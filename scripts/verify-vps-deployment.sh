#!/bin/bash
# VPS Deployment Verification Script
#
# Run this on a Docker-enabled host to confirm a community-platform deployment
# is healthy before serving real users.
#
# Works in two modes:
#   - Core mode (default): verifies api, web, postgres, redis — no nginx required.
#   - Proxy mode: additionally verifies nginx routing, TLS, and security headers.
#     Proxy mode activates automatically when community_nginx is running.
#
# TLS checks are skipped for IP addresses (Let's Encrypt requires a hostname).
# Use the no-SSL nginx template when running against an IP:
#   NGINX_CONF_TEMPLATE=default-no-ssl.conf.template \
#     docker compose -f docker-compose.yml --profile proxy up -d
#
# Usage:
#   # Core services only (no nginx required):
#   ./scripts/verify-vps-deployment.sh
#
#   # With nginx + TLS (hostname required):
#   DOMAIN=yourdomain.com ./scripts/verify-vps-deployment.sh
#
#   # With nginx, no TLS (IP address or plain HTTP):
#   DOMAIN=12.34.56.78 ./scripts/verify-vps-deployment.sh
#
#   # Start nginx if not running:
#   docker compose -f docker-compose.yml --profile proxy up -d nginx
#
# Requirements: bash, curl, docker (with compose plugin), openssl
#
# Exit codes: 0 = all required checks passed, 1 = one or more required checks failed

set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────────
_DOMAIN="${DOMAIN:-}"
_POSTGRES_USER="${POSTGRES_USER:-}"
_POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
_POSTGRES_DB="${POSTGRES_DB:-}"
_DATA_DIR="${DATA_DIR:-}"

if [ -f ".env" ]; then
  set -a
  . "./.env"
  set +a
fi

[ -n "$_DOMAIN" ]           && DOMAIN="$_DOMAIN"
[ -n "$_POSTGRES_USER" ]    && POSTGRES_USER="$_POSTGRES_USER"
[ -n "$_POSTGRES_PASSWORD" ] && POSTGRES_PASSWORD="$_POSTGRES_PASSWORD"
[ -n "$_POSTGRES_DB" ]      && POSTGRES_DB="$_POSTGRES_DB"
[ -n "$_DATA_DIR" ]         && DATA_DIR="$_DATA_DIR"

DOMAIN="${DOMAIN:-localhost}"
PGUSER="${POSTGRES_USER:-postgres}"
PGPASS="${POSTGRES_PASSWORD:-password}"
PGDB="${POSTGRES_DB:-community_platform}"
DATA_DIR="${DATA_DIR:-./data}"

# Determine whether TLS is expected.
# TLS requires a real hostname — IP addresses and localhost never have Let's Encrypt certs.
IS_IP=0
if echo "$DOMAIN" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'; then
  IS_IP=1
fi

USE_HTTPS=0
if [ "$DOMAIN" != "localhost" ] && [ "$IS_IP" = "0" ]; then
  USE_HTTPS=1
  API_URL="https://$DOMAIN"
  WEB_URL="https://$DOMAIN"
else
  API_URL="http://$DOMAIN"
  WEB_URL="http://$DOMAIN"
  # Keep internal URLs for direct container checks
  if [ "$DOMAIN" = "localhost" ]; then
    API_URL="http://localhost:3001"
    WEB_URL="http://localhost:3000"
  fi
fi

PASS=0
FAIL=0
SKIP=0
WARN=0

ok()   { echo "  [PASS] $1"; PASS=$((PASS + 1)); }
fail() { echo "  [FAIL] $1"; FAIL=$((FAIL + 1)); }
skip() { echo "  [SKIP] $1"; SKIP=$((SKIP + 1)); }
warn() { echo "  [WARN] $1"; WARN=$((WARN + 1)); }

# Detect whether nginx is running — used to decide whether to skip proxy checks.
NGINX_RUNNING=0
if docker ps --filter "name=community_nginx" --format '{{.Names}}' 2>/dev/null | grep -q "community_nginx"; then
  NGINX_RUNNING=1
fi

echo ""
echo "=== Community Platform VPS Deployment Verification ==="
echo "Domain:       $DOMAIN$([ "$IS_IP" = "1" ] && echo " (IP address — TLS checks skipped)" || true)"
echo "Proxy mode:   $([ "$NGINX_RUNNING" = "1" ] && echo "yes (nginx running)" || echo "no (nginx not running — proxy checks skipped)")"
echo "HTTPS:        $([ "$USE_HTTPS" = "1" ] && echo "yes" || echo "no")"
echo "API:          $API_URL"
echo "Web:          $WEB_URL"
echo "Date:         $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo ""

