# Deployment Guide

---

## Docker Modes: Dev vs. Production

| Mode | Command | Port exposure | When to use |
|------|---------|---------------|-------------|
| **Local dev** | `docker compose up -d` | api:3001, web:3000 on host | Development and local testing |
| **Production** | `docker compose -f docker-compose.yml --profile proxy up -d` | Only nginx on 80/443 | Any public-facing server |

The key difference is `docker-compose.override.yml`: Docker Compose auto-loads it when present in the working directory, which adds host port bindings for the api and web services. Production deployments use `-f docker-compose.yml` explicitly to skip the override and keep api/web internal-only, accessible only through nginx.

**Never run `docker compose up` (without `-f`) on a production server** — it will expose your API directly on port 3001.

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
pnpm db:migrate                  # applies migrations + generates Prisma client
SEED_DEMO_DATA=true pnpm db:seed # creates demo admin user and sample content
```

Demo seed credentials: `admin@example.com / Admin123!@#`

> The seed script is guarded by `SEED_DEMO_DATA=true` — it exits immediately without creating any accounts if the variable is not set. This prevents accidental demo account creation in production.

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
NEXT_PUBLIC_API_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# CORS (comma-separated list of allowed origins)
CORS_ORIGINS=https://yourdomain.com

# Rate limiting (defaults: 100 req / 60 s)
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

---

## Hetzner Quick Start (Recommended)

The cheapest production-ready option. A Hetzner CX22 (2 vCPU, 4 GB RAM, ~€4.50/month) comfortably runs the full stack.

### 1. Create a server

