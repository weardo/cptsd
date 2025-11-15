# Jenkins CI/CD Setup Guide

This guide will help you set up Jenkins for automated deployment of both CPTSD applications.

## Overview

- **Jenkins**: Hosted at `jenkins.cptsd.in`
- **CMS Application**: Deployed to `cms.cptsd.in`
- **Blog Application**: Deployed to `blog.cptsd.in`

## Prerequisites

- Server with Docker and Docker Compose installed
- Root access to the server
- DNS access (GoDaddy) to configure subdomains
- GitHub repository created

## Step 1: Setup Domains

Run the domain setup script to configure all subdomains:

```bash
./scripts/setup-domains.sh
```

This will:

- Install Caddy (if not already installed)
- Configure reverse proxy for all three subdomains
- Set up SSL certificates automatically

## Step 2: Configure DNS

In GoDaddy DNS settings, add A records:

1. **CMS**: `cms` → Your server IP
2. **Blog**: `blog` → Your server IP
3. **Jenkins**: `jenkins` → Your server IP

Wait 5-30 minutes for DNS propagation.

## Step 3: Setup Jenkins

Run the Jenkins setup script:

```bash
./scripts/setup-jenkins.sh
```

This will:

- Install Docker and Docker Compose (if needed)
- Start Jenkins container
- Configure Caddy for Jenkins subdomain
- Display initial admin password

## Step 4: Access Jenkins

1. Navigate to `https://jenkins.cptsd.in`
2. Get initial admin password:
   ```bash
   docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
   ```
3. Install recommended plugins
4. Create admin user

## Step 5: Configure Jenkins Jobs

### For CMS Application

1. Click "New Item"
2. Enter name: `cptsd-cms`
3. Select "Pipeline" and click OK
4. Configure:
   - **Pipeline Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/yourusername/cptsd.git`
   - **Credentials**: Add if repository is private
   - **Branch Specifier**: `*/main` (or `*/master`)
   - **Script Path**: `cptsd-cms/Jenkinsfile`
5. Click Save

### For Blog Application

1. Click "New Item"
2. Enter name: `cptsd-blog-public`
3. Select "Pipeline" and click OK
4. Configure:
   - **Pipeline Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/yourusername/cptsd.git`
   - **Credentials**: Add if repository is private
   - **Branch Specifier**: `*/main` (or `*/master`)
   - **Script Path**: `cptsd-blog-public/Jenkinsfile`
5. Click Save

## Step 6: Setup GitHub Webhook (Optional)

To trigger automatic builds on push:

1. Go to your GitHub repository
2. Settings → Webhooks → Add webhook
3. Configure:
   - **Payload URL**: `https://jenkins.cptsd.in/github-webhook/`
   - **Content type**: `application/json`
   - **Events**: Select "Just the push event"
4. Click "Add webhook"

## Step 7: Push to GitHub

If you haven't already:

```bash
git remote add origin https://github.com/yourusername/cptsd.git
git push -u origin main
```

## Step 8: Test Deployment

1. In Jenkins, click on a job (e.g., `cptsd-cms`)
2. Click "Build Now"
3. Watch the build progress
4. Check the console output for any errors

## Environment Setup

### CMS Application (`/opt/cptsd-cms/.env`)

Ensure this file exists with:

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

### Blog Application (`/opt/cptsd-blog-public/.env`)

Ensure this file exists with:

```env
MONGODB_URI=mongodb://admin:password@mongodb:27017/cptsd-cms?authSource=admin
```

**Note**: Blog uses the same MongoDB as CMS (shared network).

## Troubleshooting

### Jenkins can't access Docker

```bash
# Test Docker access from Jenkins
docker exec jenkins docker ps

# If it fails, check permissions
docker exec jenkins ls -la /var/run/docker.sock
```

### Build fails with "network not found"

Ensure the CMS application is deployed first (it creates the shared network):

```bash
cd /opt/cptsd-cms
docker-compose up -d
```

### Services not accessible

1. Check Caddy status: `systemctl status caddy`
2. Check Caddy logs: `tail -f /var/log/caddy/*.log`
3. Verify DNS: `dig jenkins.cptsd.in`

### Jenkins job fails during deployment

Check logs:

```bash
# Jenkins logs
docker logs jenkins

# Application logs
cd /opt/cptsd-cms && docker-compose logs
cd /opt/cptsd-blog-public && docker-compose logs
```

## Manual Deployment

If you need to deploy manually:

### CMS

```bash
cd /opt/cptsd-cms
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Blog

```bash
cd /opt/cptsd-blog-public
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Useful Commands

```bash
# Check Jenkins status
docker ps | grep jenkins

# View Jenkins logs
docker logs -f jenkins

# Restart Jenkins
docker restart jenkins

# Check all services
docker ps

# View Caddy configuration
cat /etc/caddy/Caddyfile

# Test Caddy configuration
caddy validate --config /etc/caddy/Caddyfile
```

## Security Notes

- Jenkins is only accessible via HTTPS through Caddy
- Jenkins container runs on localhost:8080 (not exposed publicly)
- Docker socket is mounted for Jenkins to build images
- All applications use reverse proxy with SSL

## Next Steps

1. Set up monitoring (optional)
2. Configure backup strategies
3. Set up email notifications for build failures
4. Configure build schedules (if needed)
