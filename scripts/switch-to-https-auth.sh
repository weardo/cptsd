#!/bin/bash
# Switch Jenkins jobs to use HTTPS with Personal Access Token
# Usage: ./scripts/switch-to-https-auth.sh [github-token]

set -e

JENKINS_URL="https://jenkins.cptsd.in"
JENKINS_USER="astra"
JENKINS_PASSWORD="Fie@9eqmfp@cptsd"
GITHUB_TOKEN="${1:-}"
GITHUB_REPO_URL="https://github.com/weardo/cptsd.git"

echo "🔄 Switching Jenkins to HTTPS authentication..."

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GitHub personal access token required!"
    echo ""
    echo "To create a token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Name: 'Jenkins CI/CD'"
    echo "4. Scopes: Check 'repo' (Full control of private repositories)"
    echo "5. Generate and copy the token"
    echo ""
    echo "Usage: ./scripts/switch-to-https-auth.sh YOUR_GITHUB_TOKEN"
    exit 1
fi

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
    echo "⚠️  Could not get CSRF token"
    exit 1
fi

echo "📝 Creating GitHub credentials for HTTPS..."

# Create username/password credential for HTTPS
CREDENTIAL_JSON=$(cat << EOF
{
  "": "0",
  "credentials": {
    "scope": "GLOBAL",
    "id": "github-https-token",
    "username": "weardo",
    "password": "${GITHUB_TOKEN}",
    "description": "GitHub HTTPS Token",
    "stapler-class": "com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl"
  }
}
EOF
)

# Try to create/update credential
curl -s -k -X POST -u "$JENKINS_USER:$JENKINS_PASSWORD" \
    --header "$CRUMB_FIELD: $CRUMB_VALUE" \
    -H "Content-Type: application/json" \
    --data "$CREDENTIAL_JSON" \
    "$JENKINS_URL/credentials/store/system/domain/_/createCredentials" > /dev/null 2>&1 || \
curl -s -k -X POST -u "$JENKINS_USER:$JENKINS_PASSWORD" \
    --header "$CRUMB_FIELD: $CRUMB_VALUE" \
    -H "Content-Type: application/json" \
    --data "$CREDENTIAL_JSON" \
    "$JENKINS_URL/credentials/store/system/domain/_/credential/github-https-token/updateSubmit" > /dev/null 2>&1

echo "✅ GitHub HTTPS credential created/updated"
echo ""
echo "📋 Next steps:"
echo "   You need to update the Jenkins jobs manually:"
echo "   1. Go to each job configuration"
echo "   2. Change Repository URL to: $GITHUB_REPO_URL"
echo "   3. Change Credentials to: github-https-token"
echo "   4. Save"
echo ""
echo "   Or create new jobs with HTTPS URL from scratch"

