#!/bin/bash
# Fix Jenkins GitHub SSH host key verification
# Usage: ./scripts/fix-jenkins-github-ssh.sh

set -e

SERVER_IP="37.27.39.20"

echo "🔧 Fixing Jenkins GitHub SSH host key verification..."

if [ "$(hostname -I 2>/dev/null | grep -o $SERVER_IP)" != "$SERVER_IP" ]; then
    echo "📤 Connecting to server..."
    ssh root@$SERVER_IP "bash -s" < "$0"
    exit 0
fi

echo "📦 Creating SSH directory in Jenkins..."
docker exec jenkins bash -c "
    mkdir -p /var/jenkins_home/.ssh
    chmod 700 /var/jenkins_home/.ssh
"

echo "🔑 Adding GitHub SSH host keys..."
docker exec jenkins bash -c "
    ssh-keyscan -t rsa,ecdsa,ed25519 github.com >> /var/jenkins_home/.ssh/known_hosts 2>/dev/null
    chmod 600 /var/jenkins_home/.ssh/known_hosts
    chown -R jenkins:jenkins /var/jenkins_home/.ssh
"

echo "✅ GitHub SSH host keys added!"
echo ""
echo "📋 Verifying..."
docker exec jenkins cat /var/jenkins_home/.ssh/known_hosts | grep github.com | wc -l | xargs -I {} echo "   Found {} GitHub host keys"

echo ""
echo "🧪 Test in Jenkins job - it should now be able to connect to GitHub!"

