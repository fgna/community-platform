# Build context: repo root (docker build -f apps/api/Dockerfile .)
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# ── deps: install all dependencies (dev + prod) and generate Prisma client ──────
FROM base AS deps
COPY .npmrc package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/themes/package.json ./packages/themes/
COPY packages/ui/package.json ./packages/ui/
# Schema must be present before install so @prisma/client's postinstall hook
# (prisma generate) runs against the current schema and writes into the correct
# pnpm virtual-store path that TypeScript resolves via symlinks.
COPY apps/api/prisma ./apps/api/prisma/
RUN pnpm install --frozen-lockfile --filter @community/api...

# ── builder: compile TypeScript → dist/ ────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
# Make @nestjs/cli (nest binary) findable — pnpm copies it under apps/api/node_modules
# but the .bin symlinks cross stage boundaries, so we expose them explicitly.
ENV PATH="/app/apps/api/node_modules/.bin:/app/node_modules/.bin:${PATH}"
# Re-generate Prisma client via pnpm so it writes into the correct pnpm virtual
# store path that TypeScript resolves (deps layer may carry a stale cached client).
RUN pnpm --filter @community/api exec prisma generate
WORKDIR /app/apps/api
RUN nest build

# ── production: minimal runtime image ────────────────────────────────────────
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production

# Workspace manifests allow pnpm to understand workspace context if needed
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/

# Full node_modules from deps — the pnpm virtual store (.pnpm/) holds the real
# package files; symlinks in node_modules/@nestjs/core etc. resolve into it.
# Running pnpm install --prod here would skip prisma generate (prisma is a devDep)
# leaving @prisma/client unusable, so we carry the whole deps node_modules instead.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Compiled output + Prisma schema/migrations
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
USER nestjs
WORKDIR /app/apps/api
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "dist/main"]
