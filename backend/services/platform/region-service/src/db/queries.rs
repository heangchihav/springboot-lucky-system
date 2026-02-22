use crate::db::DbClient;
use crate::models::{Area, SubArea, Branch};
use tokio_postgres::Row;
use uuid::Uuid;
use chrono::Utc;

pub struct AreaRepository;
pub struct SubAreaRepository;
pub struct BranchRepository;

impl AreaRepository {
    pub async fn find_all(client: &DbClient) -> Result<Vec<Area>, Box<dyn std::error::Error>> {
        let rows = client.query("SELECT id, name, description, created_at, updated_at FROM areas ORDER BY created_at DESC", &[]).await?;
        
        let areas: Result<Vec<_>, _> = rows.into_iter().map(|row| {
            Ok(Area {
                id: row.get(0),
                name: row.get(1),
                description: row.get(2),
                created_at: row.get(3),
                updated_at: row.get(4),
            })
        }).collect();
        
        areas
    }
    
    pub async fn find_by_id(client: &DbClient, id: &str) -> Result<Option<Area>, Box<dyn std::error::Error>> {
        let row = client.query_opt("SELECT id, name, description, created_at, updated_at FROM areas WHERE id = $1", &[&id]).await?;
        
        match row {
            Some(row) => Ok(Some(Area {
                id: row.get(0),
                name: row.get(1),
                description: row.get(2),
                created_at: row.get(3),
                updated_at: row.get(4),
            })),
            None => Ok(None),
        }
    }
    
    pub async fn create(client: &DbClient, area: &Area) -> Result<Area, Box<dyn std::error::Error>> {
        let now = Utc::now().to_rfc3339();
        let id = Uuid::new_v4().to_string();
        
        client.execute(
            "INSERT INTO areas (id, name, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
            &[&id, &area.name, &area.description, &now, &now]
        ).await?;
        
        Ok(Area {
            id,
            name: area.name.clone(),
            description: area.description.clone(),
            created_at: now.clone(),
            updated_at: now,
        })
    }
    
    pub async fn update(client: &DbClient, id: &str, area: &Area) -> Result<u64, Box<dyn std::error::Error>> {
        let now = Utc::now().to_rfc3339();
        
        let rows_affected = client.execute(
            "UPDATE areas SET name = $1, description = $2, updated_at = $3 WHERE id = $4",
            &[&area.name, &area.description, &now, &id]
        ).await?;
        
        Ok(rows_affected)
    }
    
    pub async fn delete(client: &DbClient, id: &str) -> Result<u64, Box<dyn std::error::Error>> {
        let rows_affected = client.execute("DELETE FROM areas WHERE id = $1", &[&id]).await?;
        Ok(rows_affected)
    }
}

impl SubAreaRepository {
    pub async fn find_all(client: &DbClient) -> Result<Vec<SubArea>, Box<dyn std::error::Error>> {
        let rows = client.query("SELECT id, name, description, area_id, created_at, updated_at FROM sub_areas ORDER BY created_at DESC", &[]).await?;
        
        let sub_areas: Result<Vec<_>, _> = rows.into_iter().map(|row| {
            Ok(SubArea {
                id: row.get(0),
                name: row.get(1),
                description: row.get(2),
                area_id: row.get(3),
                created_at: row.get(4),
                updated_at: row.get(5),
            })
        }).collect();
        
        sub_areas
    }
    
    pub async fn find_by_id(client: &DbClient, id: &str) -> Result<Option<SubArea>, Box<dyn std::error::Error>> {
        let row = client.query_opt("SELECT id, name, description, area_id, created_at, updated_at FROM sub_areas WHERE id = $1", &[&id]).await?;
        
        match row {
            Some(row) => Ok(Some(SubArea {
                id: row.get(0),
                name: row.get(1),
                description: row.get(2),
                area_id: row.get(3),
                created_at: row.get(4),
                updated_at: row.get(5),
            })),
            None => Ok(None),
        }
    }
    
