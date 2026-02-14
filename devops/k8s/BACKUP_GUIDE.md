# Kubernetes Database Backup & Recovery Guide

## 🛡️ Industry-Standard Backup Strategy for Kubernetes

This guide implements production-grade backup solutions following best practices used by major companies.

---

## **Architecture Overview**

### **Multi-Layer Protection**

1. **Persistent Volumes** - Data survives pod restarts
2. **Automated CronJob Backups** - Daily scheduled backups
3. **Manual Backup Scripts** - On-demand backups
4. **Off-Site Storage** - Cloud backup sync (recommended)

---

## **Layer 1: Persistent Volumes (Already Configured ✅)**

Your PostgreSQL database uses PersistentVolumeClaims which persist data across pod restarts and updates.

### Current Configuration

```yaml
volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 10Gi
```

**What This Protects Against:**
- ✅ Pod restarts and crashes
- ✅ Deployment updates
- ✅ Node failures (with proper storage class)

**What This DOESN'T Protect Against:**
- ❌ Data corruption
- ❌ Accidental data deletion
- ❌ Namespace deletion
- ❌ Cluster failures
- ❌ Ransomware attacks

---

## **Layer 2: Automated Backups (Kubernetes CronJob)**

### **Industry Standard: Kubernetes CronJob**

Most companies use Kubernetes CronJobs for automated database backups. This is the recommended approach.

### **What's Deployed**

The backup system includes:
- **CronJob**: Runs daily at 2 AM
- **ConfigMap**: Contains backup script
- **PersistentVolumeClaim**: 10Gi storage for backups
- **Secret**: PostgreSQL credentials

### **Deploy Automated Backups**

```bash
cd infra/k8s

# Deploy backup CronJob (included in main deployment)
kubectl apply -k .

# Or deploy backup only
kubectl apply -f infrastructure/backup/postgres-backup-cronjob.yaml
```

### **Verify CronJob**

```bash
# Check CronJob status
kubectl get cronjob -n demo

# View recent backup jobs
kubectl get jobs -n demo | grep backup

# Check backup logs
kubectl logs -n demo job/postgres-backup-<timestamp>

# List backups in PVC
kubectl exec -n demo postgres-0 -- ls -lh /backups
```

### **Configure Backup Schedule**

Edit `infrastructure/backup/postgres-backup-cronjob.yaml`:

```yaml
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  # schedule: "0 */6 * * *"  # Every 6 hours
  # schedule: "0 0 * * 0"  # Weekly on Sunday
```

### **Cron Schedule Examples**

```
0 2 * * *       # Daily at 2 AM
0 */6 * * *     # Every 6 hours
0 0 * * 0       # Weekly (Sunday at midnight)
0 3 * * 1-5     # Weekdays at 3 AM
*/30 * * * *    # Every 30 minutes (not recommended for production)
```

---

## **Layer 3: Manual Data Backups**

### **Create Manual Data Backup**

```bash
cd infra/k8s

# Backup all databases with data
./scripts/data-backup.sh

# Backup to specific directory
./scripts/data-backup.sh /path/to/backup/location

# Backup with custom namespace
NAMESPACE=production ./scripts/data-backup.sh
```

This creates:
- Individual database data backups: `user_service_db_data_20260109_140000.sql.gz`
- Full data backup: `all_databases_data_20260109_140000.sql.gz`

### **Restore from Data Backup**

```bash
# Restore single database with data
./scripts/data-restore.sh backups/user_service_db_data_20260109_140000.sql.gz user_service_db

# Restore all databases with data
./scripts/data-restore.sh backups/all_databases_data_20260109_140000.sql.gz

# Restore with custom namespace
NAMESPACE=production ./scripts/data-restore.sh backups/all_databases_data_20260109_140000.sql.gz
```

---

## **Layer 4: Off-Site Backups (Production Critical)**

### **Option A: Cloud Storage Sync (Recommended)**

#### **AWS S3 Example**

```bash
# Install AWS CLI in backup pod
kubectl exec -n demo postgres-backup-<job-id> -- apt-get update
kubectl exec -n demo postgres-backup-<job-id> -- apt-get install -y awscli

# Configure AWS credentials as Kubernetes secret
kubectl create secret generic aws-credentials -n demo \
  --from-literal=AWS_ACCESS_KEY_ID=your-key \
  --from-literal=AWS_SECRET_ACCESS_KEY=your-secret

# Sync backups to S3 (add to CronJob)
aws s3 sync /backups s3://your-bucket/k8s-backups/
```

