# Build context: repo root (docker build -f apps/api/Dockerfile .)
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS deps
# Copy workspace manifests + lockfile for deterministic install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/themes/package.json ./packages/themes/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile --ignore-scripts
# Generate Prisma client after install
COPY apps/api/prisma ./apps/api/prisma/
RUN cd apps/api && pnpm prisma generate

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
COPY --from=deps /app/apps/api/node_modules/.prisma ./apps/api/node_modules/.prisma
WORKDIR /app/apps/api
RUN pnpm run build

FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app
ENV NODE_ENV=production
# Only copy production artifacts
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma
# Non-root user
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
USER nestjs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "dist/main"]
