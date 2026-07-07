# Community Platform

A production-oriented, self-hosted community and learning platform with a premium dark executive dashboard. Built with Next.js 15, NestJS, PostgreSQL, and Docker.

> **Status: deployable beta.** Core features are implemented and tested. Some advanced modules (AI Coach, Billing, OAuth, Mobile Android) are experimental. See [Current Status](#current-status) and [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) before deploying to production.

---

## Current Status

| Area | State | Notes |
|---|---|---|
| Auth (JWT, RBAC, invites) | Stable | Full unit + integration tests |
| Community Feed | Stable | Full unit + E2E tests |
| Courses + Progress | Stable | Unit tests; E2E smoke |
| Events + RSVP | Stable | Unit tests; E2E smoke |
| Member Directory | Stable | Unit tests |
| Theme Engine | Stable | 3 themes, runtime switching |
| Admin Panel | Stable | Role-guarded; unit tests |
| GDPR (export, delete, consent) | Stable | Unit tests |
| Notifications | Beta | Polling-based; no WebSocket yet |
| Private Messaging | Beta | Polling-based; no WebSocket yet |
| Search | Beta | Full-text via Prisma; no dedicated engine |
| Analytics Dashboard | Beta | Aggregated queries; no dedicated pipeline |
| AI Coach | Experimental | Requires `ANTHROPIC_API_KEY`; stub if missing |
| Billing (Stripe) | Experimental | Requires `STRIPE_*` keys; disabled by default |
| OAuth (Google/LinkedIn) | Experimental | Requires OAuth credentials; disabled by default |
| Mobile Android (WebView) | Experimental | Wrapper app; not in main Docker stack |
| Coverage gates | Enforced (selected files) | 50–55% baseline on gated service/store/lib files; 60–85% on `src/auth/**`; full-project coverage gates not yet enforced |

See [FEATURE_STATUS.md](./FEATURE_STATUS.md) for a detailed per-feature matrix.

---

## Features

### Phase 1 — MVP (Complete)

| Area | Feature | Status |
|---|---|---|
| Auth | Email/password login, JWT + refresh tokens, RBAC | ✅ |
| Auth | Role-based access (Admin / Member), route protection | ✅ |
| Auth | Invite-only registration (token-based, 7-day expiry) | ✅ |
| Feed | Posts, comments, reactions (Like/Heart/Celebrate/Insightful) | ✅ |
| Feed | Markdown support (bold, italic, code, blockquote, links) | ✅ |
| Feed | Hashtag extraction and click-to-filter | ✅ |
| Feed | Latest / Trending tabs, pinned posts | ✅ |
| Courses | Course catalog, module/lesson accordion, progress tracking | ✅ |
| Events | Event list, calendar view, RSVP (Going/Maybe/Not Going) | ✅ |
| Members | Member directory, public profiles, activity badges | ✅ |
| Members | Top Contributors leaderboard | ✅ |
| Themes | 3 built-in themes, runtime switching (no page reload) | ✅ |
| Admin | User management (roles, active/suspend) | ✅ |
| Admin | Content moderation queue, post pin/hide | ✅ |
| Admin | Course and event management | ✅ |
| Admin | Audit log, analytics dashboard | ✅ |
| Admin | Platform settings (name, logo, colours, signup toggle) | ✅ |
| Admin | Invite management (send, copy link, revoke) | ✅ |
| GDPR | Cookie consent banner, privacy settings | ✅ |
| GDPR | Data export (JSON download), account deletion | ✅ |

### Phase 2 — Post-MVP (Shipped)

| Feature | Status |
|---|---|
| In-app notifications (follow, comment, reaction alerts) | ✅ |
| Follow / unfollow members | ✅ |
| Private messaging (1:1 conversations, real-time polling) | ✅ |
| Command palette (⌘K / Ctrl+K, live search, keyboard nav) | ✅ |
| Platform-wide search (posts, users, courses, events) | ✅ |
| Analytics dashboard (DAU, content, course, event, messaging stats) | ✅ |
| White-labeling foundation (PlatformSettings model, admin UI) | ✅ |

---

## Quick Start (Docker — recommended)

### Prerequisites
- [Docker 24+](https://docs.docker.com/get-docker/) and Docker Compose v2
- 2 GB RAM minimum

### One-command start

```bash
# 1. Clone
git clone <repo-url> community-platform && cd community-platform

# 2. Configure env
cp .env.example .env
# Edit .env — at minimum set:
#   JWT_SECRET=<openssl rand -hex 32>
#   JWT_REFRESH_SECRET=<openssl rand -hex 32>

# 3. Start everything (postgres + redis + api + web) with dev port bindings
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d

# 4. Run DB migrations (first run only)
docker compose exec api npx prisma migrate deploy

# 4a. (Local/demo only) Seed sample data — creates known demo accounts
#     SKIP this in production or use your own admin setup
SEED_DEMO_DATA=true docker compose exec -e SEED_DEMO_DATA=true api npx prisma db seed

# 5. (Optional) Enable HTTPS — requires a domain with DNS pointed to your server
#    Set DOMAIN and SSL_EMAIL in .env, then run:
./nginx/init-ssl.sh
```

| Service | URL | Notes |
|---|---|---|
| Web app | http://localhost:3000 | |
| API | http://localhost:3001 | Dev only — not exposed in production |
| Health | http://localhost:3001/health | |
| API Docs | http://localhost:3001/api/docs | Dev only — disabled in production |
| HTTPS (with proxy profile) | https://yourdomain.com | |

> **Note:** Local development requires `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d` to get host port bindings for the api (3001) and web (3000). Production deployments use only `docker compose -f docker-compose.yml --profile proxy up -d` so only nginx is publicly accessible.

**Demo accounts (created by seed when `SEED_DEMO_DATA=true`):**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `Admin123!@#` |
| Member | `alice@example.com` | `Member123!@#` |

> **Production warning:** Do not run the demo seed in production. These are well-known credentials. See [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md).

---

## Local Development

### Prerequisites
- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Docker (for postgres + redis)

```bash
# Install all workspace dependencies
pnpm install

# Start infrastructure services
docker compose up postgres redis -d

# Copy and configure env
cp .env.example .env

# Run database migrations
pnpm db:migrate

# Seed demo data (local/dev only — creates known demo accounts)
SEED_DEMO_DATA=true pnpm db:seed

# Start API + web with hot reload
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001/api

### Development commands

```bash
pnpm build            # Build all workspaces
pnpm test             # Run all unit tests
pnpm test:coverage    # Tests with coverage report
pnpm lint             # Lint all workspaces
pnpm typecheck        # TypeScript check (no emit)
pnpm db:migrate       # Create + apply migration
pnpm db:seed          # Seed database
pnpm db:studio        # Open Prisma Studio
pnpm docker:logs      # Follow all container logs
```

---

## Project Structure

```
community-platform/
├── apps/
│   ├── api/                  # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/         # JWT auth, guards, strategies
│   │   │   ├── users/        # Profiles, follow system
│   │   │   ├── posts/        # Feed, comments, reactions, hashtags
│   │   │   ├── courses/      # Learning hub, progress
│   │   │   ├── events/       # Events, RSVP
│   │   │   ├── messages/     # 1:1 private messaging
│   │   │   ├── notifications/# In-app notification system
│   │   │   ├── invites/      # Token-based invite system
│   │   │   ├── search/       # Platform-wide search
│   │   │   ├── admin/        # Admin endpoints + settings
│   │   │   ├── gdpr/         # GDPR compliance
│   │   │   ├── health/       # Health check (no /api prefix)
│   │   │   └── prisma/       # Database service
│   │   └── prisma/
│   │       ├── schema.prisma # Full DB schema
│   │       ├── seed.ts       # Initial data
│   │       └── migrations/   # Migration history
│   └── web/                  # Next.js 15 frontend
│       └── src/
│           ├── app/
│           │   ├── (auth)/       # Login, register (invite-aware)
│           │   ├── (dashboard)/  # Feed, courses, events, members,
│           │   │                   messages, settings
│           │   └── (admin)/      # Admin panel (users, moderation,
│           │                       analytics, settings, invites)
│           ├── components/
│           │   ├── command-palette/  # ⌘K global search
│           │   ├── feed/             # Post cards, composer, reactions
│           │   ├── members/          # Member cards, leaderboard
│           │   ├── notifications/    # Notification bell
│           │   └── common/           # Shared UI primitives
│           ├── hooks/          # TanStack Query hooks per domain
│           ├── lib/            # API client, markdown renderer, themes
│           └── store/          # Zustand: auth, theme
├── nginx/
│   ├── default.conf.template       # HTTPS config (TLS + proxy)
│   ├── default-no-ssl.conf.template # HTTP-only proxy config
│   └── init-ssl.sh                 # One-command cert provisioning
├── packages/
│   ├── shared/                 # TypeScript types + utilities
│   ├── themes/                 # Theme tokens (3 built-in themes)
│   └── ui/                    # Shared UI components
├── docker-compose.yml
├── .env.example
├── BACKLOG.md
├── ARCHITECTURE.md
├── CHANGELOG.md
└── DEPLOYMENT.md
```

---

## Themes

Switch at runtime from Settings → Appearance (no page reload):

| Theme | Look |
|---|---|
| **Executive Glass** *(default)* | Dark, gold accents, glassmorphism |
| **Corporate Light** | Light, professional |
| **High Contrast** | WCAG AAA, accessibility-first |

---

## Production Deployment

**Recommended**: Hetzner CX22 (~€5/month) — see the step-by-step guide in [DEPLOYMENT.md](./DEPLOYMENT.md).

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Hetzner quick-start (cheapest production option)
- Generic VPS setup (DigitalOcean, Contabo, AWS Lightsail, Azure)
- Built-in Nginx reverse proxy with automatic Let's Encrypt HTTPS
- Automated database migrations and backups
- Horizontal scaling notes

**Minimum VPS:** 1 vCPU · 2 GB RAM · 20 GB disk · Ubuntu 24.04

```bash
# Quick VPS deploy (production mode — no host port exposure for api/web)
curl -fsSL https://get.docker.com | sh
git clone <repo-url> /opt/community-platform && cd /opt/community-platform
cp .env.example .env && nano .env   # set secrets, DOMAIN, CORS_ORIGINS

# Start in production mode (base file only — no dev port exposure)
docker compose -f docker-compose.yml --profile proxy up --build -d
docker compose exec api npx prisma migrate deploy
# Do NOT run db:seed in production — it creates known demo credentials
./nginx/init-ssl.sh                 # enable HTTPS (requires domain + DNS)
```

> See [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) for the full pre-production checklist.

---

## Security

- Argon2id password hashing
- JWT access tokens (15 min) + rotating refresh tokens (7 days)
- SameSite=Lax auth cookies (set by frontend, server does not use cookies)
- Tiered rate limiting: 100 req/min default, 10 req/15min on login, per-user throttle keys (via `UserThrottlerGuard`)
- Helmet.js security headers + CSP in production
- class-validator DTO validation on all inputs (`whitelist`, `forbidNonWhitelisted`, `transform`)
- Audit log for 4 admin actions (role change, toggle active, hide post, pin post)

See [SECURITY.md](./SECURITY.md).

---

## Testing

```bash
pnpm test                    # All unit tests
pnpm test:coverage           # With coverage report
cd apps/web && pnpm test:e2e # Playwright E2E (app must be running)
```

Coverage reports are generated and uploaded as CI artifacts. Gate thresholds are enforced in `apps/api/vitest.config.ts` and `apps/web/vitest.config.ts`, but only for the specific service/store/lib files with dedicated unit tests (50–55% baseline, 60–85% on `src/auth/**`) — full-project coverage gates are not yet enforced (see Q-007 in `BACKLOG.md`).

CI runs on every PR: lint → typecheck → API unit tests → web unit tests → build → Docker build → E2E.

---

## Documentation

| Doc | Contents |
|---|---|
| [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) | Pre-production checklist |
| [FEATURE_STATUS.md](./FEATURE_STATUS.md) | Per-feature maturity matrix |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, data flow, module diagram |
| [API.md](./API.md) | REST API reference (core endpoints) |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | VPS, Docker, dev vs. production modes |
| [SECURITY.md](./SECURITY.md) | Security model, threat mitigations |
| [GDPR.md](./GDPR.md) | GDPR-supporting features |
| [THEMING.md](./THEMING.md) | Theme system and customisation |
| [ROADMAP.md](./ROADMAP.md) | Future work and planned features |
| [BACKLOG.md](./BACKLOG.md) | Active tasks and open bugs |
| [CHANGELOG.md](./CHANGELOG.md) | Release history |

---

## Contributing

1. Branch from `main`: `git checkout -b feature/my-feature`
2. Write tests first (TDD — RED → GREEN → REFACTOR)
3. Ensure `pnpm test` and `pnpm lint` pass
4. Update `CHANGELOG.md`
5. Open a PR against `main`

See [BACKLOG.md](./BACKLOG.md) for open items and [ROADMAP.md](./ROADMAP.md) for planned features.

---

## Documentation audit basis

The feature and readiness descriptions in this documentation are based on the current repository contents. Claims are limited to source code, configuration, scripts, and tests present in the codebase. Items not verified from code are marked as planned, experimental, or needing verification.

## License

MIT
