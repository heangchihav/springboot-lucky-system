use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Branch {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub area_id: String,
    pub sub_area_id: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateBranchRequest {
    pub name: String,
    pub description: Option<String>,
    pub area_id: String,
    pub sub_area_id: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBranchRequest {
    pub name: String,
    pub description: Option<String>,
    pub area_id: String,
    pub sub_area_id: String,
}
