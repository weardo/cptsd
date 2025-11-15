#!/bin/bash
# Deploy all CPTSD applications
# Usage: ./scripts/deploy-all.sh

set -e

echo "🚀 Deploying all CPTSD applications..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to deploy an app
deploy_app() {
    local APP_NAME=$1
    local APP_DIR=$2
    local DEPLOY_PATH=$3
    
    echo -e "${BLUE}📦 Deploying ${APP_NAME}...${NC}"
    
    if [ ! -d "$APP_DIR" ]; then
        echo -e "${YELLOW}⚠️  Directory $APP_DIR not found, skipping...${NC}"
        return
    fi
    
    # Check if docker-compose files exist
    if [ ! -f "$APP_DIR/docker-compose.yml" ]; then
        echo -e "${YELLOW}⚠️  No docker-compose.yml found for ${APP_NAME}, skipping...${NC}"
        return
    fi
    
    # Create deployment directory
    echo "Creating deployment directory: $DEPLOY_PATH"
    sudo mkdir -p "$DEPLOY_PATH"
    
    # Copy files to deployment directory
    echo "Copying files to $DEPLOY_PATH..."
    sudo cp -r "$APP_DIR"/* "$DEPLOY_PATH/" 2>/dev/null || true
    sudo cp -r "$APP_DIR"/.* "$DEPLOY_PATH/" 2>/dev/null || true
    
    # Navigate to deployment directory
    cd "$DEPLOY_PATH"
    
    # Check for .env file
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  No .env file found in $DEPLOY_PATH${NC}"
        echo "   You may need to create one with required environment variables"
    fi
    
    # Stop existing containers
    echo "Stopping existing containers..."
    sudo docker-compose -f docker-compose.yml -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
    
    # Build and start
    echo "Building and starting containers..."
    sudo docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
    
    echo -e "${GREEN}✅ ${APP_NAME} deployment initiated!${NC}"
    echo ""
}

# Deploy CMS
deploy_app "cptsd-cms" "./cptsd-cms" "/opt/cptsd-cms"

# Deploy Blog
deploy_app "cptsd-blog-public" "./cptsd-blog-public" "/opt/cptsd-blog-public"

echo -e "${GREEN}🎉 All deployments completed!${NC}"
echo ""
echo "📊 Check status:"
echo "   CMS:   sudo docker-compose -f /opt/cptsd-cms/docker-compose.yml -f /opt/cptsd-cms/docker-compose.prod.yml ps"
echo "   Blog:  sudo docker-compose -f /opt/cptsd-blog-public/docker-compose.yml -f /opt/cptsd-blog-public/docker-compose.prod.yml ps"
echo ""
echo "📝 View logs:"
echo "   CMS:   sudo docker-compose -f /opt/cptsd-cms/docker-compose.yml -f /opt/cptsd-cms/docker-compose.prod.yml logs -f"
echo "   Blog:  sudo docker-compose -f /opt/cptsd-blog-public/docker-compose.yml -f /opt/cptsd-blog-public/docker-compose.prod.yml logs -f"

