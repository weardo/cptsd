# Quick Deployment Guide for CX23 Server

## Server Info

- **IP**: 37.27.39.20
- **User**: root
- **Current Password**: PmCUpNnNfrJAbfHX7iXK
- **IPv6**: 2a01:4f9:c013:2c35::/64

## Step 1: Setup SSH (Required First)

The server requires a password change. Do this manually:

```bash
# 1. SSH to server (it will prompt for password change)
ssh root@37.27.39.20
# Password: PmCUpNnNfrJAbfHX7iXK
# When prompted, change the password (enter new password twice)

# 2. Generate SSH key if you don't have one
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N "" -C "cptsd-cms"

# 3. Copy your SSH key to the server
ssh-copy-id root@37.27.39.20

# Or manually:
cat ~/.ssh/id_rsa.pub | ssh root@37.27.39.20 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
```

## Step 2: Deploy Application

After SSH is working (no password needed), run:

```bash
cd /home/astra/n8n/cptsd-cms
./scripts/deploy-simple.sh
```

This will:

- ✅ Install Docker and Docker Compose
- ✅ Copy project files
- ✅ Create .env with generated passwords
- ✅ Deploy all services (Next.js, MongoDB, MinIO)
- ✅ Configure firewall

## Step 3: Configure Application

After deployment, edit the .env file:

```bash
ssh root@37.27.39.20
cd /opt/cptsd-cms
nano .env
```

**Update these values:**

- `OPENAI_API_KEY` - Your OpenAI API key
- `ADMIN_EMAIL` - Your admin email
- `NEXTAUTH_URL` - Your domain (or keep IP for now)

Then restart:

```bash
cd /opt/cptsd-cms
docker-compose restart app
```

## Step 4: Access Services

- **Application**: http://37.27.39.20:3000
- **MinIO Console**: http://37.27.39.20:9001
  - User: `minioadmin`
  - Password: Check `.env` file (S3_SECRET_ACCESS_KEY)

## Step 5: Setup SSL (Optional but Recommended)

Install Caddy for automatic SSL:

```bash
ssh root@37.27.39.20

# Install Caddy
apt install -y debian-keyring debian-repository-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install caddy

# Create Caddyfile
echo "your-domain.com {
    reverse_proxy localhost:3000
}" | tee /etc/caddy/Caddyfile

# Start Caddy
systemctl restart caddy
systemctl enable caddy
```

Then update NEXTAUTH_URL in .env to your domain.

## Useful Commands

```bash
# SSH to server
ssh root@37.27.39.20

# View logs
cd /opt/cptsd-cms && docker-compose logs -f

# View specific service logs
cd /opt/cptsd-cms && docker-compose logs -f app
cd /opt/cptsd-cms && docker-compose logs -f mongodb
cd /opt/cptsd-cms && docker-compose logs -f minio

# Restart services
cd /opt/cptsd-cms && docker-compose restart

# Stop services
cd /opt/cptsd-cms && docker-compose down

# View status
cd /opt/cptsd-cms && docker-compose ps

# View resource usage
docker stats

# Check disk usage
df -h
du -sh /var/lib/docker/volumes/*
```

## Troubleshooting

### Can't SSH?

- Make sure you changed the password interactively first
- Check firewall: `ufw status`

### Services won't start?

- Check logs: `docker-compose logs`
- Check .env file is configured correctly
- Verify MongoDB health: `docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"`

### Port 3000 not accessible?

- Check firewall: `ufw allow 3000/tcp`
- Verify service is running: `docker-compose ps`

## Next Steps After Deployment

1. ✅ Setup domain DNS (point to 37.27.39.20)
2. ✅ Install Caddy for SSL (see Step 5)
3. ✅ Update NEXTAUTH_URL in .env
4. ✅ Restart app: `docker-compose restart app`
5. ✅ Configure MinIO bucket via console
6. ✅ Setup automated backups (see docs/CX23_SETUP.md)

## Support

- Full documentation: `docs/CX23_SETUP.md`
- Deployment scripts: `scripts/`
- Docker compose: `docker-compose.yml`

