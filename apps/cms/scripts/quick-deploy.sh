#!/bin/bash
# Quick deployment script - handles sshpass installation and deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_SCRIPT="$SCRIPT_DIR/deploy-cx23-remote.sh"

echo "🚀 Quick Deployment to CX23 Server"
echo ""

# Check and install sshpass
if ! command -v sshpass &> /dev/null; then
    echo "📦 Installing sshpass..."
    if command -v pacman &> /dev/null; then
        sudo pacman -S --noconfirm sshpass
    elif command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y sshpass
    elif command -v yum &> /dev/null; then
        sudo yum install -y sshpass
    else
        echo "⚠️  Please install sshpass manually:"
        echo "   Ubuntu/Debian: sudo apt-get install sshpass"
        echo "   Arch: sudo pacman -S sshpass"
        exit 1
    fi
fi

# Run the deployment script
"$REMOTE_SCRIPT"


