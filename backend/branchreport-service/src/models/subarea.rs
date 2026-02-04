use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SubArea {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub area_id: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateSubAreaRequest {
    pub name: String,
    pub description: Option<String>,
    pub area_id: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSubAreaRequest {
    pub name: String,
    pub description: Option<String>,
    pub area_id: String,
}
