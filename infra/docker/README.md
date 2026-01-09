# Docker Compose Deployment

This directory contains Docker Compose configuration for running the microservices application locally or in production.

## Configuration

The docker-compose.yml uses pre-built images from Docker Hub instead of building locally for faster deployments.

### Environment Variables

Configure the following in `.env` file:

```bash
# Docker Hub Configuration
DOCKER_HUB_USERNAME=heangchihav
IMAGE_TAG=latest
```

## Usage

### 1. Pull Latest Images from Docker Hub

Before starting, ensure you have the latest images:

```bash
docker compose pull
```

### 2. Start All Services

```bash
docker compose up -d
```

### 3. Check Service Status

```bash
docker compose ps
```

### 4. View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f user-service
docker compose logs -f gateway
```

### 5. Stop Services

```bash
docker compose down
```

### 6. Stop and Remove Volumes (Clean Reset)

```bash
docker compose down -v
```

## Building and Pushing New Images

If you need to build and push new images to Docker Hub:

### Option 1: Using Kubernetes update.sh script

```bash
cd ../k8s
export DOCKER_HUB_USERNAME=heangchihav
export IMAGE_TAG=latest
./update.sh
```

This will:
1. Build all microservices with Maven
2. Build Docker images for each service
3. Push images to Docker Hub
4. Update Kubernetes deployments

### Option 2: Manual Build (from project root)

```bash
cd ../../

# Build all services
cd backend
./mvnw clean package -DskipTests

# Build and push individual service
docker build -f backend/Dockerfile --build-arg MODULE=user-service -t heangchihav/user-service:latest .
docker push heangchihav/user-service:latest

# Repeat for other services: gateway, call-service, delivery-service, marketing-service
```

## Services

The docker-compose.yml includes:

### Backend Services (from Docker Hub)
- **user-service** - Port 8081 - User authentication and authorization
- **gateway** - Port 8080 - API Gateway with routing and CORS
- **call-service** - Port 8082 - Call management service
- **delivery-service** - Port 8083 - Delivery management service
- **marketing-service** - Port 8084 - Marketing management service

### Infrastructure Services
- **postgres** - Port 5433 - PostgreSQL database
- **redis** - Port 6380 - Redis cache
- **nginx** - Port 80 - Reverse proxy
- **cloudflared** - Cloudflare tunnel for external access
- **prometheus** - Port 9090 - Metrics collection
- **grafana** - Port 3300 - Monitoring dashboards

## Accessing Services

### Local Access
- API Gateway: http://localhost:8080
- User Service: http://localhost:8081
- Call Service: http://localhost:8082
- Delivery Service: http://localhost:8083
- Marketing Service: http://localhost:8084
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3300

### External Access (via Cloudflare Tunnel)
- Domain: https://test.mooniris.com

## Health Checks

All services include health checks:

```bash
# Check user-service health
curl http://localhost:8081/actuator/health

# Check gateway health
curl http://localhost:8080/actuator/health/readiness

# Via domain
curl https://test.mooniris.com/actuator/health
```

## Troubleshooting

### Service is unhealthy
```bash
# Check logs
docker logs demo-user-service --tail=100

# Restart service
docker compose restart user-service
```

### Pull latest images
```bash
docker compose pull
docker compose up -d
```

### Clean restart
```bash
docker compose down -v
docker system prune -f
docker compose pull
docker compose up -d
```

### Database issues
```bash
# Access PostgreSQL
docker exec -it demo-postgres psql -U postgres

# List databases
\l

# Connect to specific database
\c user_service_db
```

## Image Management

### Switch Between Local Build and Docker Hub

To use local builds instead of Docker Hub images, modify docker-compose.yml:

```yaml
# From (Docker Hub):
user-service:
  image: ${DOCKER_HUB_USERNAME}/user-service:${IMAGE_TAG}

# To (Local Build):
user-service:
  build:
    context: ../..
    dockerfile: backend/Dockerfile
    args:
      MODULE: user-service
```

### Use Specific Image Tag

Update `.env` file:
```bash
IMAGE_TAG=v1.0.0  # Instead of 'latest'
```

Then pull and restart:
```bash
docker compose pull
docker compose up -d
```
