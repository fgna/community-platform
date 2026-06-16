# Community Platform

A production-ready, self-hosted community and learning platform with a premium dark executive dashboard. Built with Next.js 15, NestJS, PostgreSQL, and Docker.

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
| Themes | 5 built-in themes, runtime switching (no page reload) | ✅ |
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

# 3. Start everything (postgres + redis + api + web)
docker compose up --build -d

# 4. Run DB migrations + seed (first run only)
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed
```

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| API | http://localhost:3001 |
| Health | http://localhost:3001/health |
| API Docs | http://localhost:3001/api/docs |

**Default accounts (created by seed):**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `Admin123!@#` |
| Member | `alice@example.com` | `Member123!@#` |

> Change these immediately in production.

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

# Run database migrations and seed
pnpm db:migrate
pnpm db:seed

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
├── packages/
│   ├── shared/                 # TypeScript types + utilities
│   ├── themes/                 # Theme tokens (5 built-in themes)
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
| **Executive Red** | Dark, deep red accents |
| **Growth Green** | Dark, emerald accents |
| **Corporate Light** | Light, professional |
| **High Contrast** | WCAG AAA, accessibility-first |

---

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- VPS setup (Hetzner, DigitalOcean, AWS, Azure)
- nginx reverse proxy with TLS (Let's Encrypt)
- Automated database migration on deploy
- Horizontal scaling notes
- Backup and restore procedures

**Minimum VPS:** 1 vCPU · 2 GB RAM · 20 GB disk · Ubuntu 22.04

```bash
# Quick VPS deploy
curl -fsSL https://get.docker.com | sh
git clone <repo-url> /opt/community-platform && cd /opt/community-platform
cp .env.example .env && nano .env   # set secrets + CORS_ORIGINS
docker compose up --build -d
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed
```

---

## Security

- Argon2id password hashing
- JWT access tokens (15 min) + rotating refresh tokens (7 days)
- SameSite cookie CSRF protection
- Rate limiting: 100 req/min per IP, 10 req/min on auth endpoints
- Helmet.js security headers
- class-validator DTO validation on all inputs
- Audit log for sensitive admin actions

See [SECURITY.md](./SECURITY.md).

---

## Testing

```bash
pnpm test                    # All unit tests
pnpm test:coverage           # With coverage report
cd apps/web && pnpm test:e2e # Playwright E2E (app must be running)
```

Coverage targets: **90% overall · 95% business logic · 100% critical services**

CI runs on every PR: lint → typecheck → unit tests → build → E2E.

---

## Documentation

| Doc | Contents |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, data flow, component diagram |
| [API.md](./API.md) | Full REST API reference |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | VPS, Docker, cloud provider guides |
| [SECURITY.md](./SECURITY.md) | Security model, threat mitigations |
| [GDPR.md](./GDPR.md) | GDPR compliance features |
| [THEMING.md](./THEMING.md) | Theme system and customisation |
| [BACKLOG.md](./BACKLOG.md) | Sprint-by-sprint product backlog |
| [CHANGELOG.md](./CHANGELOG.md) | Release history |

---

## Contributing

1. Branch from `develop`: `git checkout -b feature/my-feature`
2. Write tests first (TDD — RED → GREEN → REFACTOR)
3. Ensure `pnpm test` and `pnpm lint` pass
4. Update `CHANGELOG.md`
5. Open a PR against `develop`

See [BACKLOG.md](./BACKLOG.md) for open items.

---

## License

MIT
