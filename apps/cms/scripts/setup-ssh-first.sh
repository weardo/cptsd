#!/bin/bash
# Setup SSH first by handling password change

set -e

SERVER_IP="37.27.39.20"
SERVER_USER="root"
OLD_PASSWORD="PmCUpNnNfrJAbfHX7iXK"
NEW_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-20)

echo "🔐 Setting up SSH access..."

# Generate SSH key if needed
if [ ! -f ~/.ssh/id_rsa.pub ]; then
    echo "🔑 Generating SSH key..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N "" -C "cptsd-cms-deploy"
fi

# First, change the password and copy SSH key in one command
echo "🔐 Changing password and setting up SSH key..."

# Create a temporary script to run on the server
sshpass -p "$OLD_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$SERVER_USER@$SERVER_IP" << 'REMOTE_SCRIPT'
# Change password (non-interactive)
echo "root:$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-20)" | chpasswd

# Setup SSH key directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys 2>/dev/null || true
REMOTE_SCRIPT

# Copy SSH key using the new password (will use old one if still valid, or try with password change)
PUBLIC_KEY=$(cat ~/.ssh/id_rsa.pub)

sshpass -p "$OLD_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$SERVER_USER@$SERVER_IP" \
    "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'Password change bypassed - SSH key added' || \
    (echo 'root:${NEW_PASSWORD}' | chpasswd && echo 'Password changed to: ${NEW_PASSWORD}')"

# Try to copy key with password change
echo "Attempting password change and SSH key setup..."
sshpass -p "$OLD_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$SERVER_USER@$SERVER_IP" bash -c "
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    echo '$PUBLIC_KEY' > ~/.ssh/authorized_keys.tmp
    chmod 600 ~/.ssh/authorized_keys.tmp
    mv ~/.ssh/authorized_keys.tmp ~/.ssh/authorized_keys
    echo 'SSH key installed'
" || {
    echo "⚠️  Password change required. Please manually:"
    echo "   1. SSH to server: ssh root@$SERVER_IP"
    echo "   2. Change password when prompted"
    echo "   3. Run: mkdir -p ~/.ssh && echo '$(cat ~/.ssh/id_rsa.pub)' >> ~/.ssh/authorized_keys"
    exit 1
}

echo "✅ SSH setup complete!"
echo "🔐 You can now SSH without password: ssh root@$SERVER_IP"


