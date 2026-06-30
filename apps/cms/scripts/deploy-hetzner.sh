#!/bin/bash
# Deployment script for Hetzner Cloud
# This script sets up and deploys the application on a Hetzner server

set -e

echo "🚀 Starting Hetzner deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed. Please log out and log back in, then run this script again."
    exit 0
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed."
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from example..."
    if [ -f .env.production.example ]; then
        cp .env.production.example .env
        echo "✅ Created .env file. Please edit it with your configuration."
        echo "   Run: nano .env"
        exit 1
    else
        echo "❌ No .env.example file found. Please create .env manually."
        exit 1
    fi
fi

# Validate required environment variables
echo "🔍 Validating environment variables..."
source .env

REQUIRED_VARS=("NEXTAUTH_SECRET" "ADMIN_EMAIL" "ADMIN_PASSWORD" "OPENAI_API_KEY")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '   - %s\n' "${MISSING_VARS[@]}"
    echo "   Please update your .env file."
    exit 1
fi

echo "✅ Environment variables validated."

# Build and start services
echo "🏗️  Building Docker images..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
docker-compose ps

# Initialize MinIO bucket if needed
echo "🪣 Setting up MinIO bucket..."
docker-compose exec -T minio mc alias set local http://localhost:9000 ${S3_ACCESS_KEY_ID} ${S3_SECRET_ACCESS_KEY} 2>/dev/null || true
docker-compose exec -T minio mc mb local/${S3_BUCKET_NAME} 2>/dev/null || true
docker-compose exec -T minio mc anonymous set public local/${S3_BUCKET_NAME} 2>/dev/null || true

echo "✅ Deployment complete!"
echo ""
echo "📋 Service URLs:"
echo "   - Application: http://$(hostname -I | awk '{print $1}'):3000"
echo "   - MinIO Console: http://$(hostname -I | awk '{print $1}'):9001"
echo "   - MinIO API: http://$(hostname -I | awk '{print $1}'):9000"
echo ""
echo "📝 Next steps:"
echo "   1. Set up a reverse proxy (nginx/caddy) with SSL"
echo "   2. Configure your domain DNS to point to this server"
echo "   3. Update NEXTAUTH_URL in .env with your domain"
echo "   4. Restart services: docker-compose restart app"
echo ""
echo "📚 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"

