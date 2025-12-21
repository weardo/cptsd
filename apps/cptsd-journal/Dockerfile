FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY apps/cptsd-journal/package*.json ./
COPY packages/db ./packages/db
COPY packages/ai ./packages/ai

# Install dependencies
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/cptsd-journal .
COPY packages/db ./packages/db
COPY packages/ai ./packages/ai

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

RUN npm run build

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



