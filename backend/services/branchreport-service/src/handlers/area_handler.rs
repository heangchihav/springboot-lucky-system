use actix_web::{web, HttpResponse, Responder};
use crate::models::{Area, CreateAreaRequest, UpdateAreaRequest};
use tokio_postgres::Client;
use uuid::Uuid;
use chrono::Utc;
use log::{info, error};

pub async fn list_areas(client: web::Data<Client>) -> impl Responder {
    let client = client.as_ref();
    
    match client.query("SELECT id, name, description, created_at, updated_at FROM areas ORDER BY created_at DESC", &[]).await {
        Ok(rows) => {
            let areas: Vec<Area> = rows.iter().map(|row| {
                Area {
                    id: row.get::<_, String>(0),
                    name: row.get::<_, String>(1),
                    description: row.get::<_, Option<String>>(2),
                    created_at: row.get::<_, String>(3),
                    updated_at: row.get::<_, String>(4),
                }
            }).collect();
            
            HttpResponse::Ok().json(areas)
        }
        Err(e) => {
            error!("Failed to fetch areas: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch areas"
            }))
        }
    }
}

pub async fn get_area(path: web::Path<String>, client: web::Data<Client>) -> impl Responder {
    let area_id = path.into_inner();
    let client = client.as_ref();
    
    match client.query("SELECT id, name, description, created_at, updated_at FROM areas WHERE id = $1", &[&area_id]).await {
        Ok(rows) => {
            if let Some(row) = rows.get(0) {
                let area = Area {
                    id: row.get::<_, String>(0),
                    name: row.get::<_, String>(1),
                    description: row.get::<_, Option<String>>(2),
                    created_at: row.get::<_, String>(3),
                    updated_at: row.get::<_, String>(4),
                };
                HttpResponse::Ok().json(area)
            } else {
                HttpResponse::NotFound().json(serde_json::json!({
                    "error": "Area not found"
                }))
            }
        }
        Err(e) => {
            error!("Failed to fetch area: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to fetch area"
            }))
        }
    }
}

pub async fn create_area(req: web::Json<CreateAreaRequest>, client: web::Data<Client>) -> impl Responder {
    let new_area = Area {
        id: Uuid::new_v4().to_string(),
        name: req.name.clone(),
        description: req.description.clone(),
        created_at: Utc::now().to_rfc3339(),
        updated_at: Utc::now().to_rfc3339(),
    };

    let client = client.as_ref();
    
    match client.execute(
        "INSERT INTO areas (id, name, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
        &[&new_area.id, &new_area.name, &new_area.description, &new_area.created_at, &new_area.updated_at]
    ).await {
        Ok(_) => {
            info!("Created new area: {}", new_area.name);
            HttpResponse::Created().json(new_area)
        }
        Err(e) => {
            error!("Failed to create area: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to create area"
            }))
        }
    }
}

pub async fn update_area(
    path: web::Path<String>,
    req: web::Json<UpdateAreaRequest>,
    client: web::Data<Client>
) -> impl Responder {
    let area_id = path.into_inner();
    let updated_at = Utc::now().to_rfc3339();
    let client = client.as_ref();
    
    match client.execute(
        "UPDATE areas SET name = $1, description = $2, updated_at = $3 WHERE id = $4",
        &[&req.name, &req.description, &updated_at, &area_id]
    ).await {
        Ok(rows_affected) if rows_affected > 0 => {
            info!("Updated area: {}", area_id);
            let updated_area = Area {
                id: area_id,
                name: req.name.clone(),
                description: req.description.clone(),
                created_at: String::new(), // Will be populated by a separate query if needed
                updated_at,
            };
            HttpResponse::Ok().json(updated_area)
        }
        Ok(_) => {
            HttpResponse::NotFound().json(serde_json::json!({
                "error": "Area not found"
            }))
        }
        Err(e) => {
            error!("Failed to update area: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to update area"
            }))
        }
    }
}

pub async fn delete_area(path: web::Path<String>, client: web::Data<Client>) -> impl Responder {
    let area_id = path.into_inner();
    let client = client.as_ref();
    
    match client.execute("DELETE FROM areas WHERE id = $1", &[&area_id]).await {
        Ok(rows_affected) if rows_affected > 0 => {
            info!("Deleted area: {}", area_id);
            HttpResponse::NoContent().finish()
        }
        Ok(_) => {
            HttpResponse::NotFound().json(serde_json::json!({
                "error": "Area not found"
            }))
        }
        Err(e) => {
            error!("Failed to delete area: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Failed to delete area"
            }))
        }
    }
}
