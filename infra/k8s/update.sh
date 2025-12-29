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
MODULES=("gateway" "user-service" "call-service" "delivery-service")

if [[ -z "$DOCKER_HUB_USERNAME" ]]; then
  echo -e "${RED}Error: DOCKER_HUB_USERNAME is not set.${NC}"
  echo "Export it before running (e.g., export DOCKER_HUB_USERNAME=heangchihav)"
  exit 1
fi

echo -e "${YELLOW}=== Building Spring Boot microservices (${MODULES[*]}) ===${NC}"
cd "${BACKEND_DIR}"
./mvnw -pl "$(IFS=,; echo "${MODULES[*]}")" -am clean package -DskipTests
cd "${PROJECT_ROOT}"

for module in "${MODULES[@]}"; do
  MODULE_DIR="${BACKEND_DIR}/${module}"
  DOCKERFILE="${MODULE_DIR}/Dockerfile"
  IMAGE="${DOCKER_HUB_USERNAME}/${module}:${IMAGE_TAG}"

  if [[ ! -f "${DOCKERFILE}" ]]; then
    echo -e "${RED}Dockerfile not found for ${module} at ${DOCKERFILE}.${NC}"
    exit 1
  fi

  echo -e "\n${GREEN}[1/3] Building ${module} image (${IMAGE})...${NC}"
  docker build -t "${IMAGE}" -f "${DOCKERFILE}" "${MODULE_DIR}"

  echo -e "${GREEN}[2/3] Pushing ${IMAGE} to Docker Hub...${NC}"
  docker push "${IMAGE}"

  echo -e "${GREEN}[3/3] Updating deployment/${module} in namespace ${NAMESPACE}...${NC}"
  if kubectl get deployment "${module}" -n "${NAMESPACE}" >/dev/null 2>&1; then
    kubectl set image "deployment/${module}" \
      "${module}=${IMAGE}" \
      -n "${NAMESPACE}"
    kubectl rollout status "deployment/${module}" -n "${NAMESPACE}" --timeout=180s
  else
    echo -e "${YELLOW}Deployment ${module} not found in namespace ${NAMESPACE}. Apply manifests first.${NC}"
  fi
done

echo -e "\n${GREEN}=== All services built, pushed, and rolled out! ===${NC}"
kubectl get deployments -n "${NAMESPACE}"
