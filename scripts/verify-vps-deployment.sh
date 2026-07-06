#!/usr/bin/env bash
# verify-vps-deployment.sh — post-deployment smoke test for production VPS
#
# Usage:
#   ./scripts/verify-vps-deployment.sh
#   DOMAIN=yourdomain.com ./scripts/verify-vps-deployment.sh
#
# Exit codes: 0 = all checks passed, 1 = one or more checks failed

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
DOMAIN="${DOMAIN:-localhost}"
API_INTERNAL="${API_INTERNAL:-http://localhost:3001}"
WEB_INTERNAL="${WEB_INTERNAL:-http://localhost:3000}"
USE_HTTPS="${USE_HTTPS:-false}"

if [ "${USE_HTTPS}" = "true" ] || [ "${DOMAIN}" != "localhost" ]; then
  BASE_URL="https://${DOMAIN}"
else
  BASE_URL="http://${DOMAIN}"
fi

PASS=0
FAIL=0

ok()   { echo "  [PASS] $*"; PASS=$((PASS + 1)); }
fail() { echo "  [FAIL] $*"; FAIL=$((FAIL + 1)); }
info() { echo "  [INFO] $*"; }
section() { echo; echo "── $* ──────────────────────────────────────────────"; }

# ── Section 0: Required env-var pre-flight ────────────────────────────────────
section "0. Environment variable pre-flight"

echo "  0.1  JWT_SECRET"
if [ -z "${JWT_SECRET:-}" ]; then
  fail "JWT_SECRET is not set"
elif echo "${JWT_SECRET}" | grep -qiE "change|example|placeholder|todo|secret|your-"; then
  fail "JWT_SECRET looks like a placeholder — generate with: openssl rand -hex 32"
elif [ "${#JWT_SECRET}" -lt 32 ]; then
  fail "JWT_SECRET too short (${#JWT_SECRET} chars) — minimum 32 required"
else
  ok "JWT_SECRET set (${#JWT_SECRET} chars)"
fi

echo "  0.2  JWT_REFRESH_SECRET"
if [ -z "${JWT_REFRESH_SECRET:-}" ]; then
  fail "JWT_REFRESH_SECRET is not set"
elif echo "${JWT_REFRESH_SECRET}" | grep -qiE "change|example|placeholder|todo|secret|your-"; then
  fail "JWT_REFRESH_SECRET looks like a placeholder — generate with: openssl rand -hex 32"
elif [ "${#JWT_REFRESH_SECRET}" -lt 32 ]; then
  fail "JWT_REFRESH_SECRET too short (${#JWT_REFRESH_SECRET} chars) — minimum 32 required"
else
  ok "JWT_REFRESH_SECRET set (${#JWT_REFRESH_SECRET} chars)"
fi

echo "  0.3  POSTGRES_PASSWORD"
if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  fail "POSTGRES_PASSWORD is not set"
elif echo "${POSTGRES_PASSWORD}" | grep -qiE "^(password|postgres|changeme|secret|admin|123456)$"; then
  fail "POSTGRES_PASSWORD is a well-known default — change it immediately"
else
  ok "POSTGRES_PASSWORD set (${#POSTGRES_PASSWORD} chars)"
fi

echo "  0.4  CORS_ORIGINS"
if [ -z "${CORS_ORIGINS:-}" ]; then
  fail "CORS_ORIGINS is not set"
elif echo "${CORS_ORIGINS}" | grep -q '\*'; then
  fail "CORS_ORIGINS contains wildcard (*) — must be explicit origins in production"
elif echo "${CORS_ORIGINS}" | grep -q 'localhost'; then
  fail "CORS_ORIGINS contains 'localhost' — not suitable for production"
else
  ok "CORS_ORIGINS=${CORS_ORIGINS}"
fi

echo "  0.5  NODE_ENV"
if [ "${NODE_ENV:-}" != "production" ]; then
  fail "NODE_ENV=${NODE_ENV:-<unset>} — must be 'production'"
else
  ok "NODE_ENV=production"
fi

echo "  0.6  SEED_DEMO_DATA"
if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
  fail "SEED_DEMO_DATA=true — demo seed must not be enabled in production"
else
  ok "SEED_DEMO_DATA is not 'true'"
fi

# ── Section 1: Container health ───────────────────────────────────────────────
section "1. Container health"

for container in community_api community_postgres community_redis; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' "${container}" 2>/dev/null || echo "not_found")
  case "${STATUS}" in
    healthy)   ok "${container} is healthy" ;;
    not_found) fail "${container} container not found — is the stack running?" ;;
    *)         fail "${container} health status: ${STATUS}" ;;
  esac
done

# ── Section 2: API health endpoint ───────────────────────────────────────────
section "2. API health endpoint"

API_RESP=$(curl -sf --max-time 10 "${API_INTERNAL}/health" 2>/dev/null || echo '{}')
API_STATUS=$(echo "${API_RESP}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','missing'))" 2>/dev/null || echo "parse_error")

if [ "${API_STATUS}" = "ok" ]; then
  ok "API health: ok"
elif [ "${API_STATUS}" = "degraded" ]; then
  fail "API health: degraded — check /health for details: ${API_RESP}"
