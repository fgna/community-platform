# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Five built-in themes: Executive Glass, Executive Red, Growth Green, Corporate Light, High Contrast
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
