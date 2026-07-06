#!/bin/bash
# VPS Deployment Verification Script
#
# Run this on a Docker-enabled host after `docker compose -f docker-compose.yml --profile proxy up -d`
# to confirm the deployment is healthy before serving real users.
#
# Usage:
#   ./scripts/verify-vps-deployment.sh
#   DOMAIN=yourdomain.com ./scripts/verify-vps-deployment.sh
#
# Requirements: bash, curl, docker (with compose plugin), jq (optional — improves output)
#
# Exit codes: 0 = all required checks passed, 1 = one or more required checks failed

set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────────
_DOMAIN="${DOMAIN:-}"
if [ -f ".env" ]; then
  set -a
  . "./.env"
  set +a
fi
[ -n "$_DOMAIN" ] && DOMAIN="$_DOMAIN"

DOMAIN="${DOMAIN:-localhost}"
API_INTERNAL="http://localhost:3001"
WEB_INTERNAL="http://localhost:3000"
USE_HTTPS=0
if [ "$DOMAIN" != "localhost" ]; then
  USE_HTTPS=1
  API_URL="https://$DOMAIN"
  WEB_URL="https://$DOMAIN"
else
  API_URL="$API_INTERNAL"
  WEB_URL="$WEB_INTERNAL"
fi

PASS=0
FAIL=0
SKIP=0
WARN=0

ok()   { echo "  [PASS] $1"; PASS=$((PASS + 1)); }
fail() { echo "  [FAIL] $1"; FAIL=$((FAIL + 1)); }
skip() { echo "  [SKIP] $1"; SKIP=$((SKIP + 1)); }
warn() { echo "  [WARN] $1"; WARN=$((WARN + 1)); }

echo ""
echo "=== Community Platform VPS Deployment Verification ==="
echo "Domain:  $DOMAIN"
echo "API:     $API_URL"
echo "Web:     $WEB_URL"
echo "HTTPS:   $USE_HTTPS"
echo "Date:    $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo ""

# ════════════════════════════════════════════════════════════════════════════
# SECTION 1: Container state
# ════════════════════════════════════════════════════════════════════════════
echo "── Section 1: Container state ──────────────────────────────────────────"

echo "1.1  Container status"
CONTAINERS=$(docker compose -f docker-compose.yml --profile proxy ps --format json 2>/dev/null || echo "")
if [ -z "$CONTAINERS" ]; then
  fail "Could not read container status — is Docker Compose running?"
else
  for NAME in community_postgres community_redis community_api community_web community_nginx; do
    STATUS=$(docker ps --filter "name=$NAME" --format '{{.Status}}' 2>/dev/null || echo "")
    if [ -z "$STATUS" ]; then
      fail "Container $NAME is not running"
    elif echo "$STATUS" | grep -qi "unhealthy"; then
      fail "Container $NAME is unhealthy: $STATUS"
    elif echo "$STATUS" | grep -qi "healthy"; then
      ok "$NAME: $STATUS"
    elif echo "$STATUS" | grep -qi "starting"; then
      warn "$NAME: still starting — $STATUS (re-check in 30s)"
    else
      ok "$NAME: $STATUS"
    fi
  done
fi

echo "1.2  Port exposure — api and web must NOT bind to host"
API_PORT_BOUND=$(docker ps --filter "name=community_api" --format '{{.Ports}}' 2>/dev/null || echo "")
WEB_PORT_BOUND=$(docker ps --filter "name=community_web" --format '{{.Ports}}' 2>/dev/null || echo "")

if echo "$API_PORT_BOUND" | grep -q "0.0.0.0:3001"; then
  fail "API port 3001 is bound to host (0.0.0.0:3001) — production mode not active"
elif echo "$API_PORT_BOUND" | grep -q "3001->3001"; then
  fail "API port 3001 is bound to host — production mode not active"
else
  ok "API port 3001 not exposed to host"
fi

if echo "$WEB_PORT_BOUND" | grep -q "0.0.0.0:3000"; then
  fail "Web port 3000 is bound to host (0.0.0.0:3000) — production mode not active"
elif echo "$WEB_PORT_BOUND" | grep -q "3000->3000"; then
  fail "Web port 3000 is bound to host — production mode not active"
else
  ok "Web port 3000 not exposed to host"
