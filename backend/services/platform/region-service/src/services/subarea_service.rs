use crate::db::{DbClient, SubAreaRepository};
use crate::models::SubArea;
use crate::errors::ServiceError;

pub struct SubAreaService;

impl SubAreaService {
    pub async fn list_sub_areas(client: &DbClient) -> Result<Vec<SubArea>, ServiceError> {
        match SubAreaRepository::find_all(client).await {
            Ok(sub_areas) => Ok(sub_areas),
            Err(e) => Err(ServiceError::DatabaseError(e.to_string())),
        }
    }
    
    pub async fn get_sub_area(client: &DbClient, id: &str) -> Result<Option<SubArea>, ServiceError> {
        match SubAreaRepository::find_by_id(client, id).await {
            Ok(sub_area) => Ok(sub_area),
            Err(e) => Err(ServiceError::DatabaseError(e.to_string())),
        }
    }
    
    pub async fn create_sub_area(client: &DbClient, sub_area: &SubArea) -> Result<SubArea, ServiceError> {
        if sub_area.name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Sub-area name cannot be empty".to_string()));
        }
        
        if sub_area.area_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Area ID cannot be empty".to_string()));
        }
        
        match SubAreaRepository::create(client, sub_area).await {
            Ok(created_sub_area) => Ok(created_sub_area),
            Err(e) => Err(ServiceError::DatabaseError(e.to_string())),
        }
    }
    
    pub async fn update_sub_area(client: &DbClient, id: &str, sub_area: &SubArea) -> Result<u64, ServiceError> {
        if sub_area.name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Sub-area name cannot be empty".to_string()));
        }
        
        if sub_area.area_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Area ID cannot be empty".to_string()));
        }
        
        match SubAreaRepository::update(client, id, sub_area).await {
            Ok(rows_affected) => Ok(rows_affected),
            Err(e) => Err(ServiceError::DatabaseError(e.to_string())),
        }
    }
    
    pub async fn delete_sub_area(client: &DbClient, id: &str) -> Result<u64, ServiceError> {
        match SubAreaRepository::delete(client, id).await {
            Ok(rows_affected) => Ok(rows_affected),
            Err(e) => Err(ServiceError::DatabaseError(e.to_string())),
        }
    }
}
