# Deployment Setup Summary

## ✅ Setup Status

- **Caddy**: ✅ Running (reverse proxy with SSL)
- **Jenkins**: ✅ Starting (wait ~1-2 minutes for initialization)
- **Domains Configured**: cms.cptsd.in, blog.cptsd.in, jenkins.cptsd.in

## 🔌 Ports to Forward in DNS/Firewall

### Required Public Ports
**Forward these ports publicly:**

- **Port 80** (HTTP) - Required for SSL certificate generation
- **Port 443** (HTTPS) - Required for secure connections

### Internal Ports (Behind Reverse Proxy)
**Do NOT forward these publicly** - They're only accessible via Caddy:

- Port 3000 → CMS (cms.cptsd.in)
- Port 3001 → Blog (blog.cptsd.in)  
- Port 8080 → Jenkins (jenkins.cptsd.in)

## 📋 DNS Configuration in GoDaddy

Add these A records:

1. **cms** → `37.27.39.20`
2. **blog** → `37.27.39.20`
3. **jenkins** → `37.27.39.20`

Wait 5-30 minutes for DNS propagation.

## 🔐 Jenkins Initial Setup

1. **Access Jenkins**: https://jenkins.cptsd.in

2. **Get Initial Admin Password**:
   ```bash
   ssh root@37.27.39.20 "docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword"
   ```

3. **Install Recommended Plugins** when prompted

4. **Create Admin User** (or skip to use admin password)

## 🚀 Configure Jenkins Jobs

### 1. Install Required Plugins

Go to: **Manage Jenkins → Manage Plugins → Available**

Install these plugins:
- ✅ **GitHub plugin** (for webhook support)
- ✅ **Pipeline** (already installed)
- ✅ **Docker Pipeline** (optional, for Docker builds)

Click "Install without restart" then restart Jenkins.

### 2. Create CMS Pipeline Job

1. Click **"New Item"**
2. Name: `cptsd-cms`
3. Select **"Pipeline"** → Click **OK**
4. Configure:
   - **Pipeline Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `git@github.com:weardo/cptsd.git`
   - **Credentials**: 
     - Click "Add" → "Jenkins"
     - Kind: SSH Username with private key
     - Username: `git`
     - Private Key: Enter your GitHub SSH private key
     - ID: `github-ssh-key`
   - **Branch Specifier**: `*/main`
   - **Script Path**: `cptsd-cms/Jenkinsfile`
5. **Build Triggers**: Check ✅ **"GitHub hook trigger for GITScm polling"**
6. Click **Save**

### 3. Create Blog Pipeline Job

1. Click **"New Item"**
2. Name: `cptsd-blog-public`
3. Select **"Pipeline"** → Click **OK**
4. Configure:
   - **Pipeline Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `git@github.com:weardo/cptsd.git`
   - **Credentials**: Select `github-ssh-key` (created above)
   - **Branch Specifier**: `*/main`
   - **Script Path**: `cptsd-blog-public/Jenkinsfile`
5. **Build Triggers**: Check ✅ **"GitHub hook trigger for GITScm polling"**
6. Click **Save**

## 🔗 Setup GitHub Webhook for Automatic Builds

1. **Go to GitHub**: https://github.com/weardo/cptsd/settings/hooks

2. **Click "Add webhook"**

3. **Configure Webhook**:
   - **Payload URL**: `https://jenkins.cptsd.in/github-webhook/`
   - **Content type**: `application/json`
   - **Secret**: (leave empty or generate one)
   - **Events**: Select **"Just the push event"**
   - **Active**: ✅ Checked

4. **Click "Add webhook"**

5. **Test**: Push a commit to trigger automatic build

## 🧪 Test Deployment

### Manual Build Test

1. Go to Jenkins: https://jenkins.cptsd.in
2. Click on `cptsd-cms` job
3. Click **"Build Now"**
4. Watch the build progress
5. Check console output for any errors

### Automatic Build Test

1. Make a small change in the repository
2. Commit and push:
   ```bash
   git commit --allow-empty -m "Test automatic deployment"
   git push
   ```
3. Check Jenkins - build should start automatically

## 📊 Verify Services

```bash
# Check all services
ssh root@37.27.39.20 "docker ps"

# Check Caddy status
ssh root@37.27.39.20 "systemctl status caddy"

# Check Jenkins logs
ssh root@37.27.39.20 "docker logs jenkins"

# Test domains (after DNS propagation)
curl -I https://cms.cptsd.in
curl -I https://blog.cptsd.in
curl -I https://jenkins.cptsd.in
```

## 🔧 Environment Files

Ensure these exist on the server:

### `/opt/cptsd-cms/.env`
```env
MONGODB_URI=mongodb://admin:password@mongodb:27017/cptsd-cms?authSource=admin
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=cptsd-cms
OPENAI_API_KEY=sk-...
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-password
NEXTAUTH_URL=https://cms.cptsd.in
NEXTAUTH_SECRET=...
```

### `/opt/cptsd-blog-public/.env`
```env
MONGODB_URI=mongodb://admin:password@mongodb:27017/cptsd-cms?authSource=admin
```

## 🎯 Quick Reference

- **Jenkins**: https://jenkins.cptsd.in
- **CMS**: https://cms.cptsd.in
- **Blog**: https://blog.cptsd.in
- **GitHub**: https://github.com/weardo/cptsd
- **Server IP**: 37.27.39.20

## 🆘 Troubleshooting

### Jenkins webhook not triggering
- Verify webhook URL is correct
- Check Jenkins logs: `docker logs jenkins`
- Ensure GitHub plugin is installed
- Verify "GitHub hook trigger" is checked in job config

### Build fails
- Check Jenkins console output
- Verify environment files exist
- Check Docker network: `docker network ls | grep cptsd`
- Ensure CMS is deployed first (creates shared network)

### Services not accessible
- Check DNS propagation: `dig cms.cptsd.in`
- Verify Caddy is running: `systemctl status caddy`
- Check firewall: `ufw status`