fi

echo "1.3  Nginx listening on 80 and 443"
NGINX_PORTS=$(docker ps --filter "name=community_nginx" --format '{{.Ports}}' 2>/dev/null || echo "")
if echo "$NGINX_PORTS" | grep -q "0.0.0.0:80"; then
  ok "Nginx: port 80 bound"
else
  fail "Nginx: port 80 not bound to host"
fi
if echo "$NGINX_PORTS" | grep -q "0.0.0.0:443"; then
  ok "Nginx: port 443 bound"
else
  if [ "$USE_HTTPS" = "1" ]; then
    fail "Nginx: port 443 not bound — TLS not active"
  else
    skip "Nginx: port 443 not bound (DOMAIN=localhost, HTTPS not expected)"
  fi
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

echo "2.2  API health through nginx (exact-match /health route)"
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

echo "2.3  API /api/* routing through nginx"
LOGIN_HTTP=$(curl -so /dev/null -w "%{http_code}" --max-time 10 -X POST \
  "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"__verify__@example.invalid","password":"x"}' 2>/dev/null || echo "000")
if [ "$LOGIN_HTTP" = "401" ] || [ "$LOGIN_HTTP" = "429" ]; then
  ok "API /api/auth/login via nginx: HTTP $LOGIN_HTTP (correct rejection)"
else
  fail "API /api/auth/login via nginx: HTTP $LOGIN_HTTP (expected 401 or 429)"
fi

echo ""

# ════════════════════════════════════════════════════════════════════════════
# SECTION 3: Web serving
# ════════════════════════════════════════════════════════════════════════════
echo "── Section 3: Web serving ───────────────────────────────────────────────"

echo "3.1  Web login page via nginx"
WEB_HTTP=$(curl -so /dev/null -w "%{http_code}" --max-time 15 "$WEB_URL/login" 2>/dev/null || echo "000")
if [ "$WEB_HTTP" = "200" ] || [ "$WEB_HTTP" = "301" ] || [ "$WEB_HTTP" = "302" ]; then
  ok "Web /login via nginx: HTTP $WEB_HTTP"
else
  fail "Web /login via nginx: HTTP $WEB_HTTP (expected 200/301/302)"
fi

echo "3.2  Nginx health route does NOT return Next.js HTML"
HEALTH_CONTENT=$(curl -sf --max-time 10 "$API_URL/health" 2>/dev/null || echo "")
if echo "$HEALTH_CONTENT" | grep -qi "<!DOCTYPE"; then
  fail "/health returned HTML — nginx is routing /health to web, not to the API"
else
  ok "/health returns JSON, not HTML — nginx routing is correct"
fi

echo ""

# ════════════════════════════════════════════════════════════════════════════
# SECTION 4: TLS (when DOMAIN is set)
# ════════════════════════════════════════════════════════════════════════════
echo "── Section 4: TLS ───────────────────────────────────────────────────────"

if [ "$USE_HTTPS" = "1" ]; then
  echo "4.1  HTTP → HTTPS redirect"
  REDIRECT_CODE=$(curl -so /dev/null -w "%{http_code}" --max-time 10 "http://$DOMAIN/" 2>/dev/null || echo "000")
  if [ "$REDIRECT_CODE" = "301" ] || [ "$REDIRECT_CODE" = "302" ]; then
    ok "HTTP redirects to HTTPS: HTTP $REDIRECT_CODE"
  else
    fail "HTTP did not redirect: HTTP $REDIRECT_CODE (expected 301 or 302)"
  fi

  echo "4.2  TLS certificate valid"
  CERT_CHECK=$(curl -svI --max-time 10 "https://$DOMAIN/" 2>&1 | grep -i "SSL certificate verify" || echo "")
  if echo "$CERT_CHECK" | grep -qi "ok"; then
    ok "TLS certificate is valid"
  else
    CERT_EXPIRY=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null \
      | openssl x509 -noout -dates 2>/dev/null | grep "notAfter" || echo "")
    if [ -n "$CERT_EXPIRY" ]; then
      ok "TLS certificate present: $CERT_EXPIRY"
    else
      warn "Could not verify TLS certificate — check manually: openssl s_client -connect $DOMAIN:443"
    fi
  fi

  echo "4.3  HSTS header present"
  HSTS=$(curl -sI --max-time 10 "https://$DOMAIN/" 2>/dev/null | grep -i "strict-transport-security" || echo "")
  if [ -n "$HSTS" ]; then
    ok "HSTS header: $HSTS"
  else
    fail "HSTS header missing — check nginx config"
  fi
