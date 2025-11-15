#!/bin/bash
# Check Jenkins build status
# Usage: ./scripts/check-jenkins-builds.sh

JENKINS_URL="https://jenkins.cptsd.in"
JENKINS_USER="astra"
JENKINS_PASSWORD="Fie@9eqmfp@cptsd"

echo "📊 Checking Jenkins build status..."
echo ""

for JOB in "cptsd-cms" "cptsd-blog-public"; do
    echo "🔍 Job: $JOB"
    
    # Get last build info
    BUILD_INFO=$(curl -s -k -u "$JENKINS_USER:$JENKINS_PASSWORD" \
        "$JENKINS_URL/job/$JOB/lastBuild/api/json?tree=number,result,building,timestamp,duration" 2>/dev/null)
    
    if [ -n "$BUILD_INFO" ] && echo "$BUILD_INFO" | grep -q "number"; then
        BUILD_NUM=$(echo "$BUILD_INFO" | grep -o '"number":[0-9]*' | cut -d: -f2)
        RESULT=$(echo "$BUILD_INFO" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
        BUILDING=$(echo "$BUILD_INFO" | grep -o '"building":true' || echo "")
        
        if [ -n "$BUILDING" ]; then
            echo "   Build #$BUILD_NUM: 🔄 Building..."
        else
            if [ "$RESULT" = "SUCCESS" ]; then
                echo "   Build #$BUILD_NUM: ✅ $RESULT"
            elif [ "$RESULT" = "FAILURE" ]; then
                echo "   Build #$BUILD_NUM: ❌ $RESULT"
            else
                echo "   Build #$BUILD_NUM: ⚠️  $RESULT"
            fi
        fi
        echo "   URL: $JENKINS_URL/job/$JOB/$BUILD_NUM"
    else
        echo "   ⚠️  No builds found"
    fi
    echo ""
done

echo "🌐 View all jobs: $JENKINS_URL"

