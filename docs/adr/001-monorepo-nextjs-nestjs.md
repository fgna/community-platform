# ADR 001 — Monorepo with Next.js (web) + NestJS (API)

**Status**: Accepted

## Context

The platform requires a full-stack TypeScript application with a web frontend and a REST API backend. Type safety across the client–server boundary and code sharing (types, utilities, themes) are important for maintainability.

## Decision

Use a pnpm + Turborepo monorepo with two primary apps:
- `apps/web` — Next.js 15 App Router (frontend)
- `apps/api` — NestJS 10 REST API (backend)

Shared code lives in `packages/shared` (types + utilities), `packages/themes` (design tokens), and `packages/ui` (shared component re-exports).

## Consequences

**Benefits:**
- TypeScript types shared between frontend and backend via `@community/shared` — no manual type duplication
- Single `pnpm install`, single CI pipeline, atomic commits across apps
- Turborepo caching speeds up builds and tests

**Trade-offs:**
- Monorepo tooling (pnpm workspaces, Turborepo) adds initial complexity
- Docker builds require the full repo context even when only one app changed

## Alternatives Considered

- **Separate repositories**: simpler per-repo CI but no shared types; breakage surfaces at runtime not compile time
- **Next.js full-stack (API routes)**: simpler deployment but NestJS's DI, guards, and module system are better suited for a large API surface with role-based access control
