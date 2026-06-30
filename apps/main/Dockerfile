# Multi-stage build for optimized production image
FROM node:20-alpine AS base
# Enable pnpm (used for the workspace install that replaces the copy-hack)
RUN corepack enable

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files from apps/main plus the workspace libs it depends on,
# then let pnpm wire the @cptsd/* workspace symlinks (replaces the postinstall copy-hack)
COPY apps/main/package.json ./package.json
COPY libs/db/package.json ./libs/db/package.json
COPY libs/pets/package.json ./libs/pets/package.json
# Minimal in-image pnpm workspace so @cptsd/* resolve as symlinks into ./libs/*
RUN printf 'packages:\n  - "libs/*"\n' > pnpm-workspace.yaml
RUN pnpm install --no-frozen-lockfile --loglevel=warn

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
# Copy app source
COPY apps/main/ .
# Copy shared libs (db and pets) — @cptsd/* are pnpm workspace symlinks into these
COPY libs/db ./libs/db
COPY libs/pets ./libs/pets

# Accept build arguments for environment variables
ARG MONGODB_URI

# Set environment variables for build (Next.js may need these during build)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV MONGODB_URI=${MONGODB_URI:-mongodb://admin:changeme@mongodb:27017/cptsd-cms?authSource=admin}

# Build Next.js application
RUN pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from standalone build
# Next.js standalone output structure:
# - .next/standalone/ contains server.js and all dependencies
# - .next/standalone/public/ contains public assets (if public directory exists in source)
# - .next/static/ contains static assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Ensure libs are available at runtime
# Next.js standalone includes dependencies, but we ensure libs are accessible
# Copy libs directory and recreate symlinks for @cptsd packages
COPY --from=builder --chown=nextjs:nodejs /app/libs ./libs
RUN mkdir -p node_modules/@cptsd && \
    ln -sf ../../libs/db node_modules/@cptsd/db && \
    ln -sf ../../libs/pets node_modules/@cptsd/pets

USER nextjs

EXPOSE 3002

ENV PORT 3002
ENV HOSTNAME "0.0.0.0"

# Next.js standalone creates server.js in the standalone directory
CMD ["node", "server.js"]
