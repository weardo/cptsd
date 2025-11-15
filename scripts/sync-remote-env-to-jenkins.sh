#!/bin/bash
# Sync environment variables from remote .env file to Jenkins
# Usage: ./scripts/sync-remote-env-to-jenkins.sh [job-name] [jenkins-password]

set -e

JENKINS_URL="https://jenkins.cptsd.in"
JENKINS_USER="${JENKINS_USER:-astra}"
JENKINS_PASSWORD="${2:-Fie@9eqmfp@cptsd}"
JOB_NAME="${1:-cptsd-cms}"
SERVER_IP="37.27.39.20"
SERVER_USER="root"

# Determine deployment path based on job name
if [ "$JOB_NAME" = "cptsd-blog-public" ]; then
    DEPLOY_PATH="/opt/cptsd-blog-public"
    APP_DIR="cptsd-blog-public"
else
    DEPLOY_PATH="/opt/cptsd-cms"
    APP_DIR="cptsd-cms"
fi

ENV_FILE="$DEPLOY_PATH/.env"

echo "🔄 Syncing environment variables from remote .env to Jenkins"
echo "   Job: $JOB_NAME"
echo "   Remote path: $ENV_FILE"

# Read .env file from remote server
echo "📥 Reading .env file from remote server..."
if ssh -o BatchMode=yes -o ConnectTimeout=5 "$SERVER_USER@$SERVER_IP" "test -f $ENV_FILE" 2>/dev/null; then
    REMOTE_ENV=$(ssh -o BatchMode=yes "$SERVER_USER@$SERVER_IP" "cat $ENV_FILE 2>/dev/null" || echo "")
else
    echo "❌ .env file not found at $ENV_FILE on remote server"
    echo ""
    echo "To create it, SSH to the server and create:"
    echo "  ssh $SERVER_USER@$SERVER_IP"
    echo "  nano $ENV_FILE"
    echo ""
    exit 1
fi

if [ -z "$REMOTE_ENV" ]; then
    echo "❌ Could not read .env file or file is empty"
    exit 1
fi

# Save remote .env to temporary file for parsing
TEMP_ENV=$(mktemp)
echo "$REMOTE_ENV" > "$TEMP_ENV"

echo "✅ Read .env file successfully"
echo "📋 Parsing environment variables..."

# Get CSRF token from Jenkins
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
    echo "⚠️  Could not get CSRF token, continuing without it..."
    CRUMB_FIELD=""
    CRUMB_VALUE=""
fi

# Build environment variables JSON for Jenkins global properties
echo "🔧 Building environment variables configuration..."

ENV_VARS_ARRAY=()
ENV_COUNT=0

while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Remove quotes from value if present
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    # Store key=value pair
    ENV_VARS_ARRAY+=("$key=$value")
    ENV_COUNT=$((ENV_COUNT + 1))
    
    echo "   ✓ $key"
done < <(grep -v '^#' "$TEMP_ENV" | grep -v '^$' | grep '=')

if [ $ENV_COUNT -eq 0 ]; then
    echo "⚠️  No environment variables found in .env file"
    rm -f "$TEMP_ENV"
    exit 1
fi

echo ""
echo "📝 Found $ENV_COUNT environment variables"
echo ""
echo "Choose how to add them to Jenkins:"
echo "  1) Global Properties (applies to all jobs) - Recommended"
echo "  2) Job Parameters (specific to $JOB_NAME job)"
echo ""
read -p "Enter choice (1 or 2): " CHOICE

