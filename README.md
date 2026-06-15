# Community Platform

A production-ready, self-hosted community and learning platform with a premium dark executive dashboard experience. Built with Next.js 15, NestJS, PostgreSQL, and Docker.

---

## ✨ Features

| Phase 1 (MVP) | Status |
|---|---|
| Authentication (email/password, JWT, RBAC) | ✅ |
| Community Feed (posts, comments, reactions) | ✅ |
| Learning Hub (courses, modules, progress) | ✅ |
| Events (list, RSVP, calendar) | ✅ |
| Member Directory | ✅ |
| Theme Engine (5 themes, runtime switching) | ✅ |
| Admin Panel (users, courses, events, moderation) | ✅ |
| GDPR (consent, data export, account deletion) | ✅ |

---

## 🚀 Quick Start (Docker — recommended)

### Prerequisites
- [Docker 24+](https://docs.docker.com/get-docker/) and Docker Compose v2
- 2 GB RAM minimum

### One-command start

```bash
# 1. Clone
git clone <repo-url> community-platform && cd community-platform

# 2. Configure env
cp .env.example .env
# Edit .env — at minimum set the JWT secrets:
#   JWT_SECRET=<run: openssl rand -hex 32>
#   JWT_REFRESH_SECRET=<run: openssl rand -hex 32>

# 3. Start everything (postgres + redis + api + web)
docker compose up --build -d

# 4. Run DB migrations + seed (first run only)
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed
```

The platform is now live:

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| API | http://localhost:3001 |
| Health | http://localhost:3001/health |

**Default admin account** (created by seed):
- Email: `admin@example.com`
- Password: `Admin1234!`

> Change these immediately in production.

---

## 💻 Local Development

### Prerequisites
- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Docker (for postgres + redis)

```bash
# Install all workspace dependencies
pnpm install

# Start only the infrastructure services
docker compose up postgres redis -d

# Copy and configure .env
cp .env.example .env

# Run database migrations and seed
pnpm db:migrate
pnpm db:seed

# Start both api and web with hot reload
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001

### Useful dev commands

```bash
pnpm build          # Build all workspaces
pnpm test           # Run all unit tests
pnpm test:e2e       # Run Playwright e2e tests
pnpm lint           # Lint all workspaces
pnpm db:studio      # Open Prisma Studio (visual DB browser)
pnpm db:migrate     # Create and apply a new migration
pnpm docker:logs    # Follow all container logs
```

---

## 🗂 Project Structure

```
community-platform/
├── apps/
│   ├── api/                  # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/         # JWT auth, guards, strategies
│   │   │   ├── users/        # User profiles, member directory
│   │   │   ├── posts/        # Community feed, comments, reactions
│   │   │   ├── courses/      # Learning hub, progress tracking
│   │   │   ├── events/       # Events, RSVP
│   │   │   ├── admin/        # Admin endpoints
│   │   │   ├── gdpr/         # GDPR compliance
│   │   │   ├── health/       # Health check
│   │   │   └── prisma/       # Database service
│   │   └── prisma/
│   │       ├── schema.prisma # Full DB schema
│   │       └── seed.ts       # Initial data
│   └── web/                  # Next.js 15 frontend
│       └── src/
│           ├── app/          # App Router pages
│           │   ├── (auth)/   # Login, register
│           │   ├── (dashboard)/ # Main app shell
│           │   └── (admin)/ # Admin panel
│           ├── components/   # UI components
│           ├── hooks/        # TanStack Query hooks
│           ├── lib/          # Theme engine, API client
│           └── store/        # Zustand state
├── packages/
│   ├── shared/               # TypeScript types + utilities
│   ├── themes/               # Theme tokens (5 built-in themes)
│   └── ui/                   # Shared UI components
├── docker-compose.yml
├── BACKLOG.md                # Full product backlog with sprint plan
├── ARCHITECTURE.md
├── DEPLOYMENT.md
└── CHANGELOG.md
```

---

## 🎨 Themes

Switch theme at runtime (no page reload) from the Settings page:

| Theme | Description |
|---|---|
| **Executive Glass** *(default)* | Dark UI, gold accents, glassmorphism |
| **Executive Red** | Dark UI, deep red accents |
| **Growth Green** | Dark UI, green accents |
| **Corporate Light** | Light, professional |
| **High Contrast** | WCAG AAA, accessibility-first |

---

## 🗓 Sprint Roadmap — What Ships Each Sprint

Each sprint produces **deployable, useable software**. The main branch is always releasable.

### Sprint 1 — Auth + Shell (Week 1)
Ships: Working login/register, JWT token management, protected routes, glassmorphism dashboard shell with sidebar and topbar.

**Useable**: Users can sign up, log in, and navigate a fully themed dashboard.

### Sprint 2 — Theme Engine (Week 1–2)
Ships: 5 runtime-switchable themes applied via CSS variables with no reload.

**Useable**: Platform looks polished across all 5 themes. Settings page lets users pick their theme.

### Sprint 3 — Community Feed (Week 2)
Ships: Full community feed — create posts, comment, react with Like/Heart/Celebrate/Insightful, paginated feed with load more.

**Useable**: Members can have real conversations in the community feed.

### Sprint 4 — Learning Hub (Week 3)
Ships: Course catalog, course detail with module/lesson accordion, progress tracking per lesson.

**Useable**: Admins can publish courses; members can enroll and track their progress.

### Sprint 5 — Events + Members (Week 3–4)
Ships: Events list and detail with RSVP (going/maybe/not going). Member directory with search.

**Useable**: Members can find events, RSVP, and browse the community directory.

### Sprint 6 — Admin Panel (Week 4)
Ships: Admin dashboard with KPIs, user management (roles, deactivation), content moderation (hide posts), course and event management.

**Useable**: Admins have full control over users and content without touching the database.

### Sprint 7 — GDPR + Settings (Week 4–5)
Ships: Cookie consent banner, data export (JSON), account deletion, privacy controls.

**Useable**: Platform is GDPR-compliant for EU deployments.

### Sprint 8 — QA + CI/CD (Week 5)
Ships: 90%+ test coverage, GitHub Actions CI pipeline, optimised Docker images.

**Useable**: Every PR is automatically validated. Production deployment is hardened.

---

## 🏗 Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full guide including:
- VPS setup (Hetzner, DigitalOcean, AWS, Azure)
- nginx reverse proxy with TLS
- Automated database migration on deploy
- Horizontal scaling notes
- Backup and restore procedures

### Minimum VPS spec
- 1 vCPU, 2 GB RAM, 20 GB disk
- Ubuntu 22.04 LTS recommended

### Quick VPS deploy

```bash
# On your server (Ubuntu 22.04):
curl -fsSL https://get.docker.com | sh
git clone <repo-url> /opt/community-platform
cd /opt/community-platform
cp .env.example .env && nano .env   # set secrets + CORS_ORIGINS
docker compose up --build -d
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed
```

Put nginx in front with Let's Encrypt for TLS (see [DEPLOYMENT.md](./DEPLOYMENT.md#reverse-proxy)).

---

## 🔐 Security

- Passwords hashed with Argon2id
- JWT access tokens (15 min) + rotating refresh tokens (7 days)
- CSRF protection via SameSite cookies
- Rate limiting on all endpoints (100 req/min per IP, 10 req/min on auth)
- Helmet.js security headers
- Input validation via class-validator on all DTOs
- Audit log for sensitive admin actions

See [SECURITY.md](./SECURITY.md).

---

## 🧪 Testing

```bash
# Unit tests (all workspaces)
pnpm test

# Unit tests with coverage
pnpm test -- --coverage

# E2E tests (app must be running)
cd apps/web && pnpm test:e2e
```

Coverage targets: 90% overall · 95% business logic · 100% critical services.

---

## 📄 Documentation

| Doc | Description |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, component diagram, data flow |
| [API.md](./API.md) | Full REST API reference |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deploy to VPS, Docker, and cloud providers |
| [SECURITY.md](./SECURITY.md) | Security model, threat mitigations |
| [GDPR.md](./GDPR.md) | GDPR compliance features |
| [THEMING.md](./THEMING.md) | Theme system and customisation |
| [BACKLOG.md](./BACKLOG.md) | Sprint-by-sprint product backlog |
| [CHANGELOG.md](./CHANGELOG.md) | Release history |

---

## 🤝 Contributing

1. Branch from `develop`: `git checkout -b feature/my-feature`
2. Write tests first (TDD — RED → GREEN → REFACTOR)
3. Ensure `pnpm test` and `pnpm lint` pass
4. Update `CHANGELOG.md`
5. Open a PR against `develop`

See [BACKLOG.md](./BACKLOG.md) for open items ready to pick up.

---

## License

MIT
