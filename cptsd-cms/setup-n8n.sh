#!/bin/bash

echo "=== n8n Setup Script ==="
echo ""

# Check if n8n is installed
if ! command -v n8n &> /dev/null; then
    echo "Installing n8n..."
    npm install -g n8n
else
    echo "✅ n8n is already installed"
fi

echo ""
echo "=== Next Steps ==="
echo ""
echo "1. Start n8n:"
echo "   n8n start"
echo ""
echo "2. Access n8n UI:"
echo "   http://localhost:5678"
echo ""
echo "3. Import workflow:"
echo "   - Go to n8n UI"
echo "   - Click 'Workflows' > 'Import from File'"
echo "   - Select: n8n-workflow.json"
echo ""
echo "4. Add OpenAI API credentials:"
echo "   - In n8n, go to 'Credentials'"
echo "   - Add 'OpenAI API' credential"
echo "   - Use API key from .env.local"
echo ""
echo "5. Activate workflow:"
echo "   - Toggle workflow to active"
echo "   - Copy webhook URL"
echo ""
echo "6. Update .env.local:"
echo "   N8N_BASE_URL=\"http://localhost:5678\""
echo ""
