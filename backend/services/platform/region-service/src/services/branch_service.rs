use crate::db::{DbClient, BranchRepository};
use crate::models::Branch;
use crate::errors::ServiceError;

pub struct BranchService;

impl BranchService {
    pub async fn list_branches(client: &DbClient) -> Result<Vec<Branch>, ServiceError> {
        match BranchRepository::find_all(client).await {
            Ok(branches) => Ok(branches),
            Err(e) => Err(ServiceError::DatabaseError(e.to_string())),
        }
    }
    
    pub async fn get_branch(client: &DbClient, id: &str) -> Result<Option<Branch>, ServiceError> {
        match BranchRepository::find_by_id(client, id).await {
            Ok(branch) => Ok(branch),
            Err(e) => Err(ServiceError::DatabaseError(e.to_string())),
        }
    }
    
    pub async fn create_branch(client: &DbClient, branch: &Branch) -> Result<Branch, ServiceError> {
        if branch.name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Branch name cannot be empty".to_string()));
        }
        
        if branch.area_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Area ID cannot be empty".to_string()));
        }
        
        if branch.sub_area_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Sub-area ID cannot be empty".to_string()));
        }
        
        match BranchRepository::create(client, branch).await {
            Ok(created_branch) => Ok(created_branch),
            Err(e) => Err(ServiceError::DatabaseError(e.to_string())),
        }
    }
    
    pub async fn update_branch(client: &DbClient, id: &str, branch: &Branch) -> Result<u64, ServiceError> {
        if branch.name.trim().is_empty() {
            return Err(ServiceError::ValidationError("Branch name cannot be empty".to_string()));
        }
        
        if branch.area_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Area ID cannot be empty".to_string()));
        }
        
        if branch.sub_area_id.trim().is_empty() {
            return Err(ServiceError::ValidationError("Sub-area ID cannot be empty".to_string()));
        }
        
        match BranchRepository::update(client, id, branch).await {
            Ok(rows_affected) => Ok(rows_affected),
            Err(e) => Err(ServiceError::DatabaseError(e.to_string())),
        }
    }
    
    pub async fn delete_branch(client: &DbClient, id: &str) -> Result<u64, ServiceError> {
        match BranchRepository::delete(client, id).await {
            Ok(rows_affected) => Ok(rows_affected),
            Err(e) => Err(ServiceError::DatabaseError(e.to_string())),
        }
    }
}
