#!/bin/bash
# Setup GitHub webhook via CLI
# Usage: ./scripts/setup-github-webhook.sh [github-token]

set -e

GITHUB_REPO="weardo/cptsd"
GITHUB_TOKEN="${1:-}"
JENKINS_URL="https://jenkins.cptsd.in"
WEBHOOK_URL="${JENKINS_URL}/github-webhook/"

echo "🔗 Setting up GitHub webhook..."

# Check if token is provided
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GitHub token required!"
    echo ""
    echo "📝 To get a token:"
    echo "   1. Go to: https://github.com/settings/tokens"
    echo "   2. Click 'Generate new token (classic)'"
    echo "   3. Name: 'Jenkins Webhook'"
    echo "   4. Scopes: Check 'repo' (Full control of private repositories)"
    echo "   5. Generate and copy the token"
    echo ""
    echo "Usage: ./scripts/setup-github-webhook.sh YOUR_GITHUB_TOKEN"
    exit 1
fi

# Check if webhook already exists
echo "🔍 Checking for existing webhook..."
EXISTING_WEBHOOK=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/$GITHUB_REPO/hooks" | \
    grep -o "\"url\":\"[^\"]*github-webhook" || echo "")

if [ -n "$EXISTING_WEBHOOK" ]; then
    echo "⚠️  Webhook already exists. Updating..."
    WEBHOOK_ID=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/repos/$GITHUB_REPO/hooks" | \
        grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
    
    # Update webhook
    curl -X PATCH \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/$GITHUB_REPO/hooks/$WEBHOOK_ID" \
        -d "{
            \"config\": {
                \"url\": \"$WEBHOOK_URL\",
                \"content_type\": \"json\",
                \"insecure_ssl\": \"0\"
            },
            \"events\": [\"push\"],
            \"active\": true
        }"
    
    echo "✅ Webhook updated"
else
    # Create webhook
    echo "📝 Creating webhook..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/$GITHUB_REPO/hooks" \
        -d "{
            \"name\": \"web\",
            \"active\": true,
            \"events\": [\"push\"],
            \"config\": {
                \"url\": \"$WEBHOOK_URL\",
                \"content_type\": \"json\",
                \"insecure_ssl\": \"0\"
            }
        }")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    
    if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Webhook created successfully!"
    else
        echo "❌ Failed to create webhook. HTTP code: $HTTP_CODE"
        echo "Response: $(echo "$RESPONSE" | head -n -1)"
        exit 1
    fi
fi

echo ""
echo "✅ GitHub webhook configured!"
echo ""
echo "🧪 Test: Push a commit to trigger automatic build"
echo "   git commit --allow-empty -m 'Test webhook'"
echo "   git push"

