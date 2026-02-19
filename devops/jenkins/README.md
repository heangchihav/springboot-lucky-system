# Jenkins CI/CD for Lucky System

Clean and simple Jenkins setup for your Spring Cloud microservices with Kubernetes integration.

## 🏗️ Architecture

```
Developer Push → Jenkins CI/CD → Docker Registry → Kubernetes → Running Services
```

**Jenkins Role**: Build → Test → Push → Deploy  
**Kubernetes Role**: Run containers, scaling, networking, restarts

## 📁 Directory Structure

```
devops/jenkins/
├── README.md                    # This file
├── Jenkinsfile                 # Main CI/CD pipeline
├── docker-compose.yml          # Local Jenkins setup
├── plugins.txt                # Required plugins
├── .env.example               # Environment variables template
└── scripts/
    ├── deploy.sh              # Deploy Jenkins
    └── cleanup.sh            # Cleanup Jenkins
```

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

### 2. Deploy Jenkins

```bash
# Deploy Jenkins (Docker Compose for local)
./scripts/deploy.sh dev docker-compose

# Or deploy to Kubernetes
./scripts/deploy.sh prod kubernetes
```

### 3. Access Jenkins

- **Local**: http://localhost:8090
- **Kubernetes**: Check ingress URL after deployment

### 4. Configure Jenkins

1. **Get Initial Password**:
   ```bash
   # Docker Compose
   docker-compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
   
   # Kubernetes
   kubectl exec -n jenkins deployment/jenkins -- cat /var/jenkins_home/secrets/initialAdminPassword
   ```

2. **Install Plugins**: Use provided `plugins.txt`

3. **Configure Credentials**:
   - Docker Registry credentials
   - Kubernetes kubeconfig
   - Git credentials

4. **Create Pipeline Job**:
   - New Item → Pipeline
   - Pipeline script → Use Jenkinsfile from SCM
   - SCM → Git → Repository URL

## 🔧 Configuration

### Environment Variables

```bash
# Docker Registry
DOCKER_REGISTRY_URL=your-registry.com
DOCKER_REGISTRY_USERNAME=your-username
DOCKER_REGISTRY_PASSWORD=your-password

# Kubernetes
KUBECONFIG=base64-encoded-kubeconfig

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

### Pipeline Parameters

- `ENVIRONMENT`: dev/staging/prod
- `SERVICE`: all or specific service name
- `SKIP_TESTS`: Skip running tests
- `SKIP_BUILD`: Deploy only, no rebuild
- `IMAGE_TAG`: Custom Docker tag

## 📋 Pipeline Features

### Build Stage
- Parallel compilation of all services
- Maven for Java services
- Cargo for Rust service

### Test Stage
- Unit tests in parallel
- Test result publishing
- Coverage reports

### Docker Stage
- Build images in parallel
- Push to registry
- Tag with git commit SHA

### Deploy Stage
- Update Kubernetes deployments
- Rollout status monitoring
- Zero-downtime deployments

### Health Check
- Pod readiness verification
- Health endpoint testing
- Service availability checks

## 🔄 Workflow

### Development Workflow
```bash
# 1. Developer pushes code
git push origin feature-branch

# 2. Jenkins triggers automatically
# - Builds and tests
# - Pushes Docker image
# - Deploys to dev environment

# 3. Automated health checks
# - Verifies deployment
# - Sends notifications
```

### Production Workflow
```bash
# 1. Merge to main branch
git push origin main

# 2. Manual trigger for production
# - Jenkins UI → Build with Parameters
# - Environment: prod
# - Service: all

# 3. Automated production deployment
# - Sequential deployment for safety
# - Health checks between services
# - Rollback on failure
```

## 🛠️ Services Supported

| Service | Port | Path |
|---------|------|------|
| Gateway | 8080 | `backend/infrastructure/gateway` |
| Auth Server | 8081 | `backend/infrastructure/auth-server` |
| Call Service | 8082 | `backend/services/call-service` |
| Delivery Service | 8083 | `backend/services/delivery-service` |
| Marketing Service | 8084 | `backend/services/marketing-service` |
| Branch Report Service | 8085 | `backend/services/branchreport-service` |
| Batch Service | 8086 | `backend/services/batch-service` |

## 🔒 Security Features

- **Credentials Management**: Encrypted storage
- **RBAC**: Role-based access control
- **Security Scanning**: OWASP dependency check
- **Image Scanning**: Container vulnerability scanning

## 📊 Monitoring

### Build Monitoring
- Real-time build status
- Parallel execution tracking
- Success/failure rates
- Performance metrics

### Notifications
- Email notifications
- Slack integration
- Build status webhooks

## 🧹 Maintenance

### Daily Tasks
```bash
# Check Jenkins health
curl -f http://localhost:8090/login

# Monitor build queue
# Jenkins UI → Manage Jenkins → Build Queue

# Clean up old builds
# Jenkins UI → Manage Jenkins → System Log → Log Cleaner
```

### Weekly Tasks
```bash
# Update plugins
# Jenkins UI → Manage Jenkins → Plugins → Check Updates

# Backup Jenkins data
./scripts/backup.sh prod kubernetes

# Review credentials
# Jenkins UI → Manage Jenkins → Manage Credentials
```

## 🔍 Troubleshooting

### Common Issues

#### Jenkins Won't Start
```bash
# Check logs
docker-compose logs jenkins

# Common causes:
# - Port conflicts
# - Insufficient memory
# - Permission issues
```

#### Build Failures
```bash
# Check build logs in Jenkins UI
# Verify environment variables
# Check Docker daemon status
# Validate Kubernetes connectivity
```

#### Deployment Failures
```bash
# Check kubectl access
kubectl get nodes

# Check namespace
kubectl get namespaces

# Check deployment status
kubectl get deployments -n demo-dev
```

### Health Checks

```bash
# Docker Compose
curl -f http://localhost:8090/login

# Kubernetes
kubectl get pods -n jenkins
kubectl logs -n jenkins deployment/jenkins
```

## 📚 Best Practices

### Pipeline Design
- Use declarative syntax
- Implement proper error handling
- Add comprehensive logging
- Use environment-specific configurations

### Security
- Never commit secrets
- Use credential stores
- Implement least privilege access
- Regular security audits

### Performance
- Parallelize independent tasks
- Use appropriate resource limits
- Implement caching strategies
- Monitor build times

## 🚀 Advanced Features

### Multi-Environment Support
- Environment-specific configurations
- Conditional deployments
- Environment-specific secrets
- Rollback capabilities

### Blue Ocean Integration
- Modern pipeline UI
- Visual pipeline editor
- Improved mobile experience

### Configuration as Code
- Version-controlled configuration
- Automated setup
- Environment consistency

---

## 📞 Support

### Getting Help
1. Check Jenkins logs
2. Review pipeline syntax
3. Validate configuration
4. Consult documentation

### Documentation
- [Jenkins Official Docs](https://jenkins.io/doc/)
- [Pipeline Syntax](https://jenkins.io/doc/book/pipeline/syntax/)
- [Kubernetes Plugin](https://plugins.jenkins.io/kubernetes/)

---

*Last updated: $(date)*  
*Maintained by: DevOps Team*
