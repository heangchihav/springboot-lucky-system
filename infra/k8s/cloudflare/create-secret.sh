#!/bin/bash
# Script to create cloudflared secret from files
# This is the standard way to manage binary secrets in Kubernetes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLOUDFLARED_DIR="${SCRIPT_DIR}/../../cloudflared"

# Check if files exist
if [ ! -f "${CLOUDFLARED_DIR}/demo-tunnel.json" ]; then
    echo "Error: demo-tunnel.json not found at ${CLOUDFLARED_DIR}"
    exit 1
fi

if [ ! -f "${CLOUDFLARED_DIR}/cert.pem" ]; then
    echo "Error: cert.pem not found at ${CLOUDFLARED_DIR}"
    exit 1
fi

echo "Creating cloudflared-credentials secret from files..."

# Delete existing secret if it exists
kubectl delete secret cloudflared-credentials -n demo --ignore-not-found=true

# Create secret from files
kubectl create secret generic cloudflared-credentials \
    --from-file=demo-tunnel.json="${CLOUDFLARED_DIR}/demo-tunnel.json" \
    --from-file=cert.pem="${CLOUDFLARED_DIR}/cert.pem" \
    --namespace=demo

echo "✅ Secret created successfully!"
echo ""
echo "To verify:"
echo "  kubectl get secret cloudflared-credentials -n demo"
