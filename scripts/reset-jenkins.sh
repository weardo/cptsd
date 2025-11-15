#!/bin/bash
# Reset Jenkins to default state (removes all configuration)
# WARNING: This will delete all jobs, users, and configuration!

set -e

echo "⚠️  WARNING: This will reset Jenkins and delete ALL configuration!"
echo "   - All jobs will be deleted"
echo "   - All users will be deleted"
echo "   - All plugins will remain installed"
echo ""
read -p "Are you sure you want to reset Jenkins? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo "🔄 Resetting Jenkins..."

# Stop Jenkins
ssh root@37.27.39.20 "docker stop jenkins"

# Backup current config (just in case)
ssh root@37.27.39.20 "docker exec jenkins tar -czf /var/jenkins_home/backup-$(date +%Y%m%d-%H%M%S).tar.gz /var/jenkins_home/users /var/jenkins_home/jobs /var/jenkins_home/config.xml 2>/dev/null || true"

# Remove users and jobs directories
ssh root@37.27.39.20 "docker exec jenkins rm -rf /var/jenkins_home/users /var/jenkins_home/jobs"

# Reset config.xml to disable security (will prompt for setup on first login)
ssh root@37.27.39.20 "docker exec jenkins bash -c 'cat > /var/jenkins_home/config.xml << \"EOF\"
<?xml version=\"1.1\" encoding=\"UTF-8\"?>
<hudson>
  <disabledAdministrativeMonitors/>
  <version>2.0</version>
  <installStateName>RUNNING</installStateName>
  <numExecutors>2</numExecutors>
  <mode>NORMAL</mode>
  <useSecurity>false</useSecurity>
  <authorizationStrategy class=\"hudson.security.AuthorizationStrategy\$Unsecured\"/>
  <securityRealm class=\"hudson.security.SecurityRealm\$None\"/>
</hudson>
EOF'"

# Start Jenkins
ssh root@37.27.39.20 "docker start jenkins"

echo "⏳ Waiting for Jenkins to start..."
sleep 30

echo ""
echo "✅ Jenkins reset complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Go to: https://jenkins.cptsd.in"
echo "   2. You'll be prompted to create an admin user"
echo "   3. After setup, run: ./scripts/setup-jenkins-jobs.sh"
echo ""
echo "Or if you want to keep it unsecured (not recommended for production):"
echo "   - Jenkins will be accessible without login"
echo "   - Run: ./scripts/setup-jenkins-jobs.sh"

