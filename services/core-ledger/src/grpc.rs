use tonic::{Request, Response, Status};
use rust_decimal::Decimal;
use std::str::FromStr;
use uuid::Uuid;
use sqlx::{PgPool, Row};

pub mod pb {
    tonic::include_proto!("ledger");
}

use pb::ledger_service_server::LedgerService;
use pb::{LockFundsRequest, LockFundsResponse, ConfirmOfframpRequest, ConfirmOfframpResponse};

pub struct MyLedgerService {
    pub pool: PgPool,
}

#[tonic::async_trait]
impl LedgerService for MyLedgerService {
    async fn lock_funds(
        &self,
        request: Request<LockFundsRequest>,
    ) -> Result<Response<LockFundsResponse>, Status> {
        let req = request.into_inner();
        
        let contractor_id = Uuid::parse_str(&req.contractor_id)
            .map_err(|_| Status::invalid_argument("Invalid contractor_id"))?;
        let amount = Decimal::from_str(&req.amount)
            .map_err(|_| Status::invalid_argument("Invalid amount format"))?;
            
        let mut tx = self.pool.begin().await
            .map_err(|e| Status::internal(format!("DB begin error: {}", e)))?;
            
        // pessimistic locking on the contractor row
        let contractor_opt = sqlx::query("SELECT id FROM contractors WHERE id = $1 FOR UPDATE")
            .bind(contractor_id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| Status::internal(format!("DB select err: {}", e)))?;
        
        if contractor_opt.is_none() {
            return Ok(Response::new(LockFundsResponse {
                success: false,
                transaction_id: "".to_string(),
                error_message: "Contractor not found".to_string(),
            }));
        }

        // Calculate balance
        let balance_record = sqlx::query("SELECT COALESCE(SUM(amount), 0) as balance FROM ledger_transactions WHERE contractor_id = $1")
            .bind(contractor_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| Status::internal(format!("DB error: {}", e)))?;
        
        let current_balance: Decimal = balance_record.get("balance");
        
        if current_balance < amount {
            return Ok(Response::new(LockFundsResponse {
                success: false,
                transaction_id: "".to_string(),
                error_message: "Insufficient balance".to_string(),
            }));
        }
        
        let tx_amount = -amount; // negative for offramp
        
        let new_tx = sqlx::query("INSERT INTO ledger_transactions (contractor_id, tx_type, amount, status) VALUES ($1, 'FIAT_OFFRAMP'::ledger_tx_type, $2, 'PENDING'::ledger_tx_status) RETURNING id")
            .bind(contractor_id)
            .bind(tx_amount)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| Status::internal(format!("DB error: {}", e)))?;
            
        let new_tx_id: Uuid = new_tx.get("id");
        
        tx.commit().await.map_err(|e| Status::internal(format!("Commit error: {}", e)))?;
        
        Ok(Response::new(LockFundsResponse {
            success: true,
            transaction_id: new_tx_id.to_string(),
            error_message: "".to_string(),
        }))
    }

    async fn confirm_offramp(
        &self,
        request: Request<ConfirmOfframpRequest>,
    ) -> Result<Response<ConfirmOfframpResponse>, Status> {
        let req = request.into_inner();
        let tx_id = Uuid::parse_str(&req.transaction_id)
            .map_err(|_| Status::invalid_argument("Invalid transaction_id"))?;
            
        let new_status = if req.success { "COMPLETED" } else { "FAILED" };
        
        let result = sqlx::query("UPDATE ledger_transactions SET status = $1::ledger_tx_status, tx_hash = COALESCE($2, tx_hash) WHERE id = $3 AND status = 'PENDING'::ledger_tx_status")
            .bind(new_status)
            .bind(&req.tx_hash)
            .bind(tx_id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(format!("DB error: {}", e)))?;
        
        if result.rows_affected() == 0 {
            return Ok(Response::new(ConfirmOfframpResponse {
                success: false,
                error_message: "Transaction not found or not PENDING".to_string(),
            }));
        }

        Ok(Response::new(ConfirmOfframpResponse {
            success: true,
            error_message: "".to_string(),
        }))
    }
}