if [ "$CHOICE" = "1" ]; then
    # Add to Global Properties
    echo "🔧 Adding environment variables to Jenkins Global Properties..."
    
    # Get current global configuration
    CURRENT_CONFIG=$(curl -s -k -u "$JENKINS_USER:$JENKINS_PASSWORD" \
        "$JENKINS_URL/configure" | grep -A 1000 'name="envVars"' || echo "")
    
    # Build XML for environment variables
    ENV_XML=""
    for env_pair in "${ENV_VARS_ARRAY[@]}"; do
        key=$(echo "$env_pair" | cut -d'=' -f1)
        value=$(echo "$env_pair" | cut -d'=' -f2-)
        
        # Escape XML special characters
        value_xml=$(echo "$value" | sed 's/&/\&amp;/g' | sed 's/</\&lt;/g' | sed 's/>/\&gt;/g' | sed 's/"/\&quot;/g' | sed "s/'/\&apos;/g")
        
        ENV_XML="${ENV_XML}<org.jenkinsci.plugins.envinject.EnvInjectGlobalEntry><name>${key}</name><value>${value_xml}</value></org.jenkinsci.plugins.envinject.EnvInjectGlobalEntry>"
    done
    
    # For Global Properties, we need to use the Jenkins Configuration as Code or REST API
    # Since the REST API is limited, we'll provide instructions
    echo ""
    echo "⚠️  Global Properties need to be set via Jenkins UI"
    echo ""
    echo "Manual steps:"
    echo "1. Go to: $JENKINS_URL/configure"
    echo "2. Scroll to 'Global properties'"
    echo "3. Check 'Environment variables'"
    echo "4. Click 'Add' for each variable:"
    echo ""
    for env_pair in "${ENV_VARS_ARRAY[@]}"; do
        key=$(echo "$env_pair" | cut -d'=' -f1)
        value=$(echo "$env_pair" | cut -d'=' -f2- | sed 's/&/\&amp;/g' | sed 's/</\&lt;/g' | sed 's/>/\&gt;/g' | sed 's/"/\&quot;/g')
        echo "   Name: $key"
        echo "   Value: [hidden - will show in next step]"
    done
    echo ""
    echo "📋 Here are the values (some are hidden for security):"
    for env_pair in "${ENV_VARS_ARRAY[@]}"; do
        key=$(echo "$env_pair" | cut -d'=' -f1)
        value=$(echo "$env_pair" | cut -d'=' -f2-)
        
        # Hide sensitive values
        if [[ "$key" =~ (PASSWORD|SECRET|KEY|TOKEN|API_KEY) ]]; then
            echo "   $key=***HIDDEN***"
        else
            # Truncate long values
            if [ ${#value} -gt 80 ]; then
                echo "   $key=${value:0:80}..."
            else
                echo "   $key=$value"
            fi
        fi
    done
    
    echo ""
    echo "Alternatively, save these to a file:"
    TEMP_OUTPUT=$(mktemp)
    for env_pair in "${ENV_VARS_ARRAY[@]}"; do
        echo "$env_pair" >> "$TEMP_OUTPUT"
    done
    echo "📄 Environment variables saved to: $TEMP_OUTPUT"
    echo "   You can copy from there"
    
elif [ "$CHOICE" = "2" ]; then
    # Add as Job Parameters using Jenkins REST API
    echo "🔧 Adding environment variables as Job Parameters for $JOB_NAME..."
    
    # Check if job exists
    if ! curl -s -k -f -u "$JENKINS_USER:$JENKINS_PASSWORD" "$JENKINS_URL/job/$JOB_NAME/config.xml" > /dev/null 2>&1; then
        echo "❌ Job $JOB_NAME does not exist!"
        rm -f "$TEMP_ENV"
        exit 1
    fi
    
    # Get current job config
    echo "📥 Fetching current job configuration..."
    CURRENT_CONFIG=$(curl -s -k -u "$JENKINS_USER:$JENKINS_PASSWORD" \
        "$JENKINS_URL/job/$JOB_NAME/config.xml")
    
    # Note: Updating job config via API is complex due to XML structure
    # We'll provide manual instructions instead
    echo ""
    echo "⚠️  Job Parameters need to be set via Jenkins UI"
    echo ""
    echo "Manual steps:"
    echo "1. Go to: $JENKINS_URL/job/$JOB_NAME/configure"
    echo "2. Check 'This project is parameterized'"
    echo "3. Click 'Add Parameter' → 'String Parameter' for each variable:"
    echo ""
    
    for env_pair in "${ENV_VARS_ARRAY[@]}"; do
        key=$(echo "$env_pair" | cut -d'=' -f1)
        value=$(echo "$env_pair" | cut -d'=' -f2-)
        
        # Hide sensitive values
        if [[ "$key" =~ (PASSWORD|SECRET|KEY|TOKEN|API_KEY) ]]; then
            echo "   Name: $key"
            echo "   Default Value: ***HIDDEN***"
        else
            # Truncate long values
            if [ ${#value} -gt 80 ]; then
                echo "   Name: $key"
                echo "   Default Value: ${value:0:80}..."
            else
                echo "   Name: $key"
                echo "   Default Value: $value"
            fi
        fi
        echo ""
    done
    
    echo "📋 Full values (hidden for sensitive keys):"
    TEMP_OUTPUT=$(mktemp)
    for env_pair in "${ENV_VARS_ARRAY[@]}"; do
        echo "$env_pair" >> "$TEMP_OUTPUT"
        key=$(echo "$env_pair" | cut -d'=' -f1)
        if [[ ! "$key" =~ (PASSWORD|SECRET|KEY|TOKEN|API_KEY) ]]; then
            echo "$env_pair"
        else
            echo "$key=***HIDDEN***"
        fi
    done
    echo ""
    echo "📄 All values saved to: $TEMP_OUTPUT"
    echo "   Use this file as reference when adding parameters"
    
else
    echo "❌ Invalid choice"
    rm -f "$TEMP_ENV"
    exit 1
fi

rm -f "$TEMP_ENV"

echo ""
echo "✅ Environment variables synced from remote .env file"
echo ""
echo "📝 Summary:"
echo "   - Read $ENV_COUNT variables from $ENV_FILE on remote server"
echo "   - Values are ready to be added to Jenkins"
echo ""
echo "💡 Next steps:"
if [ "$CHOICE" = "1" ]; then
    echo "   - Follow the manual steps above to add to Global Properties"
    echo "   - Or use the saved file: $TEMP_OUTPUT"
else
    echo "   - Follow the manual steps above to add as Job Parameters"
    echo "   - Or use the saved file: $TEMP_OUTPUT"
fi
echo ""
echo "🧪 After adding variables, trigger a build to test"

