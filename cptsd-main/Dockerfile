# Multi-stage build for optimized production image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files from cptsd-main
COPY cptsd-main/package.json cptsd-main/package-lock.json* ./
# Suppress deprecation warnings (they're harmless but noisy)
RUN npm ci --loglevel=warn

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy app source
COPY cptsd-main/ .
# Copy shared packages (db and pets)
COPY packages/db ./packages/db
COPY packages/pets ./packages/pets
# Create symlinks in node_modules for @cptsd packages
RUN mkdir -p node_modules/@cptsd && \
    ln -sf ../../packages/db node_modules/@cptsd/db && \
    ln -sf ../../packages/pets node_modules/@cptsd/pets

# Accept build arguments for environment variables
ARG MONGODB_URI

# Set environment variables for build (Next.js may need these during build)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV MONGODB_URI=${MONGODB_URI:-mongodb://admin:changeme@mongodb:27017/cptsd-cms?authSource=admin}

# Build Next.js application
RUN npm run build

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
# Ensure packages are available at runtime
# Next.js standalone includes dependencies, but we ensure packages are accessible
# Copy packages directory and recreate symlinks for @cptsd packages
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages
RUN mkdir -p node_modules/@cptsd && \
    ln -sf ../../packages/db node_modules/@cptsd/db && \
    ln -sf ../../packages/pets node_modules/@cptsd/pets

USER nextjs

EXPOSE 3002

ENV PORT 3002
ENV HOSTNAME "0.0.0.0"

# Next.js standalone creates server.js in the standalone directory
CMD ["node", "server.js"]

