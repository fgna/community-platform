# Architecture

## Overview

Community Platform is a full-stack monorepo application built with modern TypeScript tooling. It uses a NestJS REST API backend and a Next.js 15 App Router frontend, sharing types through a `@community/shared` package.

## Monorepo Structure

```
community-platform/
├── apps/
│   ├── api/          # NestJS 10 REST API (port 3001)
│   └── web/          # Next.js 15 App Router (port 3000)
├── packages/
│   ├── shared/       # Shared TypeScript types & utilities
│   ├── themes/       # Theme token definitions
│   └── ui/           # Shared UI component re-exports
├── turbo.json        # Turborepo pipeline
├── pnpm-workspace.yaml
└── docker-compose.yml
```

## Frontend Architecture (apps/web)

### Routing
Uses Next.js 15 App Router with route groups:
- `(auth)` — unauthenticated pages (login, register)
- `(dashboard)` — authenticated user pages
- `(admin)` — admin-only pages

### State Management
- **TanStack Query v5** — server state (API data caching, background refetching)
- **Zustand v5** — client state (auth session, theme preference)
- Persistent stores use `zustand/middleware/persist` with localStorage

### Theme System
Runtime theme switching without page reload:
1. User selects theme → `useThemeStore` persists name to localStorage
2. `ThemeProvider` calls `applyTheme()` which sets CSS custom properties on `:root`
3. All components read from CSS variables (`var(--theme-primary)` etc.)
4. No flash on load because CSS variables have sensible defaults

### Auth Flow (Client)
1. Login/register → API returns `accessToken` (15m JWT) + `refreshToken` (UUID stored in DB)
2. Tokens stored in Zustand store (persisted to localStorage)
3. `api-client.ts` attaches `Authorization: Bearer <token>` on every request
4. On 401, interceptor automatically calls `/api/auth/refresh` with refresh token
5. Failed requests are queued and retried with new access token
6. On refresh failure → clear auth state → redirect to `/login`
7. Middleware (`src/middleware.ts`) checks `auth-session` cookie for SSR route protection

## Backend Architecture (apps/api)

### Module Structure
```
AppModule
├── PrismaModule (global)
├── AuthModule   — JWT + refresh token auth, global guards
├── UsersModule  — member directory, profile management
├── PostsModule  — community feed, comments, reactions
├── CoursesModule — learning hub, progress tracking
├── EventsModule — events, RSVPs
├── AdminModule  — admin operations (role-guarded)
├── GdprModule   — GDPR compliance endpoints
└── HealthModule — health check endpoint
```

### Authentication
- **Access tokens**: JWT signed with `JWT_SECRET`, expires in 15 minutes
- **Refresh tokens**: UUID v4, stored in `RefreshToken` table, expires in 7 days
- `JwtAuthGuard` applied globally via `APP_GUARD` — all routes protected by default
- Public routes decorated with `@SetMetadata(IS_PUBLIC_KEY, true)`
- `RolesGuard` applied globally — checks `@Roles()` decorator

### Database
- PostgreSQL 16 via Prisma ORM
- All relations use cascade deletes
- `@@unique` constraints enforce business rules (e.g., one reaction per user per post per type)
- `PrismaService` extends `PrismaClient`, connects on module init

## Data Flow

```
Browser → Next.js middleware (auth check)
        → Next.js page (RSC or client component)
        → TanStack Query hook → apiClient (axios)
        → NestJS controller → service → Prisma → PostgreSQL
```

## Infrastructure

See `docker-compose.yml` for full service configuration. Services:
- `postgres` (PostgreSQL 16 Alpine) — database
- `redis` (Redis 7 Alpine) — available for caching/sessions
- `api` (NestJS) — depends on postgres + redis health checks
- `web` (Next.js) — depends on api health check

Health checks ensure services start in correct order.
