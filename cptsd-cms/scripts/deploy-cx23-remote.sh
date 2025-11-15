#!/bin/bash
# Remote deployment script for CX23 server
# This script sets up SSH keys and deploys the application remotely

set -e

SERVER_IP="37.27.39.20"
SERVER_USER="root"
SERVER_PASSWORD="PmCUpNnNfrJAbfHX7iXK"
DEPLOY_PATH="/opt/cptsd-cms"

echo "🚀 Starting remote deployment to CX23 server..."

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "📦 Installing sshpass..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y sshpass
    elif command -v yum &> /dev/null; then
        sudo yum install -y sshpass
    elif command -v pacman &> /dev/null; then
        sudo pacman -S --noconfirm sshpass
    else
        echo "❌ sshpass not available. Please install it manually:"
        echo "   Ubuntu/Debian: sudo apt-get install sshpass"
        echo "   Arch: sudo pacman -S sshpass"
        exit 1
    fi
fi

# Generate SSH key if it doesn't exist
if [ ! -f ~/.ssh/id_rsa.pub ]; then
    echo "🔑 Generating SSH key..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N "" -C "cptsd-cms-deploy"
fi

# Copy SSH key to server
echo "🔐 Setting up SSH keys on server..."
sshpass -p "$SERVER_PASSWORD" ssh-copy-id -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" 2>/dev/null || {
    # Alternative method if ssh-copy-id fails
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" \
        "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$(cat ~/.ssh/id_rsa.pub)' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
}

echo "✅ SSH keys configured"

# Test passwordless SSH
echo "🧪 Testing SSH connection..."
ssh -o BatchMode=yes -o ConnectTimeout=5 "$SERVER_USER@$SERVER_IP" "echo 'SSH connection successful'" || {
    echo "⚠️  Passwordless SSH not working yet, will use password for now"
    USE_PASSPASS=true
}

# Function to run commands on remote server
run_remote() {
    if [ "$USE_PASSPASS" = true ]; then
        sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "$@"
    else
        ssh -o BatchMode=yes "$SERVER_USER@$SERVER_IP" "$@"
    fi
}

# Function to copy files to remote server
copy_remote() {
    if [ "$USE_PASSPASS" = true ]; then
        sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no -r "$1" "$SERVER_USER@$SERVER_IP:$2"
    else
        scp -o BatchMode=yes -r "$1" "$SERVER_USER@$SERVER_IP:$2"
    fi
}

echo "📦 Updating system packages..."
run_remote "apt update && apt upgrade -y"

echo "🐳 Installing Docker..."
run_remote "curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && sh /tmp/get-docker.sh && rm /tmp/get-docker.sh"

echo "📦 Installing Docker Compose..."
run_remote "apt install -y docker-compose"

echo "📁 Creating deployment directory..."
run_remote "mkdir -p $DEPLOY_PATH"

echo "📤 Copying project files..."
# Copy project files (excluding node_modules, .next, etc.)
cd "$(dirname "$0")/../.." || cd /home/astra/n8n/cptsd-cms
tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='*.log' \
    -czf /tmp/cptsd-cms-deploy.tar.gz .

copy_remote "/tmp/cptsd-cms-deploy.tar.gz" "/tmp/"
rm /tmp/cptsd-cms-deploy.tar.gz

run_remote "cd $DEPLOY_PATH && tar -xzf /tmp/cptsd-cms-deploy.tar.gz && rm /tmp/cptsd-cms-deploy.tar.gz"

echo "🔧 Setting up environment..."
# Check if .env exists on server
run_remote "cd $DEPLOY_PATH && if [ ! -f .env ]; then cat > .env << 'ENVEOF'
# MongoDB Configuration (self-hosted)
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=\$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-24)

# MongoDB Connection String
MONGODB_URI=mongodb://admin:\$MONGO_ROOT_PASSWORD@mongodb:27017/cptsd-cms?authSource=admin

# MinIO Configuration
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=\$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-24)
S3_BUCKET_NAME=cptsd-cms

# OpenAI Configuration (UPDATE THIS!)
OPENAI_API_KEY=sk-your-openai-key-here

# Authentication
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=\$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-16)

# NextAuth Configuration
NEXTAUTH_URL=http://$SERVER_IP:3000
NEXTAUTH_SECRET=\$(openssl rand -base64 32)
ENVEOF
echo '✅ Created .env file with generated passwords'
fi"

echo "🔐 Securing SSH..."
# Disable password authentication (only after key is working)
if [ "$USE_PASSPASS" != true ]; then
    run_remote "sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config && \
                sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config && \
                systemctl reload sshd && \
                echo '✅ SSH password authentication disabled'"
fi

# Setup firewall
echo "🔥 Configuring firewall..."
run_remote "apt install -y ufw && \
            ufw allow 22/tcp && \
            ufw allow 80/tcp && \
            ufw allow 443/tcp && \
            ufw allow 3000/tcp && \
            ufw allow 9000/tcp && \
            ufw allow 9001/tcp && \
            ufw --force enable && \
            echo '✅ Firewall configured'"

echo "🚀 Deploying application..."
run_remote "cd $DEPLOY_PATH && \
            chmod +x scripts/deploy-hetzner.sh && \
            ./scripts/deploy-hetzner.sh"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Server Details:"
echo "   IP: $SERVER_IP"
echo "   Application: http://$SERVER_IP:3000"
echo "   MinIO Console: http://$SERVER_IP:9001"
echo ""
echo "📝 Next steps:"
echo "   1. Edit .env file: ssh $SERVER_USER@$SERVER_IP 'cd $DEPLOY_PATH && nano .env'"
echo "   2. Update OPENAI_API_KEY and other values"
echo "   3. Setup reverse proxy (Caddy/Nginx) with your domain"
echo "   4. Update NEXTAUTH_URL in .env with your domain"
echo ""
echo "🔐 SSH Access:"
echo "   ssh $SERVER_USER@$SERVER_IP"
echo ""
echo "📚 View logs: ssh $SERVER_USER@$SERVER_IP 'cd $DEPLOY_PATH && docker-compose logs -f'"


