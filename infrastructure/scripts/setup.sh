#!/bin/bash
# infrastructure/scripts/setup.sh

set -e

echo "🚀 Setting up Adherant Platform infrastructure..."

# Check if required tools are installed
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p database/migrations
mkdir -p database/seeds
mkdir -p logs
mkdir -p uploads/avatars
mkdir -p uploads/documents

# Set proper permissions for upload directories
chmod 755 uploads/avatars
chmod 755 uploads/documents

# Copy environment files if they don't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your configuration"
fi

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose exec postgres pg_isready -U admin -d adherent_db; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ Setup completed successfully!"
echo "🌐 API Gateway: http://localhost:3000"
echo "🔐 Auth Service: http://localhost:3001"
echo "👤 Profile Service: http://localhost:3002" 
echo "📄 Document Service: http://localhost:3003"
echo "🗄️  PostgreSQL: localhost:5432"

---
#!/bin/bash
