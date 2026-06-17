# Build context: repo root (docker compose -f apps/web/Dockerfile .)
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
# Install only the web's dependency tree
RUN pnpm install --frozen-lockfile --filter @community/web... --ignore-scripts

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app/apps/web
RUN pnpm run build

FROM node:20-alpine AS production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
# outputFileTracingRoot=workspace-root causes standalone to nest everything
# under apps/web/ — server.js lands at apps/web/server.js, so public and
# static must also be at apps/web/* (which they are via these COPY targets).
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO /dev/null http://localhost:3000/api/health || exit 1
# server.js is at apps/web/server.js within the standalone bundle
WORKDIR /app/apps/web
CMD ["node", "server.js"]
