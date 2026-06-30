# Build context = repo root. Uses the pnpm workspace (replaces the old
# npm install + packages/* copy-hack); @cptsd/* resolve via pnpm symlinks.
FROM node:20-alpine AS base
WORKDIR /app
# pnpm via corepack (version pinned by the root package.json "packageManager")
RUN corepack enable

# Install dependencies (pnpm workspace — replaces npm install + copy-hack)
FROM base AS deps
RUN apk add --no-cache libc6-compat
# Root workspace manifests + single root lockfile
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
# All workspace member manifests so the frozen lockfile resolves
COPY apps/main/package.json ./apps/main/
COPY apps/blog/package.json ./apps/blog/
COPY apps/cms/package.json ./apps/cms/
COPY apps/journal/package.json ./apps/journal/
COPY apps/worker/package.json ./apps/worker/
COPY libs/db/package.json ./libs/db/
COPY libs/pets/package.json ./libs/pets/
COPY libs/ai/package.json ./libs/ai/
# Install only the worker project and its workspace deps (@cptsd/db, @cptsd/ai)
RUN pnpm install --frozen-lockfile --filter cptsd-worker...

# Build (tsc -> dist) against the symlinked workspace libs
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
# Shared libs (raw TS source consumed via the @cptsd/* pnpm symlinks)
COPY libs/db ./libs/db
COPY libs/ai ./libs/ai
# Worker source
COPY apps/worker ./apps/worker
# Overlay the pnpm-resolved node_modules so the @cptsd/* symlinks win
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
WORKDIR /app/apps/worker
RUN pnpm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=builder /app/apps/worker/package.json ./apps/worker/
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
# Shared libs resolved by the @cptsd/* symlinks at runtime
COPY --from=builder /app/libs/db ./libs/db
COPY --from=builder /app/libs/ai ./libs/ai
WORKDIR /app/apps/worker
CMD ["node", "dist/index.js"]
