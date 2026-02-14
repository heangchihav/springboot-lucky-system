use tokio_postgres::Client;
use log::info;

pub async fn create_db_tables(client: &Client) -> Result<(), Box<dyn std::error::Error>> {
    let client_ref = client;
    
    // Create areas table
    client_ref.batch_execute("
        CREATE TABLE IF NOT EXISTS areas (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_areas_created_at ON areas(created_at);
    ").await?;
    
    // Create sub_areas table
    client_ref.batch_execute("
        CREATE TABLE IF NOT EXISTS sub_areas (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            area_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_sub_areas_area_id ON sub_areas(area_id);
        CREATE INDEX IF NOT EXISTS idx_sub_areas_created_at ON sub_areas(created_at);
    ").await?;
    
    // Create branches table
    client_ref.batch_execute("
        CREATE TABLE IF NOT EXISTS branches (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            area_id TEXT NOT NULL,
            sub_area_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
            FOREIGN KEY (sub_area_id) REFERENCES sub_areas(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS idx_branches_area_id ON branches(area_id);
        CREATE INDEX IF NOT EXISTS idx_branches_sub_area_id ON branches(sub_area_id);
        CREATE INDEX IF NOT EXISTS idx_branches_created_at ON branches(created_at);
    ").await?;
    
    info!("Database tables created successfully");
    Ok(())
}
