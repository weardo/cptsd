#!/bin/bash
# Fix password expiration and setup SSH keys

set -e

SERVER_IP="37.27.39.20"
SERVER_USER="root"
OLD_PASSWORD="PmCUpNnNfrJAbfHX7iXK"
NEW_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-20)

echo "🔐 Setting up SSH with password change..."

# Generate SSH key if needed
if [ ! -f ~/.ssh/id_rsa.pub ]; then
    echo "🔑 Generating SSH key..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N "" -C "cptsd-cms-deploy"
fi

PUBLIC_KEY=$(cat ~/.ssh/id_rsa.pub)

echo "📝 New password will be: $NEW_PASSWORD"
echo "🔐 Copying SSH key and setting up access..."

# Use sshpass with expect-like behavior to handle password change
sshpass -p "$OLD_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$SERVER_USER@$SERVER_IP" bash << REMOTE_SCRIPT
set -e

# First, set up SSH key (this should work before password change)
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo '$PUBLIC_KEY' > ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Change password
echo "root:$NEW_PASSWORD" | chpasswd

echo "✅ SSH key installed and password changed"
REMOTE_SCRIPT

echo ""
echo "✅ Setup complete!"
echo "📝 New root password: $NEW_PASSWORD"
echo "🔐 SSH key installed - you can now connect without password"
echo ""
echo "Test connection: ssh $SERVER_USER@$SERVER_IP"


