use crate::db::{DbClient, AreaRepository};
use crate::models::Area;
use crate::errors::ServiceError;

pub struct AreaService;

impl AreaService {
    pub async fn list_areas(client: &DbClient) -> Result<Vec<Area>, ServiceError> {
        match AreaRepository::find_all(client).await {
            Ok(areas) => Ok(areas),
            Err(e) => Err(ServiceError::DatabaseError(e.to_string())),
        }
    }
    
    pub async fn get_area(client: &DbClient, id: &str) -> Result<Option<Area>, ServiceError> {
        match AreaRepository::find_by_id(client, id).await {
            Ok(area) => Ok(area),
            Err(e) => Err(ServiceError::DatabaseError(e.to_string())),
        }
    }
    
    pub async fn create_area(client: &DbClient, area: &Area) -> Result<Area, ServiceError> {
        if area.name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Area name cannot be empty".to_string()));
        }
        
        match AreaRepository::create(client, area).await {
            Ok(created_area) => Ok(created_area),
            Err(e) => Err(ServiceError::DatabaseError(e.to_string())),
        }
    }
    
    pub async fn update_area(client: &DbClient, id: &str, area: &Area) -> Result<u64, ServiceError> {
        if area.name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Area name cannot be empty".to_string()));
        }
        
        match AreaRepository::update(client, id, area).await {
            Ok(rows_affected) => Ok(rows_affected),
            Err(e) => Err(ServiceError::DatabaseError(e.to_string())),
        }
    }
    
    pub async fn delete_area(client: &DbClient, id: &str) -> Result<u64, ServiceError> {
        match AreaRepository::delete(client, id).await {
            Ok(rows_affected) => Ok(rows_affected),
            Err(e) => Err(ServiceError::DatabaseError(e.to_string())),
        }
    }
}
