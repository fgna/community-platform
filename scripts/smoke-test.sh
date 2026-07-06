#!/bin/bash
# Smoke test — verifies a running Community Platform instance is healthy.
# Run after deployment or after `docker compose up` to catch basic issues.
#
# Usage:
#   ./scripts/smoke-test.sh
#   API_URL=https://yourdomain.com WEB_URL=https://yourdomain.com ./scripts/smoke-test.sh
#
# Exit codes: 0 = all checks passed, 1 = one or more checks failed

set -euo pipefail

API_URL="${API_URL:-http://localhost:3001}"
WEB_URL="${WEB_URL:-http://localhost:3000}"

PASS=0
FAIL=0

ok()   { echo "  [PASS] $1"; PASS=$((PASS + 1)); }
fail() { echo "  [FAIL] $1"; FAIL=$((FAIL + 1)); }

echo ""
echo "=== Community Platform Smoke Test ==="
echo "API:  $API_URL"
echo "Web:  $WEB_URL"
echo ""

# ── 1. API health ─────────────────────────────────────────────────────────────
echo "1. API health"
HEALTH=$(curl -sf "$API_URL/health" 2>/dev/null || echo "")
if [ -z "$HEALTH" ]; then
  fail "API health endpoint unreachable: $API_URL/health"
else
  STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
  if [ "$STATUS" = "ok" ] || [ "$STATUS" = "degraded" ]; then
    ok "API health: $STATUS"
  else
    fail "API health returned unexpected status: $HEALTH"
  fi
fi

# ── 2. Web serving ────────────────────────────────────────────────────────────
echo "2. Web serving"
WEB_HTTP=$(curl -so /dev/null -w "%{http_code}" "$WEB_URL/login" 2>/dev/null || echo "000")
if [ "$WEB_HTTP" = "200" ] || [ "$WEB_HTTP" = "301" ] || [ "$WEB_HTTP" = "302" ]; then
  ok "Web login page: HTTP $WEB_HTTP"
else
  fail "Web login page returned HTTP $WEB_HTTP (expected 200/301/302)"
fi

# ── 3. API /login reachable ───────────────────────────────────────────────────
echo "3. API login endpoint"
LOGIN_HTTP=$(curl -so /dev/null -w "%{http_code}" -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"__smoke_nonexistent__@example.invalid","password":"x"}' 2>/dev/null || echo "000")
if [ "$LOGIN_HTTP" = "401" ] || [ "$LOGIN_HTTP" = "429" ]; then
  ok "API /auth/login reachable (HTTP $LOGIN_HTTP — correct rejection)"
else
  fail "API /auth/login returned unexpected HTTP $LOGIN_HTTP (expected 401 or 429)"
fi

# ── 4. Uploads directory writable (Docker only) ───────────────────────────────
echo "4. Uploads directory"
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "community_api"; then
  if docker exec community_api sh -c 'touch /app/apps/api/uploads/avatars/.smoke-test && rm /app/apps/api/uploads/avatars/.smoke-test' 2>/dev/null; then
    ok "Uploads directory is writable"
  else
    fail "Uploads directory is not writable in community_api container"
  fi
else
  echo "  [SKIP] community_api container not running — skipping uploads check"
fi

# ── 5. Migration status (Docker only) ─────────────────────────────────────────
echo "5. Migration status"
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "community_api"; then
  MIGRATE_OUT=$(docker exec community_api npx prisma migrate status 2>&1 || true)
  if echo "$MIGRATE_OUT" | grep -q "Database schema is up to date"; then
    ok "Database migrations are up to date"
  elif echo "$MIGRATE_OUT" | grep -q "pending"; then
    fail "There are pending database migrations — run: make migrate"
  else
    echo "  [SKIP] Could not determine migration status"
  fi
else
  echo "  [SKIP] community_api container not running — skipping migration check"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
