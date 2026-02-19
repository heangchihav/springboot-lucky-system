#!/bin/bash

# Jenkins Deployment Script for Lucky System
# Usage: ./deploy.sh [environment] [deployment-type]

set -e

# Default values
ENVIRONMENT=${1:-dev}
DEPLOYMENT_TYPE=${2:-docker-compose}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
JENKINS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Starting Jenkins deployment for Lucky System"
echo "Environment: $ENVIRONMENT"
echo "Deployment Type: $DEPLOYMENT_TYPE"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo "❌ Invalid environment. Must be one of: dev, staging, prod"
    exit 1
fi

# Function to deploy with Docker Compose
deploy_docker_compose() {
    echo "🐳 Deploying Jenkins with Docker Compose..."
    
    cd "$JENKINS_DIR"
    
    # Copy environment file
    if [[ -f ".env.$ENVIRONMENT" ]]; then
        cp ".env.$ENVIRONMENT" .env
    elif [[ -f ".env.example" ]]; then
        cp .env.example .env
        echo "⚠️  Using .env.example. Please configure your environment variables."
    else
        echo "❌ No environment file found"
        exit 1
    fi
    
    # Start services
    echo "📦 Starting Jenkins services..."
    docker compose up -d
    
    # Wait for Jenkins to be ready
    echo "⏳ Waiting for Jenkins to be ready..."
    timeout 300 bash -c '
        until curl -f http://localhost:8090/login > /dev/null 2>&1; do
            echo "Waiting for Jenkins..."
            sleep 10
        done
    '
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Jenkins is ready at http://localhost:8090"
        echo "🔑 Initial admin password:"
        docker-compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword 2>/dev/null || echo "Run: docker-compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword"
    else
        echo "❌ Jenkins failed to start"
        docker-compose logs jenkins
        exit 1
    fi
}

# Function to deploy with Kubernetes
deploy_kubernetes() {
    echo "☸️  Deploying Jenkins to Kubernetes..."
    
    cd "$PROJECT_ROOT/devops/k8s"
    
    # Apply Jenkins deployment
    echo "🚀 Deploying Jenkins..."
    kubectl apply -f jenkins-deployment.yaml
    
    # Wait for deployment
    echo "⏳ Waiting for Jenkins deployment..."
    kubectl rollout status deployment/jenkins --namespace jenkins --timeout=300s
    
    # Get Jenkins URL
    INGRESS_HOST=$(kubectl get ingress jenkins-ingress --namespace jenkins -o jsonpath='{.spec.rules[0].host}')
    if [[ -n "$INGRESS_HOST" ]]; then
        echo "✅ Jenkins is ready at https://$INGRESS_HOST"
        echo "🔑 Get initial admin password:"
        echo "kubectl exec -n jenkins deployment/jenkins -- cat /var/jenkins_home/secrets/initialAdminPassword"
    else
        echo "✅ Jenkins is ready via port-forward:"
        echo "kubectl port-forward -n jenkins svc/jenkins 8090:8080"
        echo "Then access http://localhost:8090"
    fi
}

# Main deployment logic
main() {
    echo "🎯 Starting deployment process..."
    
    # Deploy based on type
    if [[ "$DEPLOYMENT_TYPE" == "docker-compose" ]]; then
        deploy_docker_compose
    elif [[ "$DEPLOYMENT_TYPE" == "kubernetes" ]]; then
        deploy_kubernetes
    fi
    
    echo "🎉 Jenkins deployment completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Access Jenkins UI"
    echo "2. Configure credentials (Docker Registry, Kubernetes)"
    echo "3. Create pipeline job using Jenkinsfile in devops/jenkins/"
    echo "4. Set up webhooks in your Git repository"
    echo ""
    echo "📚 Documentation: See README.md in devops/jenkins/"
}

# Run main function
main "$@"
