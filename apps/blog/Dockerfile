# Multi-stage build for optimized production image
FROM node:20-alpine AS base
# Enable pnpm via corepack (version pinned by root package.json packageManager)
RUN corepack enable

# Build the application using the pnpm workspace
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Build context is the repo root (see docker-compose.yml `context`).
# Copy workspace manifests first for better layer caching.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/blog/package.json ./apps/blog/
COPY libs/db/package.json ./libs/db/
COPY libs/pets/package.json ./libs/pets/

# Install workspace dependencies. pnpm resolves @cptsd/db and @cptsd/pets
# (declared as workspace:*) by symlinking node_modules/@cptsd/* into libs/* —
# this replaces the old postinstall copy-hack + manual ln -sf steps.
RUN pnpm install --no-frozen-lockfile

# Copy the application source and the shared libs it consumes
COPY apps/blog ./apps/blog
COPY libs/db ./libs/db
COPY libs/pets ./libs/pets

# Accept build arguments for environment variables
ARG MONGODB_URI

# Set environment variables for build (Next.js may need these during build)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV MONGODB_URI=${MONGODB_URI:-mongodb://admin:changeme@mongodb:27017/cptsd-cms?authSource=admin}

# Build Next.js application (output: 'standalone')
RUN pnpm --filter cptsd-blog-public build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from standalone build.
# In a pnpm workspace, Next.js standalone mirrors the repo layout:
# - .next/standalone/apps/blog/server.js is the entrypoint
# - .next/standalone/node_modules/ holds the traced deps (incl. transpiled @cptsd/*)
# - static assets must be placed at apps/blog/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/blog/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/blog/.next/static ./apps/blog/.next/static
# Next.js standalone includes public in standalone/apps/blog/public (if source has public/)
# Ensure it exists at the expected location, otherwise create an empty directory
RUN if [ -d "./apps/blog/public" ]; then \
      echo "Public directory already present"; \
    elif [ -d "./apps/blog/.next/standalone/public" ]; then \
      mv ./apps/blog/.next/standalone/public ./apps/blog/public && \
      echo "Moved public directory from standalone to app root"; \
    else \
      mkdir -p ./apps/blog/public && \
      echo "Created empty public directory"; \
    fi

USER nextjs

EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# Next.js standalone creates server.js under apps/blog/ in the workspace layout
CMD ["node", "apps/blog/server.js"]
