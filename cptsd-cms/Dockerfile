# Multi-stage build for optimized production image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files from cptsd-cms
COPY cptsd-cms/package.json cptsd-cms/package-lock.json* ./
# Suppress deprecation warnings (they're harmless but noisy)
RUN npm ci --loglevel=warn

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy app source
COPY cptsd-cms/ .
# Copy shared database package
COPY packages/db ./packages/db
# Create symlink in node_modules for @cptsd/db
RUN mkdir -p node_modules/@cptsd && ln -sf ../../packages/db node_modules/@cptsd/db

# Accept build arguments for environment variables
ARG OPENAI_API_KEY
ARG MONGODB_URI
ARG S3_ENDPOINT
ARG S3_ACCESS_KEY_ID
ARG S3_SECRET_ACCESS_KEY
ARG S3_BUCKET_NAME
ARG ADMIN_EMAIL
ARG ADMIN_PASSWORD
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET

# Set environment variables for build (Next.js may need these during build)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV OPENAI_API_KEY=${OPENAI_API_KEY}
ENV MONGODB_URI=${MONGODB_URI}
ENV S3_ENDPOINT=${S3_ENDPOINT}
ENV S3_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID}
ENV S3_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY}
ENV S3_BUCKET_NAME=${S3_BUCKET_NAME}
ENV ADMIN_EMAIL=${ADMIN_EMAIL}
ENV ADMIN_PASSWORD=${ADMIN_PASSWORD}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

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
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Ensure packages are available at runtime
# Copy packages directory and recreate symlinks for @cptsd packages
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages
RUN mkdir -p node_modules/@cptsd && \
    ln -sf ../../packages/db node_modules/@cptsd/db

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Next.js standalone creates server.js in the standalone directory
CMD ["node", "server.js"]
