## Summary

What changed, and why?

## Type

- [ ] Feature
- [ ] Bug fix
- [ ] Security hardening
- [ ] Deployment / ops
- [ ] Documentation
- [ ] Refactor

## Verification

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] `pnpm test:coverage` (meets thresholds)
- [ ] Docker build / smoke test (if `docker-compose*.yml`, `Dockerfile`, or CI changed)
- [ ] Migration tested, if applicable (`prisma migrate dev` + rollback path considered)

## Risk

What could break? Any blast radius beyond the immediate change?

## Deployment Notes

New/changed env vars, migrations, or rollback steps. Write "None" if not applicable.

## Linked Issue

Closes #

---

Every PR must also:
1. Pass all CI checks
2. Update `CHANGELOG.md` for any user-facing or operationally-relevant change
3. Update `BACKLOG.md` if it completes or changes status of a tracked item
