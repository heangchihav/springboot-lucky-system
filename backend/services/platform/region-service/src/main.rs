mod config;
mod db;
mod errors;
mod handlers;
mod models;
mod routes;
mod services;
mod utils;

use actix_web::{web, App, HttpServer, middleware::Logger};
use std::env;
use dotenv::dotenv;
use log::{info, error};
use config::Config;
use db::establish_connection;
use db::migrations::run_migrations;
use routes::configure_routes;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load environment variables
    dotenv().ok();
    
    // Initialize logger
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    
    // Load configuration
    let config = Config::from_env();
    
    info!("Starting Region Service on {}:{}", config.host, config.port);
    info!("Database URL: {}", config.database_url);
    
    // Establish database connection
    let client = match establish_connection(&config.database_url).await {
        Ok(client) => client,
        Err(e) => {
            error!("Failed to establish database connection: {}", e);
            std::process::exit(1);
        }
    };
    
    // Run database migrations
    if let Err(e) = run_migrations(&client).await {
        error!("Failed to run database migrations: {}", e);
        std::process::exit(1);
    }
    
    let client_data = web::Data::new(client);
    
    info!("Region Service initialized successfully");
    
    // Start HTTP server
    HttpServer::new(move || {
        App::new()
            .app_data(client_data.clone())
            .wrap(Logger::default())
            .configure(configure_routes)
    })
    .bind(format!("{}:{}", config.host, config.port))?
    .run()
    .await
}
