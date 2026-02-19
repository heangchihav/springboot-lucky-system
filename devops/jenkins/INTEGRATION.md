# Jenkins Integration with Existing K8s Setup

This document explains how Jenkins integrates with your existing Kubernetes deployment scripts.

## 🔄 How It Works

### Your Existing Setup
- **`devops/k8s/update.sh`**: Builds, pushes, and deploys services
- **`devops/k8s/deploy.sh`**: Initial K8s setup with envsubst
- **K8s Manifests**: Service deployments with proper labels
- **Centralized `.env`**: Single source of truth for configuration

### Jenkins Integration
Jenkins **leverages your existing scripts** instead of replacing them:

```
Jenkins Pipeline → Your update.sh → K8s Deployment
```

## 🎯 Integration Points

### 1. Docker Building & Pushing
```groovy
// Jenkins builds Docker images
docker.build("${REGISTRY}/${service}:${env.IMAGE_TAG}", ".")

// Jenkins pushes to registry
docker.withRegistry("https://${env.DOCKER_REGISTRY}", 'docker-registry-credentials') {
    docker.image(imageName).push()
}
```

### 2. K8s Deployment (Using Your Scripts)
```groovy
def deployToKubernetes(service) {
    sh """
        cd ${env.WORKSPACE}/devops/k8s
        
        # Set environment variables that your update.sh expects
        export DOCKER_HUB_USERNAME=${env.DOCKER_REGISTRY}
        export IMAGE_TAG=${env.IMAGE_TAG}
        export NAMESPACE=demo-${params.ENVIRONMENT}
        
        # Call your existing update script
        ./update.sh ${service}
    """
}
```

### 3. Health Checks (Your Patterns)
```groovy
def healthCheck(service) {
    sh """
        cd ${env.WORKSPACE}/devops/k8s
        
        # Use your existing deployment patterns
        kubectl wait --for=condition=available deployment/${service} -n ${namespace}
        
        # Health check with port-forward (your pattern)
        kubectl port-forward -n ${namespace} svc/${service} ${port}:${port}
        curl -f http://localhost:${port}/actuator/health
    """
}
```

## 🛠️ Service Name Mapping

Jenkins uses the same service names as your K8s manifests:

| Jenkins Service | K8s Deployment | K8s Service | Port |
|---------------|----------------|---------------|------|
| `auth-server` | `auth-server` | `auth-server` | 8081 |
| `gateway` | `gateway` | `gateway` | 8080 |
| `call-service` | `call-service` | `call-service` | 8082 |
| `delivery-service` | `delivery-service` | `delivery-service` | 8083 |
| `marketing-service` | `marketing-service` | `marketing-service` | 8084 |
| `branchreport-service` | `branchreport-service` | `branchreport-service` | 8085 |
| `batch-service` | `batch-service` | `batch-service` | 8086 |

## 📋 Environment Variables

Jenkins respects your existing environment variables:

### From Your `.env`
```bash
DOCKER_HUB_USERNAME=heangchihav
IMAGE_TAG=latest
NAMESPACE=demo
```

### Jenkins-Specific
```bash
# Added by Jenkins
ENVIRONMENT=dev|staging|prod
IMAGE_TAG=<git-commit-sha>
```

## 🚀 Deployment Flow

### Development Workflow
```bash
# 1. Developer pushes code
git push origin feature-branch

# 2. Jenkins triggers pipeline
# - Builds Docker images
# - Runs tests
# - Pushes to registry

# 3. Jenkins calls your update.sh
./update.sh call-service

# 4. Your update.sh handles:
# - Building service (if needed)
# - Building Docker image
# - Pushing to Docker Hub
# - Updating K8s deployment
# - Waiting for rollout
```

### Production Workflow
```bash
# 1. Merge to main
git push origin main

# 2. Manual Jenkins trigger
# - Environment: prod
# - Service: all

# 3. Jenkins deploys sequentially
# - auth-server → gateway → call-service → etc.
# - Each service uses your update.sh
# - Health checks between deployments
```

## 🔧 Configuration

### Jenkins Environment Setup
```bash
# In Jenkins .env
DOCKER_REGISTRY=heangchihav  # Matches your .env
KUBECONFIG=<base64-kubeconfig>  # For kubectl access
```

### Namespace Strategy
Jenkins uses environment-based namespaces:
- **dev**: `demo-dev` 
- **staging**: `demo-staging`
- **prod**: `demo`

Your existing scripts work with this pattern.

## 📊 Benefits of Integration

### ✅ Preserves Your Investment
- No need to rewrite existing scripts
- Maintains your deployment patterns
- Keeps your environment variable strategy

### ✅ Best of Both Worlds
- Jenkins provides CI/CD automation
- Your scripts handle K8s specifics
- Consistent deployment patterns

### ✅ Easy Migration
- Gradual adoption possible
- Can run side-by-side initially
- Rollback to manual deployment easy

## 🔄 Quick Start

### 1. Run Integration Script
```bash
cd devops/jenkins
./scripts/integrate-with-existing.sh
```

### 2. Configure Jenkins
```bash
# Set up Jenkins
./scripts/deploy.sh dev docker-compose

# Configure credentials in Jenkins UI
# - Docker Hub credentials
# - Kubernetes kubeconfig
```

### 3. Create Pipeline Job
- New Item → Pipeline
- Use `devops/jenkins/Jenkinsfile` from SCM
- Build with Parameters

### 4. Test Integration
```bash
# Run pipeline for single service
# Environment: dev
# Service: call-service
# SKIP_TESTS: false
```

## 🔍 Troubleshooting

### Common Issues

#### Jenkins Can't Find update.sh
```bash
# Check workspace structure
ls -la ${env.WORKSPACE}/devops/k8s/update.sh

# Verify permissions
chmod +x ${env.WORKSPACE}/devops/k8s/update.sh
```

#### Environment Variable Mismatch
```bash
# Check what Jenkins passes
echo "DOCKER_HUB_USERNAME: $DOCKER_HUB_USERNAME"
echo "IMAGE_TAG: $IMAGE_TAG"
echo "NAMESPACE: $NAMESPACE"
```

#### K8s Deployment Fails
```bash
# Check your update.sh script directly
cd devops/k8s
export DOCKER_HUB_USERNAME=heangchihav
export IMAGE_TAG=test
export NAMESPACE=demo-dev
./update.sh call-service
```

## 📚 Next Steps

1. **Test Integration**: Run pipeline for single service
2. **Validate**: Check deployments in K8s
3. **Monitor**: Review Jenkins logs and K8s events
4. **Scale**: Add more services to pipeline
5. **Automate**: Set up webhooks from Git

---

*This integration ensures Jenkins enhances your existing setup without disrupting proven deployment patterns.*
