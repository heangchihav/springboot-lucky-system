# 🚀 Deployment Guide - From Scratch

Complete step-by-step guide to deploy this project with Kubernetes.

## 📋 Prerequisites

### Required Tools

```bash
# 1. Docker
docker --version  # Should be 20.10+

# 2. Kubernetes cluster (choose one)
# - Minikube (local)
# - Docker Desktop with Kubernetes
# - Cloud provider (GKE, EKS, AKS)
kubectl version --client

# 3. kubectl configured
kubectl cluster-info

# 4. Cloudflare account (for tunnel)
# Sign up at https://dash.cloudflare.com
```

### System Requirements

- **OS**: Linux, macOS, or Windows with WSL2
- **RAM**: 8GB minimum (16GB recommended)
- **Disk**: 20GB free space
- **Network**: Internet connection for pulling images

---

## 🎯 Quick Start (5 Steps)

### Step 1: Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd demo

# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

**Required changes in `.env`:**
```bash
CLOUDFLARE_TUNNEL_NAME=your-tunnel-name
CLOUDFLARE_DOMAIN=your-domain.com
POSTGRES_PASSWORD=your-secure-password
GRAFANA_ADMIN_PASSWORD=your-secure-password
JWT_SECRET=your-256-bit-secret-key-change-in-production
```

### Step 2: Setup Cloudflare Tunnel

```bash
# Install cloudflared
# macOS
brew install cloudflared

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Windows (WSL)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create demo-tunnel

# Copy credentials
cp ~/.cloudflared/<tunnel-id>.json infra/cloudflared/demo-tunnel.json
cp ~/.cloudflared/cert.pem infra/cloudflared/cert.pem

# Get tunnel ID
cloudflared tunnel list
# Copy the UUID (e.g., b3eda752-5dad-4beb-a70f-44a4dcf2b9bc)
```

### Step 3: Configure DNS

Go to Cloudflare Dashboard → DNS:

```
Type: CNAME
Name: your-subdomain (e.g., api)
Target: <tunnel-id>.cfargotunnel.com
Proxy: Enabled (orange cloud)
```

Example:
```
CNAME  api  →  b3eda752-5dad-4beb-a70f-44a4dcf2b9bc.cfargotunnel.com
```

### Step 4: Build Docker Images (if needed)

```bash
# Build all services
cd backend

# Build each service
cd gateway && ./mvnw clean package -DskipTests && cd ..
cd auth-server && ./mvnw clean package -DskipTests && cd ..
cd call-service && ./mvnw clean package -DskipTests && cd ..
cd delivery-service && ./mvnw clean package -DskipTests && cd ..
cd marketing-service && ./mvnw clean package -DskipTests && cd ..

# Or use Docker Compose to build
cd ../infra/docker
docker compose build
```

### Step 5: Deploy to Kubernetes

```bash
cd ../k8s

# Make deploy script executable
chmod +x deploy.sh

# Deploy everything
./deploy.sh
```

**Expected output:**
```
Loading environment from /path/to/.env
Processing configuration files...
→ Applying base resources...
→ Applying infrastructure (database & cache)...
→ Applying infrastructure (proxy & ingress)...
→ Applying backend services...
→ Applying gateway...
→ Applying Cloudflare tunnel...
✅ Deployment complete!
```

---

## 🔍 Verification

### Check Deployment Status

```bash
# Check all resources
kubectl get all -n demo

# Check pods are running
kubectl get pods -n demo

# Expected output:
# NAME                                READY   STATUS    RESTARTS   AGE
# postgres-...                        1/1     Running   0          2m
# redis-...                           1/1     Running   0          2m
# auth-server-...                    1/1     Running   0          1m
# call-service-...                    1/1     Running   0          1m
# delivery-service-...                1/1     Running   0          1m
# marketing-service-...               1/1     Running   0          1m
# gateway-...                         1/1     Running   0          1m
# nginx-...                           1/1     Running   0          1m
# cloudflared-...                     1/1     Running   0          1m
```

### Check Logs

```bash
# Cloudflared (tunnel)
kubectl logs -n demo -l app=cloudflared --tail=50

# Gateway
kubectl logs -n demo -l app=gateway --tail=50

# User Service
kubectl logs -n demo -l app=auth-server --tail=50
```

### Test Access

```bash
# Test via Cloudflare tunnel
curl https://your-domain.com/actuator/health

# Expected: {"status":"UP"}
```

---

## 📁 Project Structure Overview

```
demo/
├── .env                    # ⭐ Centralized configuration
├── .env.example            # Template
├── DEPLOYMENT.md           # This file
│
├── backend/                # Spring Boot microservices
│   ├── gateway/
│   ├── auth-server/
│   ├── call-service/
│   ├── delivery-service/
│   └── marketing-service/
│
├── frontend/               # Next.js application
│   └── .env.local          # Frontend config
│
└── infra/
    ├── cloudflared/        # Tunnel credentials
    │   ├── config.yml
    │   ├── demo-tunnel.json
    │   └── cert.pem
    │
    ├── docker/             # Docker Compose (for local dev)
    │   └── docker-compose.yml
    │
    └── k8s/                # Kubernetes manifests
        ├── deploy.sh       # Deployment script
        ├── base/           # Base resources
        ├── infrastructure/ # Database, cache, proxy
        ├── services/       # Backend services
        └── cloudflare/     # Cloudflare tunnel
```

---

## 🔧 Configuration Files

### Root `.env` (Infrastructure & Backend)

