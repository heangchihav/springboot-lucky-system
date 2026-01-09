#!/bin/bash
set -euo pipefail

# ============================================================================
# Automated Backup Script (runs via cron)
# ============================================================================

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups"
POSTGRES_HOST="demo-postgres"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

DATABASES=(
    "user_service_db"
    "call_service_db"
    "delivery_service_db"
    "marketing_service_db"
)

echo "[${TIMESTAMP}] Starting automated backup..."

# Backup each database
for db in "${DATABASES[@]}"; do
    BACKUP_FILE="${BACKUP_DIR}/${db}_${TIMESTAMP}.sql.gz"
    echo "[${TIMESTAMP}] Backing up ${db}..."
    
    if PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" "${db}" | gzip > "${BACKUP_FILE}"; then
        echo "[${TIMESTAMP}] ✓ ${db} backup successful"
    else
        echo "[${TIMESTAMP}] ✗ ${db} backup failed"
    fi
done

# Full backup
ALL_BACKUP_FILE="${BACKUP_DIR}/all_databases_${TIMESTAMP}.sql.gz"
echo "[${TIMESTAMP}] Creating full backup..."

if PGPASSWORD="${POSTGRES_PASSWORD}" pg_dumpall -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" | gzip > "${ALL_BACKUP_FILE}"; then
    echo "[${TIMESTAMP}] ✓ Full backup successful"
else
    echo "[${TIMESTAMP}] ✗ Full backup failed"
fi

# Cleanup old backups
echo "[${TIMESTAMP}] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

REMAINING=$(find "${BACKUP_DIR}" -name "*.sql.gz" -type f | wc -l)
echo "[${TIMESTAMP}] Backup completed. Total backups: ${REMAINING}"