# ════════════════════════════════════════════════════════════════════════════
# SECTION 1: Container state
# ════════════════════════════════════════════════════════════════════════════
echo "── Section 1: Container state ──────────────────────────────────────────"

echo "1.1  Core container status"
for NAME in community_postgres community_redis community_api community_web; do
  STATUS=$(docker ps --filter "name=$NAME" --format '{{.Status}}' 2>/dev/null || echo "")
  if [ -z "$STATUS" ]; then
    fail "Container $NAME is not running"
  elif echo "$STATUS" | grep -qi "unhealthy"; then
    fail "Container $NAME is unhealthy: $STATUS"
  elif echo "$STATUS" | grep -qi "starting"; then
    warn "$NAME: still starting — $STATUS (re-check in 30s)"
  else
    ok "$NAME: $STATUS"
  fi
done

echo "1.2  Nginx container status"
NGINX_STATUS=$(docker ps --filter "name=community_nginx" --format '{{.Status}}' 2>/dev/null || echo "")
if [ -z "$NGINX_STATUS" ]; then
  skip "community_nginx not running — start with: docker compose -f docker-compose.yml --profile proxy up -d nginx"
elif echo "$NGINX_STATUS" | grep -qi "unhealthy"; then
  fail "community_nginx is unhealthy: $NGINX_STATUS"
else
  ok "community_nginx: $NGINX_STATUS"
fi

echo "1.3  Port exposure — api and web must NOT bind to host"
API_PORT_BOUND=$(docker ps --filter "name=community_api" --format '{{.Ports}}' 2>/dev/null || echo "")
WEB_PORT_BOUND=$(docker ps --filter "name=community_web" --format '{{.Ports}}' 2>/dev/null || echo "")

if echo "$API_PORT_BOUND" | grep -qE "0\.0\.0\.0:3001|:::3001"; then
  fail "API port 3001 is bound to host — production mode not active (run with -f docker-compose.yml, not override)"
else
  ok "API port 3001 not exposed to host"
fi

if echo "$WEB_PORT_BOUND" | grep -qE "0\.0\.0\.0:3000|:::3000"; then
  fail "Web port 3000 is bound to host — production mode not active (run with -f docker-compose.yml, not override)"
else
  ok "Web port 3000 not exposed to host"
fi

echo "1.4  Nginx port binding (proxy mode)"
if [ "$NGINX_RUNNING" = "1" ]; then
  NGINX_PORTS=$(docker ps --filter "name=community_nginx" --format '{{.Ports}}' 2>/dev/null || echo "")
  if echo "$NGINX_PORTS" | grep -qE "0\.0\.0\.0:80|:::80"; then
    ok "Nginx: port 80 bound"
  else
    fail "Nginx: port 80 not bound to host"
  fi
  if echo "$NGINX_PORTS" | grep -qE "0\.0\.0\.0:443|:::443"; then
    ok "Nginx: port 443 bound"
  elif [ "$USE_HTTPS" = "1" ]; then
    fail "Nginx: port 443 not bound — TLS not active"
  else
    skip "Nginx: port 443 not bound (DOMAIN=localhost)"
  fi
else
  skip "1.4  Nginx port binding — nginx not running"
fi

echo ""

# ════════════════════════════════════════════════════════════════════════════
# SECTION 2: API health
# ════════════════════════════════════════════════════════════════════════════
echo "── Section 2: API health ────────────────────────────────────────────────"

