#!/bin/bash
set -e

# Load environment variables from .env file if it exists
ENV_FILE="../docker/.env"
if [ -f "$ENV_FILE" ]; then
    echo "Loading environment from $ENV_FILE"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Check required variables
if [ -z "$CLOUDFLARED_TUNNEL_TOKEN" ]; then
    echo "Error: CLOUDFLARED_TUNNEL_TOKEN is not set"
    echo "Please set it in $ENV_FILE or export it manually"
    exit 1
fi

echo "Deploying to Kubernetes..."

# Apply namespace first
kubectl apply -f namespace.yaml

# Apply secrets with environment variable substitution
envsubst < secrets.yaml | kubectl apply -f -

# Apply remaining resources
kubectl apply -f configmap.yaml
kubectl apply -f postgres.yaml
kubectl apply -f redis.yaml
kubectl apply -f user-service.yaml
kubectl apply -f call-service.yaml
kubectl apply -f delivery-service.yaml
kubectl apply -f gateway.yaml
kubectl apply -f nginx-configmap.yaml
kubectl apply -f nginx.yaml
kubectl apply -f cloudflared.yaml
kubectl apply -f ingress.yaml

echo ""
echo "Deployment complete!"
echo "Check status with: kubectl get all -n demo"
