# cptsd-main Deployment Guide

## Overview

cptsd-main is the main website application for CPTSD.in. It uses:

- Shared `@cptsd/db` package for database models
- Shared `@cptsd/pets` package for pet animations

## Deployment Configuration

### Files Created

1. **Dockerfile** - Multi-stage build that includes both `packages/db` and `packages/pets`
2. **docker-compose.yml** - Development/production compose file
3. **docker-compose.prod.yml** - Production overrides
4. **Jenkinsfile** - CI/CD pipeline configuration

### Key Features

- **Port**: 3002 (production uses Caddy reverse proxy)
- **Network**: Connects to `cptsd-cms_app-network` to share MongoDB
- **Packages**: Includes both `@cptsd/db` and `@cptsd/pets` via symlinks and explicit copying
- **Standalone Build**: Uses Next.js standalone output for optimized Docker image

## Environment Variables

Create `/opt/cptsd-main/.env`:

```env
MONGODB_URI=mongodb://admin:password@mongodb:27017/cptsd-cms?authSource=admin
NEXT_PUBLIC_BLOG_URL=https://blog.cptsd.in
```

## Deployment

### Via Jenkins

The Jenkins job `cptsd-main` will:

1. Checkout code
2. Build Docker image (including packages)
3. Deploy to `/opt/cptsd-main`
4. Run health checks

### Manual Deployment

```bash
cd /opt/cptsd-main
sudo docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Package Inclusion

The Dockerfile ensures both packages are available:

1. **Build stage**: Copies `packages/db` and `packages/pets` and creates symlinks
2. **Runtime stage**: Explicitly copies packages to ensure they're available in standalone output

This ensures the shared packages work correctly in the Docker container.
