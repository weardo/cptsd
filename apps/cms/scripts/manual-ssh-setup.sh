#!/bin/bash
# Manual SSH setup instructions - password change required

echo "🔐 SSH Setup Required - Manual Steps"
echo ""
echo "The server requires a password change that must be done interactively."
echo ""
echo "📝 Step 1: SSH to server and change password"
echo "   Run: ssh root@37.27.39.20"
echo "   Password: PmCUpNnNfrJAbfHX7iXK"
echo "   When prompted, enter the same password twice to change it"
echo ""
echo "📝 Step 2: Copy your SSH public key to the server"
echo ""
if [ -f ~/.ssh/id_rsa.pub ]; then
    echo "Your SSH public key is ready. After password change, run:"
    echo ""
    echo "ssh-copy-id root@37.27.39.20"
    echo ""
    echo "Or manually:"
    echo "cat ~/.ssh/id_rsa.pub | ssh root@37.27.39.20 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'"
else
    echo "Generating SSH key..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N "" -C "cptsd-cms-deploy"
    echo ""
    echo "✅ SSH key generated. Now run the commands above."
fi
echo ""
echo "📝 Step 3: After SSH key is set up, run deployment:"
echo "   ./scripts/deploy-simple.sh"
echo ""


