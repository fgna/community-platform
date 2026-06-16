# Build context: repo root (docker build -f apps/api/Dockerfile .)
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS deps
# Copy workspace manifests + lockfile for deterministic install
COPY .npmrc package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/themes/package.json ./packages/themes/
COPY packages/ui/package.json ./packages/ui/
# Install only the API's dependency tree (devDeps included — needed for prisma generate)
RUN pnpm install --frozen-lockfile --filter @community/api... --ignore-scripts
# Copy Prisma schema and generate client into the pnpm virtual store
COPY apps/api/prisma ./apps/api/prisma/
RUN pnpm --filter @community/api exec prisma generate

FROM base AS builder
# Copy both root and api-specific node_modules so tsc can resolve all types
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
WORKDIR /app/apps/api
RUN pnpm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy the full node_modules from deps (includes generated Prisma client in .pnpm
# virtual store; running pnpm install --prod in this stage would skip prisma generate
# because prisma is a devDep, leaving @prisma/client unusable at runtime)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy compiled output and Prisma schema/migrations
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
USER nestjs
WORKDIR /app/apps/api
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "dist/main"]
