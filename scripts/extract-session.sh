#!/bin/bash

# Helper script to extract Firestore session info from a curl command
# Usage: ./extract-session.sh "curl 'https://firestore.googleapis.com/...'"

if [ -z "$1" ]; then
  echo "Usage: $0 \"curl 'https://firestore.googleapis.com/...'\""
  echo ""
  echo "Or pipe a curl command:"
  echo "  echo \"curl '...'\" | $0"
  exit 1
fi

CURL_CMD="$1"

# Extract gsessionid
GSESSIONID=$(echo "$CURL_CMD" | grep -oP 'gsessionid=\K[^&]*' | head -1)

# Extract SID
SID=$(echo "$CURL_CMD" | grep -oP 'SID=\K[^&]*' | head -1)

if [ -z "$GSESSIONID" ] || [ -z "$SID" ]; then
  echo "❌ Could not extract session info from curl command"
  echo ""
  echo "Make sure your curl command includes:"
  echo "  - gsessionid=..."
  echo "  - SID=..."
  exit 1
fi

echo "✅ Extracted session info:"
echo ""
echo "export FIRESTORE_GSESSIONID='$GSESSIONID'"
echo "export FIRESTORE_SID='$SID'"
echo ""
echo "Or add to your .env file:"
echo "FIRESTORE_GSESSIONID=$GSESSIONID"
echo "FIRESTORE_SID=$SID"

