#!/bin/bash
# Update script for Hetzner deployment
# Pulls latest code and redeploys

set -e

echo "🔄 Updating application..."

# Pull latest code
if [ -d .git ]; then
    echo "📥 Pulling latest code..."
    git pull
else
    echo "⚠️  Not a git repository. Skipping git pull."
fi

# Rebuild and restart
echo "🏗️  Rebuilding Docker images..."
docker-compose build

echo "🔄 Restarting services..."
docker-compose up -d

echo "✅ Update complete!"
echo "📚 View logs: docker-compose logs -f"