```bash
# Cloudflare
CLOUDFLARE_TUNNEL_NAME=demo-tunnel
CLOUDFLARE_DOMAIN=api.yourdomain.com
CLOUDFLARE_SERVICE=http://nginx:80

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure-password

# Gateway & CORS
GATEWAY_CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:*,https://yourdomain.com
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
COOKIE_SECURE=true

# Monitoring
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=secure-password

# Backend
JWT_SECRET=your-256-bit-secret-key-minimum-32-characters
SERVER_PORT=8080
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/user_service_db
```

### Frontend `.env.local`

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
```

---

## 🌍 Multiple Environments

### Development

```bash
# Create dev config
cp .env .env.dev

# Edit for dev
nano .env.dev
# CLOUDFLARE_DOMAIN=dev.yourdomain.com

# Deploy
cp .env.dev .env
cd infra/k8s && ./deploy.sh
```

### Staging

```bash
# Create staging config
cp .env .env.staging

# Edit for staging
nano .env.staging
# CLOUDFLARE_DOMAIN=staging.yourdomain.com

# Deploy
cp .env.staging .env
cd infra/k8s && ./deploy.sh
```

### Production

```bash
# Create prod config
cp .env .env.prod

# Edit for production
nano .env.prod
# CLOUDFLARE_DOMAIN=api.yourdomain.com
# Use strong passwords!

# Deploy
cp .env.prod .env
cd infra/k8s && ./deploy.sh
```

---

## 🐛 Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n demo

# Describe problematic pod
kubectl describe pod <pod-name> -n demo

# Check logs
kubectl logs <pod-name> -n demo

# Common issues:
# - Image pull errors: Check image names in YAML files
# - CrashLoopBackOff: Check application logs
# - Pending: Check resource availability
```

### Database Connection Issues

```bash
# Check postgres pod
kubectl get pod -n demo -l app=postgres

# Check postgres logs
kubectl logs -n demo -l app=postgres

# Test connection from another pod
kubectl run -it --rm debug --image=postgres:16 --restart=Never -n demo -- \
  psql -h postgres -U postgres -d postgres
```

### Cloudflare Tunnel Not Working

```bash
# Check cloudflared logs
kubectl logs -n demo -l app=cloudflared --tail=100

# Verify secret exists
kubectl get secret cloudflared-credentials -n demo

# Recreate secret
cd infra/k8s/cloudflare
./create-secret.sh

# Restart cloudflared
kubectl rollout restart deployment/cloudflared -n demo

# Check DNS configuration in Cloudflare dashboard
```

### Configuration Not Applied

```bash
# Verify .env file
cat .env

# Check if symlinks work
ls -la infra/k8s/.env

# Redeploy
cd infra/k8s
./deploy.sh
```

---

## 🔄 Updates and Maintenance

### Update Configuration

```bash
# 1. Edit .env
nano .env

# 2. Redeploy
cd infra/k8s
./deploy.sh
```

### Update Application Code

```bash
# 1. Build new images
cd backend/<service>
./mvnw clean package -DskipTests

# 2. Build Docker image
docker build -t <service>:latest .

# 3. Push to registry (if using remote)
docker push <registry>/<service>:latest

# 4. Restart deployment
kubectl rollout restart deployment/<service> -n demo
```

### Scale Services

```bash
# Scale up
kubectl scale deployment auth-server -n demo --replicas=3

# Scale down
kubectl scale deployment auth-server -n demo --replicas=1

# Auto-scale (HPA)
kubectl autoscale deployment auth-server -n demo --min=2 --max=10 --cpu-percent=80
```

### Backup Database

```bash
# Backup
kubectl exec -n demo <postgres-pod> -- pg_dump -U postgres postgres > backup.sql

# Restore
kubectl exec -i -n demo <postgres-pod> -- psql -U postgres postgres < backup.sql
```

---

## 🗑️ Cleanup

### Delete Everything

```bash
# Delete namespace (removes all resources)
kubectl delete namespace demo

# Or use deploy script
cd infra/k8s
kubectl delete -k .
```

### Delete Specific Resources

```bash
# Delete deployment
kubectl delete deployment <name> -n demo

# Delete service
kubectl delete service <name> -n demo

# Delete configmap
kubectl delete configmap <name> -n demo
```

---

## 📚 Additional Resources

- **Kubernetes Docs**: `/infra/k8s/README.md`
- **Cloudflare Docs**: `/infra/k8s/cloudflare/README.md`
- **Docker Compose**: `/infra/docker/docker-compose.yml`
- **Project README**: `/README.md`

---

## ✅ Checklist for Your Friend

- [ ] Install Docker, kubectl, cloudflared
- [ ] Clone repository
- [ ] Copy `.env.example` to `.env`
- [ ] Update `.env` with their values
- [ ] Create Cloudflare tunnel
- [ ] Copy tunnel credentials to `infra/cloudflared/`
- [ ] Configure DNS in Cloudflare
- [ ] Run `./deploy.sh`
- [ ] Verify pods are running
- [ ] Test access via domain

---

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `kubectl logs -n demo <pod-name>`
2. Check events: `kubectl get events -n demo --sort-by='.lastTimestamp'`
3. Verify configuration: `cat .env`
4. Check this guide's troubleshooting section
5. Review README files in each directory

---

## 🎉 Success!

If all pods are running and you can access the application via your domain, congratulations! 🎊

Your microservices application is now running on Kubernetes with:
- ✅ Secure Cloudflare tunnel
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ Multiple microservices
- ✅ API Gateway
- ✅ Nginx reverse proxy
- ✅ Centralized configuration

Enjoy your deployment! 🚀
