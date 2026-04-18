use rust_decimal::Decimal;
use sqlx::{PgPool, Row};
use std::str::FromStr;
use tonic::{Request, Response, Status};
use uuid::Uuid;

pub mod pb {
    tonic::include_proto!("ledger");
}

use pb::ledger_service_server::LedgerService;
use pb::{
    FinalizeOfframpRequest, FinalizeOfframpResponse, ReserveOfframpRequest, ReserveOfframpResponse,
};

pub struct MyLedgerService {
    pub pool: PgPool,
}

const BALANCE_SQL: &str = r#"
    WITH settled AS (
        SELECT COALESCE(SUM(amount), 0) AS settled_balance
        FROM ledger_transactions
        WHERE contractor_id = $1 AND status = 'COMPLETED'
    ),
    active_reservations AS (
        SELECT COALESCE(SUM(reservation.amount), 0) AS active_reserved_amount
        FROM ledger_transactions reservation
        WHERE reservation.contractor_id = $1
            AND reservation.tx_type = 'FIAT_OFFRAMP_RESERVATION'
            AND reservation.status = 'RESERVED'
            AND NOT EXISTS (
                SELECT 1
                FROM ledger_transactions resolution
                WHERE resolution.related_transaction_id = reservation.id
                    AND resolution.tx_type IN ('FIAT_OFFRAMP_SETTLEMENT', 'FIAT_OFFRAMP_REVERSAL')
            )
    )
    SELECT
        settled.settled_balance,
        settled.settled_balance + active_reservations.active_reserved_amount AS available_balance
    FROM settled, active_reservations
"#;

fn spot_price_brl() -> Decimal {
    Decimal::new(500, 2)
}

#[cfg(test)]
#[derive(Clone, Debug, PartialEq, Eq)]
enum LedgerTxType {
    Deposit,
    FiatOfframpReservation,
    FiatOfframpSettlement,
    FiatOfframpReversal,
}

#[cfg(test)]
impl LedgerTxType {
    fn is_resolution(&self) -> bool {
        matches!(
            self,
            Self::FiatOfframpSettlement | Self::FiatOfframpReversal
        )
    }
}

#[cfg(test)]
#[derive(Clone, Debug, PartialEq, Eq)]
enum LedgerTxStatus {
    Reserved,
    Completed,
}

#[cfg(test)]
#[derive(Clone, Debug)]
struct LedgerEntry {
    id: Uuid,
    related_transaction_id: Option<Uuid>,
    tx_type: LedgerTxType,
    status: LedgerTxStatus,
    amount: Decimal,
}

#[derive(Clone, Debug, PartialEq)]
struct BalanceSnapshot {
    settled_balance: Decimal,
    available_balance: Decimal,
}

#[cfg(test)]
fn calculate_balances(entries: &[LedgerEntry]) -> BalanceSnapshot {
    use std::collections::HashSet;

    let resolved_reservation_ids: HashSet<Uuid> = entries
        .iter()
        .filter_map(|entry| {
            if entry.tx_type.is_resolution() {
                entry.related_transaction_id
            } else {
                None
            }
        })
        .collect();

    let settled_balance = entries
        .iter()
        .filter(|entry| entry.status == LedgerTxStatus::Completed)
        .fold(Decimal::ZERO, |acc, entry| acc + entry.amount);

    let active_reserved_amount = entries
        .iter()
        .filter(|entry| {
            entry.tx_type == LedgerTxType::FiatOfframpReservation
                && entry.status == LedgerTxStatus::Reserved
                && !resolved_reservation_ids.contains(&entry.id)
        })
        .fold(Decimal::ZERO, |acc, entry| acc + entry.amount);

    BalanceSnapshot {
        settled_balance,
        available_balance: settled_balance + active_reserved_amount,
    }
}

