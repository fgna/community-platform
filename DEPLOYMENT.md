# Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose v2 (`docker compose` not `docker-compose`)
- pnpm 9.15+ (for local development)
- Node.js 20+

---

## Local Development (no Docker)

### 0. Node version and pnpm setup

This repo requires **Node 20**. Node 18 will break it. Use nvm:

```bash
nvm use 20
```

Make pnpm available via corepack (do this once per machine):

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET and JWT_REFRESH_SECRET
```

### 3. Start Postgres and Redis via Docker

```bash
pnpm docker:up postgres redis
# Or: docker compose up postgres redis -d
```

### 4. Run database migrations

```bash
pnpm db:migrate          # creates/applies migrations + generates Prisma client
pnpm db:seed             # loads seed data (admin user, sample content)
```

### 5. Start development servers

Run everything from the **project root** (Turbo starts all apps in parallel):

```bash
pnpm dev
# API → http://localhost:3001
# Web → http://localhost:3000  (hot reload on both)
```

> **Do not** start apps with `node server.js` or `node dist/main.js`. This is
> a monorepo managed by Turbo — always start through `pnpm dev` from the root.

If you only want the frontend (e.g. mocking the API or working on UI only):

```bash
cd apps/web
pnpm dev
```

If something starts but immediately exits, the real error is usually hidden above
the Turbo output. Check the individual app directly:

```bash
cd apps/web && pnpm dev    # shows raw Next.js output
cd apps/api && pnpm dev    # shows raw NestJS output
```

---

## Full Stack via Docker Compose

Runs the entire application (Postgres, Redis, API, Web) as containers.

### Quick start

```bash
cp .env.example .env          # configure secrets (see "Required environment variables" below)
docker compose up --build -d  # build images and start all services
docker compose logs -f        # tail logs
```

### First-time database setup

After the API container is healthy, run migrations and seed data:

```bash
docker compose exec api pnpm prisma migrate deploy
docker compose exec api pnpm prisma db seed
```

### Services

| Service  | URL                             | Notes                              |
|----------|---------------------------------|------------------------------------|
| Web      | http://localhost:3000           |                                    |
| API      | http://localhost:3001           |                                    |
| API Docs | http://localhost:3001/api/docs  | Swagger UI (non-production builds) |
| Postgres | localhost:5432                  |                                    |
| Redis    | localhost:6379                  |                                    |

### Useful commands

```bash
pnpm docker:up       # start all services (detached)
pnpm docker:down     # stop and remove containers
pnpm docker:logs     # tail all service logs
docker compose ps    # check container health status
```

### Service startup order

Health checks enforce the dependency chain:
```
postgres (healthy) → api (healthy) → web
redis    (healthy) ↗
```

---

## Docker image architecture

The API Dockerfile uses a four-stage build:

| Stage        | Purpose                                              |
|--------------|------------------------------------------------------|
| `base`       | Node 20 Alpine + pnpm via corepack                   |
| `deps`       | Install all dependencies; run `prisma generate`      |
| `builder`    | Compile TypeScript → `dist/` using `nest build`      |
| `production` | Runtime image; copies `node_modules` + `dist/`       |

Key design decisions:
- **No `pnpm install --prod` in production**: `@prisma/client` requires the Prisma-generated runtime files that `prisma generate` (a devDep) creates. Copying the full `node_modules` from the `deps` stage preserves these without re-running the generator.
- **Explicit `PATH` in builder**: sets `/app/apps/api/node_modules/.bin:/app/node_modules/.bin` so `nest build` resolves the `@nestjs/cli` binary reliably across Docker layer boundaries.
- **Production extends `base`**: pnpm is available in the final image; the production `CMD` is `node dist/main`.

The `docker-compose.override.yml` applies automatically on `docker compose up`. It currently only overrides environment variables for local development. **No dev command (`nest start --watch`) is injected**; for hot-reloading run `pnpm dev` locally instead.

---

## Required environment variables

The API **exits at startup** if either JWT secret is missing:

```bash
JWT_SECRET=          # required — 64+ random characters
JWT_REFRESH_SECRET=  # required — 64+ different random characters
```

Generate secure values:
```bash
openssl rand -hex 32   # run twice, use each output for one secret
```

Full variable reference (copy from `.env.example`):

```env
# Database
DATABASE_URL=postgresql://postgres:password@postgres:5432/community_platform

# Redis
REDIS_URL=redis://redis:6379

# JWT (REQUIRED — app refuses to start without these)
JWT_SECRET=<64+ random hex>
JWT_REFRESH_SECRET=<64+ random hex>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API
API_PORT=3001
NODE_ENV=production

# Web
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# CORS (comma-separated list of allowed origins)
CORS_ORIGINS=https://yourdomain.com

# Rate limiting (requests per TTL window; defaults: 100 req / 60 s)
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

---

## Production deployment (VPS / cloud)

### 1. Server setup

```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com | sh
```

### 2. Clone and configure

```bash
git clone https://github.com/fgna/community-platform.git
cd community-platform
cp .env.example .env
# Set JWT_SECRET, JWT_REFRESH_SECRET, DATABASE_URL, CORS_ORIGINS, NEXT_PUBLIC_API_URL
```

### 3. Build and start

```bash
docker compose up --build -d
```

### 4. Run migrations (first deploy and every deploy with schema changes)

```bash
docker compose exec api pnpm prisma migrate deploy
```

### 5. Verify health

```bash
docker compose ps                          # all containers should show "healthy"
curl http://localhost:3001/health          # {"status":"ok"}
```

---

## Reverse proxy (nginx)

```nginx
# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$host$request_uri;
}

# Web (Next.js)
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# API (NestJS)
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

Obtain TLS certificates with Certbot:
```bash
certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

---

## Database management

```bash
# Apply pending migrations (production-safe, never resets data)
docker compose exec api pnpm prisma migrate deploy

# Open Prisma Studio (visual browser — dev only)
pnpm db:studio

# Create a new migration after schema changes (dev only)
pnpm db:migrate

# Reset database (dev only — destroys all data)
cd apps/api && pnpm prisma migrate reset

# Regenerate Prisma client after schema change (without migrating)
cd apps/api && pnpm prisma generate
```

---

## Running tests

```bash
# All unit tests (all packages)
pnpm test

# API unit tests with coverage
cd apps/api && pnpm test:coverage

# API integration tests (requires a running Postgres — use DATABASE_URL env var)
cd apps/api && DATABASE_URL=postgresql://postgres:password@localhost:5432/community_test \
  pnpm test:integration

# Frontend E2E tests (requires API + web dev servers running)
cd apps/web && pnpm test:e2e
```

CI runs unit tests and integration tests on every push (see `.github/workflows/`).

---

## Scaling

- **API**: Stateless — run multiple instances behind a load balancer. Shared Postgres and Redis handle session state.
- **Database**: Add PgBouncer for connection pooling under high concurrency.
- **Web**: Next.js supports horizontal scaling; no sticky sessions required.
- **File uploads**: Configure S3-compatible object storage for user avatars.
