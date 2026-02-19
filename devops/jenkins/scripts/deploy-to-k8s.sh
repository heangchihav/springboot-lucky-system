#!/bin/bash

# K8s deployment script for Jenkins
# This script ONLY handles K8s deployment (no build/push duplication)
# Usage: ./deploy-to-k8s.sh [service] [namespace] [image]

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Parameters
SERVICE_NAME=${1:-""}
NAMESPACE=${2:-"demo"}
IMAGE=${3:-""}

# Validation
if [[ -z "$SERVICE_NAME" || -z "$IMAGE" ]]; then
    echo -e "${RED}Error: SERVICE_NAME and IMAGE are required${NC}"
    echo "Usage: $0 <service-name> <namespace> <image>"
    exit 1
fi

echo -e "${GREEN}=== Deploying ${SERVICE_NAME} to ${NAMESPACE} ===${NC}"
echo -e "${YELLOW}Service: ${SERVICE_NAME}${NC}"
echo -e "${YELLOW}Namespace: ${NAMESPACE}${NC}"
echo -e "${YELLOW}Image: ${IMAGE}${NC}"

# Only deploy to K8s (no build/push)
echo -e "\n${GREEN}[1/1] Updating deployment/${SERVICE_NAME} in namespace ${NAMESPACE}...${NC}"

if kubectl get deployment "${SERVICE_NAME}" -n "${NAMESPACE}" >/dev/null 2>&1; then
    kubectl set image "deployment/${SERVICE_NAME}" \
          "${SERVICE_NAME}=${IMAGE}" \
          -n "${NAMESPACE}"
    
    echo -e "${GREEN}Waiting for rollout to complete...${NC}"
    kubectl rollout status "deployment/${SERVICE_NAME}" -n "${NAMESPACE}" --timeout=180s
    
    echo -e "${GREEN}✅ ${SERVICE_NAME} deployed successfully!${NC}"
else
    echo -e "${RED}❌ Deployment ${SERVICE_NAME} not found in namespace ${NAMESPACE}${NC}"
    echo -e "${YELLOW}💡 Run initial deployment first using devops/k8s/deploy.sh${NC}"
    exit 1
fi

echo -e "\n${GREEN}=== Deployment completed! ===${NC}"
kubectl get deployments -n "${NAMESPACE}" | grep "${SERVICE_NAME}"
