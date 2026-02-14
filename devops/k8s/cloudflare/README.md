# Cloudflare Tunnel - Kubernetes

## Files

- **`cloudflared-config.yaml`** - Tunnel configuration with environment variables
- **`cloudflared.yaml`** - Deployment manifest  
- **`cloudflare-setup.sh`** - Unified setup script (secret + config generation)

## Overview

This setup uses environment variables from `.env` file to dynamically configure cloudflared tunnel with comma-separated domains.

## Environment Variables

```bash
# In ../.env
CLOUDFLARE_TUNNEL_NAME=demo-tunnel
CLOUDFLARE_DOMAIN=vetapi.mooniris.com,https://dev.mooniris.com
CLOUDFLARE_SERVICE=http://nginx:80
```

## How It Works

### 1. Environment Variable Processing

The `deploy.sh` script uses `envsubst` to process all YAML files, substituting environment variables:

```bash
# Processes comma-separated domains into individual ingress rules
CLOUDFLARE_DOMAIN=vetapi.mooniris.com,https://dev.mooniris.com
```

Becomes:
```yaml
ingress:
  - hostname: vetapi.mooniris.com
    service: http://nginx:80
  - hostname: dev.mooniris.com
    service: http://nginx:80
```

### 2. Unified Setup Script

The `cloudflare-setup.sh` script handles both:
- **Secret creation** from credential files
- **Config generation** from comma-separated domains

Usage:
```bash
./cloudflare-setup.sh all     # Create both (default)
./cloudflare-setup.sh secret  # Create only secret
./cloudflare-setup.sh config  # Generate only config
```

### 3. Credential Files Location

```
/devops/cloudflared/
├── demo-tunnel.json    # Tunnel credentials
└── cert.pem           # Origin certificate
```

## Deployment Process

1. **Base ConfigMap** is applied with environment variable placeholders
2. **cloudflare-setup.sh** processes comma-separated domains and updates ConfigMap
3. **Secret** is created from credential files
4. **Deployment** is applied with the generated configuration

## Multiple Domains

Add domains to `.env` using comma-separated format:

```bash
# Single domain
CLOUDFLARE_DOMAIN=vetapi.mooniris.com

# Multiple domains
CLOUDFLARE_DOMAIN=vetapi.mooniris.com,https://dev.mooniris.com,https://api.example.com
```

The setup script automatically:
- Removes protocols (`https://`, `http://`)
- Splits by comma
- Creates individual ingress rules
- Validates domain format

## Updating Credentials

### 1. Update Credential Files
```bash
# Replace files in /devops/cloudflared/
cp ~/.cloudflared/new-tunnel.json /devops/cloudflared/demo-tunnel.json
cp ~/.cloudflared/cert.pem /devops/cloudflared/cert.pem
```

### 2. Update Environment
```bash
# Edit .env if changing tunnel name
nano .env
# Change: CLOUDFLARE_TUNNEL_NAME=new-tunnel
```

### 3. Redeploy
```bash
./deploy.sh
```

## Troubleshooting

### Domain Issues
```bash
# Check generated config
kubectl get configmap cloudflared-config -n demo -o yaml

# Test domain processing
./cloudflare-setup.sh config
```

### Secret Issues
```bash
# Check if secret exists
kubectl get secret cloudflared-credentials -n demo

# Recreate secret
./cloudflare-setup.sh secret
```

### Tunnel Not Connecting
```bash
# Check logs
kubectl logs -n demo -l app=cloudflared --tail=50

# Restart deployment
kubectl rollout restart deployment/cloudflared -n demo
```

## Best Practices

1. ✅ **Use comma-separated domains** in `.env` for easy management
2. ✅ **Keep credential files secure** - don't commit to git
3. ✅ **Use cloudflare-setup.sh** for unified setup
4. ✅ **Environment variables** for dynamic configuration
5. ❌ **Don't hardcode domains** in YAML files
6. ❌ **Don't commit secrets** to version control

## Security Notes

- Credential files contain sensitive data
- Never commit to git (already in `.gitignore`)
- Use different tunnels per environment
- Rotate credentials regularly
- Audit access to credential files

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Setup Cloudflare Tunnel
  env:
    CLOUDFLARE_TUNNEL_NAME: ${{ secrets.CLOUDFLARE_TUNNEL_NAME }}
    CLOUDFLARE_DOMAIN: ${{ secrets.CLOUDFLARE_DOMAIN }}
    CLOUDFLARE_SERVICE: http://nginx:80
  run: |
    echo "$TUNNEL_CREDENTIALS" > devops/cloudflared/demo-tunnel.json
    echo "$TUNNEL_CERT" > devops/cloudflared/cert.pem
    cd devops/k8s
    ./deploy.sh
```
