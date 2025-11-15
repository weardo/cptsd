# Fix SSH Access - Firewall Blocked

## Problem

SSH access was lost after enabling the firewall because port 22 wasn't explicitly allowed.

## Solution: Use Hetzner Console

### Step 1: Access Hetzner Console

1. Go to https://console.hetzner.cloud/
2. Log in to your account
3. Click on your project
4. Click on your server (IP: 37.27.39.20)
5. Click the **"Console"** tab (or look for "VNC Console" / "Web Terminal")
6. This gives you direct access to the server without SSH

### Step 2: Fix Firewall Rules

Once in the console, run these commands:

```bash
# Allow SSH first
ufw allow 22/tcp

# Verify SSH is allowed
ufw status | grep 22

# If SSH is not in the list, add it explicitly
ufw allow from any to any port 22 proto tcp

# Check firewall status
ufw status numbered

# If needed, you can temporarily disable firewall to test
# ufw disable  # (then re-enable after fixing)
```

### Step 3: Verify SSH Works

From your local machine:

```bash
ssh root@37.27.39.20
```

## Alternative: If Console Doesn't Work

If you can't access the Hetzner console, you can:

1. **Reboot the server** (via Hetzner dashboard)

   - This might reset the firewall if it's not persistent
   - But this is risky and not recommended

2. **Reinstall/reset the server** (last resort)
   - This will delete all data
   - Only do this if you have backups

## Prevention: Update Firewall Script

The firewall should always allow SSH before enabling. Here's the correct order:

```bash
# 1. Allow SSH FIRST (before enabling)
ufw allow 22/tcp

# 2. Allow other services
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 9000/tcp
ufw allow 9001/tcp

# 3. Enable firewall LAST
ufw --force enable
```

## Quick Fix Command (Run in Hetzner Console)

```bash
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw status
```

This will:

- Allow SSH (port 22)
- Keep HTTP/HTTPS open (ports 80/443)
- Show current firewall status

## Verify Everything Works

After fixing, test from your local machine:

```bash
# Test SSH
ssh root@37.27.39.20

# Test application
curl -I http://37.27.39.20:3000

# Test Caddy (once DNS is configured)
curl -I https://cms.cptsd.in
```

## Notes

- **Caddy doesn't interfere with SSH** - it only uses ports 80/443
- **The firewall (UFW) blocked SSH** because port 22 wasn't explicitly allowed
- **Always allow SSH before enabling firewall** in production
- **Hetzner Console** is your backup access method when SSH is blocked