else
  skip "4.1  HTTP→HTTPS redirect (DOMAIN=localhost — no TLS expected)"
  skip "4.2  TLS certificate valid (DOMAIN=localhost)"
  skip "4.3  HSTS header (DOMAIN=localhost)"
fi

echo ""

# ════════════════════════════════════════════════════════════════════════════
# SECTION 5: Database
# ════════════════════════════════════════════════════════════════════════════
echo "── Section 5: Database ──────────────────────────────────────────────────"

echo "5.1  Postgres reachable from api container"
DB_CHECK=$(docker exec community_api sh -c 'npx prisma migrate status 2>&1' || echo "ERROR")
if echo "$DB_CHECK" | grep -q "Database schema is up to date"; then
  ok "Database migrations: up to date"
elif echo "$DB_CHECK" | grep -q "pending"; then
  fail "Pending migrations — run: docker compose exec api npx prisma migrate deploy"
elif echo "$DB_CHECK" | grep -q "ERROR\|error\|Error"; then
  fail "Migration status check failed — check DATABASE_URL and postgres connectivity"
else
  warn "Could not determine migration status: $DB_CHECK"
fi

echo "5.2  Postgres not directly reachable from host"
PG_PORT_BOUND=$(docker ps --filter "name=community_postgres" --format '{{.Ports}}' 2>/dev/null || echo "")
if echo "$PG_PORT_BOUND" | grep -q "5432->5432"; then
  fail "Postgres port 5432 is bound to host — should be internal only"
else
  ok "Postgres port 5432 not exposed to host"
fi

echo "5.3  No demo accounts (admin@example.com)"
DEMO_CHECK=$(docker exec community_postgres sh -c \
  "PGPASSWORD='${POSTGRES_PASSWORD:-password}' psql -U '${POSTGRES_USER:-postgres}' -d '${POSTGRES_DB:-community_platform}' -tAc \"SELECT COUNT(*) FROM \\\"User\\\" WHERE email LIKE '%example.com';\"" \
  2>/dev/null || echo "SKIP")
if [ "$DEMO_CHECK" = "SKIP" ] || [ -z "$DEMO_CHECK" ]; then
  skip "Demo account check skipped (could not query postgres)"
elif [ "$DEMO_CHECK" -eq 0 ]; then
  ok "No demo accounts found"
else
  warn "Found $DEMO_CHECK account(s) ending in @example.com — verify these are not demo credentials"
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
HEADERS=$(curl -sI --max-time 10 "$WEB_URL/login" 2>/dev/null || echo "")
if [ -z "$HEADERS" ]; then
  fail "Could not fetch headers from $WEB_URL/login"
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
  ok "SEED_DEMO_DATA is not 'true' in api container: '${SEED_ENV}'"
fi

echo ""

# ════════════════════════════════════════════════════════════════════════════
# SECTION 9: Backup smoke test
# ════════════════════════════════════════════════════════════════════════════
echo "── Section 9: Backup ────────────────────────────────────────────────────"

echo "9.1  Backup profile produces a dump file"
DATA_DIR="${DATA_DIR:-./data}"
BACKUP_DIR="$DATA_DIR/backups"
mkdir -p "$BACKUP_DIR"
BEFORE=$(ls "$BACKUP_DIR"/*.dump 2>/dev/null | wc -l || echo "0")
docker compose --profile backup run --rm backup 2>/dev/null
AFTER=$(ls "$BACKUP_DIR"/*.dump 2>/dev/null | wc -l || echo "0")
if [ "$AFTER" -gt "$BEFORE" ]; then
  LATEST=$(ls -t "$BACKUP_DIR"/*.dump 2>/dev/null | head -1)
  SIZE=$(du -sh "$LATEST" 2>/dev/null | cut -f1 || echo "unknown")
  ok "Backup created: $(basename "$LATEST") ($SIZE)"
else
  fail "No new dump file created in $BACKUP_DIR — check backup service logs"
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
