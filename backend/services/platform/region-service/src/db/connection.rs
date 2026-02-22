use tokio_postgres::{Client, NoTls};
use log::{info, error};

pub type DbClient = Client;

pub async fn establish_connection(database_url: &str) -> Result<DbClient, Box<dyn std::error::Error>> {
    info!("Establishing database connection...");
    
    let (client, connection) = tokio_postgres::connect(database_url, NoTls).await?;
    
    // Spawn connection handler
    tokio::spawn(async move {
        if let Err(e) = connection.await {
            error!("Database connection error: {}", e);
        }
    });
    
    info!("Database connection established successfully");
    Ok(client)
}
