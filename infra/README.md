# Infrastructure

This folder contains all infrastructure-related configurations for deploying the Demo Spring Boot application.

## Table of Contents

- [Structure](#structure)
- [Docker Setup](#docker-setup)
- [Kubernetes Setup](#kubernetes-setup)
- [Cloudflare Tunnel Setup](#cloudflare-tunnel-setup)
- [Deployment Guide](#deployment-guide)
- [Troubleshooting](#troubleshooting)

---

## Structure

```
infra/
├── docker/
│   ├── docker-compose.yml
│   ├── nginx/
│   │   └── nginx.conf
│   ├── .env              # Your secrets (not committed)
│   └── .env.example      # Template for .env
└── k8s/
    ├── deploy.sh            # Deploy script (reads .env automatically)
    ├── kustomization.yaml   # Kustomize entry point
    ├── namespace.yaml       # demo namespace
    ├── secrets.yaml         # DB & Cloudflare credentials (uses envsubst)
    ├── configmap.yaml       # Spring Boot config
    ├── postgres.yaml        # PostgreSQL deployment + service
    ├── app.yaml             # Spring Boot deployment + service
    ├── cloudflared.yaml     # Cloudflare tunnel deployment
    └── ingress.yaml         # Nginx ingress
```

## Docker Setup

### Prerequisites
- Docker & Docker Compose installed
- Cloudflare tunnel token (from Zero Trust dashboard)

### Quick Start

1. **Copy environment template:**
   ```bash
   cd infra/docker
   cp .env.example .env
   ```

2. **Edit `.env`** and add your Cloudflare tunnel token:
   ```
   CLOUDFLARED_TUNNEL_TOKEN=eyJhIjoi...
   ```

3. **Configure Cloudflare tunnel** to point to `http://localhost:80`

4. **Start infrastructure:**
   ```bash
   docker compose up -d
   ```

5. **Start Spring Boot app** (from project root):
   ```bash
   ./mvnw spring-boot:run
   ```

### Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database |
| Nginx | 80 | Reverse proxy → Spring Boot :8080 |
| Cloudflared | - | Exposes app via Cloudflare tunnel |

### Stop Services

```bash
cd infra/docker
docker compose down
```

### View Logs

```bash
docker compose logs -f
```

---

## Kubernetes Setup

### Prerequisites
- Kubernetes cluster (minikube, kind, or cloud provider)
- kubectl configured
- Nginx Ingress Controller installed

### Quick Start

1. **Build and push Docker image:**
   ```bash
   # From project root
   docker build -t demo-app:latest .
   
   # If using a registry:
   docker tag demo-app:latest your-registry/demo-app:latest
   docker push your-registry/demo-app:latest
   ```

2. **Update secrets** in `infra/k8s/secrets.yaml`:
   - Set your Cloudflare tunnel token
   - Update database credentials if needed

3. **Update image** in `infra/k8s/app.yaml` if using a registry:
   ```yaml
   image: your-registry/demo-app:latest
   ```

4. **Set your Cloudflare token** in `infra/docker/.env`:
   ```
   CLOUDFLARED_TUNNEL_TOKEN=eyJhIjoi...
   ```

5. **Deploy to Kubernetes** (uses token from `.env` automatically):
   ```bash
   cd infra/k8s
   ./deploy.sh
   ```

   Or manually with kustomize:
   ```bash
   export CLOUDFLARED_TUNNEL_TOKEN="your_token"
   envsubst < infra/k8s/secrets.yaml | kubectl apply -f -
   kubectl apply -k infra/k8s/
   ```

6. **Configure Cloudflare tunnel** to point to your ingress or service.

### Useful Commands

```bash
# Check deployment status
kubectl get all -n demo

# View logs
kubectl logs -f deployment/demo-app -n demo

# Delete everything
kubectl delete -k infra/k8s/
```

### Architecture

```
┌────────────────────────────────────────────────────┐
│                   Kubernetes Cluster               │
│                                                    │
│  ┌─────────────┐    ┌─────────────┐                │
│  │ cloudflared │───▶│   Ingress   │                │
│  └─────────────┘    └──────┬──────┘                │
│                            │                       │
│                    ┌───────▼───────┐               │
│                    │  demo-app (2) │               │
│                    └───────┬───────┘               │
│                            │                       │
│                    ┌───────▼───────┐               │
│                    │   PostgreSQL  │               │
│                    └───────────────┘               │
└────────────────────────────────────────────────────┘
```
