# Hetzner Deployment Guide

This guide will help you deploy the CPTSD CMS application on Hetzner Cloud in a cost-effective way.

## Prerequisites

- Hetzner Cloud account
- Domain name (optional but recommended)
- SSH access to your Hetzner server

## Cost-Effective Setup

### Recommended Hetzner Cloud Server

For a small to medium application, we recommend:

- **CPX11** (2 vCPU, 4GB RAM) - ~€5/month - Suitable for development/small production
- **CPX21** (3 vCPU, 8GB RAM) - ~€10/month - Recommended for production
- **CPX31** (4 vCPU, 16GB RAM) - ~€20/month - For higher traffic

### Storage Options

1. **Local Storage** (Free, included with server)

   - Fast but limited to server size
   - Data lost if server is deleted

2. **Hetzner Cloud Volumes** (~€0.05/GB/month)

   - Persistent storage independent of server
   - Can be attached/detached
   - Recommended for production data

3. **Hetzner Object Storage** (S3-compatible, ~€0.02/GB/month)
   - Alternative to MinIO for file storage
   - Lower cost for large amounts of data
   - See "Using Hetzner Object Storage" section below

## Step 1: Create Hetzner Cloud Server

1. Log in to [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Create a new project (if needed)
3. Click "Add Server"
4. Choose:
   - **Location**: Choose closest to your users
   - **Image**: Ubuntu 22.04 or 24.04
   - **Type**: CPX21 (or higher based on needs)
   - **SSH Keys**: Add your SSH key
   - **Firewall**: Create firewall rule allowing:
     - Port 22 (SSH)
     - Port 80 (HTTP)
     - Port 443 (HTTPS)
     - Port 3000 (optional, for testing)
5. Click "Create & Buy Now"

## Step 2: Initial Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker (if not using deployment script)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Create non-root user (optional but recommended)
adduser deploy
usermod -aG docker deploy
su - deploy
```

## Step 3: Deploy Application

```bash
# Clone your repository or upload files
git clone <your-repo-url> /opt/cptsd-cms
cd /opt/cptsd-cms

# Copy environment file
cp .env.production.example .env

# Edit environment variables
nano .env
```

### Required Environment Variables

```env
# Database (self-hosted MongoDB)
MONGODB_URI=mongodb://mongodb:27017/cptsd-cms
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=your-strong-password

# S3/MinIO
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=your-strong-password
S3_BUCKET_NAME=cptsd-cms

# OpenAI
OPENAI_API_KEY=sk-your-key

# Authentication
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-strong-password

# NextAuth (update after DNS setup)
NEXTAUTH_URL=http://your-domain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

```bash
# Make deployment script executable
chmod +x scripts/deploy-hetzner.sh

# Run deployment
./scripts/deploy-hetzner.sh
```

## Step 4: Setup Persistent Storage (Optional but Recommended)

If you want to use Hetzner Cloud Volumes for persistent storage:

1. **Create Volumes in Hetzner Console**:

   - Go to Volumes section
   - Create volume (e.g., 20GB for MongoDB, 50GB for MinIO)
   - Attach to your server

2. **Mount Volumes**:

```bash
chmod +x scripts/setup-hetzner-volumes.sh
./scripts/setup-hetzner-volumes.sh

# Follow the instructions to mount volumes
# Find your volume ID: ls -la /dev/disk/by-id/
# Mount: sudo mount -t ext4 /dev/disk/by-id/scsi-0HC_Volume_[ID] /mnt/hetzner-volumes/mongodb
```

3. **Update docker-compose.prod.yml**:
   - Uncomment the volumes sections for mongodb and minio

## Step 5: Setup Reverse Proxy with SSL

### Option A: Using Caddy (Recommended - Automatic SSL)

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-repository-keyring
sudo apt install -y apt-transport-https
sudo curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
sudo curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Create Caddyfile
sudo nano /etc/caddy/Caddyfile
```

Caddyfile content:

```
your-domain.com {
    reverse_proxy localhost:3000

    # Optional: Add security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
    }
}
```

```bash
# Restart Caddy
sudo systemctl restart caddy
sudo systemctl enable caddy
```

### Option B: Using Nginx

```bash
# Install Nginx and Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/cptsd-cms
```

Nginx config:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/cptsd-cms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Step 6: Update NEXTAUTH_URL

After DNS is configured and SSL is working:

```bash
# Update .env
nano .env
# Change: NEXTAUTH_URL=https://your-domain.com

# Restart app
docker-compose restart app
```

## Step 7: Initial Setup

1. Access your application: `https://your-domain.com`
2. Login with your admin credentials
3. Configure MinIO bucket in MinIO console (http://your-server-ip:9001)
4. Create your first topics and posts

## Using Hetzner Object Storage (Alternative to MinIO)

For even lower costs, you can use Hetzner's S3-compatible Object Storage:

1. **Create Object Storage** in Hetzner Console
2. **Create Access Key** and Secret Key
3. **Update .env**:

```env
S3_ENDPOINT=https://your-location.your-objectstorage.com
S3_REGION=nbg1  # or your location
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name
```

4. **Remove MinIO service** from docker-compose.yml:
   - Comment out or remove the minio service
   - Remove `minio` from app's `depends_on`

## Monitoring and Maintenance

### View Logs

```bash
docker-compose logs -f app
docker-compose logs -f mongodb
docker-compose logs -f minio
```

### Update Application

```bash
./scripts/update-hetzner.sh
```

### Backup Database

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR
docker-compose exec -T mongodb mongodump --archive --gzip > $BACKUP_DIR/mongodb-$(date +%Y%m%d-%H%M%S).archive.gz
# Keep only last 7 days
find $BACKUP_DIR -name "mongodb-*.archive.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/cptsd-cms/backup.sh") | crontab -
```

### Resource Monitoring

```bash
# Install htop
sudo apt install htop

# Monitor resources
htop
docker stats
```

## Cost Optimization Tips

1. **Use Hetzner Object Storage** instead of MinIO for file storage if you have many files
2. **Enable MongoDB Atlas Free Tier** instead of self-hosting if data is small (<512MB)
3. **Use Cloudflare** for free CDN and DDoS protection
4. **Monitor resource usage** and downgrade server size if possible
5. **Enable Hetzner Cloud Backups** (€0.01/GB/month) for automated snapshots

## Troubleshooting

### Application won't start

```bash
docker-compose logs app
docker-compose ps
```

### MongoDB connection issues

```bash
# Check MongoDB logs
docker-compose logs mongodb

# Test connection
docker-compose exec mongodb mongosh -u admin -p
```

### MinIO bucket issues

```bash
# Access MinIO console: http://your-server-ip:9001
# Default credentials from .env
```

### Out of memory

- Upgrade server or add swap:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Security Recommendations

1. **Change all default passwords**
2. **Restrict SSH access** (disable password auth, use keys only)
3. **Setup firewall** (UFW):

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

4. **Keep system updated**:

```bash
sudo apt update && sudo apt upgrade -y
```

5. **Regular backups** (see backup script above)

6. **Monitor logs** for suspicious activity

## Support

For issues, check:

- Application logs: `docker-compose logs`
- System logs: `journalctl -xe`
- Hetzner Cloud Console for server metrics

