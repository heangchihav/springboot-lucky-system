#!/bin/bash
set -e

# Unified Cloudflare Setup Script
# Handles both secret creation and config generation from comma-separated domains

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"
CLOUDFLARED_DIR="${PROJECT_ROOT}/devops/cloudflared"
NAMESPACE="demo"

echo "🚀 Cloudflare Setup Script"
echo "========================="

# Load environment variables
if [ -f "$ENV_FILE" ]; then
    echo "Loading environment from $ENV_FILE"
    set -a
    source "$ENV_FILE"
    set +a
else
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

# Function: Create cloudflared credentials secret
create_secret() {
    echo ""
    echo "📋 Creating cloudflared credentials secret..."
    
    # Check if required files exist
    if [ ! -f "${CLOUDFLARED_DIR}/demo-tunnel.json" ]; then
        echo "Error: demo-tunnel.json not found at ${CLOUDFLARED_DIR}"
        exit 1
    fi
    
    if [ ! -f "${CLOUDFLARED_DIR}/cert.pem" ]; then
        echo "Error: cert.pem not found at ${CLOUDFLARED_DIR}"
        exit 1
    fi
    
    # Delete existing secret if it exists
    kubectl delete secret cloudflared-credentials -n "$NAMESPACE" --ignore-not-found=true
    
    # Create secret from files
    kubectl create secret generic cloudflared-credentials \
        --from-file=demo-tunnel.json="${CLOUDFLARED_DIR}/demo-tunnel.json" \
        --from-file=cert.pem="${CLOUDFLARED_DIR}/cert.pem" \
        --namespace="$NAMESPACE"
    
    echo "✅ Secret created successfully!"
}

# Function: Generate cloudflared config from comma-separated domains
generate_config() {
    echo ""
    echo "⚙️  Generating cloudflared config from comma-separated domains..."
    
    # Check required variables
    if [ -z "${CLOUDFLARE_TUNNEL_NAME}" ]; then
        echo "Error: CLOUDFLARE_TUNNEL_NAME not set"
        exit 1
    fi
    
    if [ -z "${CLOUDFLARE_DOMAIN}" ]; then
        echo "Error: CLOUDFLARE_DOMAIN not set"
        exit 1
    fi
    
    if [ -z "${CLOUDFLARE_SERVICE}" ]; then
        echo "Error: CLOUDFLARE_SERVICE not set"
        exit 1
    fi
    
    # Create temporary config
    TEMP_CONFIG=$(mktemp)
    trap "rm -f $TEMP_CONFIG" EXIT
    
    # Start with basic config
    cat > "$TEMP_CONFIG" << EOF
tunnel: ${CLOUDFLARE_TUNNEL_NAME}
credentials-file: /etc/cloudflared/credentials/${CLOUDFLARE_TUNNEL_NAME}.json
origincert: /etc/cloudflared/credentials/cert.pem

ingress:
EOF
    
    # Process comma-separated domains
    # Remove protocols and split by comma
    domains=$(echo "$CLOUDFLARE_DOMAIN" | sed 's|https://||g' | sed 's|http://||g' | tr ',' '\n')
    
    domain_count=0
    for domain in $domains; do
        # Skip empty domains
        if [ -n "$domain" ]; then
            # Remove any trailing/leading whitespace
            domain=$(echo "$domain" | xargs)
            echo "  - hostname: $domain" >> "$TEMP_CONFIG"
            echo "    service: ${CLOUDFLARE_SERVICE}" >> "$TEMP_CONFIG"
            domain_count=$((domain_count + 1))
        fi
    done
    
    # Add fallback route
    echo "  - service: http_status:404" >> "$TEMP_CONFIG"
    
    echo "Generated config with $domain_count domains:"
    cat "$TEMP_CONFIG"
    
    # Update the ConfigMap
    echo ""
    echo "Updating cloudflared-config ConfigMap..."
    kubectl create configmap cloudflared-config \
        --from-file=config.yml="$TEMP_CONFIG" \
        --namespace="$NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    echo "✅ Cloudflared config updated successfully!"
    
    # Show configured domains
    echo ""
    echo "🌐 Domains configured:"
    for domain in $domains; do
        if [ -n "$domain" ]; then
            echo "  - $domain -> ${CLOUDFLARE_SERVICE}"
        fi
    done
}

# Function: Show verification commands
show_verification() {
    echo ""
    echo "🔍 To verify setup:"
    echo "  kubectl get secret cloudflared-credentials -n $NAMESPACE"
    echo "  kubectl get configmap cloudflared-config -n $NAMESPACE -o yaml"
    echo "  kubectl logs -n $NAMESPACE -l app=cloudflared --tail=50"
}

# Main execution
main() {
    # Parse command line arguments
    case "${1:-all}" in
        "secret")
            create_secret
            ;;
        "config")
            generate_config
            ;;
        "all")
            create_secret
            generate_config
            ;;
        *)
            echo "Usage: $0 [secret|config|all]"
            echo "  secret - Create only the credentials secret"
            echo "  config - Generate only the cloudflared config"
            echo "  all    - Create both secret and config (default)"
            exit 1
            ;;
    esac
    
    show_verification
    echo ""
    echo "🎉 Cloudflare setup completed!"
}

# Run main function with all arguments
main "$@"
