#!/bin/bash
# Setup Jenkins jobs and GitHub webhook via CLI
# Usage: ./scripts/setup-jenkins-jobs.sh [jenkins-admin-password]

set -e

JENKINS_URL="https://jenkins.cptsd.in"
JENKINS_USER="${JENKINS_USER:-astra}"
JENKINS_PASSWORD="${1:-Fie@9eqmfp@cptsd}"
GITHUB_REPO="weardo/cptsd"
GITHUB_REPO_URL="git@github.com:weardo/cptsd.git"

echo "🔧 Setting up Jenkins jobs and webhook via CLI..."

# Get Jenkins password if not provided
if [ -z "$JENKINS_PASSWORD" ]; then
    echo "📝 Getting Jenkins initial admin password..."
    JENKINS_PASSWORD=$(ssh root@37.27.39.20 "docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword 2>/dev/null" || echo "")
    
    if [ -z "$JENKINS_PASSWORD" ]; then
        echo "❌ Could not get Jenkins password. Please provide it as argument:"
        echo "   ./scripts/setup-jenkins-jobs.sh YOUR_PASSWORD"
        exit 1
    fi
fi

# Wait for Jenkins to be ready
echo "⏳ Waiting for Jenkins to be ready..."
for i in {1..30}; do
    if curl -s -k -f -u "$JENKINS_USER:$JENKINS_PASSWORD" "$JENKINS_URL/api/json" > /dev/null 2>&1; then
        echo "✅ Jenkins is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Jenkins is not responding. Please check if it's running."
        echo "   Testing connection..."
        curl -s -k -I "$JENKINS_URL" | head -5
        exit 1
    fi
    sleep 2
done

# Get CSRF token
echo "🔑 Getting CSRF token..."
CRUMB_RESPONSE=$(curl -s -k -u "$JENKINS_USER:$JENKINS_PASSWORD" \
    "$JENKINS_URL/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,\":\",//crumb)")

if [ -n "$CRUMB_RESPONSE" ] && [ "$CRUMB_RESPONSE" != "null" ]; then
    # Response format is "Jenkins-Crumb:value" or "Jenkins-Crumb=value"
    if echo "$CRUMB_RESPONSE" | grep -q ":"; then
        CRUMB_FIELD=$(echo "$CRUMB_RESPONSE" | cut -d: -f1)
        CRUMB_VALUE=$(echo "$CRUMB_RESPONSE" | cut -d: -f2-)
    elif echo "$CRUMB_RESPONSE" | grep -q "="; then
        CRUMB_FIELD=$(echo "$CRUMB_RESPONSE" | cut -d= -f1)
        CRUMB_VALUE=$(echo "$CRUMB_RESPONSE" | cut -d= -f2-)
    else
        CRUMB_FIELD="Jenkins-Crumb"
        CRUMB_VALUE="$CRUMB_RESPONSE"
    fi
    echo "✅ CSRF token obtained: $CRUMB_FIELD=$CRUMB_VALUE"
else
    echo "⚠️  Could not get CSRF token, trying without it..."
    CRUMB_FIELD=""
    CRUMB_VALUE=""
fi

# Install GitHub plugin if not installed
echo "📦 Checking GitHub plugin..."
PLUGINS=$(curl -s -k -u "$JENKINS_USER:$JENKINS_PASSWORD" "$JENKINS_URL/pluginManager/api/json?depth=1" | grep -o '"shortName":"github"' || echo "")

