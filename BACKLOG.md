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
| F-006 | Health check endpoint (`GET /health`) | P0 | XS | `[x]` |
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
| T-003 | ~~Executive Red theme~~ (removed) | P1 | S | `[-]` |
| T-004 | ~~Growth Green theme~~ (removed) | P1 | S | `[-]` |
| T-005 | Corporate Light theme | P1 | S | `[x]` |
| T-006 | High Contrast theme | P1 | S | `[x]` |
| T-007 | ThemeProvider (CSS var injection, no page reload) | P0 | M | `[x]` |
| T-008 | Zustand theme store (persist selection) | P0 | S | `[x]` |
| T-009 | Theme switcher component (dropdown with preview) | P0 | S | `[x]` |
| W-010 | Dashboard shell layout (sidebar + topbar + content area) | P0 | L | `[x]` |
| W-011 | Glassmorphism sidebar (fixed, 280px, nav links, user card) | P0 | L | `[x]` |
| W-012 | Topbar (search, notifications bell, user menu) | P0 | M | `[x]` |
| W-013 | Sidebar mobile drawer (hamburger toggle) | P1 | M | `[x]` |
| W-014 | Dashboard overview page (stats cards, quick links) | P0 | M | `[x]` |

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
| B-007 | `PATCH /api/posts/:id/pin` — admin pin/unpin | P1 | XS | `[x]` |
| B-008 | Posts service unit tests | P0 | M | `[x]` |
| W-015 | Create post composer (text area, char count, submit) | P0 | M | `[x]` |
| W-016 | Post card (author avatar, content, timestamp, reactions) | P0 | M | `[x]` |
| W-017 | Reaction bar (like, heart, celebrate, insightful + counts) | P0 | M | `[x]` |
| W-018 | Comment list + inline comment form | P0 | M | `[x]` |
| W-019 | Optimistic UI for reactions and comments | P1 | M | `[x]` |
| W-020 | Infinite scroll / load more feed pagination | P1 | M | `[x]` |
| W-021 | Feed page layout with sticky composer | P0 | S | `[x]` |

---

### Sprint 4 · Learning Hub (Week 3)

| ID | Story | Priority | Size | Status |
|----|-------|----------|------|--------|
| C-001 | `GET /api/courses` — list published courses | P0 | S | `[x]` |
| C-002 | `GET /api/courses/:id` — course detail with modules | P0 | S | `[x]` |
| C-003 | `POST /api/courses/:id/progress` — update progress | P0 | S | `[x]` |
| C-004 | `GET /api/courses/:id/progress` — get user progress | P0 | XS | `[x]` |
| C-005 | Admin: create/update/delete course | P0 | M | `[x]` |
| C-006 | Admin: create/update/delete modules and lessons | P0 | M | `[x]` |
| C-007 | Courses service unit tests | P0 | M | `[x]` |
| W-022 | Course catalog page (grid of course cards) | P0 | M | `[x]` |
| W-023 | Course card (cover, title, progress bar, module count) | P0 | S | `[x]` |
| W-024 | Course detail page (modules accordion, lesson list) | P0 | L | `[x]` |
| W-025 | Lesson viewer (markdown content, next/prev nav) | P0 | M | `[x]` |
| W-026 | Progress tracking (per-lesson completion checkbox) | P0 | M | `[x]` |
| W-027 | Course progress bar component | P0 | S | `[x]` |

---

### Sprint 5 · Events & Members (Week 3–4)

