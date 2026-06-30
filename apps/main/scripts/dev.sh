#!/bin/bash
# Script to start dev server, ensuring port 3002 is free

PORT=3002

# Kill any existing processes on the port
echo "Checking for processes on port $PORT..."
lsof -ti :$PORT | xargs -r kill -9 2>/dev/null
sleep 1

# Verify port is free
if lsof -i :$PORT >/dev/null 2>&1; then
  echo "⚠️  Warning: Port $PORT is still in use. Trying to free it..."
  pkill -f "next.*$PORT" 2>/dev/null
  pkill -f "next-server.*$PORT" 2>/dev/null
  sleep 2
fi

# Final check
if lsof -i :$PORT >/dev/null 2>&1; then
  echo "❌ Error: Port $PORT is still in use. Please manually kill the process:"
  lsof -i :$PORT
  exit 1
fi

echo "✅ Port $PORT is free. Starting dev server..."
npm run dev

