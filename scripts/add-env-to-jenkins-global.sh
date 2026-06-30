#!/bin/bash
# Add environment variables to Jenkins Global Properties
# This reads from remote .env and creates a formatted output for easy copy-paste
# Usage: ./scripts/add-env-to-jenkins-global.sh [job-name] [jenkins-password]

set -e

JENKINS_URL="https://jenkins.cptsd.in"
JENKINS_USER="${JENKINS_USER:-astra}"
JENKINS_PASSWORD="${2:-Fie@9eqmfp@cptsd}"
JOB_NAME="${1:-cptsd-cms}"
SERVER_IP="37.27.39.20"
SERVER_USER="root"

# Determine deployment path based on job name
if [ "$JOB_NAME" = "cptsd-blog-public" ]; then
    DEPLOY_PATH="/opt/blog"
else
    DEPLOY_PATH="/opt/cms"
fi

ENV_FILE="$DEPLOY_PATH/.env"

echo "📥 Reading .env file from remote server ($SERVER_IP:$ENV_FILE)..."

# Read .env file from remote server
if ssh -o BatchMode=yes -o ConnectTimeout=5 "$SERVER_USER@$SERVER_IP" "test -f $ENV_FILE" 2>/dev/null; then
    REMOTE_ENV=$(ssh -o BatchMode=yes "$SERVER_USER@$SERVER_IP" "cat $ENV_FILE 2>/dev/null" || echo "")
else
    echo "❌ .env file not found at $ENV_FILE on remote server"
    echo ""
    echo "💡 You can also provide a local .env file:"
    echo "   $0 $JOB_NAME $JENKINS_PASSWORD /path/to/local/.env"
    exit 1
fi

if [ -z "$REMOTE_ENV" ]; then
    echo "❌ Could not read .env file or file is empty"
    exit 1
fi

# Save remote .env to temporary file for parsing
TEMP_ENV=$(mktemp)
echo "$REMOTE_ENV" > "$TEMP_ENV"

echo "✅ Successfully read .env file"
echo ""
echo "📋 Environment variables to add:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ENV_COUNT=0
SENSITIVE_KEYS=(PASSWORD SECRET KEY TOKEN API_KEY)

for env_pair in $(grep -v '^#' "$TEMP_ENV" | grep -v '^$' | grep '='); do
    key=$(echo "$env_pair" | cut -d'=' -f1)
    value=$(echo "$env_pair" | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    ENV_COUNT=$((ENV_COUNT + 1))
    
    # Check if key contains sensitive keywords
    is_sensitive=false
    for sensitive in "${SENSITIVE_KEYS[@]}"; do
        if [[ "$key" =~ ${sensitive} ]]; then
            is_sensitive=true
            break
        fi
    done
    
    if [ "$is_sensitive" = true ]; then
        echo "  $ENV_COUNT. $key = ***HIDDEN***"
    else
        # Truncate if too long
        if [ ${#value} -gt 60 ]; then
            echo "  $ENV_COUNT. $key = ${value:0:60}..."
        else
            echo "  $ENV_COUNT. $key = $value"
        fi
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Found $ENV_COUNT environment variables"
echo ""
echo "🔧 Adding to Jenkins Global Properties..."
echo ""
echo "📝 Steps to add these in Jenkins UI:"
echo ""
echo "1. Go to: $JENKINS_URL/configure"
echo ""
echo "2. Scroll down to 'Global properties' section"
echo ""
echo "3. Check ✅ 'Environment variables'"
echo ""
echo "4. Click 'Add' and enter each variable:"
echo ""

ENV_LIST_FILE=$(mktemp)
echo "# Jenkins Global Environment Variables" > "$ENV_LIST_FILE"
echo "# Copy these to Jenkins UI: $JENKINS_URL/configure" >> "$ENV_LIST_FILE"
echo "" >> "$ENV_LIST_FILE"

for env_pair in $(grep -v '^#' "$TEMP_ENV" | grep -v '^$' | grep '='); do
    key=$(echo "$env_pair" | cut -d'=' -f1)
    value=$(echo "$env_pair" | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    echo "   ┌─────────────────────────────────────────"
    echo "   │ Name:  $key"
    
    # Check if key contains sensitive keywords
    is_sensitive=false
    for sensitive in "${SENSITIVE_KEYS[@]}"; do
        if [[ "$key" =~ ${sensitive} ]]; then
            is_sensitive=true
            break
        fi
    done
    
    if [ "$is_sensitive" = true ]; then
        echo "   │ Value: ***HIDDEN*** (check $ENV_LIST_FILE for actual value)"
        echo "$key=$value" >> "$ENV_LIST_FILE"
    else
        if [ ${#value} -gt 70 ]; then
            echo "   │ Value: ${value:0:70}..."
        else
            echo "   │ Value: $value"
        fi
        echo "$key=$value" >> "$ENV_LIST_FILE"
    fi
    echo "   └─────────────────────────────────────────"
    echo ""
done

echo "5. Click 'Apply' then 'Save'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📄 All environment variables (including hidden values) saved to:"
echo "   $ENV_LIST_FILE"
echo ""
echo "💡 You can use this file as reference when adding variables in Jenkins"
echo ""
echo "🧪 After adding, trigger a build to verify:"
echo "   $JENKINS_URL/job/$JOB_NAME/build"

rm -f "$TEMP_ENV"

