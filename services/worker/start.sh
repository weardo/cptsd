#!/bin/bash
# Start worker service
# Usage: ./start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load env vars from worker .env.local if it exists
if [ -f ".env.local" ]; then
    # Source the .env.local file to properly handle quoted values
    set -a
    source .env.local
    set +a
    echo "✅ Loaded environment from .env.local"
# Otherwise, try loading from journal app
elif [ -f "../../apps/cptsd-journal/.env.local" ]; then
    set -a
    source ../../apps/cptsd-journal/.env.local
    set +a
    # Update MONGODB_URI to use journal database
    if [ -n "$MONGODB_URI" ]; then
        export MONGODB_URI=$(echo "$MONGODB_URI" | sed 's/cptsd-cms/cptsd-journal/g')
    fi
    echo "✅ Loaded environment from journal app .env.local"
else
    echo "⚠️  No .env.local found. Please create one or set environment variables."
fi

echo "🚀 Starting worker service..."
echo "📊 MongoDB: ${MONGODB_URI:0:50}..."
echo "🤖 OpenAI: ${OPENAI_API_KEY:0:20}..."

npm run dev

