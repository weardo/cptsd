# Quick Start: CX23 ($4/month) Deployment

Perfect setup for small-medium CMS! Self-hosted MongoDB + MinIO, no extra volumes needed.

## Server Details

- **CX23**: 2 vCPU, 4GB RAM, 40GB storage, 20TB traffic
- **Cost**: ~$4/month
- **Storage**: 40GB is enough - no separate volumes needed initially!

## Quick Deploy

```bash
# 1. SSH to server
ssh root@your-server-ip

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
apt install docker-compose -y

# 3. Clone and setup
cd /opt
git clone <repo> cptsd-cms
cd cptsd-cms

# 4. Create .env
cat > .env << EOF
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=your-password
MONGODB_URI=mongodb://admin:your-password@mongodb:27017/cptsd-cms?authSource=admin
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=your-minio-password
S3_BUCKET_NAME=cptsd-cms
OPENAI_API_KEY=sk-your-key
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-admin-password
NEXTAUTH_URL=http://your-domain.com
NEXTAUTH_SECRET=$(openssl rand -base64 32)
EOF

nano .env  # Edit with your values

# 5. Deploy
chmod +x scripts/deploy-hetzner.sh
./scripts/deploy-hetzner.sh
```

## Setup SSL (Caddy)

```bash
apt install -y debian-keyring debian-repository-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install caddy

echo "your-domain.com {
    reverse_proxy localhost:3000
}" | sudo tee /etc/caddy/Caddyfile

systemctl restart caddy
```

## Storage: Do I Need Volumes?

**No!** 40GB is enough for:

- MongoDB: ~5-15GB
- MinIO: ~10-25GB
- System: ~10GB

Add volumes later if you exceed 30GB data (~€0.05/GB/month).

## Resource Usage (Optimized)

- App: 2GB RAM
- MongoDB: 512MB RAM
- MinIO: 256MB RAM
- System: ~500MB
- **Total: ~4GB** ✅

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Check resources
docker stats

# Backup MongoDB
docker-compose exec mongodb mongodump --archive --gzip > backup.gz

# Update app
./scripts/update-hetzner.sh

# Stop
docker-compose down
```

## Full Documentation

See [docs/CX23_SETUP.md](docs/CX23_SETUP.md) for:

- Detailed setup instructions
- Backup strategies
- Monitoring and optimization
- Troubleshooting
- Upgrade path