| ID | Story | Priority | Size | Status |
|----|-------|----------|------|--------|
| E-001 | `GET /api/events` — list upcoming events | P0 | S | `[x]` |
| E-002 | `GET /api/events/:id` — event detail | P0 | XS | `[x]` |
| E-003 | `POST /api/events/:id/rsvp` — toggle RSVP | P0 | S | `[x]` |
| E-004 | Admin: create/update/delete events | P0 | M | `[x]` |
| E-005 | Events service unit tests | P0 | M | `[x]` |
| W-028 | Events list page (upcoming, past tabs) | P0 | M | `[x]` |
| W-029 | Event card (date badge, title, location, RSVP count) | P0 | S | `[x]` |
| W-030 | RSVP button (going / maybe / not going) | P0 | S | `[x]` |
| W-031 | Calendar view (monthly grid, event dots) | P1 | L | `[x]` |
| W-032 | Event detail modal/page | P0 | M | `[x]` |
| M-001 | `GET /api/users` — member directory (paginated) | P0 | S | `[x]` |
| M-002 | `GET /api/users/:id` — public profile | P0 | XS | `[x]` |
| M-003 | `PATCH /api/users/me` — update own profile | P0 | S | `[x]` |
| W-033 | Member directory page (grid, search, filter by role) | P0 | M | `[x]` |
| W-034 | Member card (avatar, name, bio, join date) | P0 | S | `[x]` |
| W-035 | Public profile page | P0 | M | `[x]` |
| W-036 | Edit profile page (name, bio, avatar upload) | P0 | M | `[x]` |

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
| AD-007 | `GET /api/admin/audit-log` — audit log entries | P1 | S | `[x]` |
| AD-008 | `GET /api/admin/analytics` — extended platform analytics | P1 | M | `[x]` |
| AD-009 | `GET/PATCH /api/admin/settings` — platform settings | P1 | M | `[x]` |
| W-037 | Admin layout (separate nav, admin badge) | P0 | M | `[x]` |
| W-038 | Admin dashboard (user count, post count, active events) | P0 | M | `[x]` |
| W-039 | Users table (search, role badge, deactivate toggle) | P0 | L | `[x]` |
| W-040 | Content moderation queue (flagged/all posts, hide button) | P0 | L | `[x]` |
| W-041 | Course management table (publish toggle, edit, delete) | P0 | M | `[x]` |
| W-042 | Event management table (edit, delete) | P0 | M | `[x]` |
| W-048 | Admin analytics page (DAU graph, top content, funnel) | P1 | L | `[x]` |
| W-049 | Platform settings page (name, logo, colours, signup toggle) | P1 | M | `[x]` |

---

### Sprint 7 · GDPR, Settings & Invites (Week 4–5)

| ID | Story | Priority | Size | Status |
|----|-------|----------|------|--------|
| G-001 | `POST /api/gdpr/consent` — record cookie consent | P0 | S | `[x]` |
| G-002 | `GET /api/gdpr/export` — export own data (JSON) | P0 | M | `[x]` |
| G-003 | `DELETE /api/gdpr/account` — delete own account + data | P0 | M | `[x]` |
| G-004 | `PATCH /api/gdpr/privacy` — update privacy settings | P0 | S | `[x]` |
| G-005 | Audit log writes for sensitive admin actions | P1 | M | `[x]` |
| G-006 | Data anonymization on account delete | P0 | M | `[x]` |
| I-001 | `POST /api/admin/invites` — create invite (email + token) | P0 | S | `[x]` |
| I-002 | `GET /api/admin/invites` — list all invites (paginated) | P0 | S | `[x]` |
| I-003 | `DELETE /api/admin/invites/:id` — revoke invite | P0 | XS | `[x]` |
| I-004 | Invite token validation in auth register flow | P0 | S | `[x]` |
| I-005 | Invite token consumption on successful registration | P0 | XS | `[x]` |
| I-006 | 7-day expiry enforcement on invite validation | P0 | XS | `[x]` |
| W-043 | Cookie consent banner (accept / customize / reject) | P0 | M | `[x]` |
| W-044 | Settings page — theme switcher | P0 | S | `[x]` |
| W-045 | Settings page — privacy controls | P0 | M | `[x]` |
| W-046 | Settings page — data export download button | P0 | S | `[x]` |
| W-047 | Settings page — delete account confirmation flow | P0 | M | `[x]` |
| W-050 | Admin invites page (send form, status badges, copy link, revoke) | P0 | M | `[x]` |
| W-051 | Register page: invite token from `?invite=` query param | P0 | S | `[x]` |

---

### Sprint 8 · Quality, Docs & Deployment (Week 5)