else
  fail "API health endpoint returned unexpected status: ${API_STATUS}"
fi

# ── Section 3: Web app serving ────────────────────────────────────────────────
section "3. Web app serving"

WEB_STATUS=$(curl -so /dev/null -w "%{http_code}" --max-time 10 "${WEB_INTERNAL}/login" 2>/dev/null || echo "000")
if [ "${WEB_STATUS}" = "200" ]; then
  ok "Web /login returns HTTP 200"
else
  fail "Web /login returned HTTP ${WEB_STATUS} (expected 200)"
fi

# ── Section 4: Security headers & Swagger disabled ───────────────────────────
section "4. Security"

echo "  4.1  Swagger disabled in production"
SWAGGER_STATUS=$(curl -so /dev/null -w "%{http_code}" --max-time 10 "${API_INTERNAL}/api/docs" 2>/dev/null || echo "000")
if [ "${SWAGGER_STATUS}" = "404" ]; then
  ok "Swagger /api/docs returns 404 (disabled)"
else
  fail "Swagger /api/docs returned HTTP ${SWAGGER_STATUS} — should be 404 in production"
fi

echo "  4.2  API x-powered-by header removed"
XPB=$(curl -sI --max-time 10 "${API_INTERNAL}/health" 2>/dev/null | grep -i "x-powered-by" || true)
if [ -z "${XPB}" ]; then
  ok "x-powered-by header not present"
else
  fail "x-powered-by header is present: ${XPB}"
fi

# ── Section 5: Database connectivity ─────────────────────────────────────────
section "5. Database"

DB_CHECK=$(docker exec community_postgres pg_isready -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-community_platform}" 2>/dev/null || echo "failed")
if echo "${DB_CHECK}" | grep -q "accepting connections"; then
  ok "PostgreSQL is accepting connections"
else
  fail "PostgreSQL pg_isready check failed: ${DB_CHECK}"
fi

# ── Section 6: Uploads directory writable ────────────────────────────────────
section "6. Filesystem"

if docker exec community_api sh -c 'touch /app/apps/api/uploads/avatars/.write-test && rm /app/apps/api/uploads/avatars/.write-test' 2>/dev/null; then
  ok "Uploads directory is writable"
else
  fail "Uploads directory is not writable — check volume mount"
fi

# ── Section 7: nginx (proxy profile) ─────────────────────────────────────────
section "7. Reverse proxy (if nginx profile active)"

NGINX_RUNNING=$(docker inspect --format='{{.State.Running}}' community_nginx 2>/dev/null || echo "false")
if [ "${NGINX_RUNNING}" = "true" ]; then
  echo "  7.1  HTTP → HTTPS redirect"
  HTTP_REDIRECT=$(curl -so /dev/null -w "%{http_code}" --max-time 10 "http://${DOMAIN}/" 2>/dev/null || echo "000")
  if [ "${HTTP_REDIRECT}" = "301" ] || [ "${HTTP_REDIRECT}" = "302" ]; then
    ok "HTTP → HTTPS redirect active (${HTTP_REDIRECT})"
  else
    fail "Expected 301/302 redirect from HTTP, got ${HTTP_REDIRECT}"
  fi

  echo "  7.2  HTTPS reachable"
  HTTPS_STATUS=$(curl -so /dev/null -w "%{http_code}" --max-time 10 "https://${DOMAIN}/login" 2>/dev/null || echo "000")
  if [ "${HTTPS_STATUS}" = "200" ]; then
    ok "HTTPS /login returns 200"
  else
    fail "HTTPS /login returned ${HTTPS_STATUS}"
  fi

  echo "  7.3  TLS certificate expiry"
  CERT_EXPIRY=$(echo | openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "unknown")
  if [ "${CERT_EXPIRY}" = "unknown" ]; then
    fail "Could not read TLS certificate expiry"
  else
    EXPIRY_EPOCH=$(date -d "${CERT_EXPIRY}" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "${CERT_EXPIRY}" +%s 2>/dev/null || echo "0")
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
    if [ "${DAYS_LEFT}" -lt 14 ]; then
      fail "TLS certificate expires in ${DAYS_LEFT} days — renew now"
    elif [ "${DAYS_LEFT}" -lt 30 ]; then
      fail "TLS certificate expires in ${DAYS_LEFT} days — renew soon"
    else
      ok "TLS certificate valid for ${DAYS_LEFT} more days"
    fi
  fi

  echo "  7.4  Security headers via nginx"
  HSTS=$(curl -sI --max-time 10 "https://${DOMAIN}/" 2>/dev/null | grep -i "strict-transport-security" || true)
  if [ -n "${HSTS}" ]; then
    ok "Strict-Transport-Security header present"
  else
    fail "Strict-Transport-Security header missing"
  fi
else
  info "nginx not running — skipping reverse proxy checks (run with --profile proxy to enable)"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo
echo "══════════════════════════════════════════════════════"
echo "  Results: ${PASS} passed, ${FAIL} failed"
echo "══════════════════════════════════════════════════════"

if [ "${FAIL}" -gt 0 ]; then
  echo "  DEPLOYMENT VERIFICATION FAILED — do not consider this deployment production-ready"
  exit 1
else
  echo "  All checks passed."
  exit 0
fi
