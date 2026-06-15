# Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose v2
- pnpm 9+ (for local development)
- Node.js 20+

---

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start infrastructure

```bash
pnpm docker:up
# Or: docker compose up postgres redis -d
```

### 4. Run database migrations and seed

```bash
pnpm db:migrate
pnpm db:seed
```

### 5. Start development servers

```bash
pnpm dev
# Starts both API (port 3001) and web (port 3000) with hot reload
```

---

## Docker Compose (Full Stack)

Run the entire application in Docker:

```bash
# Copy and configure env
cp .env.example .env

# Build and start all services
docker compose up --build

# Or in detached mode
docker compose up --build -d

# View logs
pnpm docker:logs

# Stop
pnpm docker:down
```

Services will be available at:
- Web: http://localhost:3000
- API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs (dev mode only)

### Health Checks

All services have health checks configured:
- postgres: `pg_isready`
- redis: `redis-cli ping`
- api: HTTP GET `/health`
- web: HTTP GET on port 3000

Services start in dependency order enforced by health checks.

---

## Production Deployment

### Environment Variables

Set these in your production environment (never commit to git):

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=redis://host:6379
JWT_SECRET=<64+ random characters>
JWT_REFRESH_SECRET=<64+ different random characters>
CORS_ORIGINS=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

Generate secure secrets:
```bash
openssl rand -hex 32
```

### Database Migrations

In production, run migrations before starting the API:
```bash
npx prisma migrate deploy
```

This runs pending migrations without resetting data (unlike `migrate dev`).

### Reverse Proxy (nginx)

Example nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Scaling Considerations

- **API**: Stateless — run multiple instances behind a load balancer. Redis required for distributed rate limiting in multi-instance setup.
- **Database**: Use connection pooling (PgBouncer) for high concurrency.
- **Web**: Next.js supports horizontal scaling out of the box.
- **File uploads**: Add S3-compatible object storage for user avatar uploads.

---

## Running Tests

```bash
# All tests
pnpm test

# API unit tests only
cd apps/api && pnpm test

# Web unit tests only
cd apps/web && pnpm test

# E2E tests (requires running app)
cd apps/web && pnpm test:e2e
```

---

## Database Management

```bash
# Open Prisma Studio (visual DB browser)
pnpm db:studio

# Create a new migration
pnpm db:migrate

# Reset database (dev only — destroys data)
cd apps/api && npx prisma migrate reset

# Generate Prisma client after schema changes
cd apps/api && npx prisma generate
```
