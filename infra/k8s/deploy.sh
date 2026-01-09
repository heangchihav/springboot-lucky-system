#!/bin/bash
set -e

# Script to deploy Kubernetes resources with environment variable substitution
# This allows dynamic configuration without hardcoding values

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"

# Load environment variables from .env file
if [ -f "$ENV_FILE" ]; then
    echo "Loading environment from $ENV_FILE"
    set -a
    source "$ENV_FILE"
    set +a
else
    echo "Warning: .env file not found at $ENV_FILE"
    echo "Using environment variables from shell or defaults"
fi

# Check required variables
REQUIRED_VARS=(
    "CLOUDFLARE_TUNNEL_NAME"
    "CLOUDFLARE_DOMAIN"
    "POSTGRES_USER"
    "POSTGRES_PASSWORD"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "Error: Missing required environment variables:"
    printf '  - %s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Please set them in $ENV_FILE or export them manually"
    exit 1
fi

echo "Deploying to Kubernetes with configuration:"
echo "  Domain: $CLOUDFLARE_DOMAIN"
echo "  Tunnel: $CLOUDFLARE_TUNNEL_NAME"
echo ""

# Create temporary directory for processed files
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

# Process all YAML files with envsubst
echo "Processing configuration files..."
find . -name "*.yaml" -type f ! -name "kustomization.yaml" | while read -r file; do
    # Create directory structure in temp dir
    mkdir -p "$TMP_DIR/$(dirname "$file")"
    # Process file with envsubst
    envsubst < "$file" > "$TMP_DIR/$file"
done

# Apply resources in order
echo "Applying Kubernetes resources..."

# Base resources
echo "→ Applying base resources..."
kubectl apply -f base/namespace/namespace.yaml
kubectl apply -f "$TMP_DIR/base/secrets/secrets.yaml"
kubectl apply -f "$TMP_DIR/base/config/configmap.yaml"
kubectl apply -f base/config/postgres-init-configmap.yaml

# Infrastructure - Database & Cache
echo "→ Applying infrastructure (database & cache)..."
kubectl apply -f "$TMP_DIR/infrastructure/database/postgres.yaml"
kubectl apply -f "$TMP_DIR/infrastructure/cache/redis.yaml"

# Infrastructure - Proxy
echo "→ Applying infrastructure (proxy & ingress)..."
kubectl apply -f infrastructure/proxy/nginx-configmap.yaml
kubectl apply -f "$TMP_DIR/infrastructure/proxy/nginx.yaml"

# Services - Backend
echo "→ Applying backend services..."
kubectl apply -f "$TMP_DIR/services/backend/user-service.yaml"
kubectl apply -f "$TMP_DIR/services/backend/call-service.yaml"
kubectl apply -f "$TMP_DIR/services/backend/delivery-service.yaml"
kubectl apply -f "$TMP_DIR/services/backend/marketing-service.yaml"

# Services - Gateway
echo "→ Applying gateway..."
kubectl apply -f "$TMP_DIR/services/gateway/gateway.yaml"

# Infrastructure - Ingress
kubectl apply -f "$TMP_DIR/infrastructure/proxy/ingress.yaml"

# Cloudflare Tunnel
echo "→ Applying Cloudflare tunnel..."
kubectl apply -f "$TMP_DIR/cloudflare/cloudflared-config.yaml"

# Create secret from files (more secure than hardcoded YAML)
if [ -f "cloudflare/create-secret.sh" ]; then
    echo "  Creating cloudflared secret from files..."
    bash cloudflare/create-secret.sh
else
    echo "  Using hardcoded secret (fallback)..."
    kubectl apply -f cloudflare/cloudflared-secret.yaml
fi

kubectl apply -f "$TMP_DIR/cloudflare/cloudflared.yaml"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Check status with:"
echo "  kubectl get all -n demo"
echo "  kubectl get pods -n demo -w"
echo ""
echo "View logs:"
echo "  kubectl logs -n demo -l app=cloudflared --tail=50"
