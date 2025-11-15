#!/bin/bash
# Setup Jenkins with subdomain configuration
# Usage: ./scripts/setup-jenkins.sh

set -e

JENKINS_DOMAIN="jenkins.cptsd.in"
SERVER_IP="37.27.39.20"
JENKINS_PATH="/opt/jenkins"
CMS_PATH="/opt/cptsd-cms"
BLOG_PATH="/opt/cptsd-blog-public"

echo "🔧 Setting up Jenkins at ${JENKINS_DOMAIN}..."

# Check if running on server
if [ "$(hostname -I | grep -o $SERVER_IP)" != "$SERVER_IP" ]; then
    echo "📤 Connecting to server..."
    ssh root@$SERVER_IP "bash -s" < "$0"
    exit 0
fi

echo "📦 Installing Docker if not present..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sh /tmp/get-docker.sh
    rm /tmp/get-docker.sh
fi

echo "📦 Installing Docker Compose if not present..."
if ! command -v docker-compose &> /dev/null; then
    apt install -y docker-compose
fi

echo "📁 Creating deployment directories..."
mkdir -p $JENKINS_PATH
mkdir -p $CMS_PATH
mkdir -p $BLOG_PATH

echo "🐳 Starting Jenkins..."
cd $JENKINS_PATH

# Copy Jenkins docker-compose if not present
if [ ! -f docker-compose.jenkins.yml ]; then
    echo "⚠️  Please copy docker-compose.jenkins.yml to $JENKINS_PATH"
    echo "   Or run this script from the repository root"
fi

# Create network if it doesn't exist
docker network create cptsd-cms_app-network 2>/dev/null || echo "Network already exists"

# Start Jenkins
if [ -f docker-compose.jenkins.yml ]; then
    docker-compose -f docker-compose.jenkins.yml up -d
else
    echo "⚠️  docker-compose.jenkins.yml not found. Please ensure it's in $JENKINS_PATH"
    exit 1
fi

echo "⏳ Waiting for Jenkins to start..."
sleep 30

# Get initial admin password
JENKINS_PASSWORD=$(docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword 2>/dev/null || echo "")

echo "📝 Installing Caddy if not present..."
if ! command -v caddy &> /dev/null; then
    apt install -y debian-keyring debian-repository-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt update
    apt install -y caddy
fi

echo "📝 Configuring Caddy for Jenkins..."
# Check if Caddyfile exists
if [ -f /etc/caddy/Caddyfile ]; then
    # Backup existing Caddyfile
    cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup.$(date +%Y%m%d_%H%M%S)
    
    # Check if Jenkins domain already exists
    if ! grep -q "$JENKINS_DOMAIN" /etc/caddy/Caddyfile; then
        # Append Jenkins configuration
        cat >> /etc/caddy/Caddyfile << EOF

${JENKINS_DOMAIN} {
    reverse_proxy localhost:8080
    
    # Security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    # Logging
    log {
        output file /var/log/caddy/${JENKINS_DOMAIN}.log
    }
}
EOF
    else
        echo "✅ Jenkins domain already configured in Caddyfile"
    fi
else
    # Create new Caddyfile
    cat > /etc/caddy/Caddyfile << EOF
${JENKINS_DOMAIN} {
    reverse_proxy localhost:8080
    
    # Security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    # Logging
    log {
        output file /var/log/caddy/${JENKINS_DOMAIN}.log
    }
}
EOF
fi

# Create log directory
mkdir -p /var/log/caddy
chown caddy:caddy /var/log/caddy

echo "✅ Validating Caddy configuration..."
caddy validate --config /etc/caddy/Caddyfile

echo "🔄 Restarting Caddy..."
systemctl restart caddy
systemctl enable caddy

echo ""
echo "✅ Jenkins setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Configure DNS in GoDaddy:"
echo "      - Type: A"
echo "      - Name: jenkins"
echo "      - Value: $SERVER_IP"
echo ""
echo "   2. Wait for DNS propagation (5-30 minutes)"
echo ""
echo "   3. Access Jenkins:"
echo "      - URL: https://${JENKINS_DOMAIN}"
if [ -n "$JENKINS_PASSWORD" ]; then
    echo "      - Initial Admin Password: $JENKINS_PASSWORD"
fi
echo ""
echo "   4. Install recommended plugins in Jenkins"
echo ""
echo "   5. Create Jenkins jobs:"
echo "      - Create pipeline job for 'cptsd-cms' pointing to cptsd-cms/Jenkinsfile"
echo "      - Create pipeline job for 'cptsd-blog-public' pointing to cptsd-blog-public/Jenkinsfile"
echo ""
echo "   6. Configure GitHub webhook (optional):"
echo "      - In GitHub repo settings, add webhook:"
echo "        URL: https://${JENKINS_DOMAIN}/github-webhook/"
echo "        Content type: application/json"
echo ""
echo "📊 Check status:"
echo "   - Jenkins: docker ps | grep jenkins"
echo "   - Caddy: systemctl status caddy"
echo "   - Logs: docker logs jenkins"

