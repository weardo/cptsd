# ✅ Jenkins Setup Complete

## What's Been Done

### ✅ Jenkins Jobs Created
- **cptsd-cms** - Pipeline job for CMS application
- **cptsd-blog-public** - Pipeline job for Blog application

Both jobs are configured to:
- Pull from `git@github.com:weardo/cptsd.git`
- Use branch `main`
- Trigger on GitHub push events
- Deploy to respective directories

### ⚠️ Remaining Steps

#### 1. GitHub SSH Credentials (Manual Setup Recommended)

The automated credential setup had CSRF token issues. Please set this up manually:

1. Go to: https://jenkins.cptsd.in/credentials/store/system/domain/_/newCredentials
2. Select: **SSH Username with private key**
3. Configure:
   - **ID**: `github-ssh-key`
   - **Description**: `GitHub SSH Key`
   - **Username**: `git`
   - **Private Key**: Select "Enter directly" and paste your GitHub SSH private key
4. Click **OK**

Or use the script (may need manual fix):
```bash
./scripts/setup-jenkins-credentials.sh
```

#### 2. GitHub Webhook Setup

**Option A: Via Script (Requires GitHub Token)**
```bash
./scripts/setup-github-webhook.sh YOUR_GITHUB_TOKEN
```

To get a GitHub token:
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: "Jenkins Webhook"
4. Scopes: Check `repo` (Full control of private repositories)
5. Generate and copy token

**Option B: Manual Setup**
1. Go to: https://github.com/weardo/cptsd/settings/hooks
2. Click "Add webhook"
3. Configure:
   - **Payload URL**: `https://jenkins.cptsd.in/github-webhook/`
   - **Content type**: `application/json`
   - **Events**: Select "Just the push event"
   - **Active**: ✅ Checked
4. Click "Add webhook"

## Testing

### Test Manual Build
1. Go to: https://jenkins.cptsd.in
2. Click on `cptsd-cms` or `cptsd-blog-public`
3. Click "Build Now"
4. Watch the build progress

### Test Automatic Build (After Webhook Setup)
```bash
git commit --allow-empty -m "Test automatic deployment"
git push
```

The build should start automatically in Jenkins.

## Current Status

- ✅ Jenkins running at https://jenkins.cptsd.in
- ✅ Jenkins jobs created
- ⚠️ GitHub SSH credentials need manual setup
- ⚠️ GitHub webhook needs setup (script or manual)

## Ports Summary

**Forward these in DNS/Firewall:**
- Port 80 (HTTP)
- Port 443 (HTTPS)

**DNS Records (GoDaddy):**
- `cms` → 37.27.39.20
- `blog` → 37.27.39.20
- `jenkins` → 37.27.39.20

## Quick Commands

```bash
# Check Jenkins status
ssh root@37.27.39.20 "docker ps | grep jenkins"

# View Jenkins logs
ssh root@37.27.39.20 "docker logs jenkins"

# Restart Jenkins
ssh root@37.27.39.20 "docker restart jenkins"

# Test Jenkins API
curl -k -u astra:Fie@9eqmfp@cptsd https://jenkins.cptsd.in/api/json
```

## Next Steps

1. ✅ Set up GitHub SSH credentials in Jenkins (manual)
2. ✅ Set up GitHub webhook (script or manual)
3. ✅ Test deployment with a push
4. ✅ Verify applications are accessible at their domains