if [ -z "$PLUGINS" ]; then
    echo "📦 Installing GitHub plugin..."
    if [ -n "$CRUMB_FIELD" ] && [ -n "$CRUMB_VALUE" ]; then
        curl -s -k -X POST -u "$JENKINS_USER:$JENKINS_PASSWORD" \
            -H "$CRUMB_FIELD: $CRUMB_VALUE" \
            "$JENKINS_URL/pluginManager/installNecessaryPlugins" \
            -d '<install plugin="github@latest" />' \
            -H 'Content-Type: text/xml'
    else
        curl -s -k -X POST -u "$JENKINS_USER:$JENKINS_PASSWORD" \
            "$JENKINS_URL/pluginManager/installNecessaryPlugins" \
            -d '<install plugin="github@latest" />' \
            -H 'Content-Type: text/xml'
    fi
    
    echo "⏳ Waiting for plugin installation..."
    sleep 10
    
    # Restart Jenkins
    echo "🔄 Restarting Jenkins..."
    if [ -n "$CRUMB_FIELD" ] && [ -n "$CRUMB_VALUE" ]; then
        curl -s -k -X POST -u "$JENKINS_USER:$JENKINS_PASSWORD" \
            -H "$CRUMB_FIELD: $CRUMB_VALUE" \
            "$JENKINS_URL/safeRestart"
    else
        curl -s -k -X POST -u "$JENKINS_USER:$JENKINS_PASSWORD" \
            "$JENKINS_URL/safeRestart"
    fi
    
    echo "⏳ Waiting for Jenkins to restart (this may take 1-2 minutes)..."
    for i in {1..60}; do
        if curl -s -k -f -u "$JENKINS_USER:$JENKINS_PASSWORD" "$JENKINS_URL/api/json" > /dev/null 2>&1; then
            echo "✅ Jenkins restarted"
            # Re-get CSRF token after restart
            CRUMB=$(curl -s -k -u "$JENKINS_USER:$JENKINS_PASSWORD" \
                "$JENKINS_URL/crumbIssuer/api/xml?xpath=concat(//crumbRequestField,\":\",//crumb)")
            if [ -n "$CRUMB" ]; then
                CRUMB_FIELD=$(echo "$CRUMB" | cut -d: -f1)
                CRUMB_VALUE=$(echo "$CRUMB" | cut -d: -f2)
            fi
            break
        fi
        sleep 2
    done
else
    echo "✅ GitHub plugin already installed"
fi

