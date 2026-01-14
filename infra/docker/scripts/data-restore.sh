#!/bin/bash
set -euo pipefail

# ============================================================================
# PostgreSQL Data Restore Script - Restore with Data
# ============================================================================
# This script restores PostgreSQL databases with complete data from backup files
# Usage: ./data-restore.sh <backup_file> [database_name]
# ============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
CONTAINER_NAME="${POSTGRES_CONTAINER:-demo-postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"

# Check arguments
if [ $# -lt 1 ]; then
    echo -e "${RED}Error: Backup file not specified${NC}"
    echo "Usage: $0 <backup_file> [database_name]"
    echo ""
    echo "Examples:"
    echo "  $0 backups/user_service_db_data_20260114_154447.sql.gz user_service_db"
    echo "  $0 backups/all_databases_data_20260114_154447.sql.gz  # Restore all databases"
    exit 1
fi

BACKUP_FILE="$1"
DATABASE="${2:-}"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${RED}Error: Container ${CONTAINER_NAME} is not running${NC}"
    echo "Please start PostgreSQL container first:"
    echo "  docker compose up -d postgres"
    exit 1
fi

echo -e "${BLUE}=== PostgreSQL Data Restore Started ===${NC}"
echo "Container: ${CONTAINER_NAME}"
echo "Backup File: ${BACKUP_FILE}"
echo ""

# Function to restore single database with data
restore_database() {
    local db_name="$1"
    echo -e "${YELLOW}Restoring database with data: ${db_name}${NC}"
    
    # Terminate existing connections to this database
    echo -e "${YELLOW}Terminating connections to ${db_name}...${NC}"
    docker exec "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" postgres -c "
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = '${db_name}' 
        AND pid <> pg_backend_pid();
    " || true
    
    # Drop and recreate database for clean restore
    echo -e "${YELLOW}Recreating database ${db_name}...${NC}"
    docker exec "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" postgres -c "DROP DATABASE IF EXISTS ${db_name};" || true
    docker exec "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" postgres -c "CREATE DATABASE ${db_name};" || true
    
    # Restore the database with data
    echo -e "${YELLOW}Restoring schema and data to ${db_name}...${NC}"
    if gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" "${db_name}"; then
        echo -e "${GREEN}✓ Database ${db_name} with data restored successfully${NC}"
        
        # Verify data was restored
        echo -e "${YELLOW}Verifying data in ${db_name}...${NC}"
        case "${db_name}" in
            "user_service_db")
                ROW_COUNT=$(docker exec "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM users;" "${db_name}" | tr -d ' ')
                echo -e "${GREEN}✓ Users restored: ${ROW_COUNT} records${NC}"
                ;;
            "marketing_service_db")
                ROW_COUNT=$(docker exec "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM marketing_areas;" "${db_name}" | tr -d ' ')
                echo -e "${GREEN}✓ Marketing areas restored: ${ROW_COUNT} records${NC}"
                ;;
            "call_service_db")
                TABLES=$(docker exec "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" "${db_name}" | tr -d ' ')
                echo -e "${GREEN}✓ Call service tables restored: ${TABLES} tables${NC}"
                ;;
            "delivery_service_db")
                TABLES=$(docker exec "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" "${db_name}" | tr -d ' ')
                echo -e "${GREEN}✓ Delivery service tables restored: ${TABLES} tables${NC}"
                ;;
        esac
        return 0
    else
        echo -e "${RED}✗ Database ${db_name} restore failed${NC}"
        return 1
    fi
}

# Determine restore type
if [[ "${BACKUP_FILE}" == *"all_databases_data"* ]]; then
    # Full data backup restore
    echo -e "${YELLOW}Restoring all databases from data backup...${NC}"
    echo -e "${RED}WARNING: This will override all existing data!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Restore cancelled."
        exit 0
    fi
    
    # Create temp directory for extraction
    TEMP_DIR=$(mktemp -d)
    trap "rm -rf ${TEMP_DIR}" EXIT
    
    # Extract the backup
    echo -e "${YELLOW}Extracting data backup...${NC}"
    gunzip -c "${BACKUP_FILE}" > "${TEMP_DIR}/backup.sql"
    
    # Restore each known database
    for db in marketing_service_db user_service_db call_service_db delivery_service_db; do
        echo -e "${YELLOW}Processing ${db}...${NC}"
        
        # Extract specific database from backup
        grep -A 10000 "\\connect ${db}" "${TEMP_DIR}/backup.sql" | grep -B 10000 -m 1 "\\connect" > "${TEMP_DIR}/${db}.sql" || true
        
        if [ -s "${TEMP_DIR}/${db}.sql" ]; then
            # Terminate connections
            echo -e "${YELLOW}Terminating connections to ${db}...${NC}"
            docker exec "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" postgres -c "
                SELECT pg_terminate_backend(pid) 
                FROM pg_stat_activity 
                WHERE datname = '${db}' 
                AND pid <> pg_backend_pid();
            " || true
            
            # Drop and recreate
            echo -e "${YELLOW}Recreating ${db}...${NC}"
            docker exec "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" postgres -c "DROP DATABASE IF EXISTS ${db};" || true
            docker exec "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" postgres -c "CREATE DATABASE ${db};" || true
            
            # Restore
            echo -e "${YELLOW}Restoring ${db} schema and data...${NC}"
            docker exec -i "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" "${db}" < "${TEMP_DIR}/${db}.sql" || true
            echo -e "${GREEN}✓ ${db} with data restored${NC}"
        fi
    done
    
    echo -e "${GREEN}✓ All databases with data restored successfully${NC}"
    
else
    # Single database restore
    if [ -z "${DATABASE}" ]; then
        echo -e "${RED}Error: Database name required for single database restore${NC}"
        echo "Usage: $0 ${BACKUP_FILE} <database_name>"
        exit 1
    fi
    
    echo -e "${RED}WARNING: This will override the existing database: ${DATABASE}${NC}"
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Restore cancelled."
        exit 0
    fi
    
    restore_database "${DATABASE}"
fi

echo ""
echo -e "${GREEN}=== Data Restore Completed Successfully ===${NC}"
echo -e "${BLUE}Note: Services may need to reconnect to databases${NC}"
echo -e "${BLUE}You can restart services if needed: docker compose restart${NC}"
