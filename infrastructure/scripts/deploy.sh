# infrastructure/scripts/deploy.sh

set -e

ENVIRONMENT=${1:-development}
VERSION=${2:-latest}

echo "🚀 Deploying Adherant Platform to $ENVIRONMENT..."

if [ "$ENVIRONMENT" = "production" ]; then
    echo "⚠️  Deploying to PRODUCTION environment"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Build Docker images
echo "🔨 Building Docker images..."
docker build -t adherant/auth-service:$VERSION ./services/auth-service
docker build -t adherant/profile-service:$VERSION ./services/profile-service
docker build -t adherant/document-service:$VERSION ./services/document-service
docker build -t adherant/api-gateway:$VERSION ./services/api-gateway

if [ "$ENVIRONMENT" = "kubernetes" ]; then
    echo "☸️  Deploying to Kubernetes..."
    
    # Apply Kubernetes manifests
    kubectl apply -f infrastructure/kubernetes/namespace.yaml
    kubectl apply -f infrastructure/kubernetes/postgres.yaml
    kubectl apply -f infrastructure/kubernetes/auth-service.yaml
    kubectl apply -f infrastructure/kubernetes/profile-service.yaml
    kubectl apply -f infrastructure/kubernetes/document-service.yaml
    kubectl apply -f infrastructure/kubernetes/api-gateway.yaml
    kubectl apply -f infrastructure/kubernetes/ingress.yaml
    
    echo "⏳ Waiting for deployments to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/auth-service -n adherant-platform
    kubectl wait --for=condition=available --timeout=300s deployment/profile-service -n adherant-platform
    kubectl wait --for=condition=available --timeout=300s deployment/document-service -n adherant-platform
    kubectl wait --for=condition=available --timeout=300s deployment/api-gateway -n adherant-platform
    
else
    echo "🐳 Deploying with Docker Compose..."
    
    # Use different compose file for production
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    else
        docker-compose up -d
    fi
fi

echo "✅ Deployment completed successfully!"

# Check service health
echo "🏥 Checking service health..."
sleep 10

if [ "$ENVIRONMENT" = "kubernetes" ]; then
    kubectl get pods -n adherant-platform
else
    docker-compose ps
fi

echo "🎉 All services are running!"

---
