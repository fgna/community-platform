# MVP-First Community Platform Builder

Build a production-ready, self-hosted community and learning platform inspired by the reference site's premium executive dashboard feel (dark glassmorphism, sidebar navigation, activity feed, courses, events, member directory).

Do **not** copy the design. Create an original implementation with a similar premium experience.

---

# Priority Order

## Phase 1 (MVP - Ship Fast)

Build only:

### 1. Authentication
- Email/password login
- JWT + refresh tokens
- Role-based access control (Admin, Member)

### 2. Community Feed
- Posts
- Comments
- Reactions
- User profiles

### 3. Learning Hub
- Courses
- Modules
- Progress tracking

### 4. Events
- Event list
- RSVP
- Calendar view

### 5. Member Directory

### 6. Theme Engine
- Runtime theme switching
- No page reload

### 7. Admin Panel
- Users
- Courses
- Events
- Content moderation

### 8. GDPR Essentials
- Cookie consent
- Data export
- Account deletion
- Privacy settings

---

## Phase 2

Add:
- Private messaging
- Notifications
- Command palette
- Analytics
- White-labeling
- Multi-tenancy
- Mobile apps
- AI features
- Advanced reporting

---

# Technology Stack

## Frontend
- Next.js 15
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand

## Backend
- NestJS
- PostgreSQL
- Prisma ORM
- Redis (optional)

## Infrastructure
- Docker
- Docker Compose
- GitHub Actions

---

# Self-Hosted First

The platform must run on:
- VPS
- Hetzner
- AWS
- Azure
- DigitalOcean
- Docker Compose

Deliver:
```
docker-compose.yml
Dockerfiles
.env.example
DEPLOYMENT.md
```

Requirements:
- One-command deployment
- No vendor lock-in
- Automated migrations
- Backup and restore procedures
- Health checks
- Horizontal scaling support

---

# Theme System

## Built-in Themes

### Executive Glass (Default)
Inspired by the reference website:
- Dark UI
- Glassmorphism
- Frosted sidebar
- Premium dashboard
- Gold accents
- Elegant typography

### Corporate Light

### High Contrast

---

## Theme Architecture

Use design tokens:

```ts
interface Theme {
  name: string;

  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;

    background: string;
    surface: string;
    card: string;

    text: string;
    textMuted: string;
  };

  typography: {
    headingFont: string;
    bodyFont: string;
  };

  radius: {
    sm: string;
    md: string;
    lg: string;
  };

  effects: {
    glassmorphism: boolean;
    shadows: boolean;
    gradients: boolean;
  };
}
```

Requirements:
- Runtime theme switching
- No page reload
- Per-theme overrides
- Future white-label support

---

# Architecture

Follow:
- Clean Architecture
- SOLID
- Feature-based modules
- Repository pattern
- Domain-driven design where useful

Monorepo structure:
```
apps/
  web/
  api/

packages/
  ui/
  themes/
  shared/
```

---

# TDD (Mandatory)

Every feature must follow:

## RED
Write failing tests first.

## GREEN
Implement the minimum code required to pass.

## REFACTOR
Improve design after tests pass.

---

## Testing Stack
- Vitest
- React Testing Library
- Playwright
- Supertest

Coverage Targets:
```
Overall: 90%
Business Logic: 95%
Critical Services: 100%
```

No feature may be merged without passing tests.

---

# UI/UX Standards

Follow modern SaaS best practices.

Requirements:
- Responsive mobile-first design
- WCAG 2.2 AA compliance
- Keyboard navigation
- Dark mode
- Accessible forms
- Optimistic UI updates
- Fast page transitions
- Design system
- Reusable components

Performance targets:
```
LCP < 2.5s
INP < 200ms
CLS < 0.1
```

---

# Security & GDPR

Implement:
- Argon2 password hashing
- JWT authentication
- Refresh tokens
- CSRF protection
- Rate limiting
- Audit logs
- Secure file uploads
- TLS support

GDPR Requirements:
- Cookie consent
- Privacy settings
- User data export
- Account deletion
- Data anonymization support
- Data retention policies

Must support EU-hosted deployments.

---

# Deliverables

Generate:
- System architecture
- Database schema
- API specification
- Frontend component architecture
- Theme engine
- Authentication system
- Docker deployment
- CI/CD pipeline
- Test suite
- Documentation

Documentation:
```
ARCHITECTURE.md
API.md
DEPLOYMENT.md
SECURITY.md
GDPR.md
THEMING.md
CHANGELOG.md
```

---

# Backlog (Mandatory)

`BACKLOG.md` is the single source of truth for all work items. Use it systematically:

- **Before starting work**: Read `BACKLOG.md` to understand current status and priorities.
- **New features**: Add a backlog entry before implementing. Mark `[~]` while in progress, `[x]` when done.
- **Bug reports**: Immediately add to the "User-Reported Bugs" section with an ID (BUG-NNN), description, root cause (once identified), size, and status.
- **Bug fixes**: Update the corresponding backlog entry to `[x]` when the fix is committed.
- **Security findings**: Add to the "Security & Reliability Fixes" section with a SEC-NNN ID.
- **Never skip**: Every piece of work — feature, bug, fix, refactor — must be tracked in the backlog. If it's not in `BACKLOG.md`, it didn't happen.

---

# Change Log (Mandatory)

Maintain `CHANGELOG.md`. Follow Keep a Changelog format.

Example:
```md
## [1.0.0]

### Added
- Authentication
- Community feed
- Theme engine

### Changed
- Dashboard navigation

### Fixed
- Session refresh handling
```

Every completed feature must update the changelog.

---

# Output Strategy

Do not build everything at once.

First generate:
1. Architecture
2. Database schema
3. MVP backlog
4. Sprint plan
5. TDD test plan
6. Project structure

Then implement features incrementally in priority order.

The application must remain deployable and releasable after every sprint.

Primary goal: ship a working MVP quickly.

Secondary goal: create a scalable foundation for future modules such as messaging, analytics, white-labeling, AI features, and multi-tenancy.

---

# Reference Design Notes

The reference site (GrowthLeaders Hub) uses:
- CSS variables for theming: `--bg-main: #090d16`, `--primary-accent: #c5a880` (warm champagne brass/gold)
- Glassmorphism sidebar: `backdrop-filter: blur(16px)`, `background: rgba(10, 15, 26, 0.85)`
- Dark card backgrounds: `rgba(17, 24, 39, 0.7)`
- Sidebar width: 280px, fixed position
- Inter font family
- Border color: `rgba(255, 255, 255, 0.08)` with gold glow `rgba(197, 168, 128, 0.25)`
- Radial gradient background overlays for depth

Create an **original** design with a similar premium dark executive feel. Do not reproduce the reference layout verbatim.

---

# Development Commands

```bash
# Install all dependencies
pnpm install

# Start development (all services)
pnpm dev

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Build for production
pnpm build

# Docker: start all services
docker compose up -d

# Docker: run migrations
docker compose exec api pnpm prisma migrate deploy
```

---

# Branch Strategy

- `main` — production-ready releases only
- `develop` — integration branch
- `feature/*` — individual features
- `fix/*` — bug fixes

Every PR must:
1. Pass all tests
2. Update CHANGELOG.md
3. Have a meaningful description
