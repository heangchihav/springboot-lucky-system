# Kubernetes Deployment - Organized Structure

## Directory Structure

```
k8s/
├── .env                    # Centralized configuration (symlink to root)
├── deploy.sh              # Deployment script
├── update.sh              # Build & push Docker images
├── kustomization.yaml     # Kustomize configuration
│
├── scripts/               # Backup & maintenance scripts
│   ├── backup.sh          # Manual database backup
│   └── restore.sh         # Database restore
│
├── base/                  # Base resources
│   ├── namespace/
│   │   └── namespace.yaml
│   ├── secrets/
│   │   └── secrets.yaml
│   └── config/
│       ├── configmap.yaml
│       └── postgres-init-configmap.yaml
│
├── infrastructure/        # Infrastructure components
│   ├── database/
│   │   └── postgres.yaml
│   ├── cache/
│   │   └── redis.yaml
│   ├── backup/
│   │   └── postgres-backup-cronjob.yaml
│   └── proxy/
│       ├── nginx-configmap.yaml
│       ├── nginx.yaml
│       └── ingress.yaml
│
├── services/             # Application services
│   ├── backend/
│   │   ├── auth-server.yaml
│   │   ├── call-service.yaml
│   │   ├── delivery-service.yaml
│   │   └── marketing-service.yaml
│   └── gateway/
│       └── gateway.yaml
│
└── cloudflare/           # Cloudflare tunnel
    ├── cloudflared-config.yaml
    ├── cloudflared-secret.yaml
    └── cloudflared.yaml
```

## Quick Start

### 1. Configure Environment

```bash
# Edit root .env file (symlinked here)
nano ../../.env
```

### 2. Deploy

```bash
# Make script executable
chmod +x deploy.sh

# Deploy all resources
./deploy.sh
```

### 3. Verify

```bash
# Check all resources
kubectl get all -n demo

# Watch pods
kubectl get pods -n demo -w

# Check specific service
kubectl logs -n demo -l app=cloudflared
```

## Deployment Order

The `deploy.sh` script applies resources in this order:

1. **Base Resources**
   - Namespace
   - Secrets (with env substitution)
   - ConfigMaps

2. **Infrastructure - Database & Cache**
   - PostgreSQL
   - Redis

3. **Infrastructure - Proxy**
   - Nginx ConfigMap
   - Nginx Deployment

4. **Services - Backend**
   - User Service
   - Call Service
   - Delivery Service
   - Marketing Service

5. **Services - Gateway**
   - API Gateway

6. **Infrastructure - Ingress**
   - Ingress rules

7. **Cloudflare Tunnel**
   - Config
   - Secrets
   - Deployment

## File Organization

### Base Resources
Core Kubernetes resources that everything depends on:
- **namespace**: Isolates all demo resources
- **secrets**: Sensitive data (passwords, tokens)
- **config**: Application configuration

### Infrastructure
Platform services that applications depend on:
- **database**: PostgreSQL with persistent storage
- **cache**: Redis for caching
- **backup**: Automated database backups (CronJob)
- **proxy**: Nginx reverse proxy and ingress

### Services
Application microservices:
- **backend**: Spring Boot microservices
- **gateway**: API Gateway for routing

### Cloudflare
External connectivity:
- **cloudflared**: Secure tunnel to Cloudflare network

## Managing Configuration

### Change Domain

```bash
# Edit root .env
CLOUDFLARE_DOMAIN=new-domain.com

# Redeploy
./deploy.sh
```

### Update Secrets

```bash
# Edit root .env
POSTGRES_PASSWORD=new-password

# Delete and recreate secret
kubectl delete secret demo-secrets -n demo
./deploy.sh
```

### Scale Services

```bash
# Scale specific service
kubectl scale deployment auth-server -n demo --replicas=3

# Or edit the YAML file and redeploy
```

## Troubleshooting

### Check Deployment Status

```bash
# All resources
kubectl get all -n demo

# Specific resource type
kubectl get pods -n demo
kubectl get svc -n demo
kubectl get configmap -n demo
```

### View Logs

```bash
# Specific pod
kubectl logs -n demo <pod-name>

# Follow logs
kubectl logs -n demo <pod-name> -f

# All pods with label
kubectl logs -n demo -l app=auth-server --tail=50
```

### Debug Pod Issues

```bash
# Describe pod
kubectl describe pod -n demo <pod-name>

# Get events
kubectl get events -n demo --sort-by='.lastTimestamp'

# Execute into pod
kubectl exec -it -n demo <pod-name> -- /bin/sh
```

## Using Kustomize

### Apply with Kustomize

```bash
# Build and view
kubectl kustomize .

# Apply
kubectl apply -k .
```

### Benefits of Current Structure

✅ **Organized** - Clear separation by function  
✅ **Maintainable** - Easy to find and update resources  
✅ **Scalable** - Easy to add new services  
✅ **Standard** - Follows Kubernetes best practices  
✅ **Clean** - No scattered files  

## Best Practices

1. ✅ **Use folders** - Group related resources
2. ✅ **Clear naming** - Descriptive file and folder names
3. ✅ **Consistent structure** - Same pattern across all services
4. ✅ **Environment variables** - Centralized in root .env
5. ✅ **Deployment order** - Dependencies first
6. ❌ **Don't mix concerns** - Keep infrastructure separate from services
7. ❌ **Don't hardcode** - Use environment variables

## Database Backups

### Automated Backups (Included)

The deployment includes automated database backups via Kubernetes CronJob:

```bash
# Check backup CronJob status
kubectl get cronjob -n demo

# View recent backup jobs
kubectl get jobs -n demo | grep backup

# View backup logs
kubectl logs -n demo -l app=postgres-backup --tail=50
```

### Manual Backups

```bash
# Create manual backup
./scripts/backup.sh

# Restore from backup
./scripts/restore.sh backups/all_databases_20260109_140000.sql.gz
```

### Full Documentation

See [BACKUP_GUIDE.md](./BACKUP_GUIDE.md) for:
- Complete backup procedures
- Emergency recovery steps
- Cloud storage integration
- Production best practices

---

## Cleanup

```bash
# Delete all resources
kubectl delete namespace demo

# Or delete specific resources
kubectl delete -k .
```
