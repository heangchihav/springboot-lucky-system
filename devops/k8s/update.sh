#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
NAMESPACE="${NAMESPACE:-demo}"
DOCKER_HUB_USERNAME="${DOCKER_HUB_USERNAME:-}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
ALL_MODULES=("infrastructure/auth-server" "infrastructure/gateway" "services/call-service" "services/delivery-service" "services/marketing-service" "services/branchreport-service")

# If arguments provided, use them as modules to update. Otherwise, update all.
if [[ $# -gt 0 ]]; then
  MODULES=("$@")
  echo -e "${YELLOW}=== Updating specific services: ${MODULES[*]} ===${NC}"
else
  MODULES=("${ALL_MODULES[@]}")
  echo -e "${YELLOW}=== Updating all services: ${MODULES[*]} ===${NC}"
fi

# Validate module names
for module in "${MODULES[@]}"; do
    if [[ ! " ${ALL_MODULES[*]} " =~ " ${module} " ]]; then
        echo -e "${RED}Error: Invalid module '${module}'.${NC}"
        echo -e "Valid modules: ${ALL_MODULES[*]}"
        exit 1
    fi
done

if [[ -z "$DOCKER_HUB_USERNAME" ]]; then
    echo -e "${RED}Error: DOCKER_HUB_USERNAME is not set.${NC}"
    echo "Export it before running (e.g., export DOCKER_HUB_USERNAME=heangchihav)"
    exit 1
fi

echo -e "${YELLOW}=== Building Spring Boot microservices (${MODULES[*]}) ===${NC}"

for module in "${MODULES[@]}"; do
    MODULE_DIR="${BACKEND_DIR}/${module}"
    echo -e "\n${GREEN}Building ${module}...${NC}"
    cd "${MODULE_DIR}"
    
    # Check if it's a Rust project (has Cargo.toml) or Java project (has pom.xml)
    if [ -f "Cargo.toml" ]; then
        # Rust project - use Cargo
        echo "Detected Rust project, using Cargo..."
        cargo build --release
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Cargo build failed for ${module}${NC}"
            exit 1
        fi
    elif [ -f "pom.xml" ]; then
        # Java project - use Maven
        echo "Detected Java project, using Maven..."
        mvn clean package -DskipTests
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Maven build failed for ${module}${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Error: No build system detected for ${module} (neither Cargo.toml nor pom.xml found)${NC}"
        exit 1
    fi
    
    cd "${PROJECT_ROOT}"
done

for module in "${MODULES[@]}"; do
    MODULE_DIR="${BACKEND_DIR}/${module}"
    DOCKERFILE="${MODULE_DIR}/Dockerfile"
    
    # Extract service name from module path (e.g., "infrastructure/auth-server" -> "auth-server")
    SERVICE_NAME=$(basename "$module")
    IMAGE="${DOCKER_HUB_USERNAME}/${SERVICE_NAME}:${IMAGE_TAG}"

    if [[ ! -f "${DOCKERFILE}" ]]; then
        echo -e "${RED}Dockerfile not found for ${module} at ${DOCKERFILE}.${NC}"
        exit 1
    fi

    echo -e "\n${GREEN}[1/3] Building ${module} image (${IMAGE})...${NC}"
    docker build -t "${IMAGE}" -f "${DOCKERFILE}" "${MODULE_DIR}"

    echo -e "${GREEN}[2/3] Pushing ${IMAGE} to Docker Hub...${NC}"
    docker push "${IMAGE}"

    echo -e "${GREEN}[3/3] Updating deployment/${SERVICE_NAME} in namespace ${NAMESPACE}...${NC}"
    if kubectl get deployment "${SERVICE_NAME}" -n "${NAMESPACE}" >/dev/null 2>&1; then
        kubectl set image "deployment/${SERVICE_NAME}" \
          "${SERVICE_NAME}=${IMAGE}" \
          -n "${NAMESPACE}"
        kubectl rollout status "deployment/${SERVICE_NAME}" -n "${NAMESPACE}" --timeout=180s
    else
        echo -e "${YELLOW}Deployment ${SERVICE_NAME} not found in namespace ${NAMESPACE}. Apply manifests first.${NC}"
    fi
done

echo -e "\n${GREEN}=== All services built, pushed, and rolled out! ===${NC}"
kubectl get deployments -n "${NAMESPACE}"

# ============================================================================
# Jenkins Integration - Avoid Duplication
# ============================================================================
# Check if called from Jenkins to avoid build/push duplication
if [[ "\${JENKINS_DEPLOYMENT:-}" == "true" ]]; then
    echo -e "\${YELLOW}Jenkins deployment detected - skipping build/push, only deploying...\${NC}"
    
    # Skip build and push sections, only do deployment
    for module in "\${MODULES[@]}"; do
        MODULE_DIR="\${BACKEND_DIR}/\${module}"
        DOCKERFILE="\${MODULE_DIR}/Dockerfile"
        SERVICE_NAME=\$(basename "\$module")
        IMAGE="\${DOCKER_HUB_USERNAME}/\${SERVICE_NAME}:\${IMAGE_TAG}"
        
        echo -e "\n\${GREEN}[1/1] Deploying \${module} (\${IMAGE})...\${NC}"
        
        if kubectl get deployment "\${SERVICE_NAME}" -n "\${NAMESPACE}" >/dev/null 2>&1; then
            kubectl set image "deployment/\${SERVICE_NAME}" \
                  "\${SERVICE_NAME}=\${IMAGE}" \
                  -n "\${NAMESPACE}"
            kubectl rollout status "deployment/\${SERVICE_NAME}" -n "\${NAMESPACE}" --timeout=180s
        else
            echo -e "\${YELLOW}Deployment \${SERVICE_NAME} not found in namespace \${NAMESPACE}. Apply manifests first.\${NC}"
        fi
    done
    
    echo -e "\n\${GREEN}=== Jenkins deployment completed! ===\${NC}"
    kubectl get deployments -n "\${NAMESPACE}"
    exit 0
fi
