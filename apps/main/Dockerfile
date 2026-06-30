# Multi-stage build for optimized production image
FROM node:20-alpine AS base
# Enable pnpm (workspace install replaces the old npm copy-hack symlink)
RUN corepack enable

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace manifests from apps/main (+ root + the @cptsd/* libs it uses)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/main/package.json ./apps/main/
COPY libs/db/package.json ./libs/db/
COPY libs/pets/package.json ./libs/pets/
# pnpm symlinks @cptsd/{db,pets} into node_modules from the workspace (no copy-hack)
RUN pnpm install --frozen-lockfile --filter ./apps/main...

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
# Bring in the installed workspace (node_modules + manifests)
COPY --from=deps /app/ ./
# Copy app source
COPY apps/main/ ./apps/main/
# Copy shared libs (raw TS source, consumed via transpilePackages)
COPY libs/db ./libs/db
COPY libs/pets ./libs/pets
# Root base tsconfig that apps/main/tsconfig.json extends (../../tsconfig.base.json)
COPY tsconfig.base.json ./

# Accept build arguments for environment variables
ARG MONGODB_URI

# Set environment variables for build (Next.js may need these during build)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV MONGODB_URI=${MONGODB_URI:-mongodb://admin:changeme@mongodb:27017/cptsd-cms?authSource=admin}

# Build Next.js application (output: 'standalone')
RUN pnpm --filter ./apps/main run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from standalone build (monorepo layout: app lives at apps/main).
# Next standalone bundles the transpiled @cptsd/* source + node_modules, so no
# runtime symlink/copy-hack is needed.
COPY --from=builder --chown=nextjs:nodejs /app/apps/main/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/main/.next/static ./apps/main/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/main/public ./apps/main/public

USER nextjs

EXPOSE 3002

ENV PORT 3002
ENV HOSTNAME "0.0.0.0"

# Next.js standalone creates server.js under the app path in the monorepo output
CMD ["node", "apps/main/server.js"]
