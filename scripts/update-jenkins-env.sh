#!/bin/bash
# Update Jenkins job to include environment variables from .env or .env.local
# This updates the Jenkinsfile environment block in the job configuration
# Usage: ./scripts/update-jenkins-env.sh [jenkins-password] [job-name] [env-file]

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
    echo "Or place .env or .env.local in repository root or cptsd-cms directory"
    exit 1
fi

echo "📋 Updating Jenkins job environment variables"
echo "   Job: $JOB_NAME"
echo "   Env file: $ENV_FILE"

# Get CSRF token
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
fi

# Check if job exists
if ! curl -s -k -f -u "$JENKINS_USER:$JENKINS_PASSWORD" "$JENKINS_URL/job/$JOB_NAME/config.xml" > /dev/null 2>&1; then
    echo "❌ Job $JOB_NAME does not exist!"
    exit 1
fi

# Read environment variables from .env file
echo "📝 Environment variables to configure:"
ENV_VARS=()
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Remove quotes from value if present
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    # Store key=value pair
    ENV_VARS+=("$key=$value")
    echo "   - $key"
done < <(grep -v '^#' "$ENV_FILE" | grep -v '^$' | grep '=')

if [ ${#ENV_VARS[@]} -eq 0 ]; then
    echo "⚠️  No environment variables found in $ENV_FILE"
    exit 1
fi

echo ""
echo "✅ Jenkinsfile has been updated to automatically read from .env files"
echo ""
echo "📋 Summary:"
if [ "$JOB_NAME" = "cptsd-blog-public" ]; then
    echo "   The Jenkinsfile will check for environment variables in this order:"
    echo "   1. .env.local in checked-out repository (cptsd-blog-public/.env.local)"
    echo "   2. .env in checked-out repository (cptsd-blog-public/.env)"
    echo "   3. .env in deployment directory (/opt/cptsd-blog-public/.env)"
    echo "   4. Jenkins environment variables (if configured in job)"
    echo ""
    echo "   Required environment variables:"
    echo "   - MONGODB_URI"
else
    echo "   The Jenkinsfile will check for environment variables in this order:"
    echo "   1. .env.local in checked-out repository (cptsd-cms/.env.local)"
    echo "   2. .env in checked-out repository (cptsd-cms/.env)"
    echo "   3. .env in deployment directory (/opt/cptsd-cms/.env)"
    echo "   4. Jenkins environment variables (if configured in job)"
    echo ""
    echo "   Required environment variables:"
    echo "   - OPENAI_API_KEY"
    echo "   - MONGODB_URI"
    echo "   - S3_ACCESS_KEY_ID"
    echo "   - S3_SECRET_ACCESS_KEY"
    echo "   - S3_BUCKET_NAME"
    echo "   - ADMIN_EMAIL"
    echo "   - ADMIN_PASSWORD"
    echo "   - NEXTAUTH_URL"
    echo "   - NEXTAUTH_SECRET"
fi
echo ""
echo ""
echo "💡 Next steps:"
if [ "$JOB_NAME" = "cptsd-blog-public" ]; then
    echo "   1. Ensure your .env or .env.local file is committed to the repository"
    echo "      OR place it at /opt/cptsd-blog-public/.env on the server"
else
    echo "   1. Ensure your .env or .env.local file is committed to the repository"
    echo "      OR place it at /opt/cptsd-cms/.env on the server"
fi
echo ""
echo "   2. If you want to use Jenkins credentials instead:"
echo "      - Go to: $JENKINS_URL/job/$JOB_NAME/configure"
echo "      - Add environment variables in the pipeline environment block"
echo ""
echo "   3. The next build will automatically use environment variables"
echo "      from the .env file in the repository or deployment directory"