#### **Google Cloud Storage Example**

```bash
# Create service account key secret
kubectl create secret generic gcs-key -n demo \
  --from-file=key.json=/path/to/service-account-key.json

# Sync to GCS (add to CronJob)
gsutil -m rsync -r /backups gs://your-bucket/k8s-backups/
```

### **Option B: Velero (Enterprise Solution)**

Velero is the industry-standard backup solution for Kubernetes clusters.

```bash
# Install Velero
velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.2.0 \
  --bucket velero-backups \
  --backup-location-config region=us-east-1 \
  --snapshot-location-config region=us-east-1

# Create backup schedule
velero schedule create daily-backup --schedule="0 2 * * *"

# Backup specific namespace
velero backup create demo-backup --include-namespaces demo

# Restore from backup
velero restore create --from-backup demo-backup
```

---

## **Production Best Practices**

### **1. Backup Frequency by Environment**

```
Development:
- Frequency: Daily
- Retention: 7 days
- Off-site: Optional

Staging:
- Frequency: Every 6 hours
- Retention: 14 days
- Off-site: Recommended

Production:
- Frequency: Every 4-6 hours
- Retention: 30+ days
- Off-site: Required
- Point-in-time recovery: Recommended
```

### **2. 3-2-1 Backup Rule**

- **3** copies of your data
- **2** different storage types (PVC + Cloud)
- **1** off-site backup

### **3. Monitoring & Alerts**

```yaml
# Add to CronJob for Slack notifications
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
spec:
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            # ... existing config ...
            env:
            - name: SLACK_WEBHOOK_URL
              valueFrom:
                secretKeyRef:
                  name: slack-webhook
                  key: url
            command:
            - /bin/bash
            - -c
            - |
              /scripts/data-backup.sh
              if [ $? -eq 0 ]; then
                curl -X POST -H 'Content-type: application/json' \
                  --data '{"text":"✅ Backup successful"}' \
                  $SLACK_WEBHOOK_URL
              else
                curl -X POST -H 'Content-type: application/json' \
                  --data '{"text":"❌ Backup failed!"}' \
                  $SLACK_WEBHOOK_URL
              fi
```

### **4. Test Backups Regularly**

```bash
# Monthly backup test procedure
# 1. Create test namespace
kubectl create namespace demo-test

# 2. Deploy test database
kubectl apply -f infrastructure/database/postgres.yaml -n demo-test

# 3. Restore latest backup
NAMESPACE=demo-test ./scripts/data-restore.sh backups/all_databases_data_LATEST.sql.gz

# 4. Verify data integrity
kubectl exec -n demo-test postgres-0 -- psql -U postgres -d user_service_db -c "SELECT COUNT(*) FROM users;"

# 5. Cleanup
kubectl delete namespace demo-test
```

---

## **Emergency Recovery Procedures**

### **Scenario 1: Accidental Data Deletion**

```bash
# 1. Scale down applications immediately
kubectl scale deployment -n demo --replicas=0 --all

# 2. Find latest backup before incident
kubectl exec -n demo postgres-0 -- ls -lt /backups/

# 3. Restore affected database
./scripts/data-restore.sh backups/user_service_db_data_20260109_140000.sql.gz user_service_db

# 4. Scale applications back up
kubectl scale deployment -n demo --replicas=1 --all
```

### **Scenario 2: Database Corruption**

```bash
# 1. Delete corrupted StatefulSet (keeps PVC)
kubectl delete statefulset postgres -n demo

# 2. Recreate StatefulSet
kubectl apply -f infrastructure/database/postgres.yaml

# 3. Wait for pod to be ready
kubectl wait --for=condition=ready pod/postgres-0 -n demo --timeout=300s

# 4. Restore from backup
./scripts/data-restore.sh backups/all_databases_data_20260109_140000.sql.gz

# 5. Restart all services
kubectl rollout restart deployment -n demo
```

### **Scenario 3: Complete Cluster Failure**

```bash
# On new cluster:
# 1. Deploy infrastructure
kubectl apply -k infra/k8s/

# 2. Wait for postgres to be ready
kubectl wait --for=condition=ready pod/postgres-0 -n demo --timeout=300s

# 3. Copy backups from cloud storage
aws s3 sync s3://your-bucket/k8s-backups/ ./backups/
# or
gsutil -m rsync -r gs://your-bucket/k8s-backups/ ./backups/

# 4. Restore data
./scripts/data-restore.sh backups/all_databases_data_LATEST.sql.gz

# 5. Deploy applications
kubectl apply -k infra/k8s/
```

