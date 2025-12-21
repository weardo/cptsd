#!/bin/bash
# Add journal domain to Caddy configuration
# Usage: ./scripts/setup-caddy.sh

set -e

JOURNAL_DOMAIN="ai.cptsd.in"
SERVER_IP="37.27.39.20"

echo "🌐 Setting up Caddy for journal domain: $JOURNAL_DOMAIN"

# Check if running on server
if [ "$(hostname -I | grep -o $SERVER_IP 2>/dev/null)" != "$SERVER_IP" ]; then
    echo "📤 Connecting to server..."
    ssh root@$SERVER_IP "bash -s" < "$0"
    exit 0
fi

# Check if Caddyfile exists
if [ ! -f /etc/caddy/Caddyfile ]; then
    echo "❌ Caddyfile not found. Please install Caddy first."
    exit 1
fi

# Backup existing Caddyfile
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.backup.$(date +%Y%m%d_%H%M%S)

# Check if journal domain already exists
if grep -q "$JOURNAL_DOMAIN" /etc/caddy/Caddyfile; then
    echo "✅ Journal domain already configured in Caddyfile"
else
    # Append journal configuration
    cat >> /etc/caddy/Caddyfile << EOF

# Journal Application
${JOURNAL_DOMAIN} {
    reverse_proxy localhost:3003
    
    # Security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    # Logging
    log {
        output file /var/log/caddy/${JOURNAL_DOMAIN}.log
    }
}
EOF
    echo "✅ Added journal domain to Caddyfile"
fi

# Create log directory and file
mkdir -p /var/log/caddy
touch /var/log/caddy/${JOURNAL_DOMAIN}.log
chown caddy:caddy /var/log/caddy
chown caddy:caddy /var/log/caddy/${JOURNAL_DOMAIN}.log

echo "✅ Validating Caddy configuration..."
caddy validate --config /etc/caddy/Caddyfile

echo "🔄 Reloading Caddy..."
systemctl reload caddy

echo ""
echo "✅ Caddy configuration complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Configure DNS in GoDaddy:"
echo "      - Type: A"
echo "      - Name: ai"
echo "      - Value: $SERVER_IP"
echo ""
echo "   2. Wait for DNS propagation (5-30 minutes)"
echo ""
echo "   3. Test: https://$JOURNAL_DOMAIN"
echo ""
echo "📊 Check status:"
echo "   - Caddy: systemctl status caddy"
echo "   - Logs: tail -f /var/log/caddy/${JOURNAL_DOMAIN}.log"



