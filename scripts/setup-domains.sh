#!/bin/bash
# Setup all subdomains for CPTSD applications
# Usage: ./scripts/setup-domains.sh

set -e

MAIN_DOMAIN="cptsd.in"
CMS_DOMAIN="cms.cptsd.in"
BLOG_DOMAIN="blog.cptsd.in"
JENKINS_DOMAIN="jenkins.cptsd.in"
SERVER_IP="37.27.39.20"

echo "🌐 Setting up domains for CPTSD applications..."

# Check if running on server
if [ "$(hostname -I | grep -o $SERVER_IP)" != "$SERVER_IP" ]; then
    echo "📤 Connecting to server..."
    ssh root@$SERVER_IP "bash -s" < "$0"
    exit 0
fi

echo "📝 Installing Caddy if not present..."
if ! command -v caddy &> /dev/null; then
    apt install -y debian-keyring debian-repository-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt update
    apt install -y caddy
fi

echo "📝 Creating Caddyfile..."
# Backup existing Caddyfile if it exists
if [ -f /etc/caddy/Caddyfile ]; then
    cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup.$(date +%Y%m%d_%H%M%S)
fi

# Create comprehensive Caddyfile
cat > /etc/caddy/Caddyfile << EOF
# Main Website Application
${MAIN_DOMAIN} {
    reverse_proxy localhost:3002
    
    # Security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    # Logging
    log {
        output file /var/log/caddy/${MAIN_DOMAIN}.log
    }
}

# CMS Application
${CMS_DOMAIN} {
    reverse_proxy localhost:3000
    
    # Security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    # Logging
    log {
        output file /var/log/caddy/${CMS_DOMAIN}.log
    }
}

# Blog Public Application
${BLOG_DOMAIN} {
    reverse_proxy localhost:3001
    
    # Security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    # Logging
    log {
        output file /var/log/caddy/${BLOG_DOMAIN}.log
    }
}

# Jenkins CI/CD
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

# Create log directory and ensure proper permissions
mkdir -p /var/log/caddy
chown caddy:caddy /var/log/caddy
chmod 755 /var/log/caddy
# Create log files for all domains to avoid permission issues
touch /var/log/caddy/${MAIN_DOMAIN}.log
touch /var/log/caddy/${CMS_DOMAIN}.log
touch /var/log/caddy/${BLOG_DOMAIN}.log
touch /var/log/caddy/${JENKINS_DOMAIN}.log
chown caddy:caddy /var/log/caddy/*.log
chmod 644 /var/log/caddy/*.log

echo "✅ Validating Caddy configuration..."
caddy validate --config /etc/caddy/Caddyfile

echo "🔄 Restarting Caddy..."
systemctl restart caddy
systemctl enable caddy

echo ""
echo "✅ Domain configuration complete!"
echo ""
echo "📋 DNS Configuration needed in GoDaddy:"
echo "   1. ${MAIN_DOMAIN} (root domain):"
echo "      - Type: A"
echo "      - Name: @ (or leave blank)"
echo "      - Value: $SERVER_IP"
echo ""
echo "   2. ${CMS_DOMAIN}:"
echo "      - Type: A"
echo "      - Name: cms"
echo "      - Value: $SERVER_IP"
echo ""
echo "   3. ${BLOG_DOMAIN}:"
echo "      - Type: A"
echo "      - Name: blog"
echo "      - Value: $SERVER_IP"
echo ""
echo "   4. ${JENKINS_DOMAIN}:"
echo "      - Type: A"
echo "      - Name: jenkins"
echo "      - Value: $SERVER_IP"
echo ""
echo "⏳ Wait for DNS propagation (5-30 minutes)"
echo ""
echo "🧪 Test domains:"
echo "   - Main: https://${MAIN_DOMAIN}"
echo "   - CMS: https://${CMS_DOMAIN}"
echo "   - Blog: https://${BLOG_DOMAIN}"
echo "   - Jenkins: https://${JENKINS_DOMAIN}"
echo ""
echo "📊 Check status:"
echo "   - Caddy: systemctl status caddy"
echo "   - Logs: tail -f /var/log/caddy/*.log"

