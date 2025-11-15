#!/bin/bash
# Complete setup script for Jenkins jobs and GitHub webhook
# Usage: ./scripts/setup-all.sh [github-token]

set -e

JENKINS_PASSWORD="Fie@9eqmfp@cptsd"
GITHUB_TOKEN="${1:-}"

echo "🚀 Complete Jenkins and GitHub setup..."
echo ""

# Step 1: Setup Jenkins credentials
echo "📝 Step 1: Setting up Jenkins GitHub SSH credentials..."
./scripts/setup-jenkins-credentials.sh "$JENKINS_PASSWORD"

echo ""
echo "📝 Step 2: Jenkins jobs already created"
echo "   - cptsd-cms"
echo "   - cptsd-blog-public"

echo ""
# Step 3: Setup GitHub webhook
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  GitHub token not provided. Skipping webhook setup."
    echo ""
    echo "To setup webhook manually:"
    echo "   ./scripts/setup-github-webhook.sh YOUR_GITHUB_TOKEN"
    echo ""
    echo "Or go to: https://github.com/weardo/cptsd/settings/hooks"
    echo "   Add webhook: https://jenkins.cptsd.in/github-webhook/"
else
    echo "📝 Step 3: Setting up GitHub webhook..."
    ./scripts/setup-github-webhook.sh "$GITHUB_TOKEN"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🧪 Test deployment:"
echo "   git commit --allow-empty -m 'Test deployment'"
echo "   git push"

