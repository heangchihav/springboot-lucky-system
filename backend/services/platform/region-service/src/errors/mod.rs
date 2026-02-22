use actix_web::{HttpResponse, ResponseError};
use actix_web::http::StatusCode;
use serde_json::json;

#[derive(Debug)]
pub enum ServiceError {
    ValidationError(String),
    DatabaseError(String),
    NotFound(String),
    InternalError(String),
}

impl std::fmt::Display for ServiceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ServiceError::ValidationError(msg) => write!(f, "Validation Error: {}", msg),
            ServiceError::DatabaseError(msg) => write!(f, "Database Error: {}", msg),
            ServiceError::NotFound(msg) => write!(f, "Not Found: {}", msg),
            ServiceError::InternalError(msg) => write!(f, "Internal Error: {}", msg),
        }
    }
}

impl std::error::Error for ServiceError {}

impl ResponseError for ServiceError {
    fn error_response(&self) -> HttpResponse {
        let (status, message) = match self {
            ServiceError::ValidationError(msg) => (StatusCode::BAD_REQUEST, msg),
            ServiceError::DatabaseError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
            ServiceError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            ServiceError::InternalError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };

        HttpResponse::build(status).json(json!({
            "error": true,
            "message": message
        }))
    }
}