async fn get_balance_snapshot<'a, E>(
    executor: E,
    contractor_id: Uuid,
) -> Result<BalanceSnapshot, Status>
where
    E: sqlx::Executor<'a, Database = sqlx::Postgres>,
{
    let row = sqlx::query(BALANCE_SQL)
        .bind(contractor_id)
        .fetch_one(executor)
        .await
        .map_err(|e| Status::internal(format!("DB balance error: {}", e)))?;

    Ok(BalanceSnapshot {
        settled_balance: row.get("settled_balance"),
        available_balance: row.get("available_balance"),
    })
}

fn parse_positive_decimal(value: &str) -> Result<Decimal, Status> {
    let amount =
        Decimal::from_str(value).map_err(|_| Status::invalid_argument("Invalid amount format"))?;

    if amount <= Decimal::ZERO {
        return Err(Status::invalid_argument("Amount must be positive"));
    }

    Ok(amount)
}

fn compute_disposal_tax(
    total_token_amount: Decimal,
    acquisition_total_brl: Decimal,
    acquisition_total_tokens: Decimal,
) -> (Decimal, Decimal) {
    let total_brl_value = total_token_amount * spot_price_brl();
    let cost_basis = if acquisition_total_tokens > Decimal::ZERO {
        (acquisition_total_brl / acquisition_total_tokens) * total_token_amount
    } else {
        Decimal::ZERO
    };

    (total_brl_value, total_brl_value - cost_basis)
}

#[tonic::async_trait]
impl LedgerService for MyLedgerService {
    async fn reserve_offramp(
        &self,
        request: Request<ReserveOfframpRequest>,
    ) -> Result<Response<ReserveOfframpResponse>, Status> {
        let req = request.into_inner();
        let contractor_id = Uuid::parse_str(&req.contractor_id)
            .map_err(|_| Status::invalid_argument("Invalid contractor_id"))?;
        let amount = parse_positive_decimal(&req.amount)?;

        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| Status::internal(format!("DB begin error: {}", e)))?;

        let contractor = sqlx::query("SELECT id FROM contractors WHERE id = $1 FOR UPDATE")
            .bind(contractor_id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| Status::internal(format!("DB select error: {}", e)))?;

        if contractor.is_none() {
            return Ok(Response::new(ReserveOfframpResponse {
                success: false,
                transaction_id: String::new(),
                error_message: "Contractor not found".to_string(),
            }));
        }

        let balances = get_balance_snapshot(&mut *tx, contractor_id).await?;
        if balances.available_balance < amount {
            return Ok(Response::new(ReserveOfframpResponse {
                success: false,
                transaction_id: String::new(),
                error_message: "Insufficient balance".to_string(),
            }));
        }

