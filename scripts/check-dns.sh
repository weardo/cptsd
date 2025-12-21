#!/bin/bash
# Check DNS resolution for CPTSD domains
# Usage: ./scripts/check-dns.sh

echo "🔍 Checking DNS resolution for CPTSD domains..."
echo ""

DOMAINS=("cptsd.in" "cms.cptsd.in" "blog.cptsd.in" "jenkins.cptsd.in" "storage.cptsd.in")
EXPECTED_IP="37.27.39.20"
ALL_OK=true

for domain in "${DOMAINS[@]}"; do
    result=$(dig +short "$domain" 2>/dev/null | head -1)
    if [ -z "$result" ]; then
        echo "❌ $domain - NOT RESOLVING (DNS not configured)"
        ALL_OK=false
    elif [ "$result" = "$EXPECTED_IP" ]; then
        echo "✅ $domain - $result (correct)"
    else
        echo "⚠️  $domain - $result (expected $EXPECTED_IP)"
        ALL_OK=false
    fi
done

echo ""
if [ "$ALL_OK" = true ]; then
    echo "✅ All domains are resolving correctly!"
    echo "   Caddy should automatically obtain SSL certificates."
else
    echo "❌ Some domains are not resolving correctly."
    echo "   Please configure DNS A records in GoDaddy:"
    echo "   - cptsd.in (@) -> $EXPECTED_IP"
    echo "   - cms.cptsd.in -> $EXPECTED_IP"
    echo "   - blog.cptsd.in -> $EXPECTED_IP"
    echo "   - jenkins.cptsd.in -> $EXPECTED_IP"
    echo "   - storage.cptsd.in -> $EXPECTED_IP"
fi



