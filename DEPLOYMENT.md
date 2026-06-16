# Deployment Guide

---

## Local Development

### First install

**1. Node version**

This repo requires Node 20. Node 18 will break it.

```bash
nvm use 20
```

**2. pnpm (once per machine)**

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

**3. Install dependencies**

```bash
pnpm install
```

**4. Configure environment**

```bash
cp .env.example .env
# Edit .env — set at minimum JWT_SECRET and JWT_REFRESH_SECRET
```

**5. Start Postgres and Redis**

```bash
docker compose up postgres redis -d
```

**6. Run migrations and seed**

```bash
pnpm db:migrate   # applies migrations + generates Prisma client
pnpm db:seed      # creates admin user and sample content
```

Default seed credentials: `admin@example.com / Admin123!@#`

**7. Start the app**

```bash
pnpm dev
```

- Web → http://localhost:3000
- API → http://localhost:3001

---

### After a git pull

```bash
git pull
nvm use 20
pnpm install       # picks up any new or changed dependencies
pnpm db:migrate    # applies any new migrations (safe to run even if none pending)
pnpm dev
```

---

### Notes

- Always run `pnpm dev` from the **project root**. This is a monorepo managed by
  Turbo — do not start apps with `node server.js` or `node dist/main.js`.
- If you only want the frontend (UI work, API mocked):
  ```bash
  cd apps/web && pnpm dev
  ```
- If `pnpm dev` exits silently, Turbo is hiding the error. Run the failing app
  directly to see the raw output:
  ```bash
  cd apps/api && pnpm dev    # NestJS output
  cd apps/web && pnpm dev    # Next.js output
  ```

---

## Required environment variables

The API **exits at startup** if either JWT secret is missing.

Generate secure values:
```bash
openssl rand -hex 32   # run twice — one value for each secret
```

Full variable reference (see `.env.example`):

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

# Rate limiting (defaults: 100 req / 60 s)
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

---

## Production deployment (VPS / cloud)

### First deploy

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh

# 2. Clone the repo
git clone https://github.com/fgna/community-platform.git
cd community-platform

# 3. Configure secrets
cp .env.example .env
# Set JWT_SECRET, JWT_REFRESH_SECRET, DATABASE_URL, CORS_ORIGINS, NEXT_PUBLIC_API_URL

# 4. Build and start
docker compose up --build -d

# 5. Migrate and seed (first deploy only)
docker compose exec api pnpm prisma migrate deploy
docker compose exec api pnpm prisma db seed

# 6. Verify
docker compose ps                  # all containers should show "healthy"
curl http://localhost:3001/health  # {"status":"ok"}
```

### Updating

```bash
git pull
docker compose up --build -d
docker compose exec api pnpm prisma migrate deploy
```

### Services

| Service  | URL                             | Notes                              |
|----------|---------------------------------|------------------------------------|
| Web      | http://localhost:3000           |                                    |
| API      | http://localhost:3001           |                                    |
| API Docs | http://localhost:3001/api/docs  | Swagger UI (non-production only)   |
| Postgres | localhost:5432                  |                                    |
| Redis    | localhost:6379                  |                                    |

```bash
docker compose ps        # check health status
docker compose logs -f   # tail all logs
docker compose down      # stop and remove containers
```

---

## Reverse proxy (nginx + TLS)

```nginx
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://$host$request_uri;
}

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

server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass       http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

---

## Database management

```bash
# Apply pending migrations (production-safe, never resets data)
pnpm db:migrate
# or in Docker: docker compose exec api pnpm prisma migrate deploy

# Seed initial data
pnpm db:seed

# Open Prisma Studio (visual DB browser — dev only)
pnpm db:studio

# Reset database (dev only — destroys all data)
cd apps/api && pnpm prisma migrate reset

# Regenerate Prisma client after schema change
cd apps/api && pnpm prisma generate
```

---

## Running tests

```bash
pnpm test                  # all unit tests

cd apps/api
pnpm test:coverage         # API unit tests with coverage
pnpm test:integration      # integration tests (requires Postgres)

cd apps/web
pnpm test:e2e              # Playwright E2E (requires running API + web)
```

---

## Scaling

- **API**: Stateless — run multiple instances behind a load balancer. Postgres and Redis handle shared state.
- **Database**: Add PgBouncer for connection pooling under high concurrency.
- **Web**: Next.js supports horizontal scaling; no sticky sessions required.
- **File uploads**: Configure S3-compatible object storage for user avatars.
