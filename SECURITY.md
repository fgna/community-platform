# Security

## Authentication & Authorization

### JWT Tokens
- **Access tokens**: HS256 JWT, 15-minute expiry, signed with `JWT_SECRET`
- **Refresh tokens**: UUID v4, stored in PostgreSQL with expiry timestamp, 7-day lifetime
- Refresh token rotation: each use invalidates the old token and issues a new one
- Logout invalidates the refresh token server-side

### Password Hashing
Passwords are hashed with **Argon2id** (via the `argon2` npm package):
- Industry best practice, winner of Password Hashing Competition
- Resistant to GPU/ASIC attacks
- Default parameters: memory=65536, iterations=3, parallelism=4

### Role-Based Access Control
Two roles: `ADMIN` and `MEMBER`
- `JwtAuthGuard` is a global guard — all endpoints require authentication by default
- Public endpoints are explicitly marked with `@SetMetadata(IS_PUBLIC_KEY, true)`
- `RolesGuard` is a global guard — checks `@Roles('ADMIN')` on controllers/handlers
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
- Per-route overrides:
  - Register: 5 requests per hour
  - Login: 10 requests per 15 minutes
  - Refresh: 30 requests per 15 minutes
  - Logout: 10 requests per 15 minutes
- Implemented via `@nestjs/throttler` with custom `UserThrottlerGuard`
- Throttle key uses authenticated user ID (not just IP) for logged-in users
- Applies globally to all endpoints

## Input Validation

- All request bodies validated via `class-validator` decorators on DTOs
- `ValidationPipe` with `whitelist: true` strips unknown properties
- `forbidNonWhitelisted: true` rejects requests with extra properties
- SQL injection protected by Prisma's parameterized queries

## Data Security

### Sensitive Data Handling
- Password hashes never returned in API responses (explicitly excluded in Prisma selects)
- Refresh tokens are opaque UUIDs — never expose JWT structure
- Audit logs record sensitive admin actions

### GDPR Compliance
- Account deletion anonymizes data rather than hard-deleting to preserve referential integrity
- Data export provides complete user data in machine-readable JSON format
- Cookie consent is tracked per user (authenticated) or session (anonymous)

## Frontend Security

### Content Security
- `X-Frame-Options: DENY` header on all Next.js responses
- `X-Content-Type-Options: nosniff` on all Next.js responses

### Token Storage
- Tokens stored in localStorage (via Zustand persist) — acceptable for SPAs
- For higher security requirements, consider httpOnly cookies instead

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
