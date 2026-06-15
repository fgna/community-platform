FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

FROM base AS deps
COPY package.json ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm prisma generate

FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
EXPOSE 3001
CMD ["pnpm", "run", "start:dev"]

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm run build

FROM base AS production
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/main"]
