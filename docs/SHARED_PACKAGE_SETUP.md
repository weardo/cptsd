# Shared Database Package Setup

## Overview

The `@cptsd/db` package is a shared database package used by all three apps (`cptsd-cms`, `cptsd-blog-public`, `cptsd-main`). This document explains how it's set up for both development and deployment.

## Architecture

```
cptsd/
├── packages/
│   └── db/              # Shared database package
│       └── src/
│           ├── index.ts
│           ├── mongodb.ts
│           └── models/
├── cptsd-cms/           # Uses @cptsd/db
├── cptsd-blog-public/   # Uses @cptsd/db
└── cptsd-main/          # Uses @cptsd/db
```

## Development Setup

### How It Works

1. **Postinstall Script**: Each app has a `postinstall` script in `package.json` that creates a symlink:

   ```json
   "postinstall": "mkdir -p node_modules/@cptsd && ln -sf ../../../packages/db node_modules/@cptsd/db || cp -r ../../packages/db node_modules/@cptsd/db"
   ```

2. **Symlink Creation**: After `npm install`, the script creates:

   - `node_modules/@cptsd/db` → symlink to `../../../packages/db`

3. **Import Resolution**: Next.js (both Turbopack and Webpack) resolves `@cptsd/db` from `node_modules/@cptsd/db`, which points to the shared package.

### Setup Steps

1. Install dependencies in each app:

   ```bash
   cd cptsd-cms && npm install
   cd ../cptsd-blog-public && npm install
   cd ../cptsd-main && npm install
   ```

2. The postinstall script automatically creates the symlink.

3. Start dev servers - imports should work!

## Deployment Setup

### Docker Build Context

The Dockerfiles are configured to build from the **repo root** to include the shared package:

**docker-compose.yml changes:**

```yaml
build:
  context: ../ # Build from repo root
  dockerfile: cptsd-cms/Dockerfile
```

**Dockerfile changes:**

- Build context is repo root
- Copies app files: `COPY cptsd-cms/ .`
- Copies shared package: `COPY packages/db ./packages/db`
- Creates symlink: `RUN mkdir -p node_modules/@cptsd && ln -sf ../../packages/db node_modules/@cptsd/db`

### Jenkins Deployment

The Jenkinsfiles should work as-is, but ensure:

1. Build context includes the repo root
2. The shared package is copied during Docker build
3. The symlink is created in the Docker image

## Troubleshooting

### Import Errors in Dev

If you see `Module not found: Can't resolve '@cptsd/db'`:

1. **Run postinstall manually:**

   ```bash
   cd cptsd-cms
   npm run postinstall
   ```

2. **Verify symlink exists:**

   ```bash
   ls -la node_modules/@cptsd/db
   ```

3. **Restart dev server** after creating symlink

### Docker Build Issues

If Docker build fails:

1. **Check build context**: Ensure `docker-compose.yml` has `context: ../`
2. **Verify paths**: Dockerfile should copy from `cptsd-cms/` and `packages/db`
3. **Check Jenkinsfile**: Ensure it builds from the correct directory

## Benefits

✅ **Single Source of Truth**: All models defined once in `packages/db`  
✅ **Type Safety**: Shared TypeScript types across all apps  
✅ **Easy Updates**: Update models once, all apps benefit  
✅ **Works in Dev & Prod**: Same setup for both environments  
✅ **No Breaking Changes**: Existing deployment process still works

## Next Steps

- [ ] Test imports in all three apps
- [ ] Verify Docker builds work
- [ ] Test Jenkins deployment
- [ ] Remove old model files from individual apps (optional cleanup)
