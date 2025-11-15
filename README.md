# CPTSD Applications

This repository contains two Next.js applications:
- **cptsd-cms**: Content Management System (hosted at `cms.cptsd.in`)
- **cptsd-blog-public**: Public blog application (hosted at `blog.cptsd.in`)

## Repository Structure

```
cptsd/
├── cptsd-cms/          # CMS application
│   ├── app/            # Next.js app directory
│   ├── components/     # React components
│   ├── lib/            # Utility libraries
│   ├── models/         # MongoDB models
│   ├── Dockerfile      # Docker image definition
│   ├── docker-compose.yml
│   └── Jenkinsfile     # CI/CD pipeline
│
├── cptsd-blog-public/  # Blog public application
│   ├── lib/            # Utility libraries
│   ├── models/         # MongoDB models
│   ├── Dockerfile      # Docker image definition
│   ├── docker-compose.yml
│   └── Jenkinsfile     # CI/CD pipeline
│
├── docker-compose.jenkins.yml  # Jenkins CI/CD server
├── scripts/            # Deployment and setup scripts
└── .gitignore
```

## Prerequisites

- Docker and Docker Compose
- Caddy (for reverse proxy with SSL)
- Access to server with root privileges
- Domain DNS access (GoDaddy)

## Quick Setup

### 1. Initial Server Setup

```bash
# On your server
./scripts/setup-domains.sh
./scripts/setup-jenkins.sh
```

### 2. Configure DNS

In GoDaddy DNS settings, add A records:
- `cms` → Your server IP
- `blog` → Your server IP
- `jenkins` → Your server IP

### 3. Initialize Git Repository

```bash
./scripts/init-git.sh
```

### 4. Push to GitHub

```bash
git remote add origin https://github.com/yourusername/cptsd.git
git branch -M main
git push -u origin main
```

## Jenkins CI/CD Setup

### Access Jenkins

1. Navigate to `https://jenkins.cptsd.in`
2. Get initial admin password:
   ```bash
   docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
   ```
3. Install recommended plugins

### Create Jenkins Jobs

#### For CMS Application

1. Create new Pipeline job: `cptsd-cms`
2. Configure:
   - Pipeline definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: Your GitHub repository URL
   - Script Path: `cptsd-cms/Jenkinsfile`
   - Branch: `*/main` (or `*/master`)

#### For Blog Application

1. Create new Pipeline job: `cptsd-blog-public`
2. Configure:
   - Pipeline definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: Your GitHub repository URL
   - Script Path: `cptsd-blog-public/Jenkinsfile`
   - Branch: `*/main` (or `*/master`)

### GitHub Webhook (Optional)

1. In GitHub repository settings → Webhooks
2. Add webhook:
   - Payload URL: `https://jenkins.cptsd.in/github-webhook/`
   - Content type: `application/json`
   - Events: `Just the push event`
3. This will trigger automatic builds on push

## Manual Deployment

### CMS Application

```bash
cd /opt/cptsd-cms
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Blog Application

```bash
cd /opt/cptsd-blog-public
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Environment Variables

Each application requires a `.env` file in its deployment directory:

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
```

## Domains

- **CMS**: https://cms.cptsd.in
- **Blog**: https://blog.cptsd.in
- **Jenkins**: https://jenkins.cptsd.in

## Useful Commands

### Check Service Status

```bash
# CMS
cd /opt/cptsd-cms && docker-compose ps

# Blog
cd /opt/cptsd-blog-public && docker-compose ps

# Jenkins
docker ps | grep jenkins
```

### View Logs

```bash
# CMS
cd /opt/cptsd-cms && docker-compose logs -f

# Blog
cd /opt/cptsd-blog-public && docker-compose logs -f

# Jenkins
docker logs -f jenkins
```

### Restart Services

```bash
# CMS
cd /opt/cptsd-cms && docker-compose restart

# Blog
cd /opt/cptsd-blog-public && docker-compose restart
```

## Troubleshooting

### Jenkins can't access Docker

Ensure Jenkins container has Docker socket mounted:
```bash
docker exec jenkins docker ps
```

### Services not accessible

1. Check Caddy status: `systemctl status caddy`
2. Check Caddy logs: `tail -f /var/log/caddy/*.log`
3. Verify DNS: `dig cms.cptsd.in`

### Build failures

Check Jenkins console output and application logs:
```bash
docker logs jenkins
cd /opt/cptsd-cms && docker-compose logs
```

## License

Private project

