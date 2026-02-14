use actix_web::{HttpResponse, Responder};
use serde::Deserialize;
use chrono::Utc;

pub async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "service": "branchreport-service",
        "timestamp": Utc::now()
    }))
}

pub async fn actuator_health() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "UP",
        "components": {
            "db": {
                "status": "UP"
            },
            "application": {
                "status": "UP"
            }
        }
    }))
}
