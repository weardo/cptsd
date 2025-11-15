#!/bin/bash
# Simple deployment script - assumes SSH is already set up

set -e

SERVER_IP="37.27.39.20"
SERVER_USER="root"
DEPLOY_PATH="/opt/cptsd-cms"

echo "🚀 Deploying to CX23 server ($SERVER_IP)..."

# Test SSH connection
echo "🧪 Testing SSH connection..."
ssh -o BatchMode=yes -o ConnectTimeout=5 "$SERVER_USER@$SERVER_IP" "echo 'Connected'" || {
    echo "❌ SSH key not configured. Please run: ./scripts/setup-ssh-first.sh"
    echo "   Or manually add your SSH key to the server"
    exit 1
}

# Function to run commands on remote server
run_remote() {
    ssh "$SERVER_USER@$SERVER_IP" "$@"
}

echo "📦 Updating system packages..."
run_remote "DEBIAN_FRONTEND=noninteractive apt update && DEBIAN_FRONTEND=noninteractive apt upgrade -y"

echo "🐳 Installing Docker..."
if ! run_remote "command -v docker" &>/dev/null; then
    run_remote "curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && sh /tmp/get-docker.sh && rm /tmp/get-docker.sh"
else
    echo "✅ Docker already installed"
fi

echo "📦 Installing Docker Compose..."
if ! run_remote "command -v docker-compose" &>/dev/null; then
    run_remote "apt install -y docker-compose"
else
    echo "✅ Docker Compose already installed"
fi

echo "📁 Creating deployment directory..."
run_remote "mkdir -p $DEPLOY_PATH"

echo "📤 Copying project files..."
cd "$(dirname "$0")/../.." || cd /home/astra/n8n/cptsd-cms

# Create tarball of project
tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='*.log' \
    --exclude='backups' \
    --exclude='.env' \
    --exclude='.env.local' \
    -czf /tmp/cptsd-cms-deploy.tar.gz .

scp /tmp/cptsd-cms-deploy.tar.gz "$SERVER_USER@$SERVER_IP:/tmp/"
rm /tmp/cptsd-cms-deploy.tar.gz

run_remote "cd $DEPLOY_PATH && tar -xzf /tmp/cptsd-cms-deploy.tar.gz && rm /tmp/cptsd-cms-deploy.tar.gz"

echo "🔧 Setting up environment file..."
run_remote "cd $DEPLOY_PATH && if [ ! -f .env ]; then
    MONGO_PASS=\$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-24)
    MINIO_PASS=\$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-24)
    ADMIN_PASS=\$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-16)
    NEXTAUTH_SECRET=\$(openssl rand -base64 32)
    
    cat > .env << EOF
# MongoDB Configuration (self-hosted)
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=\$MONGO_PASS

# MongoDB Connection String
MONGODB_URI=mongodb://admin:\$MONGO_PASS@mongodb:27017/cptsd-cms?authSource=admin

# MinIO Configuration
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=\$MINIO_PASS
S3_BUCKET_NAME=cptsd-cms

# OpenAI Configuration (UPDATE THIS!)
OPENAI_API_KEY=sk-your-openai-key-here

# Authentication
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=\$ADMIN_PASS

# NextAuth Configuration
NEXTAUTH_URL=http://$SERVER_IP:3000
NEXTAUTH_SECRET=\$NEXTAUTH_SECRET
EOF
    
    echo '✅ Created .env file'
    echo ''
    echo '📝 Generated credentials:'
    echo "   MongoDB Password: \$MONGO_PASS"
    echo "   MinIO Password: \$MINIO_PASS"
    echo "   Admin Password: \$ADMIN_PASS"
    echo "   NextAuth Secret: \$NEXTAUTH_SECRET"
    echo ''
    echo '⚠️  IMPORTANT: Update OPENAI_API_KEY in .env file!'
fi"

echo "🔥 Configuring firewall..."
run_remote "apt install -y ufw && \
            ufw allow 22/tcp && \
            ufw allow 80/tcp && \
            ufw allow 443/tcp && \
            ufw allow 3000/tcp && \
            ufw allow 9000/tcp && \
            ufw allow 9001/tcp && \
            (echo 'y' | ufw enable || ufw --force enable) && \
            echo '✅ Firewall configured'" || echo "⚠️  Firewall setup skipped (may already be configured)"

echo "🚀 Deploying application..."
run_remote "cd $DEPLOY_PATH && \
            if [ -d scripts ]; then chmod +x scripts/*.sh 2>/dev/null || true; fi && \
            if [ -f scripts/deploy-hetzner.sh ]; then \
                ./scripts/deploy-hetzner.sh; \
            else \
                echo '📦 Building Docker images...'; \
                docker-compose build; \
                echo '🚀 Starting services...'; \
                docker-compose up -d; \
                echo '⏳ Waiting for services...'; \
                sleep 15; \
                docker-compose ps; \
                echo '✅ Deployment complete!'; \
            fi"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Server Details:"
echo "   IP: $SERVER_IP"
echo "   IPv6: 2a01:4f9:c013:2c35::/64"
echo "   Application: http://$SERVER_IP:3000"
echo "   MinIO Console: http://$SERVER_IP:9001 (use credentials from .env)"
echo ""
echo "📝 Next steps:"
echo "   1. View generated passwords: ssh $SERVER_USER@$SERVER_IP 'cd $DEPLOY_PATH && cat .env'"
echo "   2. Edit .env: ssh $SERVER_USER@$SERVER_IP 'cd $DEPLOY_PATH && nano .env'"
echo "   3. Update OPENAI_API_KEY and ADMIN_EMAIL"
echo "   4. Setup reverse proxy (Caddy) with your domain"
echo "   5. Update NEXTAUTH_URL in .env with your domain"
echo ""
echo "🔐 SSH Access:"
echo "   ssh $SERVER_USER@$SERVER_IP"
echo ""
echo "📚 Useful commands:"
echo "   View logs: ssh $SERVER_USER@$SERVER_IP 'cd $DEPLOY_PATH && docker-compose logs -f'"
echo "   Restart: ssh $SERVER_USER@$SERVER_IP 'cd $DEPLOY_PATH && docker-compose restart'"
echo "   Status: ssh $SERVER_USER@$SERVER_IP 'cd $DEPLOY_PATH && docker-compose ps'"

