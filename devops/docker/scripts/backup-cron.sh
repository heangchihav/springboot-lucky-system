#!/bin/bash
set -euo pipefail

# ============================================================================
# Automated Data Backup Script (runs via cron)
# ============================================================================
# This script calls the data-backup.sh script for scheduled backups
# Usage: Called by cron to create automated data backups
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "[${TIMESTAMP}] Starting automated data backup..."

# Call the data backup script
if "${SCRIPT_DIR}/data-backup.sh"; then
    echo "[${TIMESTAMP}] ✓ Automated data backup completed successfully"
else
    echo "[${TIMESTAMP}] ✗ Automated data backup failed"
    exit 1
fi

echo "[${TIMESTAMP}] Backup process finished."
