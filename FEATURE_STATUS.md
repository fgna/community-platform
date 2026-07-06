# Feature Status Matrix

This matrix shows the current implementation and maturity state of every major feature area. Use it to determine what is safe to rely on, what needs configuration, and what is experimental.

**Maturity levels:**
- **Stable** — implemented, tested, recommended for production use
- **Beta** — implemented, partially tested, usable but may have rough edges
- **Experimental** — implemented but thin test coverage, requires optional config, or not production-hardened
- **Stub** — route/UI exists but backend is minimal or not connected

---

## Core Platform

| Feature | Backend | Frontend | Tests | Maturity | Notes |
|---|---|---|---|---|---|
| Email/password auth | ✅ | ✅ | Unit + integration | **Stable** | Argon2id, JWT, rate-limited |
| JWT + refresh tokens | ✅ | ✅ | Unit + integration | **Stable** | Rotation, DB-stored, 15m/7d |
| Role-based access (Admin/Member) | ✅ | ✅ | Unit | **Stable** | Global guards, public-route decorator |
| Invite-only registration | ✅ | ✅ | Unit | **Stable** | Token-based, 7-day expiry |
| Community Feed (posts, comments) | ✅ | ✅ | Unit + E2E | **Stable** | Markdown, hashtags, pagination |
| Reactions (Like/Heart/Celebrate/Insightful) | ✅ | ✅ | Unit + E2E | **Stable** | Optimistic UI |
| Pinned posts, Latest/Trending tabs | ✅ | ✅ | Unit | **Stable** | |
| Course catalog + module/lesson accordion | ✅ | ✅ | Unit + E2E | **Stable** | |
| Course progress tracking | ✅ | ✅ | Unit | **Stable** | Per-user percentage + completion |
| Events + RSVP (Going/Maybe/Not Going) | ✅ | ✅ | Unit + E2E | **Stable** | Calendar view |
| Member directory + public profiles | ✅ | ✅ | Unit | **Stable** | Activity badges, leaderboard |
| Follow / unfollow members | ✅ | ✅ | Unit | **Stable** | |
| 3 built-in themes + runtime switching | ✅ | ✅ | Unit | **Stable** | No page reload, CSS vars |
| Admin: user management (roles, suspend) | ✅ | ✅ | Unit | **Stable** | |
| Admin: content moderation queue | ✅ | ✅ | Unit | **Stable** | Pin/hide posts |
| Admin: course + event management | ✅ | ✅ | Unit | **Stable** | |
| Admin: invite management | ✅ | ✅ | Unit | **Stable** | Send, revoke, copy link |
| Admin: platform settings (name, logo, colours) | ✅ | ✅ | Unit | **Stable** | White-label foundation |
| Admin: audit log | ✅ | ✅ | Unit | **Stable** | 4 admin action types |
| GDPR: data export (JSON) | ✅ | ✅ | Unit | **Stable** | |
| GDPR: account deletion (anonymize) | ✅ | ✅ | Unit | **Stable** | Preserves referential integrity |
| GDPR: cookie consent | ✅ | ✅ | Unit | **Stable** | Per-user + anonymous session |
| In-app notifications | ✅ | ✅ | Unit | **Beta** | Polling-based; no WebSocket |
| Private messaging (1:1) | ✅ | ✅ | Unit | **Beta** | Polling-based; no WebSocket |
| Command palette (⌘K / Ctrl+K) | ✅ | ✅ | — | **Beta** | Live search, keyboard nav |
| Platform-wide search | ✅ | ✅ | Unit | **Beta** | Full-text via Prisma; no dedicated engine |
| Analytics dashboard (admin) | ✅ | ✅ | — | **Beta** | Aggregated DB queries; no dedicated pipeline |

---

## Extended Features

| Feature | Backend | Frontend | Tests | Maturity | Notes |
|---|---|---|---|---|---|
| Learning Groups | ✅ | ✅ | Adversarial only | **Experimental** | Group creation + membership |
| Journaling | ✅ | ✅ | Adversarial only | **Experimental** | Private entries per user |
| Assessments / Quizzes | ✅ | ✅ | Adversarial only | **Experimental** | Linked to courses |
| Event Proposals | ✅ | ✅ | Adversarial only | **Experimental** | Member-submitted event requests |
| Goals | ✅ | ✅ | — | **Experimental** | User goal tracking |
| Testimonials | ✅ | ✅ | — | **Experimental** | Member success stories |
| Categories | ✅ | ✅ | — | **Experimental** | Tagging for courses/posts |
| Email Digest | ✅ | ✅ | Adversarial only | **Experimental** | Requires SMTP config; logs only without it |
| File Uploads | ✅ | ✅ | Adversarial only | **Experimental** | Local disk (avatars); S3 service stub present |
| Membership Tiers | ✅ | ✅ | Adversarial only | **Experimental** | Requires Stripe; basic tier gating |
| White-labeling | Partial | Partial | — | **Experimental** | PlatformSettings model + admin UI; no full tenant isolation |

---

## Requires External Config (Disabled by Default)

These features are disabled when their required environment variables are not set.

| Feature | Required Env Vars | Backend | Frontend | Tests | Maturity |
|---|---|---|---|---|---|
| AI Coach (chat) | `ANTHROPIC_API_KEY` | ✅ | ✅ | Adversarial only | **Experimental** |
| Stripe Billing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` | ✅ | ✅ | Adversarial only | **Experimental** |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | ✅ | ✅ | — | **Experimental** |
| LinkedIn OAuth | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` | ✅ | ✅ | — | **Experimental** |
| Email (SMTP) | `SMTP_HOST` | ✅ | — | — | **Experimental** |

---

## Infrastructure

| Component | State | Notes |
|---|---|---|
| Docker Compose (dev) | **Stable** | Auto-loads override, ports exposed on host |
| Docker Compose (production) | **Stable** | Use `-f docker-compose.yml --profile proxy`; no host port exposure |
| nginx + Let's Encrypt TLS | **Stable** | `./nginx/init-ssl.sh` from `.env` |
| Database migrations (Prisma) | **Stable** | Auto-run via `entrypoint.sh` |
| Demo seed (`SEED_DEMO_DATA=true`) | **Stable** | Guarded; skipped unless flag set |
| CI pipeline (lint/typecheck/test/build/E2E) | **Stable** | Docker smoke test included |
| Coverage gates | **Not enforced** | Coverage collected as CI artifacts only |
| Android app (WebView wrapper) | **Experimental** | Built separately; not part of main Docker stack |

---

## Known Gaps Before Production

- No WebSocket / real-time layer (notifications and messaging use polling)
- No dedicated search engine (full-text search via Prisma `contains`; will degrade at scale)
- No dedicated analytics pipeline (aggregated DB queries; not suitable for high-volume data)
- In-memory brute-force protection does not survive restarts or horizontal scaling
- Tokens in localStorage (XSS risk; see SECURITY.md)
- No test coverage gates enforced in CI

See [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) for the full operator checklist.
