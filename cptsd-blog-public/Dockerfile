# Multi-stage build for optimized production image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
# Suppress deprecation warnings (they're harmless but noisy)
RUN npm ci --loglevel=warn

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

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
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Next.js standalone includes public in .next/standalone/public (if source has public/)
# Move it to root level if it exists in standalone, otherwise create empty directory
RUN if [ -d "./public" ]; then \
      echo "Public directory already at root"; \
    elif [ -d "./.next/standalone/public" ]; then \
      mv ./.next/standalone/public ./public && \
      echo "Moved public directory from standalone to root"; \
    else \
      mkdir -p ./public && \
      echo "Created empty public directory"; \
    fi

USER nextjs

EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# Next.js standalone creates server.js in the standalone directory
CMD ["node", "server.js"]

