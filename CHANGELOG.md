# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
