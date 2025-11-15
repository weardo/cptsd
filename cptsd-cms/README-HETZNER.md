# Quick Start: Hetzner Deployment

## Prerequisites

- Hetzner Cloud account
- Domain name (optional)
- SSH access to server

## Quick Deployment Steps

### 1. Create Hetzner Server

- Ubuntu 22.04 or 24.04
- CPX21 (3 vCPU, 8GB) recommended (~€10/month)
- Add SSH key during creation

### 2. SSH and Deploy

```bash
ssh root@your-server-ip
apt update && apt upgrade -y

# Clone or upload project
git clone <repo> /opt/cptsd-cms
cd /opt/cptsd-cms

# Copy and edit environment
cp .env.production.example .env
nano .env  # Fill in your values

# Deploy
chmod +x scripts/deploy-hetzner.sh
./scripts/deploy-hetzner.sh
```

### 3. Setup Reverse Proxy (Caddy - Easiest)

```bash
sudo apt install caddy

# Create /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile
```

Add:

```
your-domain.com {
    reverse_proxy localhost:3000
}
```

```bash
sudo systemctl restart caddy
sudo systemctl enable caddy
```

### 4. Update DNS

- Point your domain A record to server IP
- Wait for DNS propagation
- Update `NEXTAUTH_URL=https://your-domain.com` in `.env`
- Restart: `docker-compose restart app`

## Cost Breakdown (Example: CPX21)

- **Server (CPX21)**: ~€10/month
- **MongoDB**: Free (self-hosted) OR MongoDB Atlas Free Tier
- **Storage**:
  - Local (included) OR
  - Hetzner Volume (~€1/month for 20GB) OR
  - Hetzner Object Storage (~€0.40/month for 20GB)
- **Domain**: ~€1-2/month
- **SSL**: Free (Caddy automatic)

**Total: ~€11-13/month** for small to medium production use

## Configuration Options

### Option 1: Self-Hosted Everything (Most Control)

```bash
# Use default docker-compose.yml
docker-compose up -d
```

### Option 2: MongoDB Atlas (Easier Management)

```bash
# Use Atlas override
docker-compose -f docker-compose.yml -f docker-compose.atlas.yml up -d
# Update MONGODB_URI in .env with Atlas connection string
```

### Option 3: Hetzner Object Storage (Cheaper for Files)

1. Create Object Storage in Hetzner Console
2. Get access keys
3. Update `.env` with Object Storage credentials
4. Comment out MinIO service in docker-compose.yml

## Common Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update application
./scripts/update-hetzner.sh

# Stop services
docker-compose down

# View resource usage
docker stats
```

## Full Documentation

See [docs/HETZNER_DEPLOYMENT.md](docs/HETZNER_DEPLOYMENT.md) for detailed instructions including:

- Volume setup
- Backup procedures
- Security hardening
- Troubleshooting
- Monitoring

## Quick Reference URLs

- Application: `http://your-server-ip:3000` (or your domain)
- MinIO Console: `http://your-server-ip:9001`
- MinIO API: `http://your-server-ip:9000`

**Note**: After setting up reverse proxy, remove port 3000 from firewall for security.