1. Sign up at [hetzner.com/cloud](https://www.hetzner.com/cloud/)
2. Create a new project → Add Server
3. **Location**: Falkenstein or Helsinki (EU, GDPR-friendly)
4. **Image**: Ubuntu 24.04
5. **Type**: CX22 (2 vCPU, 4 GB RAM, 40 GB disk) — shared CPU is fine
6. **SSH key**: Add your public key (recommended over password)
7. **Networking**: Enable public IPv4
8. **Firewall**: Create one allowing inbound TCP on ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
9. Create the server and note the IP address

### 2. Initial server setup

```bash
# SSH in
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Create a non-root deploy user (optional but recommended)
adduser deploy
usermod -aG docker deploy
```

### 3. Deploy the platform

```bash
# Switch to deploy user (or stay as root)
su - deploy

# Clone
git clone https://github.com/fgna/community-platform.git
cd community-platform

# Configure
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Generate secrets (run each command, paste output into .env)
# openssl rand -hex 32

JWT_SECRET=<paste-64-char-hex>
JWT_REFRESH_SECRET=<paste-64-char-hex>
POSTGRES_PASSWORD=<paste-strong-password>

DOMAIN=yourdomain.com
SSL_EMAIL=you@yourdomain.com

CORS_ORIGINS=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 4. Point DNS and start

Point your domain's A record to the server IP, then:

```bash
# Build and start in production mode (no host port exposure for api/web)
docker compose -f docker-compose.yml --profile proxy up --build -d

# Run database migrations (safe for production — never resets data)
docker compose exec api npx prisma migrate deploy

# DO NOT run db:seed in production — it creates well-known demo credentials
# The seed guard skips demo data when SEED_DEMO_DATA is not set to "true"

# Provision SSL certificate and start nginx
./nginx/init-ssl.sh

# Verify
docker compose -f docker-compose.yml --profile proxy ps  # all containers healthy
curl https://yourdomain.com                              # should load the login page
```

### 5. Set up automatic certificate renewal and backups

```bash
# Add to crontab (crontab -e)
# Renew SSL every Sunday at 3am
0 3 * * 0  cd /home/deploy/community-platform && docker compose run --rm certbot renew --quiet && docker compose exec nginx nginx -s reload

# Daily backup at 2am
0 2 * * *  cd /home/deploy/community-platform && docker compose --profile backup run --rm backup
```

### 6. Updating

```bash
cd /home/deploy/community-platform
git pull
docker compose -f docker-compose.yml --profile proxy up --build -d
docker compose exec api npx prisma migrate deploy
```

### Cost breakdown

| Resource | Cost |
|----------|------|
| Hetzner CX22 (2 vCPU, 4 GB) | ~€4.50/month |
| 20 GB volume (optional, for data) | ~€0.88/month |
| Domain name | ~€10/year |
| Let's Encrypt TLS | Free |
| **Total** | **~€5.50/month** |

---

## Generic VPS deployment

Works on any VPS provider (DigitalOcean, Contabo, AWS Lightsail, Azure, etc.). Minimum: 1 vCPU, 2 GB RAM, 20 GB disk.

### First deploy

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh

# 2. Clone the repo
git clone https://github.com/fgna/community-platform.git
cd community-platform

# 3. Configure secrets
cp .env.example .env
# Set JWT_SECRET, JWT_REFRESH_SECRET, POSTGRES_PASSWORD, DOMAIN, CORS_ORIGINS, NEXT_PUBLIC_API_URL

# 4. Build and start in production mode (no host port exposure for api/web)
docker compose -f docker-compose.yml --profile proxy up --build -d

# 5. Migrate (first deploy only) — DO NOT run db:seed in production
docker compose exec api npx prisma migrate deploy

# 6. Enable HTTPS (optional — requires domain + DNS pointed to server)
./nginx/init-ssl.sh

# 7. Verify
docker compose -f docker-compose.yml --profile proxy ps  # all containers healthy
curl https://yourdomain.com/health                       # {"status":"ok"}
```

### Updating

```bash
git pull
docker compose -f docker-compose.yml --profile proxy up --build -d
docker compose exec api npx prisma migrate deploy
```

### Services

| Service  | Dev URL                         | Production URL                     | Notes |
|----------|---------------------------------|------------------------------------|-------|
| Web      | http://localhost:3000           | https://yourdomain.com             | Port 3000 only bound to host in dev (override.yml) |
| API      | http://localhost:3001           | https://yourdomain.com/api         | Port 3001 only bound to host in dev (override.yml) |
| API Docs | http://localhost:3001/api/docs  | Not available                      | Swagger disabled in production (NODE_ENV=production) |
| Postgres | Not exposed                     | Not exposed                        | Internal only — `expose:` not `ports:` |
| Redis    | Not exposed                     | Not exposed                        | Internal only — `expose:` not `ports:` |

```bash
docker compose ps        # check health status
docker compose logs -f   # tail all logs
docker compose down      # stop and remove containers
```

---

## HTTPS with Nginx + Let's Encrypt

The platform includes a built-in Nginx reverse proxy with automatic TLS via Let's Encrypt. It runs behind the `proxy` Docker Compose profile so it doesn't interfere with local development.

### Setup

**1. Configure your domain in `.env`**

```env
DOMAIN=yourdomain.com
SSL_EMAIL=admin@yourdomain.com
SSL_STAGING=0

CORS_ORIGINS=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**2. Point DNS to your server**

Create an A record for `yourdomain.com` pointing to your server's IP.

**3. Provision certificates and start**

```bash
# First time — provisions Let's Encrypt certificate and starts nginx
./nginx/init-ssl.sh

# Start everything (subsequent runs)
docker compose --profile proxy up -d
```

**4. Certificate renewal**

Certificates are valid for 90 days. Renew with:

```bash
docker compose run --rm certbot renew
docker compose exec nginx nginx -s reload
```

Add this to a cron job for automatic renewal:

```bash
0 3 * * 0  cd /path/to/community-platform && docker compose run --rm certbot renew --quiet && docker compose exec nginx nginx -s reload
```

### How it works

| URL path      | Proxied to    | Notes                                         |
|---------------|---------------|-----------------------------------------------|
| `/api/*`      | `api:3001`    | Preserves `/api` prefix                       |
| `/uploads/*`  | `api:3001`    | Static file caching (7 days)                  |
| `/*`          | `web:3000`    | Next.js frontend                              |

- HTTP (port 80) redirects to HTTPS (port 443)
- TLS 1.2+ only, HSTS enabled, OCSP stapling
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`
- WebSocket upgrade supported (for future real-time features)

### Testing with staging certificates

Set `SSL_STAGING=1` in `.env` to use Let's Encrypt staging servers (avoids rate limits during testing). Browsers will show a certificate warning — this is expected.

### Without HTTPS (HTTP-only proxy)

To use nginx as a reverse proxy without TLS (e.g., behind a cloud load balancer that terminates TLS):

```bash
NGINX_CONF_TEMPLATE=default-no-ssl.conf.template docker compose --profile proxy up -d nginx
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
