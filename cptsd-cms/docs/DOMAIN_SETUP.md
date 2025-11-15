# Domain Setup Guide - cms.cptsd.in

This guide will help you configure your GoDaddy domain to point to your Hetzner server and set up SSL.

## Step 1: Configure DNS in GoDaddy

1. **Log in to GoDaddy**

   - Go to https://dcc.godaddy.com/
   - Navigate to "My Products" → "Domains"
   - Find `cptsd.in` and click "DNS" or "Manage DNS"

2. **Add A Record**

   - Click "Add" or "+" to add a new record
   - **Type**: A
   - **Name**: `cms` (or `@` if you want the root domain)
   - **Value**: `37.27.39.20` (your Hetzner server IP)
   - **TTL**: 600 (or default)
   - Click "Save"

3. **Optional: Add IPv6 Record**

   - **Type**: AAAA
   - **Name**: `cms`
   - **Value**: `2a01:4f9:c013:2c35::/64` (your IPv6 address - remove /64, use just the IP)
   - Click "Save"

4. **Wait for DNS Propagation**
   - DNS changes can take 5 minutes to 48 hours
   - Check propagation: `dig cms.cptsd.in` or use https://dnschecker.org/
   - Usually works within 10-30 minutes

## Step 2: Install Caddy (Reverse Proxy with Auto SSL)

Caddy automatically gets SSL certificates from Let's Encrypt.

```bash
ssh root@37.27.39.20

# Install Caddy
apt install -y debian-keyring debian-repository-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy

# Create Caddyfile
cat > /etc/caddy/Caddyfile << 'EOF'
cms.cptsd.in {
    reverse_proxy localhost:3000

    # Security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Optional: Logging
    log {
        output file /var/log/caddy/cms.cptsd.in.log
    }
}
EOF

# Create log directory
mkdir -p /var/log/caddy
chown caddy:caddy /var/log/caddy

# Test configuration
caddy validate --config /etc/caddy/Caddyfile

# Start and enable Caddy
systemctl restart caddy
systemctl enable caddy

# Check status
systemctl status caddy
```

## Step 3: Update Application Configuration

```bash
ssh root@37.27.39.20
cd /opt/cptsd-cms

# Edit .env file
nano .env

# Update NEXTAUTH_URL:
# Change from: NEXTAUTH_URL=http://37.27.39.20:3000
# To: NEXTAUTH_URL=https://cms.cptsd.in

# Save and exit (Ctrl+X, then Y, then Enter)

# Restart the app
docker-compose restart app
```

## Step 4: Verify Everything Works

1. **Check DNS** (from your local machine):

   ```bash
   dig cms.cptsd.in
   # Should show: 37.27.39.20
   ```

2. **Check Caddy**:

   ```bash
   ssh root@37.27.39.20
   systemctl status caddy
   tail -f /var/log/caddy/cms.cptsd.in.log
   ```

3. **Test the domain**:

   - Visit: https://cms.cptsd.in
   - Should automatically redirect to HTTPS
   - SSL certificate should be valid

4. **Test login**:
   - Go to: https://cms.cptsd.in/login
   - Login with your credentials

## Step 5: Update Firewall (Optional)

If you want to close port 3000 to the public (only accessible via Caddy):

```bash
ssh root@37.27.39.20

# Allow only localhost access to port 3000
ufw delete allow 3000/tcp
ufw allow from 127.0.0.1 to any port 3000

# Verify
ufw status
```

## Troubleshooting

### DNS Not Working

- Wait longer (up to 48 hours)
- Check GoDaddy DNS settings are saved
- Verify A record points to `37.27.39.20`
- Use `dig cms.cptsd.in` to check

### SSL Certificate Issues

- Check Caddy logs: `journalctl -u caddy -f`
- Verify DNS is pointing correctly
- Make sure port 80 and 443 are open: `ufw allow 80/tcp && ufw allow 443/tcp`
- Caddy needs port 80 for Let's Encrypt validation

### Can't Access Site

- Check Caddy is running: `systemctl status caddy`
- Check app is running: `docker-compose ps`
- Check firewall: `ufw status`
- Check Caddy logs: `tail -f /var/log/caddy/cms.cptsd.in.log`

### Login Redirects to Wrong URL

- Make sure `NEXTAUTH_URL` in `.env` is `https://cms.cptsd.in`
- Restart app: `docker-compose restart app`
- Clear browser cache/cookies

## Alternative: Using Nginx

If you prefer Nginx over Caddy:

```bash
# Install Nginx and Certbot
apt install nginx certbot python3-certbot-nginx -y

# Create Nginx config
cat > /etc/nginx/sites-available/cms.cptsd.in << 'EOF'
server {
    listen 80;
    server_name cms.cptsd.in;

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
EOF

# Enable site
ln -s /etc/nginx/sites-available/cms.cptsd.in /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Get SSL certificate
certbot --nginx -d cms.cptsd.in

# Auto-renewal is set up automatically
```

## Summary

After completing these steps:

- ✅ Domain `cms.cptsd.in` points to your server
- ✅ SSL certificate automatically configured (HTTPS)
- ✅ Application accessible at https://cms.cptsd.in
- ✅ Login works with your credentials

Your application is now live with a custom domain and SSL!
