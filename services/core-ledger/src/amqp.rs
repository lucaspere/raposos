use lapin::{options::*, types::FieldTable, Connection, ConnectionProperties};
use futures_util::StreamExt;
use sqlx::PgPool;
use rust_decimal::Decimal;
use uuid::Uuid;
use std::str::FromStr;
use serde::Deserialize;

#[derive(Deserialize, Debug)]
pub struct DepositConfirmedEvent {
    pub contractor_id: String,
    pub amount: String, // Stringified decimal
    pub tx_hash: String,
}

pub async fn start_amqp_consumer(pool: PgPool) -> Result<(), Box<dyn std::error::Error>> {
    let addr = std::env::var("AMQP_ADDR").unwrap_or_else(|_| "amqp://raposos:password@localhost:5672/%2f".into());
    let conn = Connection::connect(&addr, ConnectionProperties::default()).await?;
    let channel = conn.create_channel().await?;

    let queue = channel
        .queue_declare("deposit_confirmed", QueueDeclareOptions::default(), FieldTable::default())
        .await?;

    let mut consumer = channel
        .basic_consume(
            queue.name().as_str(),
            "core_ledger_consumer",
            BasicConsumeOptions::default(),
            FieldTable::default(),
        )
        .await?;

    println!("AMQP Consumer started");

    while let Some(delivery) = consumer.next().await {
        if let Ok(delivery) = delivery {
            if let Ok(event) = serde_json::from_slice::<DepositConfirmedEvent>(&delivery.data) {
                if let Ok(contractor_id) = Uuid::parse_str(&event.contractor_id) {
                    if let Ok(amount) = Decimal::from_str(&event.amount) {
                        let mut tx = match pool.begin().await {
                            Ok(t) => t,
                            Err(e) => {
                                println!("Failed to begin tx: {}", e);
                                let _ = delivery.nack(BasicNackOptions::default()).await;
                                continue;
                            }
                        };
                        
                        // Insert DEPOSIT
                        let res = sqlx::query("INSERT INTO ledger_transactions (contractor_id, tx_type, amount, tx_hash, status) VALUES ($1, 'DEPOSIT'::ledger_tx_type, $2, $3, 'COMPLETED'::ledger_tx_status) RETURNING id")
                            .bind(contractor_id)
                            .bind(amount)
                            .bind(&event.tx_hash)
                            .fetch_one(&mut *tx)
                            .await;
                            
                        match res {
                            Ok(row) => {
                                use sqlx::Row;
                                let tx_id: Uuid = row.get("id");
                                
                                // Mock Oracle Spot Price
                                let spot_price = Decimal::new(500, 2); // 5.00
                                let total_brl_value = amount * spot_price;
                                
                                let tax_res = sqlx::query("INSERT INTO tax_records (transaction_id, event_type, token_amount, brl_exchange_rate, total_brl_value) VALUES ($1, 'ACQUISITION'::tax_event_type, $2, $3, $4)")
                                    .bind(tx_id)
                                    .bind(amount)
                                    .bind(spot_price)
                                    .bind(total_brl_value)
                                    .execute(&mut *tx)
                                    .await;
                                    
                                if let Err(e) = tax_res {
                                    println!("Failed to insert tax event: {}", e);
                                    let _ = tx.rollback().await;
                                    let _ = delivery.nack(BasicNackOptions::default()).await;
                                    continue;
                                }
                                
                                if let Err(e) = tx.commit().await {
                                    println!("Failed to commit tx: {}", e);
                                    let _ = delivery.nack(BasicNackOptions::default()).await;
                                } else {
                                    println!("Processed deposit for {}", contractor_id);
                                    let _ = delivery.ack(BasicAckOptions::default()).await;
                                }
                            }
                            Err(e) => {
                                println!("Failed to process deposit: {}", e);
                                let _ = tx.rollback().await;
                                let _ = delivery.nack(BasicNackOptions::default()).await;
                            }
                        }
                    } else {
                        let _ = delivery.nack(BasicNackOptions::default()).await;
                    }
                } else {
                    let _ = delivery.nack(BasicNackOptions::default()).await;
                }
            } else {
                let _ = delivery.nack(BasicNackOptions::default()).await;
            }
        }
    }

    Ok(())
}
