use dotenvy::dotenv;
use sqlx::PgPool;
use std::env;
use tonic::transport::Server;

pub mod grpc;
pub mod amqp;

use grpc::pb::ledger_service_server::LedgerServiceServer;
use grpc::MyLedgerService;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    tracing_subscriber::fmt::init();
    
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPool::connect(&db_url).await?;

    let addr = "0.0.0.0:50051".parse()?;
    let ledger_service = MyLedgerService { pool: pool.clone() };

    println!("Starting Core Ledger on {}", addr);
    
    // Spawn AMQP consumer
    let pool_clone = pool.clone();
    tokio::spawn(async move {
        if let Err(e) = amqp::start_amqp_consumer(pool_clone).await {
            eprintln!("AMQP consumer error: {:?}", e);
        }
    });

    Server::builder()
        .add_service(LedgerServiceServer::new(ledger_service))
        .serve(addr)
        .await?;

    Ok(())
}
