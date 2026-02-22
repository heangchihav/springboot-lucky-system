use actix_web::{web, HttpResponse, Result};
use serde_json::json;
use crate::db::DbClient;
use crate::models::Area;
use crate::services::AreaService;
use crate::utils::{ApiResponse, ApiResult};

pub async fn list_areas(client: web::Data<DbClient>) -> ApiResult<Vec<Area>> {
    match AreaService::list_areas(client.get_ref()).await {
        Ok(areas) => Ok(web::Json(ApiResponse::success(areas))),
        Err(e) => Err(e),
    }
}

pub async fn get_area(
    client: web::Data<DbClient>,
    path: web::Path<String>
) -> ApiResult<Area> {
    match AreaService::get_area(client.get_ref(), &path).await {
        Ok(Some(area)) => Ok(web::Json(ApiResponse::success(area))),
        Ok(None) => Err(crate::errors::ServiceError::NotFound("Area not found".to_string())),
        Err(e) => Err(e),
    }
}

pub async fn create_area(
    client: web::Data<DbClient>,
    area: web::Json<Area>
) -> ApiResult<Area> {
    match AreaService::create_area(client.get_ref(), &area).await {
        Ok(created_area) => Ok(web::Json(ApiResponse::success_with_message(
            created_area,
            "Area created successfully".to_string()
        ))),
        Err(e) => Err(e),
    }
}

pub async fn update_area(
    client: web::Data<DbClient>,
    path: web::Path<String>,
    area: web::Json<Area>
) -> ApiResult<u64> {
    match AreaService::update_area(client.get_ref(), &path, &area).await {
        Ok(rows_affected) => Ok(web::Json(ApiResponse::success_with_message(
            rows_affected,
            "Area updated successfully".to_string()
        ))),
        Err(e) => Err(e),
    }
}

pub async fn delete_area(
    client: web::Data<DbClient>,
    path: web::Path<String>
) -> ApiResult<u64> {
    match AreaService::delete_area(client.get_ref(), &path).await {
        Ok(rows_affected) => Ok(web::Json(ApiResponse::success_with_message(
            rows_affected,
            "Area deleted successfully".to_string()
        ))),
        Err(e) => Err(e),
    }
}
