# Release Checklist

Use this checklist for every production release — both initial deployments and updates.

---

## Pre-release (on branch, before merge)

- [ ] All CI checks are green (Lint, Typecheck, Tests, Build, Docker Build, Docker Smoke)
- [ ] `CHANGELOG.md` updated with the new version and date
- [ ] No high/critical findings from `pnpm audit --audit-level=high`
- [ ] Change tested against a staging or preview environment where possible

---

## Deployment

Run these steps on the production server after `git pull`:

```bash
# Pull latest code
git pull

# Build and start in production mode
docker compose -f docker-compose.yml --profile proxy up --build -d

# Apply database migrations (safe — never resets data)
docker compose exec api npx prisma migrate deploy

# Verify all containers are healthy
docker compose -f docker-compose.yml --profile proxy ps
```

- [ ] Secrets verified — `JWT_SECRET`, `JWT_REFRESH_SECRET`, `POSTGRES_PASSWORD` all set and non-default
- [ ] `git pull` completed without conflicts
- [ ] `docker compose up --build` completed without errors
- [ ] `prisma migrate deploy` completed — no failed migrations
- [ ] All containers show `healthy` status

---

## Post-deployment

- [ ] Run the VPS verification script — all checks must pass:
  ```bash
  DOMAIN=yourdomain.com ./scripts/verify-vps-deployment.sh
  ```
- [ ] Run the smoke test:
  ```bash
  API_URL=https://yourdomain.com WEB_URL=https://yourdomain.com ./scripts/smoke-test.sh
  ```
- [ ] Check API logs for errors:
  ```bash
  docker compose logs --tail 50 api
  ```
- [ ] Confirm backups are running — check the most recent timestamp:
  ```bash
  ls -lh data/backups/ | tail -5
  ```

---

## Rollback (if needed)

```bash
# Return to the previous commit
git checkout <previous-tag-or-sha>

# Rebuild and restart
docker compose -f docker-compose.yml --profile proxy up --build -d

# Apply migrations for the previous schema
docker compose exec api npx prisma migrate deploy
```

> **Database rollback**: Prisma migrations cannot be automatically reversed.
> If the new schema introduced breaking changes, restore from the most recent backup:
> ```bash
> ./scripts/restore.sh data/backups/community_YYYYMMDD_HHMMSS.dump
> ```

---

## Reference

- [DEPLOYMENT.md](./DEPLOYMENT.md) — full deployment guide
- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) — pre-production checklist
- [SECURITY.md](./SECURITY.md) — security model
- `scripts/verify-vps-deployment.sh` — automated deployment verification
- `scripts/smoke-test.sh` — post-deployment smoke test
- `scripts/restore.sh` — database restore procedure
