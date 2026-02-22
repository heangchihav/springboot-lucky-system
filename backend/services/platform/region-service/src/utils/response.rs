use actix_web::{HttpResponse, web::Json};
use serde::Serialize;
use crate::errors::ServiceError;

#[derive(Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        ApiResponse {
            success: true,
            data: Some(data),
            message: None,
        }
    }
    
    pub fn success_with_message(data: T, message: String) -> Self {
        ApiResponse {
            success: true,
            data: Some(data),
            message: Some(message),
        }
    }
    
    pub fn error(message: String) -> Self {
        ApiResponse {
            success: false,
            data: None,
            message: Some(message),
        }
    }
}

pub type ApiResult<T> = Result<Json<ApiResponse<T>>, ServiceError>;
