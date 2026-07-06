# Production Readiness Checklist

Use this checklist before exposing the platform to real users. Items are grouped by whether they are already enforced by code/config, required for any production deployment, or optional hardening.

---

## Already Implemented by Code or Config

These are enforced automatically — no operator action needed.

- [x] JWT secrets required at startup (`JWT_SECRET:?` in docker-compose.yml — API exits if missing)
- [x] Argon2id password hashing (memory=65536, iterations=3, parallelism=4)
- [x] Refresh token rotation — each use invalidates the previous token
- [x] Tiered rate limiting via `@nestjs/throttler` (100 req/min global, 10 req/15min login)
- [x] Helmet.js security headers (X-Frame-Options, X-Content-Type-Options, CSP, HSTS)
- [x] class-validator DTO validation — strips and rejects unknown properties
- [x] Prisma parameterized queries — SQL injection protected
- [x] `sanitize-html` on post create/update, DOMPurify on frontend render — XSS mitigated
- [x] CORS restricted to `CORS_ORIGINS` env var
- [x] nginx reverse proxy with TLS 1.2+, HSTS, OCSP stapling (when proxy profile active)
- [x] Non-root container user (`nestjs`, uid 1001)
- [x] Health checks on all services — Docker Compose waits for readiness before starting dependents
- [x] Production-safe migration command documented: `docker compose exec api npx prisma migrate deploy`
- [x] API Swagger UI disabled in production (`NODE_ENV=production`)

---

## Required Before Production

These require operator action for every production deployment.

### Secrets
- [ ] Generate `JWT_SECRET` with `openssl rand -hex 32` (64+ hex chars)
- [ ] Generate `JWT_REFRESH_SECRET` with `openssl rand -hex 32` (64+ hex chars)
- [ ] Set a strong `POSTGRES_PASSWORD` (not the `.env.example` default)
- [ ] Remove or replace `NEXTAUTH_SECRET` if present

### Demo Data
- [ ] Do **not** run `pnpm db:seed` or `npx prisma db seed` without `SEED_DEMO_DATA=true` — the seed guard skips demo account creation by default
- [ ] If you previously ran the seed in dev and are reusing the same database, change or delete the `admin@example.com` account before going live
- [ ] Verify no default demo accounts exist: `SELECT email FROM "User" WHERE email LIKE '%example.com';`

### Network and HTTPS
- [ ] Use production Docker Compose mode — **do not** copy `docker-compose.override.yml` to production:
  ```bash
  docker compose -f docker-compose.yml --profile proxy up -d
  ```
- [ ] Confirm ports 3000 and 3001 are **not** bound to the host (only nginx on 80/443)
- [ ] Configure firewall: allow inbound TCP 22, 80, 443 only
- [ ] Run `./nginx/init-ssl.sh` to provision Let's Encrypt certificate
- [ ] Set `DOMAIN` and `SSL_EMAIL` in `.env` before running the script
- [ ] Verify HTTPS works: `curl -I https://yourdomain.com`

### Application Config
- [ ] Set `CORS_ORIGINS=https://yourdomain.com` (no wildcard)
- [ ] Set `NEXT_PUBLIC_API_URL=https://yourdomain.com`
- [ ] Set `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
- [ ] Set `NODE_ENV=production`

### Database
- [ ] Test migration on a copy of the database before applying to production
- [ ] Verify migrations applied cleanly: `docker compose exec api npx prisma migrate status`

### Admin Account
- [ ] Create a production admin account via the platform UI or API, using a strong password
- [ ] Disable or delete the demo `admin@example.com` if it was ever created

---

## Operational Readiness

Complete these before handling real user data.

### Backups
- [ ] Configure automated backups using the `backup` Compose profile:
  ```bash
  # Add to crontab — daily at 2am
  0 2 * * *  cd /path/to/community-platform && docker compose --profile backup run --rm backup
  ```
- [ ] Test restore from backup: `pg_restore -d community_platform /backups/community_YYYYMMDD.dump`
- [ ] Store backups off-server (S3, Backblaze, rsync to second host)

### Certificate Renewal
- [ ] Set up automatic renewal:
  ```bash
  # Add to crontab — weekly
  0 3 * * 0  cd /path/to/community-platform && docker compose run --rm certbot renew --quiet && docker compose exec nginx nginx -s reload
  ```

### Monitoring
- [ ] Subscribe to Let's Encrypt expiry notifications (automatic with certbot)
- [ ] Configure uptime monitoring (UptimeRobot, Freshping, etc.) on `https://yourdomain.com`
- [ ] Review container logs after first deployment: `docker compose logs -f`

### Update Procedure
- [ ] Document your update procedure:
  ```bash
  git pull
  docker compose -f docker-compose.yml --profile proxy up --build -d
  docker compose exec api npx prisma migrate deploy
  ```
- [ ] Test update procedure in staging before applying to production

---

## Optional Hardening

These are improvements beyond the baseline, prioritized by risk.

- [ ] **Dependency audit**: run `pnpm audit --audit-level moderate` and address high/critical findings
- [ ] **httpOnly cookies**: migrate token storage from localStorage to httpOnly Secure cookies for higher XSS resistance (see SECURITY.md for current risk framing)
- [ ] **In-memory brute-force**: replace the per-process `loginAttempts` Map with a Redis-backed counter so protection works across restarts and multiple instances
- [ ] **Disable invite-only bypass**: ensure `SIGNUP_OPEN` (if present) is not set to `true` in production unless intended
- [ ] **File upload limits**: review `client_max_body_size 50M` in nginx config; reduce if large uploads are not needed
- [ ] **Log aggregation**: ship container logs to a log management service
- [ ] **Secrets rotation**: rotate `JWT_SECRET` and `JWT_REFRESH_SECRET` on a regular schedule (invalidates all active sessions)
- [ ] **Dependabot**: enable GitHub Dependabot for npm and GitHub Actions to receive automated dependency updates
- [ ] **Disable experimental features if not used**: leave `ANTHROPIC_API_KEY`, `STRIPE_*`, and OAuth credentials blank to disable those modules

---

## Reference

- [DEPLOYMENT.md](./DEPLOYMENT.md) — step-by-step deployment guide
- [SECURITY.md](./SECURITY.md) — security model and threat mitigations
- [FEATURE_STATUS.md](./FEATURE_STATUS.md) — maturity status per feature
