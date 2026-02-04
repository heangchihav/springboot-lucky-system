use actix_web::{web, HttpResponse, Responder};
use crate::models::{SubArea, CreateSubAreaRequest, UpdateSubAreaRequest};
use tokio_postgres::Client;
use uuid::Uuid;
use chrono::Utc;
use log::{info, error};
use serde::Deserialize;

pub async fn list_sub_areas(
    query: web::Query<SubAreaQueryParams>,
    client: web::Data<Client>
) -> impl Responder {
    let client = client.as_ref();
    let area_id = query.area_id.as_ref();
    
    let query_result = if let Some(area_id) = area_id {
        client.query("SELECT id, name, description, area_id, created_at, updated_at FROM sub_areas WHERE area_id = $1 ORDER BY created_at DESC", &[&area_id]).await
    } else {
        client.query("SELECT id, name, description, area_id, created_at, updated_at FROM sub_areas ORDER BY created_at DESC", &[]).await
    };
    
    match query_result {
        Ok(rows) => {
            let sub_areas: Vec<SubArea> = rows.iter().map(|row| {
                SubArea {
                    id: row.get::<_, String>(0),
                    name: row.get::<_, String>(1),
                    description: row.get::<_, Option<String>>(2),
                    area_id: row.get::<_, String>(3),
                    created_at: row.get::<_, String>(4),
                    updated_at: row.get::<_, String>(5),
                }
            }).collect();
            
            HttpResponse::Ok().json(sub_areas)
        }
        Err(e) => {
            error!("Failed to fetch sub-areas: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch sub-areas"
            }))
        }
    }
}

pub async fn get_sub_area(path: web::Path<String>, client: web::Data<Client>) -> impl Responder {
    let sub_area_id = path.into_inner();
    let client = client.as_ref();
    
    match client.query("SELECT id, name, description, area_id, created_at, updated_at FROM sub_areas WHERE id = $1", &[&sub_area_id]).await {
        Ok(rows) => {
            if let Some(row) = rows.get(0) {
                let sub_area = SubArea {
                    id: row.get::<_, String>(0),
                    name: row.get::<_, String>(1),
                    description: row.get::<_, Option<String>>(2),
                    area_id: row.get::<_, String>(3),
                    created_at: row.get::<_, String>(4),
                    updated_at: row.get::<_, String>(5),
                };
                HttpResponse::Ok().json(sub_area)
            } else {
                HttpResponse::NotFound().json(serde_json::json!({
                    "error": "Sub-area not found"
                }))
            }
        }
        Err(e) => {
            error!("Failed to fetch sub-area: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch sub-area"
            }))
        }
    }
}

pub async fn create_sub_area(req: web::Json<CreateSubAreaRequest>, client: web::Data<Client>) -> impl Responder {
    let new_sub_area = SubArea {
        id: Uuid::new_v4().to_string(),
        name: req.name.clone(),
        description: req.description.clone(),
        area_id: req.area_id.clone(),
        created_at: Utc::now().to_rfc3339(),
        updated_at: Utc::now().to_rfc3339(),
    };

    let client = client.as_ref();
    
    match client.execute(
        "INSERT INTO sub_areas (id, name, description, area_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)",
        &[&new_sub_area.id, &new_sub_area.name, &new_sub_area.description, &new_sub_area.area_id, &new_sub_area.created_at, &new_sub_area.updated_at]
    ).await {
        Ok(_) => {
            info!("Created new sub-area: {}", new_sub_area.name);
            HttpResponse::Created().json(new_sub_area)
        }
        Err(e) => {
            error!("Failed to create sub-area: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to create sub-area"
            }))
        }
    }
}

pub async fn update_sub_area(
    path: web::Path<String>,
    req: web::Json<UpdateSubAreaRequest>,
    client: web::Data<Client>
) -> impl Responder {
    let sub_area_id = path.into_inner();
    let updated_at = Utc::now().to_rfc3339();
    let client = client.as_ref();
    
    match client.execute(
        "UPDATE sub_areas SET name = $1, description = $2, area_id = $3, updated_at = $4 WHERE id = $5",
        &[&req.name, &req.description, &req.area_id, &updated_at, &sub_area_id]
    ).await {
        Ok(rows_affected) if rows_affected > 0 => {
            info!("Updated sub-area: {}", sub_area_id);
            let updated_sub_area = SubArea {
                id: sub_area_id,
                name: req.name.clone(),
                description: req.description.clone(),
                area_id: req.area_id.clone(),
                created_at: String::new(), // Will be populated by a separate query if needed
                updated_at,
            };
            HttpResponse::Ok().json(updated_sub_area)
        }
        Ok(_) => {
            HttpResponse::NotFound().json(serde_json::json!({
                "error": "Sub-area not found"
            }))
        }
        Err(e) => {
            error!("Failed to update sub-area: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to update sub-area"
            }))
        }
    }
}

pub async fn delete_sub_area(path: web::Path<String>, client: web::Data<Client>) -> impl Responder {
    let sub_area_id = path.into_inner();
    let client = client.as_ref();
    
    match client.execute("DELETE FROM sub_areas WHERE id = $1", &[&sub_area_id]).await {
        Ok(rows_affected) if rows_affected > 0 => {
            info!("Deleted sub-area: {}", sub_area_id);
            HttpResponse::NoContent().finish()
        }
        Ok(_) => {
            HttpResponse::NotFound().json(serde_json::json!({
                "error": "Sub-area not found"
            }))
        }
        Err(e) => {
            error!("Failed to delete sub-area: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to delete sub-area"
            }))
        }
    }
}

#[derive(Deserialize)]
pub struct SubAreaQueryParams {
    pub area_id: Option<String>,
}
