#!/bin/bash
# Automatically add environment variables to Jenkins Global Properties via REST API
# Usage: ./scripts/automatically-add-env-to-jenkins.sh [job-name] [jenkins-password]

set -e

JENKINS_URL="https://jenkins.cptsd.in"
JENKINS_USER="${JENKINS_USER:-astra}"
JENKINS_PASSWORD="${2:-Fie@9eqmfp@cptsd}"
JOB_NAME="${1:-cptsd-cms}"
SERVER_IP="37.27.39.20"
SERVER_USER="root"

# Determine deployment path
if [ "$JOB_NAME" = "cptsd-blog-public" ]; then
    DEPLOY_PATH="/opt/cptsd-blog-public"
else
    DEPLOY_PATH="/opt/cptsd-cms"
fi

ENV_FILE="$DEPLOY_PATH/.env"

echo "🚀 Automatically adding environment variables to Jenkins Global Properties"
echo "   Job: $JOB_NAME"
echo "   Remote path: $ENV_FILE"

# Read .env file from remote server
echo "📥 Reading .env file from remote server..."
if ssh -o BatchMode=yes -o ConnectTimeout=5 "$SERVER_USER@$SERVER_IP" "test -f $ENV_FILE" 2>/dev/null; then
    REMOTE_ENV=$(ssh -o BatchMode=yes "$SERVER_USER@$SERVER_IP" "cat $ENV_FILE 2>/dev/null" || echo "")
else
    echo "❌ .env file not found at $ENV_FILE on remote server"
    exit 1
fi

if [ -z "$REMOTE_ENV" ]; then
    echo "❌ Could not read .env file or file is empty"
    exit 1
fi

# Save to temp file
TEMP_ENV=$(mktemp)
echo "$REMOTE_ENV" > "$TEMP_ENV"

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
    CRUMB_FIELD=""
    CRUMB_VALUE=""
fi

# Parse environment variables
ENV_COUNT=0
ENV_VARS_JSON="{"
FIRST=true

while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Remove quotes from value
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    # Escape JSON special characters
    value_json=$(echo "$value" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed 's/\$/\\$/g')
    
    # Add to JSON
    if [ "$FIRST" = true ]; then
        ENV_VARS_JSON="${ENV_VARS_JSON}\"$key\":\"$value_json\""
        FIRST=false
    else
        ENV_VARS_JSON="${ENV_VARS_JSON},\"$key\":\"$value_json\""
    fi
    
    ENV_COUNT=$((ENV_COUNT + 1))
    echo "   ✓ $key"
done < <(grep -v '^#' "$TEMP_ENV" | grep -v '^$' | grep '=')

ENV_VARS_JSON="${ENV_VARS_JSON}}"

if [ $ENV_COUNT -eq 0 ]; then
    echo "⚠️  No environment variables found"
    rm -f "$TEMP_ENV"
    exit 1
fi

echo ""
echo "📝 Found $ENV_COUNT environment variables"
echo ""
echo "⚠️  Note: Jenkins Global Properties API is limited."
echo "   We'll use the Configuration as Code plugin approach or provide manual instructions."
echo ""
echo "💡 Alternative: Adding via Groovy script (requires Jenkins Script Console access)"
echo ""

# Create Groovy script to add environment variables
GROOVY_SCRIPT=$(cat << 'GROOVY_EOF'
import jenkins.model.Jenkins
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
GROOVY_EOF
)

# Add each variable to Groovy script
while IFS='=' read -r key value || [ -n "$key" ]; do
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    # Escape for Groovy string
    value_groovy=$(echo "$value" | sed "s/\\/\\\\/g" | sed "s/\"/\\\"/g" | sed "s/\$/\\\$/g")
    
    GROOVY_SCRIPT="${GROOVY_SCRIPT}
envVars.put(\"$key\", \"$value_groovy\")"
done < <(grep -v '^#' "$TEMP_ENV" | grep -v '^$' | grep '=')

GROOVY_SCRIPT="${GROOVY_SCRIPT}

instance.save()
println \"✅ Added ${ENV_COUNT} environment variables to Jenkins Global Properties\"
"

# Save Groovy script
GROOVY_FILE=$(mktemp)
echo "$GROOVY_SCRIPT" > "$GROOVY_FILE"

echo "📄 Groovy script created: $GROOVY_FILE"
echo ""
echo "Option 1: Run via Script Console (Recommended)"
echo "1. Go to: $JENKINS_URL/script"
echo "2. Copy and paste the contents of: $GROOVY_FILE"
echo "3. Click 'Run'"
echo ""
echo "Option 2: Try via REST API (may require plugin)"
echo ""

# Try to execute via REST API (if script console API is enabled)
echo "🔄 Attempting to add via REST API..."
SCRIPT_URL_ENCODED=$(cat "$GROOVY_FILE" | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read()))" 2>/dev/null || echo "")

if [ -n "$SCRIPT_URL_ENCODED" ]; then
    CURL_CMD="curl -s -k -w '\n%{http_code}' -X POST"
    if [ -n "$CRUMB_FIELD" ] && [ -n "$CRUMB_VALUE" ]; then
        CURL_CMD="$CURL_CMD -H '$CRUMB_FIELD: $CRUMB_VALUE'"
    fi
    CURL_CMD="$CURL_CMD -u '$JENKINS_USER:$JENKINS_PASSWORD'"
    CURL_CMD="$CURL_CMD --data-urlencode 'script=$(cat $GROOVY_FILE)'"
    CURL_CMD="$CURL_CMD '$JENKINS_URL/scriptText'"
    
    echo "Executing via Script Console API..."
    RESPONSE=$(eval "$CURL_CMD" 2>/dev/null || echo "")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q "Added"; then
        echo "✅ Successfully added environment variables via REST API!"
        echo "$BODY"
    else
        echo "⚠️  REST API call failed (HTTP $HTTP_CODE)"
        echo "   This is normal - Jenkins may require manual script execution"
        echo ""
        echo "📋 Use Option 1 above to add via Script Console"
    fi
else
    echo "⚠️  Could not encode script for API"
    echo "📋 Use Option 1 above to add via Script Console"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📄 Files created:"
echo "   - Groovy script: $GROOVY_FILE"
echo "   - Environment variables: $TEMP_ENV"
echo ""
echo "💡 To add manually via Jenkins UI:"
echo "   1. Go to: $JENKINS_URL/configure"
echo "   2. Scroll to 'Global properties' → Check 'Environment variables'"
echo "   3. Add each variable from: $TEMP_ENV"
echo ""
echo "   OR use the Groovy script at: $GROOVY_FILE"

rm -f "$TEMP_ENV"

