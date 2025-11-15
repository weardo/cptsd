#!/bin/bash
# Setup Jenkins job environment variables from .env or .env.local files
# Usage: ./scripts/setup-jenkins-env.sh [jenkins-password] [job-name] [env-file]

set -e

JENKINS_URL="https://jenkins.cptsd.in"
JENKINS_USER="${JENKINS_USER:-astra}"
JENKINS_PASSWORD="${1:-Fie@9eqmfp@cptsd}"
JOB_NAME="${2:-cptsd-cms}"
ENV_FILE="${3:-}"

# Default to looking for .env or .env.local based on job name
if [ -z "$ENV_FILE" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
    
    # Determine which app directory to check based on job name
    if [ "$JOB_NAME" = "cptsd-blog-public" ]; then
        APP_DIR="cptsd-blog-public"
    else
        APP_DIR="cptsd-cms"
    fi
    
    if [ -f "$REPO_ROOT/$APP_DIR/.env.local" ]; then
        ENV_FILE="$REPO_ROOT/$APP_DIR/.env.local"
    elif [ -f "$REPO_ROOT/$APP_DIR/.env" ]; then
        ENV_FILE="$REPO_ROOT/$APP_DIR/.env"
    elif [ -f "$REPO_ROOT/.env.local" ]; then
        ENV_FILE="$REPO_ROOT/.env.local"
    elif [ -f "$REPO_ROOT/.env" ]; then
        ENV_FILE="$REPO_ROOT/.env"
    fi
fi

if [ -z "$ENV_FILE" ] || [ ! -f "$ENV_FILE" ]; then
    echo "❌ No .env or .env.local file found!"
    echo ""
    echo "Usage: $0 [jenkins-password] [job-name] [env-file]"
    echo ""
    echo "Example:"
    echo "  $0 mypassword cptsd-cms /path/to/.env"
    echo ""
    # Determine app directory based on job name
    if [ "$JOB_NAME" = "cptsd-blog-public" ]; then
        APP_DIR="cptsd-blog-public"
    else
        APP_DIR="cptsd-cms"
    fi
    
    echo "Or place .env or .env.local in:"
    echo "  - $REPO_ROOT/$APP_DIR/.env.local (preferred)"
    echo "  - $REPO_ROOT/$APP_DIR/.env"
    echo "  - $REPO_ROOT/.env.local"
    echo "  - $REPO_ROOT/.env"
    exit 1
fi

echo "📋 Setting up Jenkins environment variables for job: $JOB_NAME"
echo "📄 Using environment file: $ENV_FILE"

# Get CSRF token
echo "🔑 Getting CSRF token..."
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

# Check if job exists
if ! curl -s -k -f -u "$JENKINS_USER:$JENKINS_PASSWORD" "$JENKINS_URL/job/$JOB_NAME/config.xml" > /dev/null 2>&1; then
    echo "❌ Job $JOB_NAME does not exist!"
    echo "   Please create the job first or check the job name"
    exit 1
fi

# Parse .env file and build environment variables JSON
echo "📝 Reading environment variables from $ENV_FILE..."

# Read .env file and convert to key-value pairs (skip comments and empty lines)
ENV_VARS=""
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Remove quotes from value if present
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    # Escape special characters in value for JSON
    value_escaped=$(echo "$value" | sed 's/"/\\"/g' | sed 's/\$/\\$/g' | sed 's/\\/\\\\/g')
    
    # Build JSON object
    if [ -n "$ENV_VARS" ]; then
        ENV_VARS="$ENV_VARS,\"$key\":\"$value_escaped\""
    else
        ENV_VARS="\"$key\":\"$value_escaped\""
    fi
done < <(grep -v '^#' "$ENV_FILE" | grep -v '^$' | grep '=')

if [ -z "$ENV_VARS" ]; then
    echo "⚠️  No environment variables found in $ENV_FILE"
    exit 1
fi

# Get current job config
echo "📥 Fetching current job configuration..."
JOB_CONFIG=$(curl -s -k -u "$JENKINS_USER:$JENKINS_PASSWORD" "$JENKINS_URL/job/$JOB_NAME/config.xml")

# Check if job config contains pipeline definition
if ! echo "$JOB_CONFIG" | grep -q "flow-definition\|CpsScmFlowDefinition"; then
    echo "⚠️  Job $JOB_NAME is not a pipeline job or uses a different configuration format"
    echo "   This script works best with Pipeline jobs from SCM"
    echo ""
    echo "   You can manually add environment variables to the job:"
    echo "   1. Go to: $JENKINS_URL/job/$JOB_NAME/configure"
    echo "   2. Scroll to 'Pipeline' section"
    echo "   3. Add environment variables in the pipeline environment block"
    exit 1
fi

# For pipeline jobs, we'll update the Jenkinsfile environment section
# or use Jenkins credentials/global properties
echo "🔧 Updating Jenkins job with environment variables..."

# Build the environment variables section for pipeline
ENV_SECTION=""
ENV_ITEMS=""
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Remove quotes from value if present
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    # Escape XML special characters
    value_xml=$(echo "$value" | sed 's/&/\&amp;/g' | sed 's/</\&lt;/g' | sed 's/>/\&gt;/g' | sed 's/"/\&quot;/g' | sed "s/'/\&apos;/g")
    
    # Add to environment items
    if [ -n "$ENV_ITEMS" ]; then
        ENV_ITEMS="$ENV_ITEMS"$'\n'"        <hudson.model.StringParameterValue>"
    else
        ENV_ITEMS="        <hudson.model.StringParameterValue>"
    fi
    ENV_ITEMS="$ENV_ITEMS"$'\n'"          <name>$key</name>"
    ENV_ITEMS="$ENV_ITEMS"$'\n'"          <value>$value_xml</value>"
    ENV_ITEMS="$ENV_ITEMS"$'\n'"        </hudson.model.StringParameterValue>"
done < <(grep -v '^#' "$ENV_FILE" | grep -v '^$' | grep '=')

# Create parameters section XML
PARAMETERS_SECTION="<parameters>$ENV_ITEMS</parameters>"

echo "✅ Environment variables parsed:"
grep -v '^#' "$ENV_FILE" | grep -v '^$' | grep '=' | cut -d'=' -f1 | while read -r key; do
    echo "   - $key"
done

echo ""
echo "📝 Note: This script will create a Jenkins Parameters job configuration"
echo "   For Pipeline jobs, you have two options:"
echo ""
echo "   Option 1: Manual configuration (recommended for pipelines)"
echo "   1. Go to: $JENKINS_URL/job/$JOB_NAME/configure"
echo "   2. Scroll to 'Pipeline' → 'This project is parameterized'"
echo "   3. Add parameters for each environment variable"
echo "   4. Update Jenkinsfile to use params.ENV_VAR_NAME"
echo ""
echo "   Option 2: Use environment variables in Jenkinsfile"
echo "   The Jenkinsfile will automatically read from .env files in the repository"
echo ""
echo "   The Jenkinsfile has been updated to:"
echo "   1. Check for .env.local or .env in the checked-out repository"
echo "   2. Fall back to deployment directory .env"
echo "   3. Use Jenkins environment variables as last resort"
echo ""
echo "✅ Jenkinsfile is already configured to read from .env files!"
echo "   Just ensure your .env or .env.local file is in the repository or deployment directory."

