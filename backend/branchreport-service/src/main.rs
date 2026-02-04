mod models;
mod handlers;
mod routes;
mod database;

use actix_web::{web, App, HttpServer};
use std::env;
use tokio_postgres::{Client, NoTls};
use log::{info, error};
use database::create_db_tables;
use routes::configure_routes;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env::set_var("RUST_LOG", "info");
    env_logger::init();

    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/branchreport_service_db".to_string());
    
    let port = env::var("PORT")
        .unwrap_or_else(|_| "8085".to_string())
        .parse()
        .unwrap_or(8085);

    info!("Connecting to database...");
    let (client, connection) = tokio_postgres::connect(&database_url, NoTls).await
        .expect("Failed to connect to database");

    tokio::spawn(async move {
        if let Err(e) = connection.await {
            error!("Database connection error: {}", e);
        }
    });

    if let Err(e) = create_db_tables(&client).await {
        error!("Failed to create database tables: {}", e);
        std::process::exit(1);
    }

    let client_data = web::Data::new(client);

    info!("Starting branchreport-service on port {}", port);

    HttpServer::new(move || {
        App::new()
            .app_data(client_data.clone())
            .configure(configure_routes)
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
