FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY services/worker/package*.json ./
COPY packages/db ./packages/db
COPY packages/ai ./packages/ai
RUN npm install

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY services/worker ./services/worker
COPY packages/db ./packages/db
COPY packages/ai ./packages/ai
WORKDIR /app/services/worker
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/services/worker/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY packages/db ./packages/db
COPY packages/ai ./packages/ai

CMD ["node", "dist/index.js"]

