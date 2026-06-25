# Build context: repo root (docker compose -f apps/web/Dockerfile .)

# ─── Stage 0: Build Android APK (skipped when BUILD_APK=false) ──────────────
ARG BUILD_APK=true

FROM eclipse-temurin:21-jdk-jammy AS apk-builder-real
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
RUN apt-get update && apt-get install -y wget unzip && rm -rf /var/lib/apt/lists/*
RUN mkdir -p $ANDROID_HOME/cmdline-tools && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip \
         -O /tmp/cmdline-tools.zip && \
    unzip -q /tmp/cmdline-tools.zip -d $ANDROID_HOME/cmdline-tools && \
    mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest && \
    rm /tmp/cmdline-tools.zip
RUN yes | sdkmanager --licenses && \
    sdkmanager "platform-tools" "platforms;android-36" "build-tools;35.0.0"
WORKDIR /app
COPY apps/mobile-android/ ./
RUN chmod +x gradlew && ./gradlew assembleRelease --no-daemon

FROM alpine:3.20 AS apk-builder-skip
RUN mkdir -p /app/app/build/outputs/apk/release
RUN touch /app/app/build/outputs/apk/release/app-release.apk

FROM apk-builder-${BUILD_APK} AS apk-builder

# ─── Stage 1: Node base ─────────────────────────────────────────────────────
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
# Copy built APK into public directory before Next.js build (empty file if skipped)
COPY --from=apk-builder /app/app/build/outputs/apk/release/app-release.apk ./apps/web/public/app/community.apk
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
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/login',(r)=>{process.exit(r.statusCode<400?0:1)}).on('error',()=>process.exit(1))"
WORKDIR /app/apps/web
CMD ["node", "server.js"]