| ID | Story | Priority | Size | Status |
|----|-------|----------|------|--------|
| Q-001 | Frontend unit tests (components, hooks) | P0 | L | `[x]` |
| Q-002 | Playwright e2e: auth flow | P0 | M | `[x]` |
| Q-003 | Playwright e2e: feed (post, comment, react) | P0 | M | `[x]` |
| Q-004 | Playwright e2e: course enroll + progress | P1 | M | `[x]` |
| Q-005 | Playwright e2e: event RSVP | P1 | S | `[x]` |
| Q-006 | API integration tests (Supertest) | P0 | L | `[x]` |
| Q-007 | Coverage gates enforced in CI (90% overall) | P0 | S | `[x]` |
| D-001 | GitHub Actions CI pipeline (lint, typecheck, test, build, e2e) | P0 | M | `[x]` |
| D-002 | Dockerfile optimisation (multi-stage, non-root user) | P0 | S | `[x]` |
| D-003 | Automated Prisma migration in Docker entrypoint | P0 | S | `[x]` |
| D-004 | Health check endpoints wired into Docker Compose | P0 | XS | `[x]` |
| D-005 | DEPLOYMENT.md (one-command setup + VPS guide) | P0 | M | `[x]` |
| D-006 | ARCHITECTURE.md | P0 | M | `[x]` |
| D-007 | API.md (endpoint reference) | P0 | M | `[x]` |
| D-008 | SECURITY.md | P0 | S | `[x]` |
| D-009 | GDPR.md | P0 | S | `[x]` |
| D-010 | THEMING.md | P0 | S | `[x]` |
| D-011 | CHANGELOG.md (initial 1.0.0 entry) | P0 | S | `[x]` |

---

## Phase 2 — Post-MVP

### Sprint 9 · Engagement & Discovery (Shipped)

| ID | Story | Priority | Size | Status |
|----|-------|----------|------|--------|
| N-001 | `GET /api/notifications` — list notifications (paginated) | P1 | S | `[x]` |
| N-002 | `PATCH /api/notifications/:id/read` — mark as read | P1 | XS | `[x]` |
| N-003 | `PATCH /api/notifications/read-all` — mark all read | P1 | XS | `[x]` |
| N-004 | Notification triggers: follow, comment, reaction | P1 | M | `[x]` |
| N-005 | Notification bell + dropdown (unread count badge) | P1 | M | `[x]` |
| FL-001 | `POST /api/users/:id/follow` — follow a member | P1 | S | `[x]` |
| FL-002 | `DELETE /api/users/:id/follow` — unfollow | P1 | XS | `[x]` |
| FL-003 | `GET /api/users/:id/followers` — follower list | P1 | S | `[x]` |
| FL-004 | `GET /api/users/:id/following` — following list | P1 | S | `[x]` |
| FL-005 | Follow / Unfollow button on member cards and profiles | P1 | S | `[x]` |
| SR-001 | `GET /api/search?q=` — unified search (posts, users, courses, events) | P1 | M | `[x]` |
| SR-002 | Command palette (⌘K / Ctrl+K) with live search + keyboard nav | P1 | L | `[x]` |
| SR-003 | Hashtag extraction on post create + click-to-filter feed | P1 | M | `[x]` |
| SR-004 | Latest / Trending tabs on feed | P1 | S | `[x]` |
| SR-005 | Activity badges on member profiles | P1 | S | `[x]` |
| SR-006 | Top Contributors leaderboard on members page | P1 | M | `[x]` |

---

### Sprint 10 · Messaging & Analytics (Shipped)

| ID | Story | Priority | Size | Status |
|----|-------|----------|------|--------|
| MSG-001 | `POST /api/messages` — start or continue a conversation | P1 | M | `[x]` |
| MSG-002 | `GET /api/messages/conversations` — list my conversations | P1 | S | `[x]` |
| MSG-003 | `GET /api/messages/conversations/:id` — messages in thread | P1 | S | `[x]` |
| MSG-004 | Real-time message delivery (client polling) | P1 | M | `[x]` |
| MSG-005 | Messages inbox page (conversation list + chat panel) | P1 | L | `[x]` |
| AN-001 | Extended analytics: DAU, WAU, MAU retention | P1 | M | `[x]` |
| AN-002 | Content analytics: top posts, comments per day | P1 | M | `[x]` |
| AN-003 | Course analytics: enrolments, completion rate | P1 | M | `[x]` |
| AN-004 | Event analytics: RSVP trends | P1 | S | `[x]` |
| AN-005 | Messaging analytics: message volume | P1 | S | `[x]` |
| WL-001 | PlatformSettings model (name, logo URL, primary colour, signup toggle) | P1 | M | `[x]` |
| WL-002 | Admin settings page: update platform name, logo, colours | P1 | M | `[x]` |
| WL-003 | Platform name injected into layout + auth pages dynamically | P1 | S | `[x]` |