    pub async fn create(client: &DbClient, sub_area: &SubArea) -> Result<SubArea, Box<dyn std::error::Error>> {
        let now = Utc::now().to_rfc3339();
        let id = Uuid::new_v4().to_string();
        
        client.execute(
            "INSERT INTO sub_areas (id, name, description, area_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)",
            &[&id, &sub_area.name, &sub_area.description, &sub_area.area_id, &now, &now]
        ).await?;
        
        Ok(SubArea {
            id,
            name: sub_area.name.clone(),
            description: sub_area.description.clone(),
            area_id: sub_area.area_id.clone(),
            created_at: now.clone(),
            updated_at: now,
        })
    }
    
    pub async fn update(client: &DbClient, id: &str, sub_area: &SubArea) -> Result<u64, Box<dyn std::error::Error>> {
        let now = Utc::now().to_rfc3339();
        
        let rows_affected = client.execute(
            "UPDATE sub_areas SET name = $1, description = $2, area_id = $3, updated_at = $4 WHERE id = $5",
            &[&sub_area.name, &sub_area.description, &sub_area.area_id, &now, &id]
        ).await?;
        
        Ok(rows_affected)
    }
    
    pub async fn delete(client: &DbClient, id: &str) -> Result<u64, Box<dyn std::error::Error>> {
        let rows_affected = client.execute("DELETE FROM sub_areas WHERE id = $1", &[&id]).await?;
        Ok(rows_affected)
    }
}

impl BranchRepository {
    pub async fn find_all(client: &DbClient) -> Result<Vec<Branch>, Box<dyn std::error::Error>> {
        let rows = client.query("SELECT id, name, description, area_id, sub_area_id, created_at, updated_at FROM branches ORDER BY created_at DESC", &[]).await?;
        
        let branches: Result<Vec<_>, _> = rows.into_iter().map(|row| {
            Ok(Branch {
                id: row.get(0),
                name: row.get(1),
                description: row.get(2),
                area_id: row.get(3),
                sub_area_id: row.get(4),
                created_at: row.get(5),
                updated_at: row.get(6),
            })
        }).collect();
        
        branches
    }
    
    pub async fn find_by_id(client: &DbClient, id: &str) -> Result<Option<Branch>, Box<dyn std::error::Error>> {
        let row = client.query_opt("SELECT id, name, description, area_id, sub_area_id, created_at, updated_at FROM branches WHERE id = $1", &[&id]).await?;
        
        match row {
            Some(row) => Ok(Some(Branch {
                id: row.get(0),
                name: row.get(1),
                description: row.get(2),
                area_id: row.get(3),
                sub_area_id: row.get(4),
                created_at: row.get(5),
                updated_at: row.get(6),
            })),
            None => Ok(None),
        }
    }
    
    pub async fn create(client: &DbClient, branch: &Branch) -> Result<Branch, Box<dyn std::error::Error>> {
        let now = Utc::now().to_rfc3339();
        let id = Uuid::new_v4().to_string();
        
        client.execute(
            "INSERT INTO branches (id, name, description, area_id, sub_area_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            &[&id, &branch.name, &branch.description, &branch.area_id, &branch.sub_area_id, &now, &now]
        ).await?;
        
        Ok(Branch {
            id,
            name: branch.name.clone(),
            description: branch.description.clone(),
            area_id: branch.area_id.clone(),
            sub_area_id: branch.sub_area_id.clone(),
            created_at: now.clone(),
            updated_at: now,
        })
    }
    
    pub async fn update(client: &DbClient, id: &str, branch: &Branch) -> Result<u64, Box<dyn std::error::Error>> {
        let now = Utc::now().to_rfc3339();
        
        let rows_affected = client.execute(
            "UPDATE branches SET name = $1, description = $2, area_id = $3, sub_area_id = $4, updated_at = $5 WHERE id = $6",
            &[&branch.name, &branch.description, &branch.area_id, &branch.sub_area_id, &now, &id]
        ).await?;
        
        Ok(rows_affected)
    }
    
    pub async fn delete(client: &DbClient, id: &str) -> Result<u64, Box<dyn std::error::Error>> {
        let rows_affected = client.execute("DELETE FROM branches WHERE id = $1", &[&id]).await?;
        Ok(rows_affected)
    }
}
