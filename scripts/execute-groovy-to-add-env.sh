#!/bin/bash
# Execute Groovy script to add environment variables to Jenkins Global Properties
# Usage: ./scripts/execute-groovy-to-add-env.sh [job-name] [jenkins-password]

set -e

JENKINS_URL="https://jenkins.cptsd.in"
JENKINS_USER="${JENKINS_USER:-astra}"
JENKINS_PASSWORD="${2:-Fie@9eqmfp@cptsd}"
JOB_NAME="${1:-cptsd-cms}"
SERVER_IP="37.27.39.20"
SERVER_USER="root"

# Determine deployment path
if [ "$JOB_NAME" = "cptsd-blog-public" ]; then
    DEPLOY_PATH="/opt/blog"
else
    DEPLOY_PATH="/opt/cms"
fi

ENV_FILE="$DEPLOY_PATH/.env"

echo "🚀 Adding environment variables to Jenkins Global Properties"
echo "   Job: $JOB_NAME"
echo "   Remote path: $ENV_FILE"

# Read .env file from remote server
echo "📥 Reading .env file from remote server..."
REMOTE_ENV=$(ssh -o BatchMode=yes "$SERVER_USER@$SERVER_IP" "cat $ENV_FILE 2>/dev/null" || echo "")

if [ -z "$REMOTE_ENV" ]; then
    echo "❌ Could not read .env file from $ENV_FILE"
    exit 1
fi

# Get CSRF token
echo "🔑 Getting Jenkins CSRF token..."
CRUMB_RESPONSE=$(curl -s -k -u "$JENKINS_USER:$JENKINS_PASSWORD" \
    "$JENKINS_URL/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,\":\",//crumb)")

if [ -n "$CRUMB_RESPONSE" ] && [ "$CRUMB_RESPONSE" != "null" ]; then
    if echo "$CRUMB_RESPONSE" | grep -q ":"; then
        CRUMB_FIELD=$(echo "$CRUMB_RESPONSE" | cut -d: -f1)
        CRUMB_VALUE=$(echo "$CRUMB_RESPONSE" | cut -d: -f2-)
    else
        CRUMB_FIELD="Jenkins-Crumb"
        CRUMB_VALUE="$CRUMB_RESPONSE"
    fi
    echo "✅ CSRF token obtained"
else
    echo "⚠️  Could not get CSRF token"
    exit 1
fi

# Build Groovy script
GROOVY_SCRIPT="import jenkins.model.Jenkins
import hudson.model.EnvironmentVariablesNodeProperty

def instance = Jenkins.getInstance()
def globalNodeProperties = instance.getGlobalNodeProperties()
def envVarsProperty = globalNodeProperties.getAll(hudson.model.EnvironmentVariablesNodeProperty)

// Create new property if it doesn't exist
if (envVarsProperty.isEmpty()) {
    def newEnvVarsProperty = new hudson.model.EnvironmentVariablesNodeProperty()
    globalNodeProperties.add(newEnvVarsProperty)
    envVarsProperty = newEnvVarsProperty
} else {
    envVarsProperty = envVarsProperty.get(0)
}

def envVars = envVarsProperty.getEnvVars()

// Add environment variables
"

ENV_COUNT=0

# Parse .env file and add to Groovy script
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Remove quotes from value
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    # Escape backslashes and quotes for Groovy
    value_escaped=$(echo "$value" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
    
    # Add to Groovy script
    GROOVY_SCRIPT="${GROOVY_SCRIPT}envVars.put(\"$key\", \"$value_escaped\")
"
    
    ENV_COUNT=$((ENV_COUNT + 1))
    echo "   ✓ $key"
done < <(echo "$REMOTE_ENV" | grep -v '^#' | grep -v '^$' | grep '=')

GROOVY_SCRIPT="${GROOVY_SCRIPT}
instance.save()
println \"✅ Added ${ENV_COUNT} environment variables to Jenkins Global Properties\"
"

echo ""
echo "📝 Found $ENV_COUNT environment variables"
echo ""
echo "🔄 Executing Groovy script via Jenkins REST API..."

# Execute via REST API
RESPONSE=$(curl -s -k -w "\n%{http_code}" -X POST \
    -u "$JENKINS_USER:$JENKINS_PASSWORD" \
    -H "$CRUMB_FIELD: $CRUMB_VALUE" \
    --data-urlencode "script=$GROOVY_SCRIPT" \
    "$JENKINS_URL/scriptText" 2>/dev/null || echo "")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q "Added"; then
    echo "✅ Successfully added environment variables to Jenkins Global Properties!"
    echo "$BODY"
    echo ""
    echo "🧪 Trigger a build to test:"
    echo "   $JENKINS_URL/job/$JOB_NAME/build"
else
    echo "❌ Failed to add environment variables (HTTP $HTTP_CODE)"
    echo ""
    echo "Response:"
    echo "$BODY"
    echo ""
    echo "💡 Alternative: Run the Groovy script manually:"
    echo "   1. Go to: $JENKINS_URL/script"
    echo "   2. Copy and paste this script:"
    echo ""
    echo "$GROOVY_SCRIPT"
    exit 1
fi