---

### Remaining Phase 2 Items — Completed

| ID | Feature | Priority | Status |
|----|---------|----------|--------|
| P2-012 | Rich-text post editor (Tiptap — bold, tables, embeds) | P1 | `[x]` |
| P2-016 | Email digest (daily / weekly notification summary) | P1 | `[x]` |
| P2-019 | Public community landing page (pre-login) | P1 | `[x]` |
| P2-020 | API rate limiting per user (not just per IP) | P1 | `[x]` |
| P2-021 | HTTPS reverse proxy (Nginx + Let's Encrypt) in Docker Compose | P0 | `[x]` |
| P2-022 | Event recordings page (browse past meeting recordings) | P1 | `[x]` |
| P2-023 | Calendar invites (.ics) on event RSVP with opt-out setting | P1 | `[x]` |
| P2-024 | Dedicated search page with category filters (posts, members, events, courses, recordings) | P1 | `[x]` |

---

### Phase 3 — GrowthLeaders Feature Parity & Beyond

> Features derived from the GrowthLeaders reference platform, user wishlist, and gap analysis.
> Grouped by theme. Priority reflects user impact and implementation dependency.

#### 3A · Onboarding & First Experience

| ID | Feature | Priority | Size | Status |
|----|---------|----------|------|--------|
| GL-001 | In-platform onboarding sequence (welcome wizard, profile setup, tour) — no emails, all in-app | P1 | L | `[x]` |
| GL-002 | "Say hello" / introduce-yourself prompt for new members (pinned intro thread or dedicated section) | P1 | M | `[x]` |
| GL-003 | Post types: question, discussion, announcement, introduction — filterable in feed | P1 | M | `[x]` |

#### 3B · Personal Development Area ("My Private Area")

| ID | Feature | Priority | Size | Status |
|----|---------|----------|------|--------|
| GL-004 | "My Goals" — define top 5 goals for the year/month with progress tracking | P1 | L | `[x]` |
| GL-005 | "My Most Important Challenge" — single pinned challenge with reflection prompts | P1 | M | `[x]` |
| GL-006 | Course notes — personal notes per course/lesson, saved privately | P1 | M | `[x]` |
| GL-007 | Self-assessment based on the GROWTH model (questionnaire + radar chart) | P1 | L | `[x]` |
| GL-008 | Assessment results recommend a personalised development path (suggested courses, events) | P2 | XL | `[x]` |

#### 3C · Journaling

| ID | Feature | Priority | Size | Status |
|----|---------|----------|------|--------|
| GL-009 | In-app journaling — rich-text daily/weekly journal entries (private) | P1 | L | `[x]` |
| GL-010 | Journaling streaks & tracking — calendar heatmap, current streak, weekly/daily completion | P1 | M | `[x]` |
| GL-011 | Journal prompts — admin-editable prompts with category show/hide (reflection, gratitude, leadership, growth, challenge) | P2 | S | `[x]` |

#### 3D · Content Discovery & Categories

| ID | Feature | Priority | Size | Status |
|----|---------|----------|------|--------|
| GL-012 | "Explore by category" — topic tags on courses, events, posts (e.g. Growth, Rhythms, Empowerment, Impact, Teams, Balance, AI, Other) | P1 | L | `[x]` |
| GL-013 | Category landing pages — browse all content filtered by topic | P1 | M | `[x]` |
| GL-014 | "Leadership and AI" section — curated mix of courses, methods, news, testimonials on AI + leadership | P1 | M | `[x]` |

#### 3E · Q&A & AI Coach

| ID | Feature | Priority | Size | Status |
|----|---------|----------|------|--------|
| GL-015 | "My Questions" — dedicated Q&A feed (to Peter / to the community), separate from main feed | P1 | M | `[x]` |
| GL-016 | *Ambitious*: AI Coach ("Pete — your virtual coach") — AI avatar answers questions instantly using platform content as context | P2 | XL | `[ ]` |

#### 3F · Events & Workflows

| ID | Feature | Priority | Size | Status |
|----|---------|----------|------|--------|
| GL-017 | Event reminders — automated email/in-app reminder 24h and 1h before event | P1 | M | `[x]` |
| GL-018 | Event topic/date voting — members vote on proposed topics and preferred dates for upcoming events | P1 | L | `[x]` |

#### 3G · Social Proof & Engagement

| ID | Feature | Priority | Size | Status |
|----|---------|----------|------|--------|
| GL-019 | Testimonials section — prominent but subtle; admin-managed or member-submitted success stories | P1 | M | `[x]` |
| GL-020 | Success stories — dedicated section or feed filter for member success stories / case studies | P1 | M | `[x]` |

#### 3H · Learning Groups

| ID | Feature | Priority | Size | Status |
|----|---------|----------|------|--------|
| GL-021 | "My Learning Group" (Lernpartner) — small private groups with shared goals, group chat, progress visibility | P1 | XL | `[x]` |

#### 3I · Personalisation & Digest

| ID | Feature | Priority | Size | Status |
|----|---------|----------|------|--------|
| GL-022 | Customisable digest templates — admin designs email digest layout (header, sections, branding) | P2 | L | `[x]` |
| GL-023 | "Customise your view" — members pick interests/topics, dashboard and feed prioritise matching content | P2 | L | `[x]` |

#### 3J · Access Tiers

| ID | Feature | Priority | Size | Status |
|----|---------|----------|------|--------|
| GL-024 | Free-tier feature gating — limited visibility (e.g. only landing page, 1 free course, no DMs) with upgrade prompt | P1 | L | `[x]` |
| GL-025 | Stripe billing integration (subscription checkout, customer portal, webhooks) | P2 | XL | `[x]` |

#### 3K · Internationalisation

| ID | Feature | Priority | Size | Status |
|----|---------|----------|------|--------|
| GL-026 | *Ambitious*: Bilingual platform (English + German) — next-intl, locale switcher, translated UI strings | P2 | XL | `[ ]` |

#### 3L · Mobile & Infrastructure

| ID | Feature | Priority | Size | Status |
|----|---------|----------|------|--------|
| GL-027 | Mobile app (React Native / Expo) — core features: feed, events, messages, notifications | P2 | XL | `[ ]` |
| GL-028 | SSO / OAuth (Google, LinkedIn) | P2 | L | `[x]` |
| GL-029 | File / image uploads to S3-compatible storage | P1 | L | `[x]` |
| GL-030 | Multi-tenancy (isolated workspaces per organisation) | P2 | XL | `[ ]` |
| GL-031 | Post bookmarks / saved items | P2 | M | `[x]` |
| GL-032 | Polls within posts | P2 | M | `[x]` |
| GL-033 | Video lessons (HLS streaming, chapter markers) | P2 | XL | `[ ]` |
| GL-034 | Live events / webinar integration | P2 | XL | `[ ]` |
| GL-035 | Advanced reporting (CSV/PDF exports, scheduled reports) | P2 | L | `[x]` |

---

## Security & Reliability Fixes — Adversarial QA Findings

> Discovered by adversarial QA audit (June 2026). Every item has a corresponding
> failing test in `*.adversarial.spec.ts` that documents the broken invariant.
> Fix the code → update the test assertion to assert correct behaviour.

### 🔴 Critical (P0 — fix before next release)

| ID | Finding | Root cause | Size | Status |
|----|---------|------------|------|--------|
| SEC-001 | **Hidden posts accept comments & reactions** — moderation bypass | `addComment` / `toggleReaction` query posts without `isHidden: false` filter | S | `[x]` |
| SEC-002 | **RSVP capacity TOCTOU race** — `maxRsvps` can be exceeded under concurrent load | `rsvp()` reads count then writes in a non-atomic check-then-act pattern; no DB-level lock | M | `[x]` |
| SEC-003 | **Unpublished course content accessible by ID** — content leak before launch | `CoursesService.findOne` and `getLesson` have no `isPublished` filter | S | `[x]` |
| SEC-004 | **`JWT_SECRET \|\| 'default-secret'` fallback in production** — trivially forgeable JWTs | `auth.service.ts` and `jwt.strategy.ts` fall back to a known-default secret when env var is absent | S | `[x]` |
| SEC-005 | **Concurrent token refresh duplicates sessions** — ghost sessions | `refresh()` is not atomic: both concurrent requests pass the DB validation check before either deletes the token | M | `[x]` |

### 🟠 High (P0/P1)

| ID | Finding | Root cause | Size | Status |
|----|---------|------------|------|--------|
| SEC-006 | **Audit log is never written** — all admin actions are untracked | `AdminService` never calls `prisma.auditLog.create`; the `AuditLog` table is unused | M | `[x]` |
| SEC-007 | **No last-admin guard** — admin can self-demote or self-deactivate, locking out the system | `updateUserRole` / `toggleUserActive` have no check for self-targeting or last-admin scenarios | S | `[x]` |
| SEC-008 | **GDPR data export loads all user data in a single unbounded query** — OOM risk | `exportUserData` uses a single `include`-heavy Prisma query with no pagination or streaming | L | `[x]` |
| SEC-009 | **Login accumulates refresh tokens without cleanup** — unbounded DB growth | `generateTokens` always `INSERT`s a new refresh token; no cleanup of existing tokens for the same user on login | S | `[x]` |

### 🟡 Medium (P1)

| ID | Finding | Root cause | Size | Status |
|----|---------|------------|------|--------|
| SEC-010 | **Event `update()` skips start/end date validation** — events can have `endsAt < startsAt` | `create()` validates temporal order; `update()` does not run the same check | XS | `[x]` |
| SEC-011 | **RSVP status is not enum-validated at the route level** — invalid values produce unhandled 500 | `EventsController` accepts `body: { status: string }` with no `@IsEnum(RsvpStatus)` guard | XS | `[x]` |
| SEC-012 | **Reaction type is not enum-validated at the route level** — invalid values produce unhandled 500 | `PostsController` reads `:type` URL param with no `@IsEnum(ReactionType)` guard | XS | `[x]` |
| SEC-013 | **Concurrent reaction toggle race** — unique-constraint violation produces unhandled 500 | `toggleReaction` check-then-create is not wrapped in a transaction; simultaneous identical requests hit P2002 | S | `[x]` |
| SEC-014 | **Course progress percentage is unconstrained** — negative, >100, NaN, Infinity all accepted | `updateProgress` has no bounds validation; DTO for progress update is missing `@Min(0) @Max(100)` | XS | `[x]` |
| SEC-015 | **`updateUserRole` accepts arbitrary strings** — invalid role produces unhandled 500 from DB | `AdminService.updateUserRole` casts `role as any`; no `@IsEnum(Role)` on the controller body | XS | `[x]` |
| SEC-016 | **Anonymous consent `sessionId` is attacker-controlled** — consent hijacking possible | `saveAnonymousConsent` applies no length limit or ownership validation to the caller-supplied `sessionId` | S | `[x]` |
| SEC-017 | **Cookie consent rows grow unboundedly** — append-only table, no dedup or cleanup | `updateConsent` always calls `prisma.cookieConsent.create`; should upsert on `(userId)` | XS | `[x]` |
| SEC-018 | **`avatarUrl` accepts `javascript:` and `data:` URIs** — stored XSS vector | `UpdateProfileDto.avatarUrl` uses `@IsString()` only; no `@IsUrl({ protocols: ['http','https'] })` | XS | `[x]` |
| SEC-019 | **Member directory exposes user emails to all authenticated members** — PII enumeration | `UsersService.findAll` `select` includes `email`; email should be excluded from public member-directory responses | S | `[x]` |
| SEC-020 | **`limit=0` produces `Infinity` totalPages across all paginated endpoints** | `Math.ceil(n / 0) = Infinity` serialises to `null` in JSON; `page=0` produces negative `skip` rejected by Prisma | S | `[x]` |
| SEC-021 | **Moderation queue has no pagination** — unbounded response under spam floods | `getModerationQueue` uses `findMany` with no `take`/`skip` | S | `[x]` |
| SEC-022 | **Email uniqueness is case-sensitive** — `USER@EXAMPLE.COM` and `user@example.com` can co-exist | `register` does not normalise email to lowercase before the uniqueness check | XS | `[x]` |
| SEC-023 | **Auth throttler globally permissive at 100 req/15min** | Reduced global auth throttler limit from 100 to 60 per 15 minutes | XS | `[x]` |
| SEC-024 | **Predictable default JWT secrets in docker-compose.yml** | Replaced `:-` defaults with `:?` error syntax — compose now fails fast if secrets unset | XS | `[x]` |
| SEC-025 | **Login rate limit at 20/15min enables credential stuffing** | Tightened login throttle from 20 to 10 per 15 min | XS | `[x]` |
| SEC-026 | **Avatar URL SSRF via x-forwarded-host header injection** | Removed raw header reads; use `req.protocol` and `req.get('host')` which respect Express trust proxy | S | `[x]` |
| SEC-027 | **Post delete error silently swallowed** | Added `alert()` feedback on delete failure instead of empty catch block | XS | `[x]` |
| SEC-028 | **Refresh/logout endpoints lack per-route @Throttle** | Added `@Throttle` decorators: refresh 30/15min, logout 10/15min | XS | `[x]` |
| SEC-029 | **Avatar upload MIME check uses Content-Type, not file magic bytes** | Added magic byte validation post-upload; rejects and deletes files that don't match declared MIME | S | `[x]` |
| SEC-030 | **Backup service exposes PGPASSWORD in environment** | Replaced `PGPASSWORD` env var with `.pgpass` file created at runtime with 600 perms, deleted after use | S | `[x]` |
| SEC-031 | **Free tier self-upgrade bypass — no payment verification** | Disabled self-upgrade endpoint (returns 501) until billing integration | M | `[x]` |
| SEC-032 | **Arbitrary tier string injection via admin endpoint** | Added enum validation — only FREE/PREMIUM accepted | S | `[x]` |
| SEC-033 | **S3 local-disk mode path traversal** | Added resolved path prefix check to prevent directory traversal | M | `[x]` |
| SEC-034 | **Upload MIME validation uses client Content-Type, not magic bytes** | Added magic byte validation for uploaded files | S | `[x]` |
| SEC-035 | **Learning group join() TOCTOU race condition** | Wrapped join logic in \$transaction | S | `[x]` |
| SEC-036 | **Non-member can view learning group metadata and member list** | Non-members now see only name, description, and member count | S | `[x]` |
| SEC-037 | **Unbounded proposedDates array in event proposals** | Added @ArrayMaxSize(20) to DTO | S | `[x]` |
| SEC-038 | **Event proposal voter privacy leak** | Non-admin users see aggregate counts only; admin sees voter details | S | `[x]` |
| SEC-039 | **Event proposal vote TOCTOU + phantom date voting** | Wrapped in \$transaction; validate dates against proposedDates | S | `[x]` |
| SEC-040 | **Journal content field has no length limit** | Added @MaxLength(50000) to content field | XS | `[x]` |
| SEC-041 | **Journal mood field accepts arbitrary strings** | Added @IsIn(VALID_MOODS) and @MaxLength(50) validation | XS | `[x]` |
| SEC-042 | **Unsafe date parsing in journal service** | Added YYYY-MM-DD regex validation with BadRequestException | S | `[x]` |
| SEC-043 | **Assessment questionIds not validated against server QUESTIONS** | Validate each questionId exists in server QUESTIONS array | S | `[x]` |
| SEC-044 | **Assessment score manipulation via duplicate dimension IDs** | Validate exact question set match and reject duplicates | S | `[x]` |

### CI Infrastructure

| ID | Finding | Root cause | Size | Status |
|----|---------|------------|------|--------|
| CI-001 | **E2E job: API server at `:3001` never becomes available** — `wait-on` times out every run | `HealthModule` missing `PrismaModule` import — NestJS DI fails, API never starts | M | `[x]` |

---

## UI / UX Bug Fixes — Exploratory QA Findings (June 2026)

> Discovered by automated Playwright exploratory QA run on PR #6 (2026-06-16).
> All items below were confirmed against a seeded local environment with screenshots.

### 🔴 High (P0/P1 — fix before production deploy)

| ID | Finding | Root cause | Size | Status |
|----|---------|------------|------|--------|
| UX-001 | **Settings profile fields not pre-populated on load** — users risk saving a blank name | `useEffect` populated form from query but ran on every profile refetch; added `profileInitialized` ref guard + disabled inputs while loading | S | `[x]` |
| UX-002 | **Rate limiter is IP-based — all users blocked when one IP exhausts quota** | Already fixed: custom `UserThrottlerGuard` uses authenticated user ID as throttle key; `trust proxy` enabled in main.ts | S | `[x]` |
| UX-003 | **Dashboard shows infinite skeleton when API returns 429 or any error** — no error fallback state | Added `isError` destructuring for all dashboard queries; stats cards show error indicator; events section has error/retry state | S | `[x]` |

### 🟡 Medium (P1)

| ID | Finding | Root cause | Size | Status |
|----|---------|------------|------|--------|
| UX-004 | **No "Send Message" button on member profile pages** — Messages empty state says "Start from a member's profile" but the button doesn't exist | Already fixed: Send Message button exists on `/members/[id]` using `useGetOrCreateConversation` hook | S | `[x]` |
| UX-005 | **Posts have no permalink / detail view** — cannot link to or open a single post | Wrapped post content area in `<Link href="/feed/[id]">` so clicking post body navigates to detail page; timestamp was already linked | S | `[x]` |
| UX-006 | **Cookie Preferences modal re-appears on every page navigation within the same session** — overlaps content | Already fixed: CookieBanner is in root layout (persists across navigations), uses localStorage directly, and only shows after 800ms delay if no consent found | S | `[x]` |

### 🟢 Low (P2)

| ID | Finding | Root cause | Size | Status |
|----|---------|------------|------|--------|
| UX-007 | **Logout button has no accessible label** — icon-only `→` arrow with no `aria-label`, title, or tooltip | Already fixed: sidebar logout button has `aria-label="Sign out"` and `title="Sign out"` | XS | `[x]` |
| UX-008 | **Members directory has no inline search/filter** — global ⌘K palette is the only search | Already fixed: `/members` page has search input filtering by name in real-time | S | `[x]` |

---


## User-Reported Bugs (June 2026)

> Reported during manual testing of Docker deployment.

| ID | Bug | Root cause | Size | Status |
|----|-----|------------|------|--------|
| BUG-001 | **Menu not working from Events page** — hamburger menu unresponsive on mobile | Events `page.tsx` rendered a duplicate `<Topbar>` without `onMenuClick`, overlaying the layout's Topbar | S | `[x]` |
| BUG-002 | **Menu not working from Members page** — same as BUG-001 | Members `page.tsx` rendered a duplicate `<Topbar>` without `onMenuClick` | S | `[x]` |
| BUG-003 | **Calendar: failed to load events** — error shown on Events page | Likely caused by duplicate Topbar layout issue (BUG-001); API endpoint itself is correct | S | `[x]` |
| BUG-004 | **Delete post breaks feed** — "failed to load posts" after admin deletes a post | `handleDelete` had no try-catch; `useDeletePost` only invalidated feed on `onSuccess` (not `onSettled`); `authorId` missing from API response | S | `[x]` |
| BUG-005 | **Create post not working** — post form submits but nothing happens | `handleSubmit` had no try-catch; `useCreatePost` only invalidated feed on `onSuccess` (not `onSettled`) | S | `[x]` |
| BUG-006 | **Docker API crash: EACCES on uploads** — container restart loop | Bind-mount replaces Dockerfile-created uploads dir with root-owned host dir; multer `diskStorage` crashes at module load | M | `[x]` |
| BUG-007 | **Data loss on `docker compose down -v`** — named volumes destroyed | Switched to host bind mounts under `DATA_DIR` | M | `[x]` |
| BUG-008 | **Docker web healthcheck always fails** — web container never becomes "healthy" | Healthcheck hit `/` which redirects to `/login`; BusyBox wget doesn't follow redirects | S | `[x]` |
| BUG-009 | **Menu not working from Settings page** — same duplicate Topbar pattern as BUG-001/002 | Settings `page.tsx` rendered its own `<Topbar>` without `onMenuClick` | S | `[x]` |
| BUG-010 | **No way to start a message from Messages page** — must navigate to member profile first | Messages panel had no "New Message" button or member picker | M | `[x]` |
| BUG-011 | **User avatar in topbar should be clickable** — no way to access profile or settings from topbar | Avatar was a static element with no dropdown menu; added dropdown with profile, settings, sign out | S | `[x]` |
| BUG-012 | **Remove Growth Green and Executive Red themes** — only 3 themes should remain | Deleted `executive-red.ts` and `growth-green.ts` from `packages/themes`; removed from theme switcher and index. Three themes remain: Executive Glass, Corporate Light, High Contrast | S | `[x]` |
| BUG-013 | **Events page shows "Failed to load events"** — all API calls fail after ~5 requests | `auth` named throttler had global limit of 5 req/15min applied to ALL endpoints; dashboard loads exhaust the quota, then events and other pages get 429'd. Fixed: auth throttler now permissive globally (100/15min), strict only on login (5/15min) and register (3/hour) | M | `[x]` |

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
