#!/bin/bash
set -euo pipefail

# ============================================================================
# PostgreSQL Data Restore Script for Kubernetes
# ============================================================================
# This script restores PostgreSQL databases with complete data in K8s
# Usage: ./data-restore.sh <backup_file> [database_name]
# ============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
NAMESPACE="${NAMESPACE:-demo}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"

# Auto-detect PostgreSQL pod name
POD_NAME=$(kubectl get pods -n "${NAMESPACE}" -l app=postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -z "$POD_NAME" ]; then
    echo -e "${RED}Error: No PostgreSQL pod found in namespace ${NAMESPACE}${NC}"
    echo "Make sure PostgreSQL is deployed with label 'app=postgres'"
    exit 1
fi

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

# Check if pod is running
if ! kubectl get pod "${POD_NAME}" -n "${NAMESPACE}" &>/dev/null; then
    echo -e "${RED}Error: Pod ${POD_NAME} not found in namespace ${NAMESPACE}${NC}"
    exit 1
fi

echo -e "${BLUE}=== Kubernetes PostgreSQL Data Restore Started ===${NC}"
echo "Namespace: ${NAMESPACE}"
echo "Pod: ${POD_NAME}"
echo "Backup File: ${BACKUP_FILE}"
echo ""

# Function to restore single database with data
restore_database() {
    local db_name="$1"
    echo -e "${YELLOW}Restoring database with data: ${db_name}${NC}"
    
    # Terminate existing connections to this database
    echo -e "${YELLOW}Terminating connections to ${db_name}...${NC}"
    kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" postgres -c "
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE datname = '${db_name}' 
        AND pid <> pg_backend_pid();
    " || true
    
    # Drop and recreate database for clean restore
    echo -e "${YELLOW}Recreating database ${db_name}...${NC}"
    kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" postgres -c "DROP DATABASE IF EXISTS ${db_name};" || true
    kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" postgres -c "CREATE DATABASE ${db_name};" || true
    
    # Restore the database with data
    echo -e "${YELLOW}Restoring schema and data to ${db_name}...${NC}"
    if gunzip -c "${BACKUP_FILE}" | kubectl exec -i -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" "${db_name}"; then
        echo -e "${GREEN}✓ Database ${db_name} with data restored successfully${NC}"
        
        # Verify data was restored
        echo -e "${YELLOW}Verifying data in ${db_name}...${NC}"
        case "${db_name}" in
            "user_service_db")
                ROW_COUNT=$(kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM users;" "${db_name}" | tr -d ' ')
                echo -e "${GREEN}✓ Users restored: ${ROW_COUNT} records${NC}"
                ;;
            "marketing_service_db")
                ROW_COUNT=$(kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM marketing_areas;" "${db_name}" | tr -d ' ')
                echo -e "${GREEN}✓ Marketing areas restored: ${ROW_COUNT} records${NC}"
                ;;
            "call_service_db")
                TABLES=$(kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" "${db_name}" | tr -d ' ')
                echo -e "${GREEN}✓ Call service tables restored: ${TABLES} tables${NC}"
                ;;
            "delivery_service_db")
                TABLES=$(kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" "${db_name}" | tr -d ' ')
                echo -e "${GREEN}✓ Delivery service tables restored: ${TABLES} tables${NC}"
                ;;
            "region_service_db")
                TABLES=$(kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" "${db_name}" | tr -d ' ')
                echo -e "${GREEN}✓ Region service tables restored: ${TABLES} tables${NC}"
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
    # Full data backup restore - FIXED VERSION
    echo -e "${YELLOW}Restoring all databases from data backup...${NC}"
    echo -e "${RED}WARNING: This will override all existing data!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Restore cancelled."
        exit 0
    fi
    
    # Drop existing databases first to ensure clean restore
    echo -e "${YELLOW}Dropping existing databases...${NC}"
    for db in user_service_db marketing_service_db call_service_db delivery_service_db region_service_db; do
        echo -e "${YELLOW}  - Terminating connections to ${db}...${NC}"
        kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" postgres -c "
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE datname = '${db}' 
            AND pid <> pg_backend_pid();
        " 2>/dev/null || true
        
        echo -e "${YELLOW}  - Dropping ${db}...${NC}"
        kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" postgres -c "DROP DATABASE IF EXISTS ${db};" 2>/dev/null || true
    done
    
    # Now restore the entire backup at once
    echo -e "${YELLOW}Restoring all databases from complete backup...${NC}"
    if gunzip -c "${BACKUP_FILE}" | kubectl exec -i -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" postgres; then
        echo -e "${GREEN}✓ All databases restored successfully${NC}"
        
        # Verify each database
        echo -e "${YELLOW}Verifying restored databases...${NC}"
        
        # Check user service
        if kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM users;" user_service_db >/dev/null 2>&1; then
            USER_COUNT=$(kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM users;" user_service_db | tr -d ' ')
            echo -e "${GREEN}✓ User Service: ${USER_COUNT} users restored${NC}"
        else
            echo -e "${YELLOW}⚠ User Service: No users table found${NC}"
        fi
        
        # Check marketing service
        if kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM marketing_areas;" marketing_service_db >/dev/null 2>&1; then
            MARKETING_COUNT=$(kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM marketing_areas;" marketing_service_db | tr -d ' ')
            echo -e "${GREEN}✓ Marketing Service: ${MARKETING_COUNT} marketing areas restored${NC}"
        else
            echo -e "${YELLOW}⚠ Marketing Service: No marketing areas table found${NC}"
        fi
        
        # Check call service
        if kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" call_service_db >/dev/null 2>&1; then
            CALL_TABLES=$(kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" call_service_db | tr -d ' ')
            echo -e "${GREEN}✓ Call Service: ${CALL_TABLES} tables restored${NC}"
        else
            echo -e "${YELLOW}⚠ Call Service: No tables found${NC}"
        fi
        
        # Check delivery service
        if kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" delivery_service_db >/dev/null 2>&1; then
            DELIVERY_TABLES=$(kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" delivery_service_db | tr -d ' ')
            echo -e "${GREEN}✓ Delivery Service: ${DELIVERY_TABLES} tables restored${NC}"
        else
            echo -e "${YELLOW}⚠ Delivery Service: No tables found${NC}"
        fi
        
        # Check region service
        if kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" region_service_db >/dev/null 2>&1; then
            REGION_TABLES=$(kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- psql -U "${POSTGRES_USER}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" region_service_db | tr -d ' ')
            echo -e "${GREEN}✓ Region Service: ${REGION_TABLES} tables restored${NC}"
        else
            echo -e "${YELLOW}⚠ Region Service: No tables found${NC}"
        fi
        
    else
        echo -e "${RED}✗ Full database restore failed${NC}"
        exit 1
    fi
    
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

# Ask if user wants to restart services
echo ""
read -p "Do you want to restart services now? (y/n): " -r
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Restarting Kubernetes services...${NC}"
    if kubectl rollout restart deployment -n "${NAMESPACE}"; then
        echo -e "${GREEN}✓ Services restarted successfully${NC}"
        echo -e "${BLUE}Waiting for services to be ready...${NC}"
        kubectl rollout status deployment -n "${NAMESPACE}" --timeout=300s
    else
        echo -e "${YELLOW}⚠ Service restart completed with some warnings${NC}"
    fi
    echo -e "${BLUE}Services should now be connected to the restored data${NC}"
else
    echo -e "${BLUE}You can restart services manually with: kubectl rollout restart deployment -n ${NAMESPACE}${NC}"
fi
