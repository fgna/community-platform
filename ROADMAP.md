# Roadmap

Future work planned for the Community Platform. These items are not yet started.

For completed work, see [CHANGELOG.md](./CHANGELOG.md).
For active bugs and in-progress tasks, see [BACKLOG.md](./BACKLOG.md).

---

## Not Started

### Infrastructure

| ID | Feature | Priority | Notes |
|----|---------|----------|-------|
| GL-030 | Multi-tenancy — isolated workspaces per organisation | P2 | Requires significant schema changes |
| GL-033 | Video lessons — HLS streaming, chapter markers | P2 | Requires video storage/CDN |
| GL-034 | Live events / webinar integration | P2 | Third-party integration (Zoom/Teams/Jitsi) |

### Quality

| ID | Item | Priority | Notes |
|----|------|----------|-------|
| Q-007 | Coverage gates enforced in CI (90% overall) | P1 | Currently collected but not gated |

### Security Hardening (Optional)

| ID | Item | Priority | Notes |
|----|------|----------|-------|
| — | httpOnly cookie token storage | P2 | Higher XSS resistance; requires backend session management |
| — | Redis-backed brute-force counter | P2 | Replaces in-memory Map; needed for horizontal scaling |
| — | Dependabot for npm + GitHub Actions | P2 | Automated dependency security updates |

---

## Phase 2 Items Not Yet Prioritized

These were deferred from Phase 2 planning and have no active work scheduled.

- Real-time messaging and notifications (WebSocket / SSE) — currently polling-based
- Dedicated full-text search engine (Elasticsearch / Meilisearch) — currently Prisma `contains`
- Dedicated analytics pipeline — currently aggregated DB queries
- S3-compatible object storage for user uploads — currently local disk
- Advanced reporting (scheduled reports, exports at scale)
- Internationalisation (English + German, `next-intl`)
