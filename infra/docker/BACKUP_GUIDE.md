# Database Backup & Recovery Guide

## 🛡️ Data Safety Strategy

This guide covers multiple layers of protection for your PostgreSQL databases running in Docker/Kubernetes.

---

## **Layer 1: Volume Persistence (Already Active ✅)**

Your databases use **Docker named volumes** which persist data even when containers are removed or rebuilt.

### Current Configuration

```yaml
volumes:
  - db-data:/var/lib/postgresql/data  # Persistent storage
```

### What This Protects Against
- ✅ Container restarts
- ✅ Container rebuilds
- ✅ Image updates
- ✅ `docker compose down` (without `-v` flag)

### What This DOESN'T Protect Against
- ❌ `docker compose down -v` (removes volumes)
- ❌ `docker volume rm db-data`
- ❌ Data corruption
- ❌ Accidental data deletion
- ❌ Server failures
- ❌ Ransomware attacks

**Conclusion:** Volumes are good for normal operations but NOT sufficient for production!

---

## **Layer 2: Regular Backups (Implement This)**

### Manual Backups

#### Create a Backup

```bash
cd infra/docker

# Backup all databases
./script./scripts/backup.sh

# Backup to specific directory
./script./scripts/backup.sh /path/to/backup/location
```

This creates:
- Individual database backups: `user_service_db_20260109_140000.sql.gz`
- Full backup: `all_databases_20260109_140000.sql.gz`

#### Restore from Backup

```bash
# Restore single database
./script./scripts/restore.sh backups/user_service_db_20260109_140000.sql.gz user_service_db

# Restore all databases
./script./scripts/restore.sh backups/all_databases_20260109_140000.sql.gz
```

### Automated Backups (Recommended)

The automated backup service is included in the main docker-compose.yml:

```bash
# Start all services including automated backups
docker compose up -d

# View backup logs
docker logs -f demo-postgres-backup
```

#### Configure Backup Schedule

Edit `.env` file:

```bash
# Backup schedule (cron format)
BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM
# BACKUP_SCHEDULE=0 */6 * * *  # Every 6 hours
# BACKUP_SCHEDULE=0 0 * * 0  # Weekly on Sunday

# Retention period
BACKUP_RETENTION_DAYS=30  # Keep backups for 30 days
```

#### Cron Schedule Examples

```bash
0 2 * * *       # Daily at 2 AM
0 */6 * * *     # Every 6 hours
0 0 * * 0       # Weekly (Sunday at midnight)
0 3 * * 1-5     # Weekdays at 3 AM
*/30 * * * *    # Every 30 minutes
```

---

## **Layer 3: Off-Site Backups (Production Critical)**

### Option A: Cloud Storage (Recommended)

Store backups in cloud storage for disaster recovery.

#### AWS S3 Example

```bash
# Install AWS CLI
apt-get install awscli

# Configure credentials
aws configure

# Upload backups to S3
aws s3 sync ./backups s3://your-bucket/database-backups/
```

#### Google Cloud Storage Example

```bash
# Install gsutil
curl https://sdk.cloud.google.com | bash

# Upload backups
gsutil -m rsync -r ./backups gs://your-bucket/database-backups/
```

#### Automated Cloud Sync Script

Create `sync-to-cloud.sh`:

```bash
#!/bin/bash
# Run backup first
./scripts/backup.sh

# Sync to cloud (choose your provider)
# AWS S3:
aws s3 sync ./backups s3://your-bucket/db-backups/ --delete

# Or Google Cloud:
# gsutil -m rsync -r ./backups gs://your-bucket/db-backups/

# Or Azure:
# az storage blob upload-batch -d db-backups -s ./backups
```

### Option B: Remote Server Backup

```bash
# Backup and copy to remote server via SSH
./scripts/backup.sh
rsync -avz --delete ./backups/ user@backup-server:/backups/demo-app/
```

---

## **Layer 4: Kubernetes Persistent Volumes**

For Kubernetes deployments, use PersistentVolumeClaims with proper storage classes.

### Current K8s Setup

Check your Kubernetes PostgreSQL configuration:

```bash
kubectl get pvc -n demo
kubectl describe pvc postgres-pvc -n demo
```

### Recommended K8s Storage Strategy

1. **Use StorageClass with backup support** (e.g., AWS EBS with snapshots)
2. **Enable volume snapshots**
3. **Use StatefulSets for databases**
4. **Implement backup CronJobs**

---

## **Best Practices for Production**

### 1. **3-2-1 Backup Rule**
- **3** copies of your data
- **2** different storage types (local + cloud)
- **1** off-site backup

### 2. **Backup Schedule**
```
Production:
- Full backup: Daily
- Incremental: Every 6 hours
- Retention: 30 days minimum

Development:
- Full backup: Daily
- Retention: 7 days
```

### 3. **Test Your Backups Regularly**

```bash
# Monthly backup test procedure
# 1. Create test environment
docker compose -f docker-compose.test.yml up -d

# 2. Restore latest backup
./scripts/restore.sh backups/all_databases_YYYYMMDD_HHMMSS.sql.gz

# 3. Verify data integrity
docker exec demo-postgres psql -U postgres -d user_service_db -c "SELECT COUNT(*) FROM users;"

# 4. Cleanup
docker compose -f docker-compose.test.yml down -v
```

### 4. **Monitor Backup Success**

