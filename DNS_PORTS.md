# DNS and Port Configuration

## Required Ports for DNS Forwarding

For the subdomains to work properly, ensure these ports are open and forwarded:

### HTTP/HTTPS (Required)

- **Port 80** (HTTP) - Required for initial SSL certificate generation
- **Port 443** (HTTPS) - Required for secure connections

### Application Ports (Internal - Behind Reverse Proxy)

These are NOT exposed publicly, only accessible via Caddy reverse proxy:

- **Port 3000** - CMS Application (cms.cptsd.in)
- **Port 3001** - Blog Application (blog.cptsd.in)
- **Port 8080** - Jenkins (jenkins.cptsd.in) - Only accessible via reverse proxy

### Other Services (Internal Only)

- **Port 27017** - MongoDB (localhost only)
- **Port 9000** - MinIO API (internal)
- **Port 9001** - MinIO Console (internal, can be exposed if needed)

## DNS Configuration in GoDaddy

Add these A records in your GoDaddy DNS settings:

1. **CMS Application**

   - Type: A
   - Name: `cms`
   - Value: `37.27.39.20` (your server IP)
   - TTL: 600 (or default)

2. **Blog Application**

   - Type: A
   - Name: `blog`
   - Value: `37.27.39.20`
   - TTL: 600

3. **Jenkins CI/CD**
   - Type: A
   - Name: `jenkins`
   - Value: `37.27.39.20`
   - TTL: 600

## Firewall Configuration

On your server, ensure these ports are open:

```bash
# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Optional: Allow SSH (if not already configured)
ufw allow 22/tcp
```

## Verification

After DNS propagation (5-30 minutes), verify:

```bash
# Check DNS resolution
dig cms.cptsd.in
dig blog.cptsd.in
dig jenkins.cptsd.in

# Check if ports are accessible
curl -I http://cms.cptsd.in
curl -I http://blog.cptsd.in
curl -I http://jenkins.cptsd.in
```

## Summary

**Public Ports (Forward these):**

- ✅ Port 80 (HTTP)
- ✅ Port 443 (HTTPS)

**Internal Ports (Do NOT forward publicly):**

- Port 3000 (CMS - accessed via cms.cptsd.in)
- Port 3001 (Blog - accessed via blog.cptsd.in)
- Port 8080 (Jenkins - accessed via jenkins.cptsd.in)

All applications are accessed through the reverse proxy (Caddy) which handles SSL automatically.
