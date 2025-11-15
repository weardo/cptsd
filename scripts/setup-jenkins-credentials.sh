#!/bin/bash
# Setup Jenkins GitHub SSH credentials via CLI
# Usage: ./scripts/setup-jenkins-credentials.sh [jenkins-password] [ssh-private-key-file]

set -e

JENKINS_URL="https://jenkins.cptsd.in"
JENKINS_USER="${JENKINS_USER:-astra}"
JENKINS_PASSWORD="${1:-Fie@9eqmfp@cptsd}"
SSH_KEY_FILE="${2:-$HOME/.ssh/id_rsa}"

echo "🔐 Setting up Jenkins GitHub SSH credentials..."

# Get Jenkins password if not provided
if [ -z "$JENKINS_PASSWORD" ]; then
    echo "📝 Getting Jenkins initial admin password..."
    JENKINS_PASSWORD=$(ssh root@37.27.39.20 "docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword 2>/dev/null" || echo "")
    
    if [ -z "$JENKINS_PASSWORD" ]; then
        echo "❌ Could not get Jenkins password. Please provide it as argument:"
        echo "   ./scripts/setup-jenkins-credentials.sh YOUR_PASSWORD [ssh-key-file]"
        exit 1
    fi
fi

# Check if SSH key file exists
if [ ! -f "$SSH_KEY_FILE" ]; then
    echo "❌ SSH key file not found: $SSH_KEY_FILE"
    echo "   Please provide path to your GitHub SSH private key"
    exit 1
fi

# Get CSRF token
echo "🔑 Getting CSRF token..."
CRUMB=$(curl -s -u "$JENKINS_USER:$JENKINS_PASSWORD" \
    "$JENKINS_URL/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,\":\",//crumb)")

if [ -z "$CRUMB" ]; then
    echo "⚠️  Could not get CSRF token, continuing without it..."
    CRUMB_HEADER=""
else
    CRUMB_HEADER="-H \"$CRUMB\""
fi

# Read SSH private key
SSH_PRIVATE_KEY=$(cat "$SSH_KEY_FILE" | sed 's/$/\\n/' | tr -d '\n' | sed 's/\\n$//')

# Create credentials XML
cat > /tmp/jenkins-credentials.xml << EOF
<com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey>
  <scope>GLOBAL</scope>
  <id>github-ssh-key</id>
  <description>GitHub SSH Key</description>
  <username>git</username>
  <privateKeySource class="com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey\$DirectEntryPrivateKeySource">
    <privateKey>${SSH_PRIVATE_KEY}</privateKey>
  </privateKeySource>
</com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey>
EOF

# Check if credential already exists
CREDENTIAL_EXISTS=$(curl -s -u "$JENKINS_USER:$JENKINS_PASSWORD" \
    "$JENKINS_URL/credentials/store/system/domain/_/credential/github-ssh-key/config.xml" 2>/dev/null || echo "")

# Use Jenkins CLI or REST API with proper authentication
# For credentials, we'll use a simpler approach with the credentials API
CREDENTIAL_JSON=$(cat << EOF
{
  "": "0",
  "credentials": {
    "scope": "GLOBAL",
    "id": "github-ssh-key",
    "username": "git",
    "description": "GitHub SSH Key",
    "privateKeySource": {
      "stapler-class": "com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey\$DirectEntryPrivateKeySource",
      "privateKey": "${SSH_PRIVATE_KEY}"
    },
    "stapler-class": "com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey"
  }
}
EOF
)

if [ -n "$CREDENTIAL_EXISTS" ]; then
    echo "⚠️  Credential already exists. Updating..."
    curl -X POST -u "$JENKINS_USER:$JENKINS_PASSWORD" \
        -H "Content-Type: application/json" \
        --data "$CREDENTIAL_JSON" \
        "$JENKINS_URL/credentials/store/system/domain/_/credential/github-ssh-key/updateSubmit" || \
    curl -X POST -u "$JENKINS_USER:$JENKINS_PASSWORD" \
        --data-binary @/tmp/jenkins-credentials.xml \
        -H "Content-Type: text/xml" \
        "$JENKINS_URL/credentials/store/system/domain/_/credential/github-ssh-key/config.xml"
else
    echo "📝 Creating credential..."
    curl -X POST -u "$JENKINS_USER:$JENKINS_PASSWORD" \
        -H "Content-Type: application/json" \
        --data "$CREDENTIAL_JSON" \
        "$JENKINS_URL/credentials/store/system/domain/_/createCredentials" || \
    curl -X POST -u "$JENKINS_USER:$JENKINS_PASSWORD" \
        --data-binary @/tmp/jenkins-credentials.xml \
        -H "Content-Type: text/xml" \
        "$JENKINS_URL/credentials/store/system/domain/_/createCredentials"
fi

rm -f /tmp/jenkins-credentials.xml

echo "✅ GitHub SSH credentials configured in Jenkins!"