```bash
# Check latest backup
ls -lht backups/ | head -5

# Verify backup size (should not be 0)
du -sh backups/all_databases_*.sql.gz | tail -1

# Check backup logs
docker logs demo-postgres-backup
```

---

## **Emergency Recovery Procedures**

### Scenario 1: Accidental Data Deletion

```bash
# 1. Stop the application immediately
docker compose stop user-service gateway call-service delivery-service marketing-service

# 2. Find the latest backup before the incident
ls -lt backups/

# 3. Restore the affected database
./scripts/restore.sh backups/user_service_db_20260109_140000.sql.gz user_service_db

# 4. Restart services
docker compose start
```

### Scenario 2: Database Corruption

```bash
# 1. Stop all services
docker compose down

# 2. Remove corrupted volume
docker volume rm docker_db-data

# 3. Restart database
docker compose up -d db

# 4. Wait for database to be ready
docker compose logs -f db

# 5. Restore from backup
./scripts/restore.sh backups/all_databases_20260109_140000.sql.gz

# 6. Start all services
docker compose up -d
```

### Scenario 3: Complete Server Failure

```bash
# On new server:
# 1. Clone repository
git clone https://github.com/heangchihav/springboot-lucky-system.git
cd springboot-lucky-system/demo/infra/docker

# 2. Copy backups from cloud/remote
aws s3 sync s3://your-bucket/db-backups/ ./backups/
# or
rsync -avz user@backup-server:/backups/demo-app/ ./backups/

# 3. Start database only
docker compose up -d db redis

# 4. Restore data
./scripts/restore.sh backups/all_databases_LATEST.sql.gz

# 5. Start all services
docker compose up -d
```

---

## **Volume Management Commands**

### Safe Operations (Data Preserved)

```bash
# Restart containers (data safe)
docker compose restart

# Rebuild containers (data safe)
docker compose up -d --build

# Stop containers (data safe)
docker compose down

# Update images (data safe)
docker compose pull
docker compose up -d
```

### Dangerous Operations (Data Loss Risk)

```bash
# ⚠️ DANGER: Removes volumes and ALL DATA
docker compose down -v

# ⚠️ DANGER: Removes specific volume
docker volume rm docker_db-data

# ⚠️ DANGER: Removes all unused volumes
docker volume prune
```

### Before Dangerous Operations

```bash
# ALWAYS backup first!
./scripts/backup.sh

# Verify backup exists and is not empty
ls -lh backups/all_databases_*.sql.gz | tail -1

# Then proceed with dangerous operation
docker compose down -v
```

---

## **Monitoring & Alerts**

### Setup Backup Monitoring

Create a monitoring script `check-backups.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
MAX_AGE_HOURS=26  # Alert if no backup in last 26 hours

LATEST_BACKUP=$(find "$BACKUP_DIR" -name "all_databases_*.sql.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
BACKUP_AGE_SECONDS=$(( $(date +%s) - $(stat -c %Y "$LATEST_BACKUP") ))
BACKUP_AGE_HOURS=$(( BACKUP_AGE_SECONDS / 3600 ))

if [ $BACKUP_AGE_HOURS -gt $MAX_AGE_HOURS ]; then
    echo "⚠️ WARNING: Latest backup is $BACKUP_AGE_HOURS hours old!"
    # Send alert (email, Slack, etc.)
else
    echo "✓ Backup is current (${BACKUP_AGE_HOURS}h old)"
fi
```

---

## **Quick Reference**

### Daily Operations

```bash
# Manual backup
./scripts/backup.sh

# Check backup status
ls -lht backups/ | head -5

# View automated backup logs
docker logs demo-postgres-backup
```

### Recovery

```bash
# Restore single database
./scripts/restore.sh backups/DB_NAME_TIMESTAMP.sql.gz DB_NAME

# Restore everything
./scripts/restore.sh backups/all_databases_TIMESTAMP.sql.gz
```

### Maintenance

```bash
# Check volume size
docker system df -v | grep db-data

# Check backup disk usage
du -sh backups/

# Clean old backups (manual)
find backups/ -name "*.sql.gz" -mtime +30 -delete
```

---

## **Summary: What You Should Do**

### Minimum (Development)
1. ✅ Keep named volumes (already done)
2. ✅ Manual backups before major changes
3. ✅ Test restore procedure once

### Recommended (Staging)
1. ✅ Everything from Minimum
2. ✅ Automated daily backups
3. ✅ 7-day retention
4. ✅ Weekly backup tests

### Required (Production)
1. ✅ Everything from Recommended
2. ✅ Multiple backup frequencies (daily + hourly)
3. ✅ Off-site backup storage (cloud)
4. ✅ 30+ day retention
5. ✅ Automated backup monitoring
6. ✅ Documented recovery procedures
7. ✅ Monthly disaster recovery drills

---

## **Files Created**

```
infra/docker/
├── scripts/
│   ├── backup.sh         # Manual backup script
│   ├── restore.sh        # Restore script
│   └── backup-cron.sh    # Automated backup script (used by service)
├── backups/              # Backup storage directory
├── docker-compose.yml    # Includes automated backup service
└── BACKUP_GUIDE.md       # This documentation
```

## **Next Steps**

1. Test the backup script: `./scripts/backup.sh`
2. Test the restore script with a test database
3. Enable automated backups for production
4. Set up cloud storage sync
5. Document your recovery procedures
6. Schedule regular backup tests
