# Deployment Guide for CPTSD Applications

This guide covers deploying all CPTSD applications.

## Applications to Deploy

1. **cptsd-cms** - CMS application (https://cms.cptsd.in)
2. **cptsd-blog-public** - Blog application (https://blog.cptsd.in)
3. **cptsd-main** - Main website (needs deployment setup)

## Deployment Methods

### Option 1: Using Jenkins (Recommended)

If Jenkins is set up and accessible:

```bash
# Trigger CMS deployment
./scripts/trigger-build.sh cptsd-cms

# Trigger Blog deployment
./scripts/trigger-build.sh cptsd-blog-public
```

View builds at: https://jenkins.cptsd.in

### Option 2: Manual Deployment via SSH

SSH to your server and run:

```bash
# On the server
cd /home/astra/cptsd
./scripts/deploy-all.sh
```

Or deploy individually:

```bash
# Deploy CMS
cd /opt/cptsd-cms
sudo docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Deploy Blog
cd /opt/cptsd-blog-public
sudo docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Option 3: Deploy from Local Machine

If you have SSH access to the server:

```bash
# From local machine
cd /home/astra/cptsd

# Copy files and deploy CMS
scp -r cptsd-cms/* root@37.27.39.20:/opt/cptsd-cms/
ssh root@37.27.39.20 "cd /opt/cptsd-cms && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build"

# Copy files and deploy Blog
scp -r cptsd-blog-public/* root@37.27.39.20:/opt/cptsd-blog-public/
ssh root@37.27.39.20 "cd /opt/cptsd-blog-public && docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build"
```

## Environment Variables

Ensure `.env` files exist on the server:

### CMS (`/opt/cptsd-cms/.env`)

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

### Blog (`/opt/cptsd-blog-public/.env`)

```env
MONGODB_URI=mongodb://admin:password@mongodb:27017/cptsd-cms?authSource=admin
NEXT_PUBLIC_SITE_URL=https://blog.cptsd.in
NEXT_PUBLIC_MAIN_URL=https://cptsd.in
```

## Check Deployment Status

```bash
# Check CMS status
sudo docker-compose -f /opt/cptsd-cms/docker-compose.yml -f /opt/cptsd-cms/docker-compose.prod.yml ps

# Check Blog status
sudo docker-compose -f /opt/cptsd-blog-public/docker-compose.yml -f /opt/cptsd-blog-public/docker-compose.prod.yml ps

# View logs
sudo docker-compose -f /opt/cptsd-cms/docker-compose.yml -f /opt/cptsd-cms/docker-compose.prod.yml logs -f
sudo docker-compose -f /opt/cptsd-blog-public/docker-compose.yml -f /opt/cptsd-blog-public/docker-compose.prod.yml logs -f
```

## Notes

- The blog shares MongoDB with CMS (uses external network)
- CMS runs on port 3000 (proxied by Caddy)
- Blog runs on port 3001 (proxied by Caddy)
- cptsd-main doesn't have Docker setup yet - needs to be configured
