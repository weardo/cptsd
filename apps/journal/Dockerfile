FROM node:20-alpine AS base

# Enable pnpm via corepack for workspace installs
RUN corepack enable

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY apps/journal/package*.json ./
COPY libs/db ./libs/db
COPY libs/ai ./libs/ai

# Declare a pnpm workspace so @cptsd/* resolve as symlinks into libs/*
RUN printf 'packages:\n  - "libs/*"\n' > pnpm-workspace.yaml

# Install dependencies (pnpm workspace symlinks @cptsd/db and @cptsd/ai from libs/*)
RUN pnpm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/journal .
COPY libs/db ./libs/db
COPY libs/ai ./libs/ai

# Build arguments
ARG OPENAI_API_KEY
ARG MONGODB_URI
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG ADMIN_EMAIL
ARG ADMIN_PASSWORD

# Set environment variables for build
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV MONGODB_URI=$MONGODB_URI
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV ADMIN_EMAIL=$ADMIN_EMAIL
ENV ADMIN_PASSWORD=$ADMIN_PASSWORD

RUN pnpm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3003

ENV PORT=3003
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]



