#!/bin/bash

# Test n8n workflow
# This script tests the n8n webhook endpoint

echo "=== Testing n8n Workflow ==="
echo ""

# Check if n8n is running
if ! curl -s http://localhost:5678 > /dev/null 2>&1; then
    echo "⚠️  n8n is not running on http://localhost:5678"
    echo "Start n8n with: n8n start"
    exit 1
fi

echo "✅ n8n is running"
echo ""

# Test webhook endpoint
echo "Testing webhook endpoint: http://localhost:5678/webhook/generate-content"
echo ""

curl -X POST http://localhost:5678/webhook/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "test-123",
    "topicName": "Understanding CPTSD",
    "topicSlug": "understanding-cptsd",
    "postType": "CAROUSEL",
    "rawIdea": "Create a post explaining what CPTSD is and how it differs from PTSD",
    "tone": "educational",
    "finchScreenshotUrl": null
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | python3 -m json.tool 2>/dev/null || echo "Response received (may not be JSON)"

echo ""
echo "=== Test Complete ==="

