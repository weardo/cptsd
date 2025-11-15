#!/bin/bash
# Grant admin permissions to astra user
# Usage: ./scripts/grant-admin-permissions.sh

set -e

JENKINS_URL="https://jenkins.cptsd.in"
JENKINS_USER="astra"
JENKINS_PASSWORD="Fie@9eqmfp@cptsd"

echo "🔧 Granting admin permissions to astra user..."

# Get CSRF token
CRUMB_RESPONSE=$(curl -s -k -u "$JENKINS_USER:$JENKINS_PASSWORD" \
    "$JENKINS_URL/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,\":\",//crumb)")

if [ -n "$CRUMB_RESPONSE" ] && [ "$CRUMB_RESPONSE" != "null" ]; then
    if echo "$CRUMB_RESPONSE" | grep -q ":"; then
        CRUMB_FIELD=$(echo "$CRUMB_RESPONSE" | cut -d: -f1)
        CRUMB_VALUE=$(echo "$CRUMB_RESPONSE" | cut -d: -f2-)
    else
        CRUMB_FIELD="Jenkins-Crumb"
        CRUMB_VALUE="$CRUMB_RESPONSE"
    fi
else
    echo "❌ Could not get CSRF token. User may not have permission."
    echo ""
    echo "Please do this manually:"
    echo "1. Go to: https://jenkins.cptsd.in/configureSecurity/"
    echo "2. Under Authorization, select 'Logged-in users can do anything'"
    echo "3. Or add astra user with all permissions"
    exit 1
fi

echo "⚠️  This requires admin access. If astra doesn't have admin, you need to:"
echo "   - Reset Jenkins (run ./scripts/reset-jenkins.sh)"
echo "   - Or manually configure permissions in Jenkins UI"
echo ""
echo "To manually grant permissions:"
echo "1. Go to: https://jenkins.cptsd.in/configureSecurity/"
echo "2. Change Authorization to 'Logged-in users can do anything'"
echo "3. Or use Matrix-based and grant all permissions to astra"

