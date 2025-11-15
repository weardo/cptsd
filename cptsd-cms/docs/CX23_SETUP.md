# CX23 ($4/month) Deployment Guide

Perfect for small to medium CMS deployments! This guide is optimized for Hetzner's CX23 server.

## Server Specs (CX23)

- **CPU**: 2 vCPU
- **RAM**: 4 GB
- **Storage**: 40 GB SSD (included)
- **Traffic**: 20 TB/month
- **Cost**: ~$4/month (~€4/month)

## Do You Need Separate Volumes?

**Short answer: No, not initially!**

The 40GB included storage is sufficient for:

- **MongoDB**: ~5-15GB (depending on content)
- **MinIO**: ~10-25GB (depending on uploaded files)
- **OS & Docker**: ~10GB

**When to add volumes:**

- If your data grows beyond 30GB
- If you want data persistence independent of server (backups)
- Hetzner Cloud Volumes cost ~€0.05/GB/month (~$0.05/GB/month)

For a CMS starting out, 40GB should last months or years depending on usage.

## Quick Setup

### 1. Create CX23 Server

1. Go to [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Create new server:
   - Image: **Ubuntu 22.04** or **24.04**
   - Type: **CX23** ($4.15/month)
   - Location: Closest to your users
   - SSH Keys: Add your SSH key
   - Firewall: Allow ports 22, 80, 443
3. Note your server IP

### 2. Initial Server Setup

```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Optional: Create non-root user
adduser deploy
usermod -aG docker deploy
su - deploy
```

### 3. Deploy Application

```bash
# Clone or upload project
cd /opt
git clone <your-repo> cptsd-cms
cd cptsd-cms

# Create environment file
cat > .env << EOF
# MongoDB Configuration (self-hosted)
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=your-strong-password-here

# MongoDB Connection (auto-configured)
MONGODB_URI=mongodb://admin:your-strong-password-here@mongodb:27017/cptsd-cms?authSource=admin

# MinIO Configuration
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=your-minio-password-here
S3_BUCKET_NAME=cptsd-cms

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Authentication
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-admin-password-min-8-chars

# NextAuth
NEXTAUTH_URL=http://your-domain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
EOF

# Edit .env with your actual values
nano .env

# Deploy
chmod +x scripts/deploy-hetzner.sh
./scripts/deploy-hetzner.sh
```

### 4. Setup Reverse Proxy (Caddy - Easiest)

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

Add:

```
your-domain.com {
    reverse_proxy localhost:3000
}
```

```bash
# Start Caddy
sudo systemctl restart caddy
sudo systemctl enable caddy
```

### 5. Configure DNS & Update NEXTAUTH_URL

1. Point your domain A record to server IP
2. Wait for DNS propagation (check: `dig your-domain.com`)
3. Update `.env`:
   ```bash
   nano .env
   # Change: NEXTAUTH_URL=https://your-domain.com
   ```
4. Restart app:
   ```bash
   docker-compose restart app
   ```

## Resource Usage (CX23 Optimized)

The docker-compose.yml is optimized for your 4GB RAM:

- **Next.js App**: 2GB limit (1GB reservation)
- **MongoDB**: 512MB limit (256MB reservation)
- **MinIO**: 256MB limit (128MB reservation)
- **System**: ~500MB
- **Buffer**: ~700MB free

Total: ~4GB (perfect fit!)

## Storage Management

### Check Current Usage

```bash
# Check disk usage
df -h

# Check Docker volumes
docker system df

# Check MongoDB size
docker-compose exec mongodb mongosh --eval "db.stats(1024*1024)" cptsd-cms

# Check MinIO usage (in MinIO console)
# Visit: http://your-server-ip:9001
```

### When You Need More Storage

**Option 1: Clean up old data**

```bash
# Clean Docker system
docker system prune -a

# Clean old MongoDB data (if applicable)
# Use your app's delete functionality
```

**Option 2: Add Hetzner Cloud Volume**

1. Create volume in Hetzner Console (e.g., 50GB = ~€2.50/month)
2. Attach to server
3. Mount and update docker-compose.prod.yml
4. See `scripts/setup-hetzner-volumes.sh` for details

**Option 3: Move MinIO to Hetzner Object Storage**

- Cheaper for large files (~€0.02/GB/month)
- See main deployment guide for instructions

## Monitoring

### Check Resource Usage

```bash
# Real-time stats
docker stats

# System resources
htop  # Install: apt install htop

# Disk usage
df -h
du -sh /var/lib/docker/volumes/*
```

### Set Up Alerts

You can set up Hetzner Cloud monitoring alerts:

1. Go to Hetzner Console → Monitoring
2. Set alerts for:
   - CPU > 80%
   - RAM > 90%
   - Disk > 85%

## Backup Strategy

### Automated MongoDB Backup

```bash
# Create backup script
cat > /opt/cptsd-cms/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR
cd /opt/cptsd-cms
docker-compose exec -T mongodb mongodump \
  --archive --gzip \
  --uri="mongodb://admin:your-password@localhost:27017/cptsd-cms?authSource=admin" \
  > $BACKUP_DIR/mongodb-$(date +%Y%m%d-%H%M%S).archive.gz

# Keep only last 7 days
find $BACKUP_DIR -name "mongodb-*.archive.gz" -mtime +7 -delete

# Optional: Upload to Hetzner Object Storage or external backup
EOF

chmod +x /opt/cptsd-cms/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/cptsd-cms/backup.sh") | crontab -
```

### Backup MinIO Data

```bash
# Backup MinIO volume
docker run --rm \
  -v cptsd-cms_minio_data:/data \
  -v $(pwd)/backups:/backup \
  ubuntu tar czf /backup/minio-$(date +%Y%m%d).tar.gz /data
```

## Cost Breakdown (CX23)

- **Server (CX23)**: ~$4.15/month (~€4/month)
- **MongoDB**: Free (self-hosted)
- **MinIO**: Free (self-hosted)
- **Storage**: Free (40GB included)
- **Domain**: ~$1-2/month (optional)
- **SSL**: Free (Caddy automatic)

**Total: ~$4-6/month** (depending on domain)

## Performance Tips

1. **Enable swap** (if needed):

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

2. **Optimize MongoDB** (for larger datasets):

   - Add indexes for frequently queried fields
   - Regular maintenance with `db.repairDatabase()`

3. **Use CDN** (Cloudflare free tier):

   - Free CDN
   - DDoS protection
   - Reduced server load

4. **Monitor and optimize**:
   - Check slow queries in MongoDB
   - Optimize image sizes before upload
   - Use MinIO lifecycle policies for old files

## Troubleshooting

### Out of Memory

```bash
# Check what's using memory
docker stats

# Reduce resource limits in docker-compose.yml if needed
# Then: docker-compose down && docker-compose up -d
```

### Out of Disk Space

```bash
# Clean Docker
docker system prune -a -f

# Check large files
du -sh /var/lib/docker/volumes/* | sort -h

# Consider moving to Hetzner Object Storage or adding volume
```

### Slow Performance

```bash
# Check CPU usage
htop

# Check disk I/O
iostat -x 1

# Consider upgrading to CX31 if consistently high
```

## Upgrade Path

If you outgrow CX23:

- **CX31** (~$8/month): 4 vCPU, 8GB RAM, 80GB storage
- **CPX21** (~$10/month): 3 vCPU, 8GB RAM, 80GB storage (AMD)

The same docker-compose.yml will work - just increase resource limits!

## Security Checklist

- [ ] Changed all default passwords
- [ ] MongoDB only accessible on localhost (already configured)
- [ ] MinIO console password changed (via .env)
- [ ] Firewall configured (UFW recommended)
- [ ] SSH key-only access (disable password auth)
- [ ] Regular system updates (`apt update && apt upgrade`)
- [ ] SSL certificate active (Caddy automatic)
- [ ] Regular backups scheduled

## Support

For issues, check:

- Application logs: `docker-compose logs -f`
- System logs: `journalctl -xe`
- Hetzner Console metrics
- This guide's troubleshooting section

