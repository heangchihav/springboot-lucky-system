# Cloudflare Tunnel - Kubernetes

## Files

- **`cloudflared-config.yaml`** - Tunnel configuration (uses env variables)
- **`cloudflared.yaml`** - Deployment manifest
- **`cloudflared-secret.yaml`** - Hardcoded secret (fallback)
- **`create-secret.sh`** - Script to create secret from files (recommended)

## Secret Management

### Recommended Approach (From Files)

The secret is created from actual credential files:

```bash
# Run manually
./create-secret.sh

# Or automatically via deploy.sh
cd ..
./deploy.sh
```

**Benefits:**
- ✅ No hardcoded base64 in git
- ✅ Easy to update (just replace files)
- ✅ Works with different tunnels per environment
- ✅ Standard Kubernetes practice

### Fallback Approach (Hardcoded YAML)

If `create-secret.sh` doesn't exist, the deployment falls back to `cloudflared-secret.yaml`.

## How It Works

### 1. Credential Files Location

```
/infra/cloudflared/
├── demo-tunnel.json    # Tunnel credentials
└── cert.pem           # Origin certificate
```

### 2. Secret Creation

The `create-secret.sh` script:
1. Reads files from `/infra/cloudflared/`
2. Creates Kubernetes secret with base64 encoding
3. Deletes old secret if exists
4. Creates new secret in `demo` namespace

### 3. Deployment Uses Secret

```yaml
volumeMounts:
  - name: credentials
    mountPath: /etc/cloudflared/credentials
volumes:
  - name: credentials
    secret:
      secretName: cloudflared-credentials
```

## Multiple Environments

### Dev Environment

```bash
# Use dev tunnel credentials
cp ~/.cloudflared/dev-tunnel.json ../../cloudflared/demo-tunnel.json
./create-secret.sh
```

### Staging Environment

```bash
# Use staging tunnel credentials
cp ~/.cloudflared/staging-tunnel.json ../../cloudflared/demo-tunnel.json
./create-secret.sh
```

### Production Environment

```bash
# Use prod tunnel credentials
cp ~/.cloudflared/prod-tunnel.json ../../cloudflared/demo-tunnel.json
./create-secret.sh
```

## Updating Credentials

### When to Update

- Rotating tunnel credentials
- Changing tunnel
- Moving to different Cloudflare account

### How to Update

```bash
# 1. Get new credentials
cloudflared tunnel create new-tunnel

# 2. Copy to cloudflared directory
cp ~/.cloudflared/<new-tunnel-id>.json ../../cloudflared/demo-tunnel.json

# 3. Update .env with new tunnel name
nano ../../../.env
# Change: CLOUDFLARE_TUNNEL_NAME=new-tunnel

# 4. Recreate secret
./create-secret.sh

# 5. Restart cloudflared
kubectl rollout restart deployment/cloudflared -n demo
```

## Troubleshooting

### Secret Not Found

```bash
# Check if secret exists
kubectl get secret cloudflared-credentials -n demo

# Recreate secret
./create-secret.sh
```

### Wrong Credentials

```bash
# Delete secret
kubectl delete secret cloudflared-credentials -n demo

# Verify files are correct
ls -la ../../cloudflared/

# Recreate secret
./create-secret.sh
```

### Permission Denied

```bash
# Make script executable
chmod +x create-secret.sh

# Run script
./create-secret.sh
```

## Best Practices

1. ✅ **Use create-secret.sh** - Don't hardcode secrets in YAML
2. ✅ **Keep files secure** - Don't commit credential files to git
3. ✅ **Rotate regularly** - Update credentials periodically
4. ✅ **Environment-specific** - Different tunnels per environment
5. ❌ **Don't commit secrets** - Keep `cloudflared-secret.yaml` as fallback only
6. ❌ **Don't share credentials** - Each environment has its own

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Create Cloudflared Secret
  env:
    TUNNEL_CREDENTIALS: ${{ secrets.CLOUDFLARE_TUNNEL_CREDENTIALS }}
    TUNNEL_CERT: ${{ secrets.CLOUDFLARE_TUNNEL_CERT }}
  run: |
    echo "$TUNNEL_CREDENTIALS" | base64 -d > infra/cloudflared/demo-tunnel.json
    echo "$TUNNEL_CERT" | base64 -d > infra/cloudflared/cert.pem
    cd infra/k8s/cloudflare
    ./create-secret.sh
```

### GitLab CI Example

```yaml
deploy:
  script:
    - echo "$TUNNEL_CREDENTIALS" | base64 -d > infra/cloudflared/demo-tunnel.json
    - echo "$TUNNEL_CERT" | base64 -d > infra/cloudflared/cert.pem
    - cd infra/k8s/cloudflare
    - ./create-secret.sh
```

## Security Notes

- Credential files contain sensitive data
- Never commit to git (already in `.gitignore`)
- Use secret management tools in production (Vault, AWS Secrets Manager)
- Rotate credentials regularly
- Audit access to credential files
