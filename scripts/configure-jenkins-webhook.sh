#!/bin/bash
# Configure Jenkins for automatic builds via GitHub webhook
# Usage: ./scripts/configure-jenkins-webhook.sh

set -e

JENKINS_DOMAIN="jenkins.cptsd.in"
GITHUB_REPO="weardo/cptsd"
SERVER_IP="37.27.39.20"

echo "🔧 Configuring Jenkins for automatic builds..."

# Check if running on server
if [ "$(hostname -I 2>/dev/null | grep -o $SERVER_IP)" != "$SERVER_IP" ]; then
    echo "📤 Connecting to server..."
    ssh root@$SERVER_IP "bash -s" < "$0"
    exit 0
fi

echo "📋 Jenkins Webhook Configuration"
echo ""
echo "1. Access Jenkins: https://${JENKINS_DOMAIN}"
echo ""
echo "2. For each job (cptsd-cms and cptsd-blog-public), configure:"
echo "   - Go to job configuration"
echo "   - Under 'Build Triggers', check 'GitHub hook trigger for GITScm polling'"
echo "   - Save"
echo ""
echo "3. In GitHub repository settings:"
echo "   - Go to: https://github.com/${GITHUB_REPO}/settings/hooks"
echo "   - Click 'Add webhook'"
echo "   - Payload URL: https://${JENKINS_DOMAIN}/github-webhook/"
echo "   - Content type: application/json"
echo "   - Events: Select 'Just the push event'"
echo "   - Active: Checked"
echo "   - Click 'Add webhook'"
echo ""
echo "4. Install GitHub plugin in Jenkins (if not already installed):"
echo "   - Manage Jenkins → Manage Plugins → Available"
echo "   - Search for 'GitHub plugin'"
echo "   - Install and restart Jenkins"
echo ""
echo "✅ Webhook configuration complete!"
echo ""
echo "🧪 Test: Push a commit to trigger automatic build"

