#!/bin/bash
set -euo pipefail

# ============================================================================
# PostgreSQL Backup Script for Kubernetes
# ============================================================================
# This script creates timestamped backups of all PostgreSQL databases in K8s
# Usage: ./backup.sh [backup_dir]
# ============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
NAMESPACE="${NAMESPACE:-demo}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
BACKUP_DIR="${1:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Auto-detect PostgreSQL pod name
POD_NAME=$(kubectl get pods -n "${NAMESPACE}" -l app=postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -z "$POD_NAME" ]; then
    echo -e "${RED}Error: No PostgreSQL pod found in namespace ${NAMESPACE}${NC}"
    echo "Make sure PostgreSQL is deployed with label 'app=postgres'"
    exit 1
fi

# Database list
DATABASES=(
    "user_service_db"
    "call_service_db"
    "delivery_service_db"
    "marketing_service_db"
)

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo -e "${YELLOW}=== Kubernetes PostgreSQL Backup Started ===${NC}"
echo "Namespace: ${NAMESPACE}"
echo "Pod: ${POD_NAME}"
echo "Backup Directory: ${BACKUP_DIR}"
echo "Timestamp: ${TIMESTAMP}"
echo ""

# Check if pod is running
if ! kubectl get pod "${POD_NAME}" -n "${NAMESPACE}" &>/dev/null; then
    echo -e "${RED}Error: Pod ${POD_NAME} not found in namespace ${NAMESPACE}${NC}"
    exit 1
fi

# Backup each database
for db in "${DATABASES[@]}"; do
    BACKUP_FILE="${BACKUP_DIR}/${db}_${TIMESTAMP}.sql.gz"
    
    echo -e "${YELLOW}Backing up database: ${db}${NC}"
    
    if kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- pg_dump -U "${POSTGRES_USER}" "${db}" | gzip > "${BACKUP_FILE}"; then
        SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
        echo -e "${GREEN}✓ Backup successful: ${BACKUP_FILE} (${SIZE})${NC}"
    else
        echo -e "${RED}✗ Backup failed for ${db}${NC}"
        exit 1
    fi
done

# Backup all databases (including postgres system db)
ALL_BACKUP_FILE="${BACKUP_DIR}/all_databases_${TIMESTAMP}.sql.gz"
echo -e "${YELLOW}Creating full backup of all databases...${NC}"

if kubectl exec -n "${NAMESPACE}" "${POD_NAME}" -- pg_dumpall -U "${POSTGRES_USER}" | gzip > "${ALL_BACKUP_FILE}"; then
    SIZE=$(du -h "${ALL_BACKUP_FILE}" | cut -f1)
    echo -e "${GREEN}✓ Full backup successful: ${ALL_BACKUP_FILE} (${SIZE})${NC}"
else
    echo -e "${RED}✗ Full backup failed${NC}"
    exit 1
fi

# Clean up old backups (older than retention period)
echo -e "${YELLOW}Cleaning up backups older than ${RETENTION_DAYS} days...${NC}"
find "${BACKUP_DIR}" -name "*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
REMAINING=$(find "${BACKUP_DIR}" -name "*.sql.gz" -type f | wc -l)
echo -e "${GREEN}✓ Cleanup complete. ${REMAINING} backup files remaining${NC}"

echo ""
echo -e "${GREEN}=== Backup Completed Successfully ===${NC}"
echo "Backup location: ${BACKUP_DIR}"
echo "Total backups: ${REMAINING}"
