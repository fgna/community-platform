# ADR 006 — nginx + Certbot for TLS Termination

**Status**: Accepted

## Context

Production deployments need HTTPS. The TLS setup must be self-contained (no external services required beyond Let's Encrypt), operator-friendly (one script to run), and maintainable (certificate auto-renewal).

## Decision

Include nginx as a reverse proxy and Certbot for Let's Encrypt certificate provisioning, both running as Docker Compose services under the `proxy` profile. TLS termination happens at nginx; the API and web services communicate over HTTP internally.

The `init-ssl.sh` script:
1. Loads `.env` for `DOMAIN` and `SSL_EMAIL`
2. Starts nginx in HTTP-only mode (for ACME challenge)
3. Runs Certbot to obtain the certificate
4. Restarts nginx with SSL config

Certificate renewal is via a cron job running `docker compose run --rm certbot renew`.

In production, the `proxy` profile must be activated explicitly: `docker compose -f docker-compose.yml --profile proxy up -d`.

## Consequences

**Benefits:**
- Zero-dependency TLS — no paid certificates, no cloud load balancer required
- nginx serves as a single public entrypoint; API and web are internal only
- HSTS, OCSP stapling, TLS 1.2+, modern cipher suites configured out of the box
- HTTP → HTTPS redirect included
- WebSocket upgrade passthrough included (for future real-time features)

**Trade-offs:**
- Certbot rate limits apply (5 certificates per domain per week) — use `SSL_STAGING=1` during testing
- Certificate renewal requires a cron job — not automatic on the first deployment
- Operators behind a cloud load balancer that already terminates TLS should use the HTTP-only nginx config template

## Alternatives Considered

- **Traefik with automatic TLS**: more automatic but significantly more complex to configure; requires understanding of Traefik's provider model
- **Caddy**: auto-HTTPS by default; simpler config language; less familiar to operators who know nginx
- **Cloud load balancer (AWS ALB, GCP Cloud Run, etc.)**: good for managed deployments but introduces cloud dependency and cost; out of scope for the self-hosted Docker model
