use dotenvy::dotenv;
use ethers::prelude::*;
use lapin::{options::*, BasicProperties, Connection, ConnectionProperties};
use serde::Serialize;
use std::collections::HashMap;
use std::env;
use std::sync::Arc;

abigen!(
    ERC20,
    r#"[
        event Transfer(address indexed from, address indexed to, uint256 value)
    ]"#,
);

#[derive(Serialize)]
struct DepositConfirmedEvent {
    contractor_id: String,
    amount: String,
    tx_hash: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    tracing_subscriber::fmt::init();

    println!("Starting Chain Indexer...");

    let rpc_url = env::var("RPC_WS_URL").unwrap_or_else(|_| "ws://localhost:8545".to_string());
    let amqp_addr = env::var("AMQP_ADDR").unwrap_or_else(|_| "amqp://raposos:password@localhost:5672/%2f".into());
    let usdc_address = env::var("USDC_ADDRESS")
        .unwrap_or_else(|_| "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48".to_string())
        .parse::<Address>()?;

    let conn = Connection::connect(&amqp_addr, ConnectionProperties::default()).await?;
    let channel = conn.create_channel().await?;
    channel.queue_declare("deposit_confirmed", QueueDeclareOptions::default(), lapin::types::FieldTable::default()).await?;

    println!("Connecting to network RPC at {}", rpc_url);
    let provider = Provider::<Ws>::connect(&rpc_url).await?;
    let client = Arc::new(provider);
    let usdc_contract = ERC20::new(usdc_address, client.clone());

    // Mock wallet to contractor ID mapping
    let mut recorded_wallets = HashMap::new();
    recorded_wallets.insert(
        "0x1234567890123456789012345678901234567890".parse::<Address>()?,
        "123e4567-e89b-12d3-a456-426614174000".to_string(), // contractor ID
    );

    let events = usdc_contract.event::<TransferFilter>();
    let mut stream = events.subscribe().await?.with_meta();

    println!("Ready and listening for USDC transfers...");

    while let Some(Ok((log, meta))) = stream.next().await {
        // filter by to address
        if let Some(contractor_id) = recorded_wallets.get(&log.to) {
            println!("Deposit detected for contractor {} amount {}", contractor_id, log.value);
            
            // Format 6 decimals for USDC
            let formatted_amount = ethers::utils::format_units(log.value, 6)?;
            let tx_hash = format!("{:?}", meta.transaction_hash);

            let event = DepositConfirmedEvent {
                contractor_id: contractor_id.clone(),
                amount: formatted_amount,
                tx_hash,
            };

            let payload = serde_json::to_vec(&event)?;

            channel.basic_publish(
                "",
                "deposit_confirmed",
                BasicPublishOptions::default(),
                &payload,
                BasicProperties::default(),
            ).await?;
            println!("Event emitted to RabbitMQ");
        }
    }

    Ok(())
}
