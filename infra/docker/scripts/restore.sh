#!/bin/bash
set -euo pipefail

# ============================================================================
# PostgreSQL Restore Script for Docker Compose
# ============================================================================
# This script restores PostgreSQL databases from backup files
# Usage: ./restore.sh <backup_file> [database_name]
# ============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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
    echo "  $0 backups/user_service_db_20260109_120000.sql.gz user_service_db"
    echo "  $0 backups/all_databases_20260109_120000.sql.gz  # Restore all databases"
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
    exit 1
fi

echo -e "${YELLOW}=== PostgreSQL Restore Started ===${NC}"
echo "Container: ${CONTAINER_NAME}"
echo "Backup File: ${BACKUP_FILE}"

# Determine if this is a full backup or single database
if [[ "${BACKUP_FILE}" == *"all_databases"* ]]; then
    # Full restore (all databases)
    echo -e "${YELLOW}Restoring all databases from full backup...${NC}"
    echo -e "${RED}WARNING: This will overwrite all existing databases!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Restore cancelled."
        exit 0
    fi
    
    if gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" postgres; then
        echo -e "${GREEN}✓ Full restore successful${NC}"
    else
        echo -e "${RED}✗ Full restore failed${NC}"
        exit 1
    fi
else
    # Single database restore
    if [ -z "${DATABASE}" ]; then
        echo -e "${RED}Error: Database name required for single database restore${NC}"
        echo "Usage: $0 ${BACKUP_FILE} <database_name>"
        exit 1
    fi
    
    echo "Database: ${DATABASE}"
    echo -e "${RED}WARNING: This will overwrite the existing database: ${DATABASE}${NC}"
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Restore cancelled."
        exit 0
    fi
    
    # Drop existing connections
    echo -e "${YELLOW}Terminating existing connections to ${DATABASE}...${NC}"
    docker exec "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DATABASE}' AND pid <> pg_backend_pid();" || true
    
    # Drop and recreate database
    echo -e "${YELLOW}Recreating database ${DATABASE}...${NC}"
    docker exec "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" postgres -c "DROP DATABASE IF EXISTS ${DATABASE};"
    docker exec "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" postgres -c "CREATE DATABASE ${DATABASE};"
    
    # Restore from backup
    echo -e "${YELLOW}Restoring data...${NC}"
    if gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${POSTGRES_USER}" "${DATABASE}"; then
        echo -e "${GREEN}✓ Database restore successful${NC}"
    else
        echo -e "${RED}✗ Database restore failed${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}=== Restore Completed Successfully ===${NC}"