        let reservation = sqlx::query(
            "INSERT INTO ledger_transactions (contractor_id, tx_type, amount, status)
             VALUES ($1, 'FIAT_OFFRAMP_RESERVATION'::ledger_tx_type, $2, 'RESERVED'::ledger_tx_status)
             RETURNING id",
        )
        .bind(contractor_id)
        .bind(-amount)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| Status::internal(format!("DB insert error: {}", e)))?;

        let reservation_id: Uuid = reservation.get("id");

        tx.commit()
            .await
            .map_err(|e| Status::internal(format!("Commit error: {}", e)))?;

        Ok(Response::new(ReserveOfframpResponse {
            success: true,
            transaction_id: reservation_id.to_string(),
            error_message: String::new(),
        }))
    }

    async fn finalize_offramp(
        &self,
        request: Request<FinalizeOfframpRequest>,
    ) -> Result<Response<FinalizeOfframpResponse>, Status> {
        let req = request.into_inner();
        let reservation_id = Uuid::parse_str(&req.transaction_id)
            .map_err(|_| Status::invalid_argument("Invalid transaction_id"))?;

        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| Status::internal(format!("DB begin error: {}", e)))?;

        let reservation = sqlx::query(
            "SELECT id, contractor_id, amount
             FROM ledger_transactions
             WHERE id = $1
                AND tx_type = 'FIAT_OFFRAMP_RESERVATION'::ledger_tx_type
                AND status = 'RESERVED'::ledger_tx_status
             FOR UPDATE",
        )
        .bind(reservation_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| Status::internal(format!("DB read error: {}", e)))?;

        let Some(reservation) = reservation else {
            return Ok(Response::new(FinalizeOfframpResponse {
                success: false,
                error_message: "Reservation not found".to_string(),
            }));
        };

        let resolution_exists = sqlx::query(
            "SELECT 1
             FROM ledger_transactions
             WHERE related_transaction_id = $1
                AND tx_type IN ('FIAT_OFFRAMP_SETTLEMENT'::ledger_tx_type, 'FIAT_OFFRAMP_REVERSAL'::ledger_tx_type)
             LIMIT 1",
        )
        .bind(reservation_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(|e| Status::internal(format!("DB read error: {}", e)))?;

        if resolution_exists.is_some() {
            return Ok(Response::new(FinalizeOfframpResponse {
                success: false,
                error_message: "Reservation already finalized".to_string(),
            }));
        }

        let contractor_id: Uuid = reservation.get("contractor_id");
        let reserved_amount: Decimal = reservation.get("amount");
        let token_amount = -reserved_amount;
        let tx_hash = if req.tx_hash.is_empty() {
            None::<&str>
        } else {
            Some(req.tx_hash.as_str())
        };

        if req.success {
            let settlement = sqlx::query(
                "INSERT INTO ledger_transactions (contractor_id, related_transaction_id, tx_type, amount, tx_hash, status)
                 VALUES ($1, $2, 'FIAT_OFFRAMP_SETTLEMENT'::ledger_tx_type, $3, $4, 'COMPLETED'::ledger_tx_status)
                 RETURNING id",
            )
            .bind(contractor_id)
            .bind(reservation_id)
            .bind(reserved_amount)
            .bind(tx_hash)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| Status::internal(format!("DB insert error: {}", e)))?;

            let settlement_id: Uuid = settlement.get("id");
            let acquisition = sqlx::query(
                "SELECT
                    COALESCE(SUM(tax_records.total_brl_value), 0) AS acquisition_total_brl,
                    COALESCE(SUM(tax_records.token_amount), 0) AS acquisition_total_tokens
                 FROM tax_records
                 JOIN ledger_transactions ON ledger_transactions.id = tax_records.transaction_id
                 WHERE ledger_transactions.contractor_id = $1
                    AND tax_records.event_type = 'ACQUISITION'::tax_event_type",
            )
            .bind(contractor_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| Status::internal(format!("DB read error: {}", e)))?;

            let acquisition_total_brl: Decimal = acquisition.get("acquisition_total_brl");
            let acquisition_total_tokens: Decimal = acquisition.get("acquisition_total_tokens");
            let (total_brl_value, capital_gain) = compute_disposal_tax(
                token_amount,
                acquisition_total_brl,
                acquisition_total_tokens,
            );

            sqlx::query(
                "INSERT INTO tax_records (transaction_id, event_type, token_amount, brl_exchange_rate, total_brl_value, capital_gain)
                 VALUES ($1, 'DISPOSAL'::tax_event_type, $2, $3, $4, $5)",
            )
            .bind(settlement_id)
            .bind(token_amount)
            .bind(spot_price_brl())
            .bind(total_brl_value)
            .bind(capital_gain)
            .execute(&mut *tx)
            .await
            .map_err(|e| Status::internal(format!("DB tax error: {}", e)))?;
        } else {
            sqlx::query(
                "INSERT INTO ledger_transactions (contractor_id, related_transaction_id, tx_type, amount, tx_hash, status)
                 VALUES ($1, $2, 'FIAT_OFFRAMP_REVERSAL'::ledger_tx_type, 0, $3, 'COMPLETED'::ledger_tx_status)",
            )
            .bind(contractor_id)
            .bind(reservation_id)
            .bind(tx_hash)
            .execute(&mut *tx)
            .await
            .map_err(|e| Status::internal(format!("DB insert error: {}", e)))?;
        }

        tx.commit()
            .await
            .map_err(|e| Status::internal(format!("Commit error: {}", e)))?;

        Ok(Response::new(FinalizeOfframpResponse {
            success: true,
            error_message: String::new(),
        }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn entry(
        id: Uuid,
        related_transaction_id: Option<Uuid>,
        tx_type: LedgerTxType,
        status: LedgerTxStatus,
        amount: &str,
    ) -> LedgerEntry {
        LedgerEntry {
            id,
            related_transaction_id,
            tx_type,
            status,
            amount: Decimal::from_str(amount).expect("valid decimal"),
        }
    }

    #[test]
    fn reservation_reduces_available_balance_without_changing_settled_balance() {
        let reservation_id = Uuid::new_v4();
        let entries = vec![
            entry(
                Uuid::new_v4(),
                None,
                LedgerTxType::Deposit,
                LedgerTxStatus::Completed,
                "100.00",
            ),
            entry(
                reservation_id,
                None,
                LedgerTxType::FiatOfframpReservation,
                LedgerTxStatus::Reserved,
                "-40.00",
            ),
        ];

        let balances = calculate_balances(&entries);

        assert_eq!(
            balances.settled_balance,
            Decimal::from_str("100.00").unwrap()
        );
        assert_eq!(
            balances.available_balance,
            Decimal::from_str("60.00").unwrap()
        );
    }

    #[test]
    fn settlement_keeps_available_and_settled_balances_in_sync() {
        let reservation_id = Uuid::new_v4();
        let entries = vec![
            entry(
                Uuid::new_v4(),
                None,
                LedgerTxType::Deposit,
                LedgerTxStatus::Completed,
                "100.00",
            ),
            entry(
                reservation_id,
                None,
                LedgerTxType::FiatOfframpReservation,
                LedgerTxStatus::Reserved,
                "-40.00",
            ),
            entry(
                Uuid::new_v4(),
                Some(reservation_id),
                LedgerTxType::FiatOfframpSettlement,
                LedgerTxStatus::Completed,
                "-40.00",
            ),
        ];

        let balances = calculate_balances(&entries);

        assert_eq!(
            balances.settled_balance,
            Decimal::from_str("60.00").unwrap()
        );
        assert_eq!(
            balances.available_balance,
            Decimal::from_str("60.00").unwrap()
        );
    }

    #[test]
    fn reversal_releases_reserved_funds() {
        let reservation_id = Uuid::new_v4();
        let entries = vec![
            entry(
                Uuid::new_v4(),
                None,
                LedgerTxType::Deposit,
                LedgerTxStatus::Completed,
                "100.00",
            ),
            entry(
                reservation_id,
                None,
                LedgerTxType::FiatOfframpReservation,
                LedgerTxStatus::Reserved,
                "-40.00",
            ),
            entry(
                Uuid::new_v4(),
                Some(reservation_id),
                LedgerTxType::FiatOfframpReversal,
                LedgerTxStatus::Completed,
                "0",
            ),
        ];

        let balances = calculate_balances(&entries);

        assert_eq!(
            balances.settled_balance,
            Decimal::from_str("100.00").unwrap()
        );
        assert_eq!(
            balances.available_balance,
            Decimal::from_str("100.00").unwrap()
        );
    }

    #[test]
    fn insufficient_funds_uses_available_balance() {
        let reservation_id = Uuid::new_v4();
        let entries = vec![
            entry(
                Uuid::new_v4(),
                None,
                LedgerTxType::Deposit,
                LedgerTxStatus::Completed,
                "100.00",
            ),
            entry(
                reservation_id,
                None,
                LedgerTxType::FiatOfframpReservation,
                LedgerTxStatus::Reserved,
                "-80.00",
            ),
        ];

        let balances = calculate_balances(&entries);

        assert!(balances.available_balance < Decimal::from_str("30.00").unwrap());
        assert_eq!(
            balances.available_balance,
            Decimal::from_str("20.00").unwrap()
        );
    }
}
