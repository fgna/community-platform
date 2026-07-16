# Security

## Authentication & Authorization

### JWT Tokens
- **Access tokens**: HS256 JWT, 15-minute expiry, signed with `JWT_SECRET`
- **Refresh tokens**: JWT with embedded `jti` (UUID v4), stored in PostgreSQL with expiry timestamp, 7-day lifetime
- Refresh token rotation: each use invalidates the old token and issues a new one
- Logout invalidates the refresh token server-side

### Password Hashing
Passwords are hashed with **Argon2id** (via the `argon2` npm package):
- Industry best practice, winner of Password Hashing Competition
- Resistant to GPU/ASIC attacks
- Uses argon2 library defaults (memory=65536, iterations=3, parallelism=4)

### Role-Based Access Control
Two roles: `ADMIN` and `MEMBER`
- `JwtAuthGuard` is a global `APP_GUARD` — all endpoints require authentication by default
- Public endpoints explicitly marked with `@SetMetadata(IS_PUBLIC_KEY, true)`
- `RolesGuard` is a global `APP_GUARD` — checks `@Roles('ADMIN')` on controllers/handlers
- Admin operations (user management, content moderation, course/event CRUD) require `ADMIN` role

## Transport Security

### HTTP Headers (Helmet)
All responses include security headers via `helmet`:
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `Content-Security-Policy` — restricts resource loading
- `Strict-Transport-Security` — enforces HTTPS (in production)
- `Referrer-Policy: strict-origin-when-cross-origin`

### CORS
- Configured via `CORS_ORIGINS` environment variable
- Credentials allowed for cookie-based sessions
- Only specified origins can make cross-origin requests

### Rate Limiting
- Default: 100 requests per 60 seconds (configurable via `THROTTLE_TTL` / `THROTTLE_LIMIT` env vars)
- Auth named throttler: 60 requests per 15 minutes for auth endpoints
- Per-route overrides on auth controller:
  - Register: 5 requests per hour
  - Login: 10 requests per 15 minutes
  - Refresh: 30 requests per 15 minutes
  - Logout: 10 requests per 15 minutes
- GDPR export: 3 requests per 15 minutes
- AI Coach chat: 10 requests per minute
- Implemented via `@nestjs/throttler` with custom `UserThrottlerGuard` (applied globally via `APP_GUARD`)
- Throttle key uses authenticated user ID (not just IP), falls back to IP for unauthenticated
- **Note**: the per-account brute-force protection in `AuthService` (`loginAttempts` Map) is in-memory; it resets on process restart and does not work across multiple API instances. In a horizontally scaled or frequently restarted deployment, this protection is weaker than the `@nestjs/throttler` layer above

## Input Validation

- All request bodies validated via `class-validator` decorators on DTOs
- `ValidationPipe` with `whitelist: true` strips unknown properties
- `forbidNonWhitelisted: true` rejects requests with extra properties
- SQL injection protected by Prisma's parameterized queries

## Data Security

### Sensitive Data Handling
- Password hashes never returned in API responses (explicitly excluded in Prisma selects)
- Refresh tokens are HS256 JWTs (signed with `JWT_REFRESH_SECRET`) stored as full JWT strings in the `RefreshToken` table; the `jti` claim (UUID v4) enables per-token revocation
- Audit logs record sensitive admin actions

### GDPR Compliance
- Account deletion anonymizes data rather than hard-deleting to preserve referential integrity
- Data export provides complete user data in machine-readable JSON format
- Cookie consent is tracked per user (authenticated) or session (anonymous)

## Frontend Security

### Content Security
- `X-Frame-Options: DENY` header on all Next.js responses
- `X-Content-Type-Options: nosniff` on all Next.js responses
- Content-Security-Policy header on all Next.js responses, set per-request in `apps/web/src/middleware.ts` (not in `next.config.ts`, since it needs a fresh nonce every request):
  - `script-src 'self' 'nonce-<random>' 'strict-dynamic'` (+ `'unsafe-eval'` in development only, for webpack HMR/fast-refresh) — no `'unsafe-inline'`; Next's own bootstrap scripts carry the nonce automatically since `x-nonce` is set on the incoming request
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` — `'unsafe-inline'` is required here and has no nonce-based alternative: the app renders React inline `style={{...}}` props pervasively for theme tokens, which produce real `style="..."` attributes, and CSP nonces only apply to `<style>`/`<link>` tags, never to style attributes
- NestJS Helmet CSP in production only (separate config from Next.js) — `script-src 'self'` with no `'unsafe-inline'`/`'unsafe-eval'`, since the API never serves scripts in production (Swagger, the only thing that ever needed inline scripts, is dev-only)
- Stored XSS mitigated via `sanitize-html` on API post create/update
- Rendered XSS mitigated via DOMPurify on frontend post rendering

### Token Storage (HAR-001)

**Refresh token**: stored as an `httpOnly; Secure; SameSite=Lax` cookie (`refresh_token`) scoped to `path=/api/auth`. Not accessible from JavaScript — XSS cannot steal it.

**Access token**: held only in a module-level closure inside `apps/web/src/lib/api-client.ts` — not in Zustand, not in localStorage, not in any React state. Not enumerable via React devtools or the Zustand store API. Lost on page reload; silently re-acquired via the httpOnly cookie on the first 401 response (silent refresh).

**Session-indicator cookies** (non-httpOnly — not secrets, readable by Next.js middleware):
- `auth-session=1` — presence signals an active session; used by middleware for route gating
- `user-role=<ADMIN|MEMBER>` — used by middleware to protect `/admin` routes

The backend never trusts these indicator cookies for authorization — it always validates the `Authorization: Bearer` JWT on protected endpoints.

**Known limitation — Android native client**: The Android WebView app (`apps/mobile-android`) uses a native HTTP client (`AuthClient.kt`) that reads `refreshToken` from the response body and sends it via body on refresh. Since `refreshToken` is no longer in the response body, the native Android auth flow will break. The WebView-based session (which uses browser cookies) still works. Fix: update `AuthClient.kt` to use Android's `CookieManager` to extract and send the httpOnly cookie, or use the body fallback (send `refreshToken` in the request body to `/api/auth/refresh` — the strategy still accepts it).

**Cookie settings**:
- `httpOnly: true` — inaccessible to JavaScript
- `secure: true` in production — HTTPS only
- `sameSite: lax` — sent on top-level navigations, blocked on cross-site subrequests (CSRF protection)
- `path: /api/auth` — only sent to auth endpoints, not every API request

## Dependency Security

Keep dependencies updated:
```bash
pnpm audit
pnpm update --interactive
```

Run security audits in CI:
```bash
pnpm audit --audit-level moderate
```

## Production Checklist

- [ ] Change all default secrets in `.env`
- [ ] Use strong random values for `JWT_SECRET` and `JWT_REFRESH_SECRET` (64+ chars)
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS_ORIGINS to your production domain only
- [ ] Enable HTTPS via built-in Nginx proxy: `docker compose --profile proxy up -d` (see DEPLOYMENT.md)
- [ ] Set `DOMAIN` and `SSL_EMAIL` in `.env` for certificate provisioning
- [ ] Set up database backups
- [ ] Configure log aggregation
- [ ] Review rate limiting thresholds
- [ ] Rotate secrets regularly
