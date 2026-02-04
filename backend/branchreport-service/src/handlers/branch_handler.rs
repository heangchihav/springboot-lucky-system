use actix_web::{web, HttpResponse, Responder};
use crate::models::{Branch, CreateBranchRequest, UpdateBranchRequest};
use tokio_postgres::Client;
use uuid::Uuid;
use chrono::Utc;
use log::{info, error};
use serde::Deserialize;

pub async fn list_branches(
    query: web::Query<BranchQueryParams>,
    client: web::Data<Client>
) -> impl Responder {
    let client = client.as_ref();
    let area_id = query.area_id.clone();
    let sub_area_id = query.sub_area_id.clone();
    
    let query_result = if let Some(sub_area_id) = sub_area_id {
        client.query("SELECT id, name, description, area_id, sub_area_id, created_at, updated_at FROM branches WHERE sub_area_id = $1 ORDER BY created_at DESC", &[&sub_area_id]).await
    } else if let Some(area_id) = area_id {
        client.query("SELECT id, name, description, area_id, sub_area_id, created_at, updated_at FROM branches WHERE area_id = $1 ORDER BY created_at DESC", &[&area_id]).await
    } else {
        client.query("SELECT id, name, description, area_id, sub_area_id, created_at, updated_at FROM branches ORDER BY created_at DESC", &[]).await
    };
    
    match query_result {
        Ok(rows) => {
            let branches: Vec<Branch> = rows.iter().map(|row| {
                Branch {
                    id: row.get::<_, String>(0),
                    name: row.get::<_, String>(1),
                    description: row.get::<_, Option<String>>(2),
                    area_id: row.get::<_, String>(3),
                    sub_area_id: row.get::<_, String>(4),
                    created_at: row.get::<_, String>(5),
                    updated_at: row.get::<_, String>(6),
                }
            }).collect();
            
            HttpResponse::Ok().json(branches)
        }
        Err(e) => {
            error!("Failed to fetch branches: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch branches"
            }))
        }
    }
}

pub async fn get_branch(path: web::Path<String>, client: web::Data<Client>) -> impl Responder {
    let branch_id = path.into_inner();
    let client = client.as_ref();
    
    match client.query("SELECT id, name, description, area_id, sub_area_id, created_at, updated_at FROM branches WHERE id = $1", &[&branch_id]).await {
        Ok(rows) => {
            if let Some(row) = rows.get(0) {
                let branch = Branch {
                    id: row.get::<_, String>(0),
                    name: row.get::<_, String>(1),
                    description: row.get::<_, Option<String>>(2),
                    area_id: row.get::<_, String>(3),
                    sub_area_id: row.get::<_, String>(4),
                    created_at: row.get::<_, String>(5),
                    updated_at: row.get::<_, String>(6),
                };
                HttpResponse::Ok().json(branch)
            } else {
                HttpResponse::NotFound().json(serde_json::json!({
                    "error": "Branch not found"
                }))
            }
        }
        Err(e) => {
            error!("Failed to fetch branch: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch branch"
            }))
        }
    }
}

pub async fn create_branch(req: web::Json<CreateBranchRequest>, client: web::Data<Client>) -> impl Responder {
    let new_branch = Branch {
        id: Uuid::new_v4().to_string(),
        name: req.name.clone(),
        description: req.description.clone(),
        area_id: req.area_id.clone(),
        sub_area_id: req.sub_area_id.clone(),
        created_at: Utc::now().to_rfc3339(),
        updated_at: Utc::now().to_rfc3339(),
    };

    let client = client.as_ref();
    
    match client.execute(
        "INSERT INTO branches (id, name, description, area_id, sub_area_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        &[&new_branch.id, &new_branch.name, &new_branch.description, &new_branch.area_id, &new_branch.sub_area_id, &new_branch.created_at, &new_branch.updated_at]
    ).await {
        Ok(_) => {
            info!("Created new branch: {}", new_branch.name);
            HttpResponse::Created().json(new_branch)
        }
        Err(e) => {
            error!("Failed to create branch: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to create branch"
            }))
        }
    }
}

pub async fn update_branch(
    path: web::Path<String>,
    req: web::Json<UpdateBranchRequest>,
    client: web::Data<Client>
) -> impl Responder {
    let branch_id = path.into_inner();
    let updated_at = Utc::now().to_rfc3339();
    let client = client.as_ref();
    
    match client.execute(
        "UPDATE branches SET name = $1, description = $2, area_id = $3, sub_area_id = $4, updated_at = $5 WHERE id = $6",
        &[&req.name, &req.description, &req.area_id, &req.sub_area_id, &updated_at, &branch_id]
    ).await {
        Ok(rows_affected) if rows_affected > 0 => {
            info!("Updated branch: {}", branch_id);
            let updated_branch = Branch {
                id: branch_id,
                name: req.name.clone(),
                description: req.description.clone(),
                area_id: req.area_id.clone(),
                sub_area_id: req.sub_area_id.clone(),
                created_at: String::new(), // Will be populated by a separate query if needed
                updated_at,
            };
            HttpResponse::Ok().json(updated_branch)
        }
        Ok(_) => {
            HttpResponse::NotFound().json(serde_json::json!({
                "error": "Branch not found"
            }))
        }
        Err(e) => {
            error!("Failed to update branch: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to update branch"
            }))
        }
    }
}

pub async fn delete_branch(path: web::Path<String>, client: web::Data<Client>) -> impl Responder {
    let branch_id = path.into_inner();
    let client = client.as_ref();
    
    match client.execute("DELETE FROM branches WHERE id = $1", &[&branch_id]).await {
        Ok(rows_affected) if rows_affected > 0 => {
            info!("Deleted branch: {}", branch_id);
            HttpResponse::NoContent().finish()
        }
        Ok(_) => {
            HttpResponse::NotFound().json(serde_json::json!({
                "error": "Branch not found"
            }))
        }
        Err(e) => {
            error!("Failed to delete branch: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to delete branch"
            }))
        }
    }
}

#[derive(Deserialize)]
pub struct BranchQueryParams {
    pub area_id: Option<String>,
    pub sub_area_id: Option<String>,
}
