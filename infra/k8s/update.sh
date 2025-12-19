#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IMAGE_NAME="demo-app"
NAMESPACE="demo"
DEPLOYMENT_NAME="demo-app"

echo -e "${YELLOW}=== Updating Demo Application (Zero-Downtime) ===${NC}"

# Step 1: Build the Spring Boot application
echo -e "\n${GREEN}[1/4] Building Spring Boot application...${NC}"
cd "$PROJECT_ROOT"
./mvnw clean package -DskipTests

# Step 2: Remove old Docker images completely
echo -e "\n${GREEN}[2/4] Removing old Docker images...${NC}"
docker rmi ${IMAGE_NAME}:latest -f 2>/dev/null || true
minikube ssh "docker rmi ${IMAGE_NAME}:latest -f" 2>/dev/null || true

# Step 3: Build new Docker image
echo -e "\n${GREEN}[3/4] Building new Docker image...${NC}"
docker build --no-cache -t ${IMAGE_NAME}:latest .

# Step 4: Load image into minikube and trigger rolling update
echo -e "\n${GREEN}[4/4] Loading image and triggering rolling update...${NC}"
minikube image load ${IMAGE_NAME}:latest

# Trigger rolling update by patching the deployment with a new annotation
# This forces Kubernetes to create new pods without deleting old ones first
echo -e "\n${YELLOW}Initiating zero-downtime rolling update...${NC}"
kubectl patch deployment ${DEPLOYMENT_NAME} -n ${NAMESPACE} -p \
  '{"spec":{"template":{"metadata":{"annotations":{"update":"'$(date +%s)'"}}}}}' || \
kubectl patch deployment ${DEPLOYMENT_NAME} -n ${NAMESPACE} -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"demo-app","image":"'${IMAGE_NAME}':latest","imagePullPolicy":"Never"}]}}}}'

# Wait for rolling update to complete
echo -e "\n${YELLOW}Waiting for rolling update to complete...${NC}"
kubectl rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE} --timeout=180s

echo -e "\n${GREEN}=== Update complete! (Zero-downtime achieved) ===${NC}"
echo "Check pods: kubectl get pods -n ${NAMESPACE}"
echo "View logs:  kubectl logs -f deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE}"
