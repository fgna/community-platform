# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.36.0] — 2026-07-06

### Security
- **OPS-011**: Refresh tokens now set as httpOnly, Secure, SameSite=Strict cookies by the API on login, register, and token refresh; browser sends them automatically so JS never needs to read the value. The JWT refresh strategy accepts cookie-first with request-body fallback for non-browser clients.

### Added
- `RELEASE_CHECKLIST.md` — concrete per-release checklist covering pre-release, deployment, post-deployment verification, and rollback steps (HAR-010)
- `.github/dependabot.yml` — weekly automated dependency updates for npm (grouped by production/development) and GitHub Actions ecosystems (HAR-003)
- `dependency-audit` CI job — runs `pnpm audit --audit-level=high` on every push/PR; fails CI on high/critical vulnerabilities (HAR-003)
- Coverage thresholds in `apps/api/vitest.config.ts` and `apps/web/vitest.config.ts` — scoped include + 50–60% baseline floor; CI now fails on coverage regression (HAR-004)
- Section 0 in `scripts/verify-vps-deployment.sh` — six env-var checks before deployment validation (HAR-008)

### Changed
- `PRODUCTION_READINESS.md` — added link to `RELEASE_CHECKLIST.md` in the Reference section

### Added
- **OPS-012**: Structured JSON logging via `nestjs-pino` — production output is machine-readable JSON; development uses pino-pretty for readable output. Authorization and Cookie headers are redacted from HTTP access logs.
- **HAR-008 / Q-007 (baseline)**: Coverage thresholds added to both vitest configs. API gated on 4 service files (50% floor). Web gated on store + lib layer (60% floor). Path to 90% overall after measuring actuals.
- **HAR-008**: `scripts/verify-vps-deployment.sh` extended with Section 0 — env-var pre-flight checks (JWT_SECRET, JWT_REFRESH_SECRET, POSTGRES_PASSWORD, CORS_ORIGINS, NODE_ENV, Swagger disabled).
- Web unit tests for `auth.store`, `theme.store`, `utils`, and `api-client` (Q-001 rework — prior backlog entry was incorrectly marked done).
- `withCredentials: true` on the web API client so the httpOnly refresh cookie is included in cross-origin requests.
- `cookie-parser` middleware in API bootstrap.

---

## [1.35.0] — 2026-07-06

### Security
- **OPS-003**: Hardened `docker-compose.yml` — replaced `:-` insecure fallbacks with `:?` required expansion for `POSTGRES_PASSWORD`, `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`; compose now fails fast when these are unset
- **OPS-005**: Enhanced `main.ts` startup validation — refuses to start if JWT secrets contain placeholder strings or are shorter than 32 chars; refuses to start if `CORS_ORIGINS` is wildcard `*` in production
- **OPS-010**: Added CI `security-config-guard` job — greps compose files for dangerous `:-` defaults and SEED_DEMO_DATA=true; fails the build if found

### Added
- `scripts/preflight-production.sh` — validates `.env`, secrets strength, CORS, NODE_ENV, demo seed guard, Docker availability, and compose override file before deploying
- `scripts/production-up.sh` — safe deployment wrapper that runs preflight → build → migrate → verify in sequence; explicitly excludes `docker-compose.override.yml`
- `scripts/verify-vps-deployment.sh` — comprehensive VPS deployment verification script covering container state, port exposure, API/web routing through nginx, TLS, database migration status, demo account check, uploads, security headers, seed guard, backup smoke test, and non-root container users
- `scripts/restore.sh` — Docker-based database restore script; drops/recreates DB, runs pg_restore inside the postgres container, restarts the API, and re-applies migrations
- `scripts/backup.sh` — point-in-time PostgreSQL backup via `pg_dump -Fc` with automatic pruning (keeps 30 most recent)
- `scripts/restore-test.sh` — verifies a backup is restorable into a temporary test DB without touching the live database
- `scripts/create-admin.sh` — bootstrap first admin user in production without running the demo seed
- `.env.development.example` — development defaults separate from the production template

### Changed
- `apps/web/Dockerfile` — removed Android SDK build stage (`eclipse-temurin:21-jdk-jammy`) that downloaded ~1.5 GB from Google's servers unconditionally; APK placeholder is now created at build time if the file is absent (CI pre-builds the APK separately)
- `scripts/smoke-test.sh` — added nginx `/health` routing verification in proxy mode
- `nginx/default-no-ssl.conf.template` — added upload caching headers (`expires 7d`, `Cache-Control: public, immutable`) to match the SSL template
- `docker-compose.override.yml` — added documentation note that production deployments must explicitly exclude it with `-f docker-compose.yml`
- CI `docker-smoke` job — added required env vars (`POSTGRES_PASSWORD`, `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`) now that compose uses `:?` required expansion
- `DEPLOYMENT.md` — added Backup and Restore section with full Docker-based restore procedure
- `PRODUCTION_READINESS.md` — added Deployment Verification section referencing `verify-vps-deployment.sh`

