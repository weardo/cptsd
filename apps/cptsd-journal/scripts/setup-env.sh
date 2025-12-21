#!/bin/bash
# Setup environment variables for journal app
# Copies from CMS if available, or creates new

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
CMS_DIR="../../cptsd-cms"

echo "🔧 Setting up environment variables for journal app..."

# Check if CMS .env.local exists
if [ -f "$CMS_DIR/.env.local" ]; then
    echo "📋 Found CMS .env.local, using as base..."
    cp "$CMS_DIR/.env.local" "$APP_DIR/.env.local"
    
    # Update journal-specific vars
    sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=http://localhost:3003|' "$APP_DIR/.env.local"
    
    # Update MongoDB URI for journal database
    if grep -q "MONGODB_URI=" "$APP_DIR/.env.local"; then
        sed -i 's|MONGODB_URI=.*|MONGODB_URI=${MONGODB_URI:-mongodb://admin:changeme@localhost:27017/cptsd-journal?authSource=admin}|' "$APP_DIR/.env.local"
    else
        echo "MONGODB_URI=mongodb://admin:changeme@localhost:27017/cptsd-journal?authSource=admin" >> "$APP_DIR/.env.local"
    fi
    
    echo "✅ Environment file created from CMS config"
else
    echo "📝 Creating new .env.local file..."
    cat > "$APP_DIR/.env.local" << 'EOF'
# Database - Connect to shared MongoDB
# For local dev with Docker: mongodb://admin:changeme@localhost:27017/cptsd-journal?authSource=admin
# For local dev without Docker: mongodb://localhost:27017/cptsd-journal
MONGODB_URI=mongodb://admin:changeme@localhost:27017/cptsd-journal?authSource=admin

# NextAuth
NEXTAUTH_URL=http://localhost:3003
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Authentication - Used to initialize admin user
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=changeme

# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=
EOF
    echo "⚠️  Please edit .env.local and set:"
    echo "   - NEXTAUTH_SECRET (run: openssl rand -base64 32)"
    echo "   - OPENAI_API_KEY"
    echo "   - ADMIN_EMAIL and ADMIN_PASSWORD"
fi

echo ""
echo "✅ Environment setup complete!"
echo "📝 Edit $APP_DIR/.env.local to customize values"



