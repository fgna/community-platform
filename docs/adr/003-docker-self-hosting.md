# ADR 003 — Docker Compose as Primary Deployment Model

**Status**: Accepted

## Context

The platform is designed to be self-hosted by operators on their own VPS or server. The deployment model must be simple enough for a technically competent non-DevOps operator to manage, while supporting production-level features like TLS, reverse proxying, and automated database migrations.

## Decision

Docker Compose is the primary and supported deployment model. The deployment includes:
- `docker-compose.yml` — base services (postgres, redis, api, web); no host port exposure in production
- `docker-compose.dev.yml` — must be loaded explicitly in dev/CI; adds host port bindings for api and web
- nginx service (`proxy` profile) — reverse proxy + TLS termination
- certbot service (`proxy` profile) — Let's Encrypt certificate provisioning
- backup service (`backup` profile) — on-demand pg_dump

Production command: `docker compose -f docker-compose.yml --profile proxy up -d` (base file only).
Dev command: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d` (explicit dev overrides).

## Consequences

**Benefits:**
- Explicit file selection prevents accidental port exposure (`docker compose -f docker-compose.yml …`)
- No vendor lock-in — runs on any Linux host with Docker
- All services (postgres, redis, nginx, certbot) included — no external dependencies
- Compose profiles separate optional services from core services
- Dev overrides are explicit, not auto-loaded, eliminating a common production footgun

**Trade-offs:**
- Not optimized for managed PaaS (Railway, Fly, Render) — those require separate Dockerfiles and platform-specific config
- Horizontal scaling requires an external load balancer and shared Redis + Postgres

## Alternatives Considered

- **Kubernetes**: more powerful but far too complex for self-hosted single-node deployments
- **Managed PaaS (Railway, Render, Fly.io)**: simpler deploys but vendor lock-in, higher cost, and harder to keep data on EU soil for GDPR
- **Bare-metal systemd services**: no isolation, harder to reproduce environments, migration path more complex
