---
name: Deployment issue
about: Problem with self-hosted / VPS / Docker deployment
title: "[DEPLOY] "
labels: type:ops
assignees: ''
---

## Environment

- Hosting: [VPS / Hetzner / AWS / Azure / DigitalOcean / other]
- Deployment method: [docker compose / manual]
- OS:
- Docker / Docker Compose version:

## What Happened

Describe the problem. Which step of `DEPLOYMENT.md` / `RELEASE_CHECKLIST.md` failed?

## `scripts/verify-vps-deployment.sh` Output

```
paste output here (redact secrets, IPs if sensitive)
```

## Relevant `.env` Settings (redacted)

Which variables are set, without their values (e.g. `CORS_ORIGINS=<set>`, `JWT_SECRET=<set>`).

## Logs

```
docker compose logs output, redacted
```

## Expected Behavior

What should have happened instead.
