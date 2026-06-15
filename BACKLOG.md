# Product Backlog — Community Platform

> Format: `[ID] Title` · **Priority**: P0–P3 · **Size**: XS / S / M / L / XL  
> Status: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` deferred

---

## Phase 1 — MVP

### Sprint 1 · Foundation & Auth (Week 1)

| ID | Story | Priority | Size | Status |
|----|-------|----------|------|--------|
| F-001 | Monorepo scaffold (pnpm workspaces + Turborepo) | P0 | S | `[x]` |
| F-002 | Docker Compose: postgres, redis, api, web | P0 | S | `[x]` |
| F-003 | Prisma schema (all models) + initial migration | P0 | M | `[x]` |
| F-004 | Database seed (admin user + sample data) | P0 | S | `[x]` |
| F-005 | NestJS app bootstrap (main.ts, CORS, helmet, rate limit) | P0 | S | `[x]` |
| F-006 | Health check endpoint (`GET /api/health`) | P0 | XS | `[x]` |
| A-001 | User registration (email/password, Argon2 hashing) | P0 | M | `[x]` |
| A-002 | User login → JWT access + refresh tokens | P0 | M | `[x]` |
| A-003 | Token refresh endpoint | P0 | S | `[x]` |
| A-004 | Logout (invalidate refresh token in DB) | P0 | XS | `[x]` |
| A-005 | JWT strategy + guards (JwtAuthGuard, RolesGuard) | P0 | S | `[x]` |
| A-006 | Role-based access control (ADMIN / MEMBER) | P0 | S | `[x]` |
| A-007 | Auth unit tests (register, login, refresh, logout) | P0 | M | `[x]` |
| W-001 | Next.js 15 app bootstrap (App Router, TypeScript) | P0 | S | `[x]` |
| W-002 | Tailwind CSS + shadcn/ui setup | P0 | S | `[x]` |
| W-003 | TanStack Query provider | P0 | XS | `[x]` |
| W-004 | Zustand auth store (token management, persist) | P0 | S | `[x]` |
| W-005 | Axios API client with JWT interceptors + auto-refresh | P0 | M | `[x]` |
| W-006 | Next.js middleware (route protection by role) | P0 | S | `[x]` |
| W-007 | Login page (form, validation, error states) | P0 | M | `[x]` |
| W-008 | Register page (form, validation, error states) | P0 | M | `[x]` |
| W-009 | Auth layout (branded centered card) | P0 | S | `[x]` |

---

### Sprint 2 · Shell & Theme Engine (Week 1–2)

| ID | Story | Priority | Size | Status |
|----|-------|----------|------|--------|
| T-001 | Theme token interface (`packages/themes`) | P0 | S | `[x]` |
| T-002 | Executive Glass theme (dark, gold accents) | P0 | S | `[x]` |
| T-003 | Executive Red theme | P1 | S | `[x]` |
| T-004 | Growth Green theme | P1 | S | `[x]` |
| T-005 | Corporate Light theme | P1 | S | `[x]` |
| T-006 | High Contrast theme | P1 | S | `[x]` |
| T-007 | ThemeProvider (CSS var injection, no page reload) | P0 | M | `[x]` |
| T-008 | Zustand theme store (persist selection) | P0 | S | `[x]` |
| T-009 | Theme switcher component (dropdown with preview) | P0 | S | `[ ]` |
| W-010 | Dashboard shell layout (sidebar + topbar + content area) | P0 | L | `[ ]` |
| W-011 | Glassmorphism sidebar (fixed, 280px, nav links, user card) | P0 | L | `[ ]` |
| W-012 | Topbar (search, notifications bell, user menu) | P0 | M | `[ ]` |
| W-013 | Sidebar mobile drawer (hamburger toggle) | P1 | M | `[ ]` |
| W-014 | Dashboard overview page (stats cards, quick links) | P0 | M | `[ ]` |

---

### Sprint 3 · Community Feed (Week 2)

| ID | Story | Priority | Size | Status |
|----|-------|----------|------|--------|
| B-001 | `POST /api/posts` — create post | P0 | S | `[x]` |
| B-002 | `GET /api/posts` — paginated feed | P0 | S | `[x]` |
| B-003 | `DELETE /api/posts/:id` — delete own post (admin: any) | P0 | S | `[x]` |
| B-004 | `POST /api/posts/:id/comments` — add comment | P0 | S | `[x]` |
| B-005 | `GET /api/posts/:id/comments` — list comments | P0 | S | `[x]` |
| B-006 | `POST /api/posts/:id/reactions` — toggle reaction | P0 | S | `[x]` |
| B-007 | `PATCH /api/posts/:id/pin` — admin pin/unpin | P1 | XS | `[ ]` |
| B-008 | Posts service unit tests | P0 | M | `[x]` |
| W-015 | Create post composer (text area, char count, submit) | P0 | M | `[ ]` |
| W-016 | Post card (author avatar, content, timestamp, reactions) | P0 | M | `[ ]` |
| W-017 | Reaction bar (like, heart, celebrate, insightful + counts) | P0 | M | `[ ]` |
| W-018 | Comment list + inline comment form | P0 | M | `[ ]` |
| W-019 | Optimistic UI for reactions and comments | P1 | M | `[ ]` |
| W-020 | Infinite scroll / load more feed pagination | P1 | M | `[ ]` |
| W-021 | Feed page layout with sticky composer | P0 | S | `[ ]` |

---

### Sprint 4 · Learning Hub (Week 3)

| ID | Story | Priority | Size | Status |
|----|-------|----------|------|--------|
| C-001 | `GET /api/courses` — list published courses | P0 | S | `[x]` |
| C-002 | `GET /api/courses/:id` — course detail with modules | P0 | S | `[x]` |
| C-003 | `POST /api/courses/:id/progress` — update progress | P0 | S | `[x]` |
| C-004 | `GET /api/courses/:id/progress` — get user progress | P0 | XS | `[x]` |
| C-005 | Admin: create/update/delete course | P0 | M | `[x]` |
| C-006 | Admin: create/update/delete modules and lessons | P0 | M | `[ ]` |
| C-007 | Courses service unit tests | P0 | M | `[x]` |
| W-022 | Course catalog page (grid of course cards) | P0 | M | `[ ]` |
| W-023 | Course card (cover, title, progress bar, module count) | P0 | S | `[ ]` |
| W-024 | Course detail page (modules accordion, lesson list) | P0 | L | `[ ]` |
| W-025 | Lesson viewer (markdown content, next/prev nav) | P0 | M | `[ ]` |
| W-026 | Progress tracking (per-lesson completion checkbox) | P0 | M | `[ ]` |
| W-027 | Course progress bar component | P0 | S | `[ ]` |

---

### Sprint 5 · Events & Members (Week 3–4)

| ID | Story | Priority | Size | Status |
|----|-------|----------|------|--------|
| E-001 | `GET /api/events` — list upcoming events | P0 | S | `[x]` |
| E-002 | `GET /api/events/:id` — event detail | P0 | XS | `[x]` |
| E-003 | `POST /api/events/:id/rsvp` — toggle RSVP | P0 | S | `[x]` |
| E-004 | Admin: create/update/delete events | P0 | M | `[x]` |
| E-005 | Events service unit tests | P0 | M | `[ ]` |
| W-028 | Events list page (upcoming, past tabs) | P0 | M | `[ ]` |
| W-029 | Event card (date badge, title, location, RSVP count) | P0 | S | `[ ]` |
| W-030 | RSVP button (going / maybe / not going) | P0 | S | `[ ]` |
| W-031 | Calendar view (monthly grid, event dots) | P1 | L | `[ ]` |
| W-032 | Event detail modal/page | P0 | M | `[ ]` |
| M-001 | `GET /api/users` — member directory (paginated) | P0 | S | `[x]` |
| M-002 | `GET /api/users/:id` — public profile | P0 | XS | `[x]` |
| M-003 | `PATCH /api/users/me` — update own profile | P0 | S | `[x]` |
| W-033 | Member directory page (grid, search, filter by role) | P0 | M | `[ ]` |
| W-034 | Member card (avatar, name, bio, join date) | P0 | S | `[ ]` |
| W-035 | Public profile page | P0 | M | `[ ]` |
| W-036 | Edit profile page (name, bio, avatar upload) | P0 | M | `[ ]` |

---

### Sprint 6 · Admin Panel (Week 4)

| ID | Story | Priority | Size | Status |
|----|-------|----------|------|--------|
| AD-001 | `GET /api/admin/users` — list all users with filters | P0 | S | `[x]` |
| AD-002 | `PATCH /api/admin/users/:id/role` — change role | P0 | XS | `[x]` |
| AD-003 | `PATCH /api/admin/users/:id/deactivate` — ban user | P0 | XS | `[x]` |
| AD-004 | `GET /api/admin/posts` — all posts (incl. hidden) | P0 | S | `[x]` |
| AD-005 | `PATCH /api/admin/posts/:id/hide` — moderate post | P0 | XS | `[x]` |
| AD-006 | `GET /api/admin/stats` — dashboard KPIs | P0 | S | `[x]` |
| W-037 | Admin layout (separate nav, admin badge) | P0 | M | `[ ]` |
| W-038 | Admin dashboard (user count, post count, active events) | P0 | M | `[ ]` |
| W-039 | Users table (search, role badge, deactivate toggle) | P0 | L | `[ ]` |
| W-040 | Content moderation queue (flagged/all posts, hide button) | P0 | L | `[ ]` |
| W-041 | Course management table (publish toggle, edit, delete) | P0 | M | `[ ]` |
| W-042 | Event management table (edit, delete) | P0 | M | `[ ]` |

---

### Sprint 7 · GDPR & Settings (Week 4–5)

| ID | Story | Priority | Size | Status |
|----|-------|----------|------|--------|
| G-001 | `POST /api/gdpr/consent` — record cookie consent | P0 | S | `[x]` |
| G-002 | `GET /api/gdpr/export` — export own data (JSON) | P0 | M | `[x]` |
| G-003 | `DELETE /api/gdpr/account` — delete own account + data | P0 | M | `[x]` |
| G-004 | `PATCH /api/gdpr/privacy` — update privacy settings | P0 | S | `[x]` |
| G-005 | Audit log writes for sensitive actions | P1 | M | `[ ]` |
| G-006 | Data anonymization on account delete | P0 | M | `[ ]` |
| W-043 | Cookie consent banner (accept / customize / reject) | P0 | M | `[ ]` |
| W-044 | Settings page — theme switcher | P0 | S | `[ ]` |
| W-045 | Settings page — privacy controls | P0 | M | `[ ]` |
| W-046 | Settings page — data export download button | P0 | S | `[ ]` |
| W-047 | Settings page — delete account confirmation flow | P0 | M | `[ ]` |

---

### Sprint 8 · Quality, Docs & Deployment (Week 5)

| ID | Story | Priority | Size | Status |
|----|-------|----------|------|--------|
| Q-001 | Frontend unit tests (components, hooks) | P0 | L | `[ ]` |
| Q-002 | Playwright e2e: auth flow | P0 | M | `[ ]` |
| Q-003 | Playwright e2e: feed (post, comment, react) | P0 | M | `[ ]` |
| Q-004 | Playwright e2e: course enroll + progress | P1 | M | `[ ]` |
| Q-005 | Playwright e2e: event RSVP | P1 | S | `[ ]` |
| Q-006 | API integration tests (Supertest) | P0 | L | `[ ]` |
| Q-007 | Coverage gates enforced in CI (90% overall) | P0 | S | `[ ]` |
| D-001 | GitHub Actions CI pipeline (lint, test, build) | P0 | M | `[ ]` |
| D-002 | Dockerfile optimisation (multi-stage, non-root user) | P0 | S | `[ ]` |
| D-003 | Automated Prisma migration in Docker entrypoint | P0 | S | `[ ]` |
| D-004 | Health check endpoints wired into Docker Compose | P0 | XS | `[x]` |
| D-005 | DEPLOYMENT.md (one-command setup + VPS guide) | P0 | M | `[ ]` |
| D-006 | ARCHITECTURE.md | P0 | M | `[ ]` |
| D-007 | API.md (endpoint reference) | P0 | M | `[ ]` |
| D-008 | SECURITY.md | P0 | S | `[ ]` |
| D-009 | GDPR.md | P0 | S | `[ ]` |
| D-010 | THEMING.md | P0 | S | `[ ]` |
| D-011 | CHANGELOG.md (initial 1.0.0 entry) | P0 | S | `[ ]` |

---

## Phase 2 — Post-MVP

> Deferred until Phase 1 is shipped and stable.

| ID | Feature | Priority |
|----|---------|----------|
| P2-001 | Private messaging (inbox, threads, read receipts) | P1 |
| P2-002 | In-app notifications (bell, push, email digest) | P1 |
| P2-003 | Command palette (`⌘K`) | P2 |
| P2-004 | Analytics dashboard (DAU, retention, funnel) | P1 |
| P2-005 | White-labeling (custom domain, logo, colors per tenant) | P1 |
| P2-006 | Multi-tenancy (isolated workspaces) | P1 |
| P2-007 | Mobile apps (React Native) | P2 |
| P2-008 | AI features (content suggestions, summarisation) | P2 |
| P2-009 | Advanced reporting (exports, scheduled reports) | P2 |
| P2-010 | Stripe billing (subscriptions, seats) | P2 |
| P2-011 | SSO / OAuth (Google, LinkedIn) | P2 |
| P2-012 | Rich-text post editor (Tiptap) | P1 |
| P2-013 | File/image uploads to S3-compatible storage | P1 |
| P2-014 | Video lessons (HLS streaming) | P2 |
| P2-015 | Live events / webinar integration | P2 |

---

## Definition of Done

A story is **Done** when:

- [ ] Feature works as described in a running app
- [ ] Unit tests written and passing
- [ ] Coverage thresholds met (90% overall / 95% business logic)
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] No lint errors (`pnpm lint`)
- [ ] CHANGELOG.md updated
- [ ] PR reviewed and merged to `develop`

---

## Velocity Notes

- Sprint = 1 week
- Estimate in T-shirt sizes: XS (< 1h), S (1–2h), M (2–4h), L (4–8h), XL (> 8h)
- P0 = must have for MVP · P1 = should have · P2 = nice to have · P3 = future