# Function to create Jenkins job
create_job() {
    local JOB_NAME=$1
    local JENKINSFILE_PATH=$2
    
    echo "📝 Creating job: $JOB_NAME..."
    
    # Check if job already exists
    if curl -s -k -f -u "$JENKINS_USER:$JENKINS_PASSWORD" "$JENKINS_URL/job/$JOB_NAME/config.xml" > /dev/null 2>&1; then
        echo "⚠️  Job $JOB_NAME already exists. Updating..."
        UPDATE_MODE=true
    else
        UPDATE_MODE=false
    fi
    
    # Create job XML configuration
    cat > /tmp/jenkins-job-${JOB_NAME}.xml << EOF
<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job">
  <description>Pipeline for ${JOB_NAME}</description>
  <keepDependencies>false</keepDependencies>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps">
    <scm class="hudson.plugins.git.GitSCM" plugin="git">
      <configVersion>2</configVersion>
      <userRemoteConfigs>
        <hudson.plugins.git.UserRemoteConfig>
          <url>${GITHUB_REPO_URL}</url>
          <credentialsId>github-ssh-key</credentialsId>
        </hudson.plugins.git.UserRemoteConfig>
      </userRemoteConfigs>
      <branches>
        <hudson.plugins.git.BranchSpec>
          <name>*/main</name>
        </hudson.plugins.git.BranchSpec>
      </branches>
      <doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
      <submoduleCfg class="list"/>
      <extensions/>
    </scm>
    <scriptPath>${JENKINSFILE_PATH}</scriptPath>
    <lightweight>false</lightweight>
  </definition>
  <triggers>
    <com.cloudbees.jenkins.GitHubPushTrigger plugin="github">
      <spec></spec>
      <githubHooks>true</githubHooks>
    </com.cloudbees.jenkins.GitHubPushTrigger>
  </triggers>
  <disabled>false</disabled>
</flow-definition>
EOF

    # Create or update job with CSRF token
    if [ "$UPDATE_MODE" = true ]; then
        # Update existing job
        if [ -n "$CRUMB_FIELD" ] && [ -n "$CRUMB_VALUE" ]; then
            HTTP_CODE=$(curl -s -k -w "%{http_code}" -o /tmp/jenkins-response-${JOB_NAME}.txt \
                -X POST -u "$JENKINS_USER:$JENKINS_PASSWORD" \
                -H "$CRUMB_FIELD: $CRUMB_VALUE" \
                --data-binary @/tmp/jenkins-job-${JOB_NAME}.xml \
                -H "Content-Type: text/xml" \
                "$JENKINS_URL/job/$JOB_NAME/config.xml")
        else
            HTTP_CODE=$(curl -s -k -w "%{http_code}" -o /tmp/jenkins-response-${JOB_NAME}.txt \
                -X POST -u "$JENKINS_USER:$JENKINS_PASSWORD" \
                --data-binary @/tmp/jenkins-job-${JOB_NAME}.xml \
                -H "Content-Type: text/xml" \
                "$JENKINS_URL/job/$JOB_NAME/config.xml")
        fi
    else
        # Create new job
        if [ -n "$CRUMB_FIELD" ] && [ -n "$CRUMB_VALUE" ]; then
            HTTP_CODE=$(curl -s -k -w "%{http_code}" -o /tmp/jenkins-response-${JOB_NAME}.txt \
                -X POST -u "$JENKINS_USER:$JENKINS_PASSWORD" \
                -H "$CRUMB_FIELD: $CRUMB_VALUE" \
                --data-binary @/tmp/jenkins-job-${JOB_NAME}.xml \
                -H "Content-Type: text/xml" \
                "$JENKINS_URL/createItem?name=$JOB_NAME")
        else
            HTTP_CODE=$(curl -s -k -w "%{http_code}" -o /tmp/jenkins-response-${JOB_NAME}.txt \
                -X POST -u "$JENKINS_USER:$JENKINS_PASSWORD" \
                --data-binary @/tmp/jenkins-job-${JOB_NAME}.xml \
                -H "Content-Type: text/xml" \
                "$JENKINS_URL/createItem?name=$JOB_NAME")
        fi
    fi
    
    # Check response
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "302" ]; then
        echo "✅ Job $JOB_NAME created/updated successfully (HTTP $HTTP_CODE)"
        # Verify job exists
        sleep 1
        if curl -s -k -f -u "$JENKINS_USER:$JENKINS_PASSWORD" "$JENKINS_URL/job/$JOB_NAME/api/json" > /dev/null 2>&1; then
            echo "   ✅ Verified: Job exists in Jenkins"
        else
            echo "   ⚠️  Warning: Job may not be visible yet"
        fi
    else
        echo "❌ Failed to create/update job $JOB_NAME (HTTP $HTTP_CODE)"
        echo "   Response: $(cat /tmp/jenkins-response-${JOB_NAME}.txt 2>/dev/null | head -20)"
        rm -f /tmp/jenkins-job-${JOB_NAME}.xml /tmp/jenkins-response-${JOB_NAME}.txt
        return 1
    fi
    
    rm -f /tmp/jenkins-job-${JOB_NAME}.xml /tmp/jenkins-response-${JOB_NAME}.txt
}

# Create jobs
create_job "cptsd-cms" "cptsd-cms/Jenkinsfile"
create_job "cptsd-blog-public" "cptsd-blog-public/Jenkinsfile"

echo ""
echo "✅ Jenkins jobs created!"
echo ""
echo "📋 Next steps:"
echo "   1. Configure GitHub SSH key in Jenkins:"
echo "      - Go to: $JENKINS_URL/credentials/store/system/domain/_/newCredentials"
echo "      - Kind: SSH Username with private key"
echo "      - ID: github-ssh-key"
echo "      - Username: git"
echo "      - Private Key: Enter your GitHub SSH private key"
echo ""
echo "   2. Setup GitHub webhook (see scripts/setup-github-webhook.sh)"
echo ""
echo "🧪 Test: Go to $JENKINS_URL and trigger a build manually"

