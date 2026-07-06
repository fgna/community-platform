# ADR 002 — JWT Auth with localStorage Token Storage

**Status**: Accepted (with known risk — see below)

## Context

The application needs stateless authentication that works for a Next.js SPA and a NestJS REST API. Two approaches were evaluated: JWT tokens stored client-side vs. httpOnly secure cookies managed server-side.

## Decision

Use short-lived JWT access tokens (15 min) with long-lived JWT refresh tokens (7 days). Both are stored in Zustand (persisted to localStorage). The Next.js middleware mirrors the access token + role into a non-httpOnly `auth-session` cookie for SSR route gating only; backend authorization always uses the `Authorization: Bearer` JWT header.

Refresh tokens are rotated on every use (each use deletes the old DB row and creates a new one).

## Consequences

**Benefits:**
- Simple to implement in a pure SPA architecture
- No server-side session store required
- Works well with NestJS Passport JWT strategy
- Stateless API — easy to scale horizontally

**Known risks:**
- Tokens in localStorage are accessible to JavaScript. A stored XSS attack can steal them. XSS mitigations (DOMPurify, `sanitize-html`, CSP) reduce but do not eliminate this risk.
- In-memory brute-force protection (`loginAttempts` Map) does not survive process restarts or horizontal scaling.

## Alternatives Considered

- **httpOnly Secure SameSite=Strict cookies**: better XSS resistance (tokens not accessible to JS); requires server-side session management or a `Set-Cookie` endpoint; more complex CORS/CSRF handling. This is the recommended migration path for high-security deployments.
- **NextAuth.js**: opinionated auth library with built-in provider support; considered too heavy given the custom NestJS API and invite-only registration requirements.

## Future

If the security profile of deployments increases (financial data, medical, enterprise), migrate to httpOnly cookie-based auth. See SECURITY.md for risk framing.