echo "2.1  Direct API health (bypassing nginx)"
HEALTH_DIRECT=$(docker exec community_api wget -qO- http://localhost:3001/health 2>/dev/null || echo "")
if [ -z "$HEALTH_DIRECT" ]; then
  fail "API /health unreachable inside container"
else
  STATUS=$(echo "$HEALTH_DIRECT" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
  if [ "$STATUS" = "ok" ] || [ "$STATUS" = "degraded" ]; then
    ok "API /health inside container: $STATUS"
  else
    fail "API /health inside container: unexpected response: $HEALTH_DIRECT"
  fi
fi

echo "2.2  API health through nginx (/health exact-match route)"
if [ "$NGINX_RUNNING" = "1" ]; then
  HEALTH_NGINX=$(curl -sf --max-time 10 "$API_URL/health" 2>/dev/null || echo "")
  if [ -z "$HEALTH_NGINX" ]; then
    fail "API /health unreachable via nginx at $API_URL/health"
  else
    STATUS=$(echo "$HEALTH_NGINX" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    if [ "$STATUS" = "ok" ] || [ "$STATUS" = "degraded" ]; then
      ok "API /health via nginx: $STATUS"
    else
      fail "API /health via nginx: unexpected response: $HEALTH_NGINX"
    fi
  fi
else
  skip "2.2  Nginx not running — skipping proxy health check"
fi

echo "2.3  API /api/* routing through nginx"
if [ "$NGINX_RUNNING" = "1" ]; then
  LOGIN_HTTP=$(curl -so /dev/null -w "%{http_code}" --max-time 10 -X POST \
    "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"__verify__@example.invalid","password":"x"}' 2>/dev/null || echo "000")
  if [ "$LOGIN_HTTP" = "401" ] || [ "$LOGIN_HTTP" = "429" ]; then
    ok "API /api/auth/login via nginx: HTTP $LOGIN_HTTP (correct rejection)"
  else
    fail "API /api/auth/login via nginx: HTTP $LOGIN_HTTP (expected 401 or 429)"
  fi
else
  skip "2.3  Nginx not running — skipping proxy routing check"
fi

echo ""

# ════════════════════════════════════════════════════════════════════════════
# SECTION 3: Web serving
# ════════════════════════════════════════════════════════════════════════════
echo "── Section 3: Web serving ───────────────────────────────────────────────"

echo "3.1  Web login page"
if [ "$NGINX_RUNNING" = "1" ]; then
  WEB_HTTP=$(curl -so /dev/null -w "%{http_code}" --max-time 15 "$WEB_URL/login" 2>/dev/null || echo "000")
  if [ "$WEB_HTTP" = "200" ] || [ "$WEB_HTTP" = "301" ] || [ "$WEB_HTTP" = "302" ]; then
    ok "Web /login via nginx: HTTP $WEB_HTTP"
  else
    fail "Web /login via nginx: HTTP $WEB_HTTP (expected 200/301/302)"
  fi
else
  WEB_HTTP=$(curl -so /dev/null -w "%{http_code}" --max-time 15 "http://localhost:3000/login" 2>/dev/null || echo "000")
  if [ "$WEB_HTTP" = "200" ] || [ "$WEB_HTTP" = "301" ] || [ "$WEB_HTTP" = "302" ]; then
    ok "Web /login direct: HTTP $WEB_HTTP"
  else
    fail "Web /login direct: HTTP $WEB_HTTP (expected 200/301/302)"
  fi
fi

echo "3.2  Nginx /health route returns API JSON, not Next.js HTML"
if [ "$NGINX_RUNNING" = "1" ]; then
  HEALTH_CONTENT=$(curl -sf --max-time 10 "$API_URL/health" 2>/dev/null || echo "")
  if [ -z "$HEALTH_CONTENT" ]; then
    fail "/health returned no response via nginx — check nginx is fully started"
  elif echo "$HEALTH_CONTENT" | grep -qi "<!DOCTYPE"; then
    fail "/health returned HTML — nginx is routing /health to web instead of the API"
  else
    ok "/health returns JSON, not HTML — nginx routing correct"
  fi
else
  skip "3.2  Nginx not running — skipping /health routing check"
fi

echo ""

# ════════════════════════════════════════════════════════════════════════════
# SECTION 4: TLS
# ════════════════════════════════════════════════════════════════════════════
echo "── Section 4: TLS ───────────────────────────────────────────────────────"

if [ "$USE_HTTPS" = "1" ] && [ "$NGINX_RUNNING" = "1" ]; then
  echo "4.1  HTTP → HTTPS redirect"
  REDIRECT_CODE=$(curl -so /dev/null -w "%{http_code}" --max-time 10 "http://$DOMAIN/" 2>/dev/null || echo "000")
  if [ "$REDIRECT_CODE" = "301" ] || [ "$REDIRECT_CODE" = "302" ]; then
    ok "HTTP redirects to HTTPS: HTTP $REDIRECT_CODE"
  else
    fail "HTTP did not redirect to HTTPS: HTTP $REDIRECT_CODE (expected 301/302)"
  fi

  echo "4.2  TLS certificate valid and not expired"
  CERT_CHECKEND=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null \
    | openssl x509 -noout -checkend 0 2>/dev/null && echo "valid" || echo "expired")
  CERT_EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null || echo "")
  if [ "$CERT_CHECKEND" = "valid" ]; then
    # Also warn if expiring within 14 days
    EXPIRING_SOON=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null \
      | openssl x509 -noout -checkend 1209600 2>/dev/null && echo "ok" || echo "soon")
    if [ "$EXPIRING_SOON" = "soon" ]; then
      warn "TLS certificate valid but expires within 14 days — renew soon: $CERT_EXPIRY"
    else
      ok "TLS certificate valid: $CERT_EXPIRY"
    fi
  elif [ -n "$CERT_EXPIRY" ]; then
    fail "TLS certificate EXPIRED: $CERT_EXPIRY — renew: docker compose run --rm certbot renew --force-renewal && docker compose exec nginx nginx -s reload"
  else
    fail "Could not retrieve TLS certificate — check nginx SSL config"
  fi

  echo "4.3  HSTS header present"
  HSTS=$(curl -sI --max-time 10 "https://$DOMAIN/" 2>/dev/null | grep -i "strict-transport-security" || echo "")
  if [ -n "$HSTS" ]; then
    ok "HSTS header: $HSTS"
  else
    fail "HSTS header missing — check nginx config"
  fi
elif [ "$USE_HTTPS" = "1" ] && [ "$NGINX_RUNNING" = "0" ]; then
  skip "4.1  HTTP→HTTPS redirect — nginx not running"
  skip "4.2  TLS certificate — nginx not running"
  skip "4.3  HSTS header — nginx not running"
else
  if [ "$IS_IP" = "1" ]; then
    skip "4.1  HTTP→HTTPS redirect (DOMAIN is an IP address — Let's Encrypt requires a hostname)"
    skip "4.2  TLS certificate (IP address — use a hostname + init-ssl.sh for TLS)"
    skip "4.3  HSTS header (IP address — no TLS)"
  else
    skip "4.1  HTTP→HTTPS redirect (DOMAIN=localhost — no TLS expected)"
    skip "4.2  TLS certificate (DOMAIN=localhost)"
    skip "4.3  HSTS header (DOMAIN=localhost)"
  fi
fi

echo ""

# ════════════════════════════════════════════════════════════════════════════
# SECTION 5: Database
# ════════════════════════════════════════════════════════════════════════════
echo "── Section 5: Database ──────────────────────────────────────────────────"

echo "5.1  Migration status"
DB_CHECK=$(docker exec community_api sh -c 'npx prisma migrate status 2>&1' || echo "ERROR")
if echo "$DB_CHECK" | grep -q "Database schema is up to date"; then
  ok "Database migrations: up to date"
elif echo "$DB_CHECK" | grep -q "pending"; then
  fail "Pending migrations — run: docker compose exec api npx prisma migrate deploy"
elif echo "$DB_CHECK" | grep -qiE "ERROR|Cannot connect|Access denied"; then
  fail "Migration status check failed — check DATABASE_URL and postgres connectivity"
else
  warn "Could not determine migration status (unexpected output)"
fi

echo "5.2  Postgres not directly reachable from host"
PG_PORT_BOUND=$(docker ps --filter "name=community_postgres" --format '{{.Ports}}' 2>/dev/null || echo "")
if echo "$PG_PORT_BOUND" | grep -qE "0\.0\.0\.0:5432|:::5432"; then
  fail "Postgres port 5432 is bound to host — should be internal only"
else
  ok "Postgres port 5432 not exposed to host"
fi

echo "5.3  No demo accounts (admin@example.com)"
DEMO_CHECK=$(docker exec community_postgres sh -c \
  "PGPASSWORD='$PGPASS' psql -U '$PGUSER' -d '$PGDB' -tAc \"SELECT COUNT(*) FROM \\\"User\\\" WHERE email LIKE '%example.com';\"" \
  2>/dev/null || echo "SKIP")
if [ "$DEMO_CHECK" = "SKIP" ] || [ -z "$DEMO_CHECK" ]; then
  skip "Demo account check skipped (could not query postgres)"
elif [ "$DEMO_CHECK" -eq 0 ] 2>/dev/null; then
  ok "No demo accounts found"
else
  warn "Found $DEMO_CHECK account(s) ending in @example.com — verify these are not demo credentials before going live"
fi

echo ""

# ════════════════════════════════════════════════════════════════════════════
# SECTION 6: File uploads
# ════════════════════════════════════════════════════════════════════════════
echo "── Section 6: File uploads ──────────────────────────────────────────────"

echo "6.1  Uploads directory writable"
if docker exec community_api sh -c \
  'touch /app/apps/api/uploads/avatars/.verify-vps && rm /app/apps/api/uploads/avatars/.verify-vps' \
  2>/dev/null; then
  ok "Uploads directory is writable"
else
  fail "Uploads directory is not writable — check DATA_DIR volume mount"
fi

echo ""

# ════════════════════════════════════════════════════════════════════════════
# SECTION 7: Security headers
# ════════════════════════════════════════════════════════════════════════════
echo "── Section 7: Security headers ──────────────────────────────────────────"

echo "7.1  Security headers on web response"
if [ "$NGINX_RUNNING" = "1" ]; then
  HEADER_URL="$WEB_URL/login"
else
  HEADER_URL="http://localhost:3000/login"
fi
HEADERS=$(curl -sI --max-time 10 "$HEADER_URL" 2>/dev/null || echo "")
if [ -z "$HEADERS" ]; then
  fail "Could not fetch headers from $HEADER_URL"
else
  check_header() {
    local HNAME="$1"
    if echo "$HEADERS" | grep -qi "$HNAME"; then
      ok "Header present: $HNAME"
    else
      warn "Header missing: $HNAME"
    fi
  }
  check_header "x-frame-options"
  check_header "x-content-type-options"
  check_header "referrer-policy"
fi

echo ""

# ════════════════════════════════════════════════════════════════════════════
# SECTION 8: Seed guard
# ════════════════════════════════════════════════════════════════════════════
echo "── Section 8: Seed guard ────────────────────────────────────────────────"

echo "8.1  SEED_DEMO_DATA is not 'true' in running api container"
SEED_ENV=$(docker exec community_api sh -c 'echo "${SEED_DEMO_DATA:-}"' 2>/dev/null || echo "UNKNOWN")
if [ "$SEED_ENV" = "true" ]; then
  warn "SEED_DEMO_DATA=true is set in the api container — do not run db:seed in production"
elif [ "$SEED_ENV" = "UNKNOWN" ]; then
  skip "Could not read SEED_DEMO_DATA from container"
else
  ok "SEED_DEMO_DATA is not 'true' in api container"
fi

echo ""

# ════════════════════════════════════════════════════════════════════════════
# SECTION 9: Backup smoke test
# ════════════════════════════════════════════════════════════════════════════
echo "── Section 9: Backup ────────────────────────────────────────────────────"

echo "9.1  Backup profile produces a dump file"
BACKUP_DIR="$DATA_DIR/backups"
if ! mkdir -p "$BACKUP_DIR" 2>/dev/null; then
  fail "Cannot create/access backup directory $BACKUP_DIR — fix permissions with: sudo chown \$(id -u) \"$DATA_DIR\""
else
  BEFORE=$(ls "$BACKUP_DIR"/*.dump 2>/dev/null | wc -l || echo "0")
  docker compose --profile backup run --rm backup 2>/dev/null || true
  AFTER=$(ls "$BACKUP_DIR"/*.dump 2>/dev/null | wc -l || echo "0")
  if [ "$AFTER" -gt "$BEFORE" ]; then
    LATEST=$(ls -t "$BACKUP_DIR"/*.dump 2>/dev/null | head -1)
    SIZE=$(du -sh "$LATEST" 2>/dev/null | cut -f1 || echo "unknown")
    ok "Backup created: $(basename "$LATEST") ($SIZE)"
  else
    fail "No new dump file in $BACKUP_DIR — check: docker compose --profile backup logs backup"
  fi
fi

echo ""

# ════════════════════════════════════════════════════════════════════════════
# SECTION 10: Container non-root user
# ════════════════════════════════════════════════════════════════════════════
echo "── Section 10: Container users ──────────────────────────────────────────"

for CTR in community_api community_web; do
  WHO=$(docker exec "$CTR" whoami 2>/dev/null || echo "unknown")
  if [ "$WHO" = "root" ]; then
    fail "$CTR is running as root — check USER directive in Dockerfile"
  else
    ok "$CTR running as: $WHO"
  fi
done

echo ""

# ════════════════════════════════════════════════════════════════════════════
# Summary
# ════════════════════════════════════════════════════════════════════════════
echo "══════════════════════════════════════════════════════════════════════════"
echo "Results: $PASS passed  $FAIL failed  $WARN warnings  $SKIP skipped"
if [ "$NGINX_RUNNING" = "0" ]; then
  echo "Note: nginx was not running — proxy/TLS checks were skipped."
  echo "      To run a full check: docker compose -f docker-compose.yml --profile proxy up -d"
fi
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "DEPLOYMENT NOT READY — fix the failing checks above before serving users."
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo "Deployment looks good but review the warnings above."
  exit 0
else
  echo "All checks passed. Deployment looks healthy."
  exit 0
fi