---

## [1.34.0] — 2026-06-22

### Changed
- Event Proposals now shown inline on top of the Events page and as a compact widget on the Dashboard — no longer a separate page
- Removed Event Proposals sidebar link; old `/event-proposals` URL redirects to `/events`
- Removed Success Stories, AI Coach, and Leadership & AI from sidebar navigation
- Leadership & AI redirects to `/explore/ai` (it's a category in Explore)
- AI Coach redirects to `/dashboard`
- Explore section: replaced emoji icons with elegant lucide icons in styled containers that match the premium theme

---

## [1.33.0] — 2026-06-22

### Security
- **SEC-046**: OAuth `redirectUri` now validated with `@IsUrl` — blocks non-URL strings and arbitrary redirects
- **SEC-047**: OAuth auto-link by email now requires `emailVerified: true` from identity provider — prevents account takeover via unverified emails
- **SEC-049**: Stripe customer creation wrapped in `$transaction` with `SELECT ... FOR UPDATE` — prevents duplicate customer TOCTOU race
- **SEC-052**: AI Coach history messages truncated to 2000 chars each; system prompt hardened against prompt injection from client-supplied history
- **SEC-053**: Digest `headerHtml`/`footerHtml` now escaped in `renderPreview()` — blocks stored XSS
- **SEC-054**: Digest `accentColor` validated with hex regex in DTO; render sanitizes invalid values to default
- **SEC-055**: Digest template DTO constraints: `@MaxLength(10000)` on HTML fields, `@ArrayMaxSize(20)` on sections, `@IsUrl` on logoUrl
- **SEC-056**: CSV exports capped at 10,000 rows (`take: 10000`) — prevents OOM on large datasets
- **SEC-057**: Removed email addresses from posts and course progress CSV exports — data minimization

### Changed
- Updated 3 adversarial test files to verify fixed behavior (OAuth, digest templates, reports)

---

## [1.32.0] — 2026-06-22

### Security
- **SEC-065**: Billing DTO `@IsUrl` now uses `require_tld: false` — allows localhost URLs in development/staging
- **SEC-066**: Learning group `addMember()` and `join()` now use `SELECT ... FOR UPDATE` row lock — truly serializes concurrent requests under READ COMMITTED isolation
- **SEC-067**: Event update endpoint now uses dedicated `UpdateEventDto` with explicit validators — same fix pattern as SEC-058 for categories

---

## [1.31.0] — 2026-06-22

### Security
- **SEC-045**: OAuth callback DTO now supports `state` parameter for CSRF protection
- **SEC-048**: Billing checkout/portal endpoints now use validated DTOs with `@IsUrl` — prevents open redirect attacks
- **SEC-050**: AI Coach chat endpoint rate-limited to 10 requests per minute — prevents LLM API cost amplification
- **SEC-051**: AI Coach chat history array capped at 20 items (`@ArrayMaxSize(20)`) — prevents DoS via validation overload
- **SEC-058**: Categories update uses dedicated `UpdateCategoryDto` with full runtime validation
- **SEC-059**: Invite token registration verifies registering email matches the invite's intended recipient
- **SEC-060**: GDPR data export endpoint rate-limited to 3 requests per 15 minutes
- **SEC-061**: Learning group `addMember()` wrapped in `$transaction` with `FOR UPDATE` lock — prevents TOCTOU race
- **SEC-062**: Journal prompt/category color fields validated with hex color regex — blocks CSS injection
- **SEC-063**: Event `meetingUrl` validated with `@IsUrl({ protocols: ['http', 'https'] })` — blocks `javascript:` URI injection
- **SEC-064**: Event partial date updates validate against existing counterpart date

### Added
- 17 adversarial tests covering security fixes (SEC-045–064)
- 20 adversarial tests for SEC-045–057 audit findings (OAuth, billing, AI coach, digests, CSV exports)
- **Android mobile app (GL-027)**: Native Android wrapper at `apps/mobile-android/` based on the my-taskOS WebView template; JWT authentication via `/api/auth/login` with automatic token refresh; tokens injected into WebView localStorage for seamless SSO; background notification polling (15-min WorkManager) with deep-link support; branded Executive Glass offline error page; `CommunityApp` JS bridge for native↔web token sync and logout; Dockerfile for headless APK builds; release keystore and ProGuard configuration

---

## [1.30.0] — 2026-06-22

### Fixed
- **BUG-014**: Avatar upload is now the sole method for setting profile pictures — removed confusing "Avatar URL" text input from Settings
- **BUG-015**: User avatar now displays in topbar/sidebar icons instead of initials when present — added `useProfileSync` hook that syncs `/users/me` data back to Zustand auth store on every dashboard load
- **BUG-016**: Admin panel now supports editing core platform content — added admin Categories page (CRUD with color/emoji management) and Assessment Questions page (CRUD grouped by GROWTH dimension with enable/disable toggle, sort order); `AssessmentQuestion` database model with migration and 30 seeded default questions; assessment service reads from DB with hardcoded fallback

---

## [1.29.0] — 2026-06-22

### Added
- **Bilingual i18n (GL-026)**: Full English + German translation support using next-intl; cookie-based locale detection (no URL restructuring required); translation files for all core UI strings (navigation, auth, dashboard, settings, AI coach); `LocaleSwitcher` component in Settings > Appearance tab; `NextIntlClientProvider` wired into root layout; sidebar, login, register, dashboard, and AI coach pages fully translated

---

## [1.28.0] — 2026-06-22

### Added
- **SSO / OAuth (GL-028)**: Google and LinkedIn OAuth login via authorization code flow; `OAuthAccount` model linking providers to users; automatic account linking when OAuth email matches existing account; OAuth-only users (no password) fully supported; "Connected Accounts" section in Settings to link/unlink providers; password set/change UI for OAuth-only users; social login buttons on login and register pages; CSRF protection via `state` parameter; graceful degradation when OAuth env vars not configured
- **Stripe Billing (GL-025)**: Stripe Checkout for FREE→PREMIUM subscription upgrade; Stripe Customer Portal for subscription management (cancel, update payment); webhook handler for `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed`; `stripeCustomerId` and `stripeSubscriptionId` on User model; pricing page at `/pricing`; subscription management in Settings; billing success page; automatic downgrade on subscription cancellation; graceful degradation when Stripe env vars not set
- **Assessment Recommendations (GL-008)**: Personalized development path based on GROWTH assessment scores; identifies top 3 weakest dimensions with actionable suggestions; keyword-based course and event recommendations; progress-aware course cards; `GET /assessments/recommendations` endpoint; "Your Development Path" section in assessment results view
- **AI Coach (GL-016)**: Virtual leadership development coach powered by Claude; contextual coaching using member's GROWTH assessment scores, goals, platform courses, and upcoming events; chat interface with suggested prompts and conversation history; system prompt enforcing GROWTH framework focus; `GET /ai-coach/status` and `POST /ai-coach/chat` endpoints; graceful degradation when `ANTHROPIC_API_KEY` not configured; sidebar navigation link

---

## [1.27.0] — 2026-06-22

### Added
- **Digest Templates (GL-022)**: Admin-managed email digest templates with CRUD; configurable header/footer HTML, accent color, logo, and section selection (new posts, upcoming events, new courses, community stats); template activation (only one active at a time); HTML preview rendering; admin Digests page at `/admin/digests`
- **Interest Preferences (GL-023)**: Members pick interest categories in Settings > Interests; feed prioritises posts matching selected interests; `UserInterest` model linking users to categories; `GET/PUT /users/me/interests` endpoints; `?prioritize=interests` feed query parameter
- **Admin Journal Prompts (GL-011 enhancement)**: Journal prompts moved from hardcoded to fully admin-editable; `JournalPromptCategory` and `JournalPrompt` database models; admin CRUD for categories (create, edit, delete, show/hide) and prompts (create, edit, delete, show/hide); category color management; admin page at `/admin/journal-prompts`; 30 default prompts seeded across 5 categories
- **Adversarial tests SEC-031–044**: 30 tests across 6 new files covering tier self-upgrade bypass, S3 path traversal, upload MIME spoofing, learning group TOCTOU race, event proposal privacy leak, journal input validation, and assessment score manipulation

### Fixed
- **SEC-031**: Tier self-upgrade bypass — `upgradeTier()` now disabled (throws NotImplementedException) until billing integration
- **SEC-032**: Tier enum injection — `setTier()` validates against whitelist of valid tier values
- **SEC-033**: S3 path traversal — local storage validates resolved path stays within upload directory
- **SEC-034**: Upload MIME spoofing — validates magic bytes match claimed MIME type; blocks dangerous extensions
- **SEC-035**: Learning group join race condition — wrapped in database transaction to enforce maxMembers
- **SEC-036**: Learning group data leak — non-members see only public info (name, description, member count)
- **SEC-037**: Event proposal date array bomb — `@ArrayMaxSize(20)` on proposedDates DTO
- **SEC-038**: Event proposal vote privacy — non-admin voters see only aggregate counts, not individual votes
- **SEC-039**: Event proposal vote race condition — wrapped in transaction; validates dateVotes against proposedDates
- **SEC-040**: Journal content size limit — `@MaxLength(50000)` on journal content field
- **SEC-041**: Journal mood injection — validates mood against whitelist with `@IsIn(VALID_MOODS)`
- **SEC-042**: Journal date injection — strict regex validation on date and month parameters
- **SEC-043**: Assessment question injection — validates each questionId exists in server-side question set
- **SEC-044**: Assessment score manipulation — validates exact question set match; rejects duplicates

### Changed
- Journal prompts now read from database instead of hardcoded array; prompt colors come from admin-configured category colors

---

## [1.26.0] — 2026-06-22

### Added
- **Journal Prompts (GL-011)**: 30 curated daily prompts across 5 categories (Reflection, Gratitude, Leadership, Growth, Challenge); deterministic daily rotation showing 3 prompts per day; clickable prompt cards that populate the journal editor; color-coded category tags; `GET /journal/prompts` endpoint
- **CSV Export Reports (GL-035)**: Admin-only CSV export endpoints for members, posts, events, and course progress; date range filtering; download via browser blob; admin Reports page at `/admin/reports` with download cards and date pickers

---

## [1.25.0] — 2026-06-21

### Added
- **Post Bookmarks (GL-031)**: Save/unsave posts with toggle button in post action bar; `/bookmarks` page listing all saved posts with pagination; `Bookmark` model with unique user+post constraint; bookmark status indicator (filled icon when saved); sidebar "Saved" nav item

---

## [1.24.0] — 2026-06-21

### Added
- **Learning Groups (GL-021)**: Small peer learning groups (max 8 members) with real-time group chat, member avatars, join/leave/create/delete; creator management (add/remove members); group listing and detail views with message history; `/learning-groups` page with glassmorphism-themed cards
- **Free-Tier Gating (GL-024)**: `MembershipTier` enum (FREE/PREMIUM) on User model; `PremiumGuard` and `@RequirePremium()` decorator for backend route protection; `TierService` with admin tier management; `<PremiumGate>` wrapper component and `<UpgradePrompt>` for frontend feature gating; tier info API endpoint; admins bypass all tier restrictions
- **Shared Tier Types**: `MembershipTier` enum, `TierStatus` interface, `PREMIUM_FEATURES` config, and `FREE_TIER_LIMITS`/`PREMIUM_TIER_LIMITS` in `@community/shared`

---

## [1.23.0] — 2026-06-21

### Added
- **GROWTH Self-Assessment**: 30-question assessment across 6 leadership dimensions (Growth mindset, Rhythms, Ownership, Willpower, Teamwork, Holistic balance); SVG radar chart visualization; dimension score breakdown; assessment history; retake flow at `/assessment`
- **Event Proposals**: Admin-created event proposals with topic voting and date preference selection; members upvote proposals and pick preferred dates from options; date vote distribution display; admin can close/delete proposals; `/event-proposals` page
- **S3 File Uploads**: Unified upload service supporting S3-compatible storage (MinIO, DigitalOcean Spaces, AWS) with local disk fallback; image uploads (10MB max) and file uploads (50MB max); drag-and-drop `ImageUpload` component with preview; `Upload` model tracking metadata

### Fixed
- **SUCCESS_STORY post type rejected by API** — Added `SUCCESS_STORY` to `PostTypeEnum` in create-post DTO so the validation pipe accepts the new type
- **Category content pages empty** — API returned `{ data, total }` objects but UI expected arrays; changed API to return flat arrays
- **Event reminder 24h/1h overlap** — Events created less than 75 minutes before start received both 24h and 1h reminders simultaneously; added lower bound to 24h query
- **Introduction banner not activating composer** — `CreatePost` state was initialized once from props; added `key` prop to remount when intro type changes
- **E2E logout test blocked by onboarding modal** — Onboarding wizard overlay intercepted pointer events; test now dismisses the modal before attempting logout

---

## [1.22.0] — 2026-06-21

### Added
- **Journaling**: Private daily journal entries at `/journal` with calendar grid, day selection, auto-save editor, mood tracking; streak stats (current/longest streak, total entries, 30-day count); `JournalEntry` model with upsert API and month-based listing
- **Onboarding Wizard**: 4-step welcome sequence for new members — welcome screen, profile setup (name/bio/avatar), interest selection (category chips), and feature tour; shown as modal overlay on first login; `onboardingCompleted` flag on User model

---

## [1.21.0] — 2026-06-21

### Added
- **My Goals**: Personal goal tracker on dashboard — up to 5 goals with title, description, progress bar (0-100%), target date, and status (active/completed/paused); drag-to-reorder support; full CRUD API with 5-goal limit enforcement
- **Leadership & AI**: Curated `/leadership-ai` page showcasing AI-tagged courses, posts, and events from the category system; hero section with gradient, sectioned content with links to full explore view
- **Success Stories**: New `SUCCESS_STORY` post type with purple badge; dedicated `/success-stories` page; "Share Your Story" CTA with filtered feed; type added to feed filters and post composer

---

## [1.20.0] — 2026-06-21

### Added
- **My Challenge**: Personal "Most Important Challenge" card on the dashboard — set a challenge with title, description, reflection, and status (active/completed/archived); upsert API on User model
- **Q&A Feed**: Dedicated `/questions` page filtered to QUESTION-type posts with "Ask a Question" button; sidebar nav link added
- **Testimonials**: Member-submitted success stories with admin approval workflow; featured badge support; `/testimonials` page with story grid and submission form; full CRUD API with admin moderation endpoints

---

## [1.19.0] — 2026-06-21

### Added
- **Introduction Banner**: New members see a welcome prompt on the feed to introduce themselves; auto-dismissed after posting an INTRODUCTION-type post; dismissible via close button (localStorage)
- **Course Notes**: Private per-lesson notes with auto-save (800ms debounce); collapsible "My Notes" section below lesson content; `CourseNote` model with upsert API
- **Category Landing Pages**: Dedicated `/explore/:slug` route with category header (icon, description, stats), and sectioned content (posts, courses, events); explore grid now links to landing pages

---

## [1.18.0] — 2026-06-21

### Added
- **Post Types**: Posts can be typed as Discussion, Question, Announcement, or Introduction — with colored badges in the feed and type-based filtering
- **Content Categories**: Category model with 8 default topics (Growth, Rhythms, Empowerment, Impact, Teams, Balance, AI, Other); many-to-many tagging for posts, courses, and events; category selector in post composer
- **Explore Page**: New `/explore` page with category grid — click a category to browse its posts, courses, and events
- **Categories API**: Full CRUD at `/categories` with content aggregation endpoint (`GET /categories/:slug/content`)
- **Event Reminders**: Automated email and in-app reminders sent 24h and 1h before events to RSVP'd attendees; cron job runs every 15 minutes with duplicate-prevention flags
- **Event Reminders Settings**: Toggle in Settings → Notifications to enable/disable event reminder emails

---

## [1.17.0] — 2026-06-17

### Added
- **Search Page**: Dedicated `/search` page with category filters (All, Posts, Members, Events, Courses, Recordings), debounced search input, URL query param sync, and sectioned results
- **Search API**: Extended `GET /api/search?q=` to include recordings in results
- **Sidebar**: Search link added to navigation

---

## [1.16.0] — 2026-06-17

### Added
- **Recordings**: New `/recordings` page to browse recordings from past events — video-card grid with thumbnails, duration, search, and pagination
- **Recordings API**: `GET /events/recordings/all` (paginated listing), `GET /events/:id/recordings`, `POST /events/:id/recordings` (admin), `DELETE /events/recordings/:id` (admin)
- **Recording Model**: `Recording` model linked to events with title, description, URL, duration, and thumbnail
- **Sidebar**: Recordings link added to navigation

---

## [1.15.0] — 2026-06-17

### Added
- **Calendar Invites**: `.ics` calendar invite attached to RSVP confirmation email when user RSVPs "Going" to an event
- **Calendar Settings**: Toggle in Settings → Notifications to enable/disable calendar invite emails
- **ICS Generator**: `ics.util.ts` generates standards-compliant iCalendar files with event details, location, and meeting URL

---

## [1.14.0] — 2026-06-17

### Added
- **Landing Page**: Public community landing page at `/` with hero, feature grid, and CTA — visible to unauthenticated visitors; authenticated users redirect to dashboard
- **Rich-Text Editor**: Tiptap-based post editor with toolbar (heading, bold, italic, code, lists, blockquote, links, divider) replacing the plain textarea; plain-text mode toggle available
- **Email Digest**: Daily and weekly email digest with trending posts, event count, and unread notifications; configurable per user via Settings → Notifications; uses nodemailer with SMTP; logs to console when SMTP is not configured
- **Email Digest Settings**: Radio-button selector in Settings → Notifications for Daily / Weekly / Off preference

### Changed
- **Middleware**: Root path `/` is now public (was redirecting to `/dashboard` for all visitors)
- **Post Rendering**: Post cards detect HTML (from rich editor) vs plain markdown and apply the correct CSS class

---

## [1.13.0] — 2026-06-17

### Added
- **Testing**: Integration tests for users, admin, GDPR, and health modules (Q-006 complete — all 8 API modules now covered)

---

## [1.12.0] — 2026-06-17

### Added
- **HTTPS**: Nginx reverse proxy with automatic Let's Encrypt TLS via `--profile proxy`
- **HTTPS**: `init-ssl.sh` script for one-command certificate provisioning
- **HTTPS**: HTTP-only proxy mode for deployments behind a cloud load balancer
- **HTTPS**: Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- **HTTPS**: Certbot service for certificate renewal

---

## [1.11.0] — 2026-06-17

### Added
- **Messages**: "New Message" button in messages panel — search and pick a member to start a conversation without leaving the page
- **Topbar**: User avatar dropdown menu with links to profile, settings, and sign out
- **Docker**: Backup service profile — run `docker compose --profile backup run backup` for on-demand pg_dump
- **Docker**: Configurable `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` in `.env`

### Fixed
- **Navigation**: Events, Members, and Settings pages no longer render a duplicate Topbar that blocks the mobile hamburger menu
- **Docker healthcheck**: Web container healthcheck now hits `/api/health` instead of `/` which redirects unauthenticated users and fails BusyBox wget
- **Docker uploads**: `entrypoint.sh` with `su-exec` fixes bind-mount ownership so the uploads directory is writable
- **Feed**: Post create and delete mutations now handle errors gracefully and always refresh the feed
- **API**: `authorId` included in post API responses for frontend ownership checks

### Changed
- **Docker**: Switched from named volumes to host bind mounts under `DATA_DIR` (default `./data`) — community data now survives `docker compose down -v`
- **Themes**: Removed Executive Red and Growth Green themes; three themes remain (Executive Glass, Corporate Light, High Contrast)

---

## [1.10.0] — 2026-06-16

### Fixed
- **Auth flow**: login and registration now sync `auth-session` and `user-role` cookies on success so the Next.js middleware can gate protected routes correctly
- **Auth flow**: Zustand store rehydration from localStorage re-syncs cookies on page refresh
- **Axios interceptor**: 401 responses on unauthenticated requests (e.g. wrong password on login) no longer trigger a redirect to `/login`; the error propagates to the React mutation state and is displayed inline

### Security
- **SEC-001** (extended) Hidden posts now also reject non-admin `update()` and `delete()` calls with 403
- **SEC-004** `JWT_SECRET` / `JWT_REFRESH_SECRET` fallback removed from `generateTokens()` — startup guard guarantees env vars are present
- **SEC-018** `avatarUrl` validated with `@IsUrl({ protocols: ['http','https'], require_protocol: true })` in `UpdateProfileDto` — rejects `javascript:` and `data:` URIs
- **SEC-022** Email normalization (lowercase + trim) tested end-to-end — duplicate accounts via mixed-case email are blocked

### Tests
- E2E auth suite expanded from 6 to 20 tests covering login/register flows, client-side validation, error messages, and logout

---


## [1.9.0] — 2026-06-16

### Security (Adversarial QA — SEC fixes)

- **SEC-001** Hidden posts no longer accept comments or reactions (`isHidden: false` filter added)
- **SEC-002** RSVP capacity check is now atomic inside a `$transaction` (eliminates TOCTOU race)
- **SEC-003** Unpublished courses/lessons return 404 to non-admin users (`isPublished` gate)
- **SEC-005** Concurrent refresh token rotation is safe: detects already-consumed tokens (count=0 → 401)
- **SEC-007** Last-admin guard: `updateUserRole` and `toggleUserActive` prevent self-demotion and last-admin removal
- **SEC-008** GDPR data export is bounded (posts ≤ 1000, nested items ≤ 100, cookie consents ≤ 10)
- **SEC-009** Expired refresh tokens purged on every token generation (prevents unbounded table growth)
- **SEC-010** Event `update()` now validates `startsAt < endsAt` (same check as `create()`)
- **SEC-011** RSVP status validated via `RsvpDto` with `@IsEnum(RsvpStatus)` — was raw `string`
- **SEC-012** Reaction type validated against allowed enum values — invalid types return 400
- **SEC-013** `toggleReaction` is wrapped in `$transaction` to prevent P2002 unique-constraint races
- **SEC-014** Course progress `UpdateProgressDto` uses `@Min(0) @Max(100) @IsNumber()` — out-of-range returns 400
- **SEC-016** Anonymous consent `sessionId` capped at 128 characters
- **SEC-017** Cookie consent upserts on existing record instead of always inserting new rows
- **SEC-020** All paginated endpoints clamp `limit` to 1–100 and `page` to ≥ 1 (`limit=0` no longer returns `Infinity`)
- **SEC-021** Moderation queue is now paginated (was unbounded `findMany`)

---

## [1.8.0] — 2026-06-16

### Added (Sprint 8 — Security Hardening)
- Global `ExceptionFilter` prevents stack trace / internal error detail leakage in production responses
- JWT secret startup validation: API exits with code 1 if `JWT_SECRET` or `JWT_REFRESH_SECRET` are missing
- Graceful shutdown hooks enabled (`app.enableShutdownHooks()`)
- `UpdateUserRoleDto` with `@IsEnum(UserRole)` validation replaces raw string for admin role updates
- Audit logging for admin actions: `updateUserRole`, `toggleUserActive`, `hidePost`, `pinPost` each write an `AuditLog` entry with the acting admin's ID
- Per-user rate limiting: `UserThrottlerGuard` uses authenticated `userId` as throttle key (falls back to IP for unauthenticated requests) — accurate behind reverse proxies
- Named `auth` throttler with tighter limits: login 5 req / 15 min, register 3 req / hour
- Password strength enforcement on registration: must contain uppercase, lowercase, and a digit
- Email normalization: lowercased and trimmed before any DB lookup in `register` and `login`
- Avatar URL validation: `@IsUrl()` applied to `avatarUrl` in `UpdateProfileDto`

### Security
- Member directory (`GET /users`) no longer exposes email addresses in public listing
- Auth endpoint throttling tightened at both controller level (`@Throttle` decorator) and module level (named throttler)

---

## [1.7.0] — 2026-06-16

### Added (Sprint 7 — Invite System)
- `Invite` model: UUID token, 7-day expiry, soft-delete via `usedAt` timestamp
- `InvitesService`: `createInvite`, `listInvites`, `validateInvite`, `consumeInvite`, `revokeInvite`
- `InvitesModule` exported and wired into `AppModule` and `AuthModule`
- Admin invite endpoints: `POST /admin/invites`, `GET /admin/invites`, `DELETE /admin/invites/:id`
- Admin Invites page (`/admin/invites`): send invites, list with status badges (Pending / Used / Expired), copy invite link, revoke, pagination
- Invite token wired into auth registration: `POST /auth/register` accepts optional `inviteToken`, validates before creating account and consumes on success
- Register page reads `?invite=` query param, pre-fills invite badge and auto-submits token
- Admin nav updated with Invites link

---

## [1.6.0] — 2026-06-15

### Added (Sprint 6 — Social Features & Platform Polish)
- White-labeling foundation: `PlatformSettings` singleton model with platform name, logo URL, primary/accent colours, and signup toggle
- `GET /admin/settings` and `PUT /admin/settings` admin endpoints
- Admin Settings page (`/admin/settings`) with colour swatches, logo URL, and signup control
- Trending posts: `GET /posts/trending` returns most-reacted posts in the last 7 days, sorted by reaction count
- Feed page now has Latest / Trending tab toggle; compose area hidden on Trending tab
- `useTrendingFeed()` hook with 60-second auto-refresh
- Top Contributors leaderboard on Members page (right-hand sidebar, top 5 by post count with medal indicators)
- Members page refactored to use shared `MemberCard` component with clickable profile links

---

## [1.5.0] — 2026-06-15

### Added (Sprint 5 — Rich Text, Search & Polish)
- Markdown rendering in post content: **bold**, *italic*, `code`, ` ``` ` code blocks, `> blockquotes`, `[links](url)`
- Write/Preview tab toggle in post compose area for live markdown preview before posting
- All HTML is escaped before markdown rendering (XSS-safe)
- Platform-wide search endpoint `GET /search?q=` searching posts, users, courses, and events
- `SearchModule` wired into AppModule
- Command palette now shows live search results (debounced 250 ms) alongside navigation commands
- User avatars shown in member search results within command palette
- Topbar search input replaced with command palette trigger button (shows ⌘K shortcut)

---

## [1.4.0] — 2026-06-15

### Added (Sprint 4 — Command Palette & Analytics)
- Global command palette triggered by `⌘K` / `Ctrl+K` from any dashboard page
  - Fuzzy search across all navigation items and admin commands
  - Keyboard navigation (↑↓ arrows, Enter to select, Escape to close)
  - Admin-only commands (Analytics, Admin Panel) hidden from regular members
  - Integrated into dashboard layout — available everywhere
- Analytics dashboard at `/admin/analytics`
  - Member stats: total, active, new (7-day / 30-day)
  - Content stats: posts, comments, reactions with period breakdowns
  - Course & event stats: published courses, upcoming events, total RSVPs
  - Messaging stats: total messages and conversation count
  - Top 5 most active post authors with horizontal bar chart
  - Auto-refreshes every 60 s
- `GET /admin/analytics` endpoint with aggregated platform metrics
- Analytics link added to admin sidebar navigation

---

## [1.3.0] — 2026-06-15

### Added (Sprint 3 — Private Messaging)
- `Conversation`, `ConversationParticipant`, and `Message` database models with indexes
- `MessagesModule` with full CRUD: list conversations, get/create conversation, send message, paginated message history
- `GET /messages/conversations` — lists all conversations for current user (polls every 15 s on frontend)
- `POST /messages/conversations/:userId` — get or create a direct conversation with another user
- `GET /messages/conversations/:id/messages` — paginated message history (most recent first, auto-marks as read)
- `POST /messages/conversations/:id/messages` — send a message, bumps conversation `updatedAt`
- Messages page `/messages` with split-pane layout: conversation list on left, message thread on right
- Chat bubble UI: own messages right-aligned with primary colour, others left-aligned with avatar
- Real-time polling: conversations refresh every 15 s, open thread refreshes every 5 s
- "Message" button on member profile pages — creates/opens a direct conversation and navigates to `/messages`
- Messages link added to sidebar navigation
- `useConversations`, `useMessages`, `useSendMessage`, `useGetOrCreateConversation` React Query hooks
- `Conversation`, `Message`, `PaginatedMessages` shared types in `packages/shared`
- `MessagesService` unit tests
- `?conv=<id>` query param support on messages page for deep-linking from member profiles

---

## [1.2.0] — 2026-06-15

### Added (Sprint 2 — Notifications & Profiles)
- In-app notification bell with live unread count badge (polls every 30 s)
- Notification dropdown: reaction, comment, mention, event-reminder rows with actor avatar and relative timestamp
- Mark single / mark-all-read actions on notifications
- `Notification` and `Follow` database models with indexes
- `GET/PATCH /notifications` API with `unread-count`, `read-all`, `:id/read` endpoints
- Notifications auto-created on post reaction and comment (skips self-notifications)
- Follow / unfollow endpoints `POST/DELETE /users/:id/follow`
- Public member profile page `/members/[id]` with follower/following counts and follow button
- Member cards now link to public profile pages
- Settings profile tab now saves name, bio, and avatar URL via `PATCH /users/me`
- `updateUser` action added to auth Zustand store for optimistic profile sync
- `packages/shared` notification types: `Notification`, `PaginatedNotifications`, `NotificationType`

---

## [1.1.0] — 2026-06-15

### Added
- Events calendar grid view with month navigation and List/Calendar toggle
- Admin course creation modal with title, description, cover URL fields
- Admin event creation modal with start/end datetime, location, virtual toggle, meeting URL, capacity
- Admin audit log page with paginated table and action-colour badges
- Audit Log link added to admin sidebar navigation
- GDPR data export button now downloads full account data as JSON
- GDPR account deletion button wired to anonymisation endpoint with confirmation dialog

### Fixed
- GDPR settings privacy tab buttons were stubs — now fully functional

---

## [1.0.0] — 2026-06-15

### Added

#### Authentication
- Email/password registration and login
- JWT access tokens (15-minute expiry)
- Refresh token rotation with database storage (7-day expiry)
- RBAC with Admin and Member roles
- Argon2id password hashing
- Global JWT guard with explicit public route exceptions

#### Community Feed
- Create, read, update, delete posts
- Nested comments on posts
- Four reaction types: Like, Heart, Celebrate, Insightful
- Pinned posts (Admin feature)
- Content moderation (hide/unhide posts, Admin feature)

#### Learning Hub
- Course catalog with module and lesson structure
- Course progress tracking (percentage-based)
- Completion tracking with timestamp
- Admin course management (create, publish, unpublish, delete)

#### Events
- Event listing with upcoming/past categorization
- RSVP system with Going / Maybe / Not Going status
- Virtual and in-person event support with meeting URLs
- Capacity limits with enforcement
- Admin event management

#### Member Directory
- Paginated member listing
- Public user profiles
- Post count and course enrollment count display

#### Theme Engine
- Three built-in themes: Executive Glass, Corporate Light, High Contrast
- Runtime theme switching without page reload
- CSS custom property-based system
- Theme preference persisted to localStorage
- Glassmorphism effects for dark themes

#### Admin Panel
- Dashboard with platform statistics
- User management (view, activate/deactivate, promote to admin)
- Course management (publish/unpublish, delete)
- Event management (delete)
- Content moderation queue

#### GDPR Compliance
- Cookie consent banner (essential / all)
- Granular consent settings (analytics, marketing)
- Data export endpoint (GDPR Article 20)
- Account deletion/anonymization (GDPR Article 17)
- Consent stored per user or anonymous session

#### Infrastructure
- Docker Compose setup with health checks
- PostgreSQL 16 database with Prisma ORM
- Redis service (available for caching)
- pnpm workspaces + Turborepo monorepo
- Shared TypeScript types package
- Theme tokens package

#### Developer Experience
- Swagger API documentation (development mode)
- Database seed with realistic sample data
- Vitest unit tests for API services
- Vitest + React Testing Library for web components
- Playwright E2E tests for auth flows
- Hot reload in development via Turborepo

### Security
- Helmet middleware for security headers
- CORS configuration with origin allowlist
- Rate limiting (100 req/min default)
- Input validation via class-validator
- SQL injection protection via Prisma parameterized queries
- Password hashing with Argon2id
