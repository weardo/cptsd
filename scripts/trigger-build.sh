#!/bin/bash
# Trigger Jenkins build manually
# Usage: ./scripts/trigger-build.sh [job-name]

JENKINS_URL="https://jenkins.cptsd.in"
JENKINS_USER="astra"
JENKINS_PASSWORD="Fie@9eqmfp@cptsd"
JOB_NAME="${1:-cptsd-cms}"

echo "🚀 Triggering build for: $JOB_NAME"

# Get CSRF token
CRUMB=$(curl -s -k -u "$JENKINS_USER:$JENKINS_PASSWORD" \
    "$JENKINS_URL/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,\":\",//crumb)")

if [ -n "$CRUMB" ]; then
    CRUMB_FIELD=$(echo "$CRUMB" | cut -d: -f1)
    CRUMB_VALUE=$(echo "$CRUMB" | cut -d: -f2)
    
    RESPONSE=$(curl -s -k -w "\n%{http_code}" -X POST \
        -u "$JENKINS_USER:$JENKINS_PASSWORD" \
        -H "$CRUMB_FIELD: $CRUMB_VALUE" \
        "$JENKINS_URL/job/$JOB_NAME/build")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    
    if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Build triggered successfully!"
        echo "📊 View build: $JENKINS_URL/job/$JOB_NAME"
    else
        echo "❌ Failed to trigger build. HTTP code: $HTTP_CODE"
        exit 1
    fi
else
    echo "❌ Could not get CSRF token"
    exit 1
fi

