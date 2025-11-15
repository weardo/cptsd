#!/bin/bash
# Quick domain setup script for cms.cptsd.in

set -e

DOMAIN="cms.cptsd.in"
SERVER_IP="37.27.39.20"
DEPLOY_PATH="/opt/cptsd-cms"

echo "🌐 Setting up domain: $DOMAIN"
echo ""

# Check if running on server
if [ "$(hostname -I | grep -o $SERVER_IP)" != "$SERVER_IP" ]; then
    echo "📤 Connecting to server..."
    ssh root@$SERVER_IP "bash -s" < "$0"
    exit 0
fi

echo "📦 Installing Caddy..."
apt install -y debian-keyring debian-repository-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy

echo "📝 Creating Caddyfile..."
cat > /etc/caddy/Caddyfile << EOF
$DOMAIN {
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
        output file /var/log/caddy/$DOMAIN.log
    }
}
EOF

# Create log directory
mkdir -p /var/log/caddy
chown caddy:caddy /var/log/caddy

echo "✅ Validating Caddy configuration..."
caddy validate --config /etc/caddy/Caddyfile

echo "🔄 Starting Caddy..."
systemctl restart caddy
systemctl enable caddy

echo "📝 Updating NEXTAUTH_URL..."
cd $DEPLOY_PATH
sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://$DOMAIN|" .env

echo "🔄 Restarting application..."
docker-compose restart app

echo ""
echo "✅ Domain setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Configure DNS in GoDaddy:"
echo "      - Type: A"
echo "      - Name: cms"
echo "      - Value: $SERVER_IP"
echo ""
echo "   2. Wait for DNS propagation (5-30 minutes)"
echo ""
echo "   3. Test: https://$DOMAIN"
echo ""
echo "📊 Check status:"
echo "   - Caddy: systemctl status caddy"
echo "   - Logs: tail -f /var/log/caddy/$DOMAIN.log"
echo "   - DNS: dig $DOMAIN"