---

## **Backup Storage Management**

### **Check Backup Storage Usage**

```bash
# Check PVC usage
kubectl exec -n demo postgres-0 -- df -h /backups

# List all backups
kubectl exec -n demo postgres-0 -- ls -lh /backups/

# Check total backup size
kubectl exec -n demo postgres-0 -- du -sh /backups/
```

### **Manual Cleanup**

```bash
# Delete backups older than 30 days
kubectl exec -n demo postgres-0 -- find /backups -name "*.sql.gz" -mtime +30 -delete

# Delete specific backup
kubectl exec -n demo postgres-0 -- rm /backups/user_service_db_20260101_020000.sql.gz
```

### **Increase Backup Storage**

```bash
# Edit PVC (if storage class supports expansion)
kubectl edit pvc postgres-backup-pvc -n demo

# Change storage size
spec:
  resources:
    requests:
      storage: 20Gi  # Increase from 10Gi
```

---

## **Comparison: Docker vs Kubernetes Backups**

| Feature | Docker Compose | Kubernetes |
|---------|---------------|------------|
| **Automation** | Simple cron container | CronJob (native) |
| **Storage** | Local volumes | PersistentVolumes |
| **Scaling** | Single node | Multi-node |
| **Monitoring** | Manual logs | Native monitoring |
| **Recovery** | Manual scripts | Automated with Velero |
| **Production Ready** | Small deployments | Enterprise scale |

---

## **What Major Companies Use**

### **Startup/Small (1-50 employees)**
- Kubernetes CronJobs for backups
- Daily backups to S3/GCS
- 30-day retention
- Manual restore testing

### **Medium (50-500 employees)**
- Velero for cluster backups
- Multiple backup frequencies
- 90-day retention
- Automated restore testing
- Backup monitoring/alerts

### **Enterprise (500+ employees)**
- Velero + custom solutions
- Continuous replication
- Multi-region backups
- Point-in-time recovery
- Compliance requirements (SOC2, HIPAA)
- Disaster recovery drills

---

## **Quick Reference**

### **Daily Operations**

```bash
# Manual backup
./scripts/data-backup.sh

# Check CronJob status
kubectl get cronjob -n demo

# View backup logs
kubectl logs -n demo -l app=postgres-backup --tail=50

# List backups
kubectl exec -n demo postgres-0 -- ls -lh /backups/
```

### **Recovery**

```bash
# Restore single database
./scripts/data-restore.sh backups/DB_NAME_data_TIMESTAMP.sql.gz DB_NAME

# Restore everything
./scripts/data-restore.sh backups/all_databases_data_TIMESTAMP.sql.gz
```

### **Maintenance**

```bash
# Check storage usage
kubectl exec -n demo postgres-0 -- df -h /backups

# Clean old backups
kubectl exec -n demo postgres-0 -- find /backups -name "*.sql.gz" -mtime +30 -delete

# Trigger manual backup job
kubectl create job --from=cronjob/postgres-backup manual-backup-$(date +%s) -n demo
```

---

## **Files Created**

```
infra/k8s/
├── scripts/
│   ├── data-backup.sh                              # Manual data backup script
│   └── data-restore.sh                             # Data restore script
├── infrastructure/backup/
│   └── postgres-backup-cronjob.yaml                 # Automated backup CronJob
├── kustomization.yaml                               # Updated with backup resources
└── BACKUP_GUIDE.md                                  # This documentation
```

---

## **Next Steps**

1. ✅ Deploy backup CronJob: `kubectl apply -k .`
2. ✅ Test manual backup: `./scripts/data-backup.sh`
3. ✅ Test restore procedure
4. ⚠️ Set up cloud storage sync (S3/GCS)
5. ⚠️ Configure backup monitoring/alerts
6. ⚠️ Document recovery procedures for your team
7. ⚠️ Schedule monthly disaster recovery drills

---

## **Summary**

Your Kubernetes backup solution now includes:

✅ **Automated daily backups** via CronJob (industry standard)  
✅ **Manual backup scripts** for on-demand backups  
✅ **Persistent storage** for backup retention  
✅ **Restore procedures** for emergency recovery  
✅ **Clean folder structure** for easy maintenance  
✅ **Production-ready** following best practices  

**This matches what most companies do for Kubernetes database backups!** 🎯
