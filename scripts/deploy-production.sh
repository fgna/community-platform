#!/bin/bash
# Production deployment helper — runs pre-flight checks, builds, and starts the stack.
# Must be run from the repository root on the production server.
#
# Usage:
#   ./scripts/deploy-production.sh
#   SKIP_CHECKS=1 ./scripts/deploy-production.sh   # skip env-var validation (not recommended)
set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*" >&2; exit 1; }

# ── Locate repository root ────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

# ── Load .env if present ──────────────────────────────────────────────────────
if [ -f ".env" ]; then
  # Capture any explicit shell overrides before sourcing .env so they take precedence.
  _JWT_SECRET="${JWT_SECRET:-}"
  _JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-}"
  _POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
  _CORS_ORIGINS="${CORS_ORIGINS:-}"
  _NODE_ENV="${NODE_ENV:-}"

  set -a
  # shellcheck source=../.env
  . "./.env"
  set +a

  [ -n "$_JWT_SECRET" ]          && JWT_SECRET="$_JWT_SECRET"
  [ -n "$_JWT_REFRESH_SECRET" ]  && JWT_REFRESH_SECRET="$_JWT_REFRESH_SECRET"
  [ -n "$_POSTGRES_PASSWORD" ]   && POSTGRES_PASSWORD="$_POSTGRES_PASSWORD"
  [ -n "$_CORS_ORIGINS" ]        && CORS_ORIGINS="$_CORS_ORIGINS"
  [ -n "$_NODE_ENV" ]            && NODE_ENV="$_NODE_ENV"
fi

# ── Pre-flight checks ─────────────────────────────────────────────────────────
SKIP_CHECKS="${SKIP_CHECKS:-0}"
FAIL=0

if [ "$SKIP_CHECKS" != "1" ]; then
  info "Running pre-flight checks..."

  # JWT_SECRET must be set and look like a real secret (≥32 chars, not a placeholder)
  if [ -z "${JWT_SECRET:-}" ]; then
    warn "JWT_SECRET is not set — set it in .env or export before running"
    FAIL=1
  elif echo "$JWT_SECRET" | grep -qi "change\|example\|placeholder\|secret\|todo"; then
    warn "JWT_SECRET looks like a placeholder — generate with: openssl rand -hex 32"
    FAIL=1
  elif [ "${#JWT_SECRET}" -lt 32 ]; then
    warn "JWT_SECRET is too short (${#JWT_SECRET} chars) — use at least 32 chars"
    FAIL=1
  fi

  if [ -z "${JWT_REFRESH_SECRET:-}" ]; then
    warn "JWT_REFRESH_SECRET is not set"
    FAIL=1
  elif echo "$JWT_REFRESH_SECRET" | grep -qi "change\|example\|placeholder\|secret\|todo"; then
    warn "JWT_REFRESH_SECRET looks like a placeholder — generate with: openssl rand -hex 32"
    FAIL=1
  elif [ "${#JWT_REFRESH_SECRET}" -lt 32 ]; then
    warn "JWT_REFRESH_SECRET is too short (${#JWT_REFRESH_SECRET} chars)"
    FAIL=1
  fi

  if [ -z "${POSTGRES_PASSWORD:-}" ]; then
    warn "POSTGRES_PASSWORD is not set"
    FAIL=1
  elif echo "$POSTGRES_PASSWORD" | grep -qi "^password$\|^postgres$\|^change"; then
    warn "POSTGRES_PASSWORD looks like a default — use a strong random password"
    FAIL=1
  fi

  if [ -z "${CORS_ORIGINS:-}" ]; then
    warn "CORS_ORIGINS is not set — set to your domain, e.g. https://yourdomain.com"
    FAIL=1
  elif echo "$CORS_ORIGINS" | grep -q '\*'; then
    warn "CORS_ORIGINS contains a wildcard — this is insecure for production"
    FAIL=1
  fi

  NODE_ENV_VAL="${NODE_ENV:-}"
  if [ "$NODE_ENV_VAL" != "production" ]; then
    warn "NODE_ENV is '${NODE_ENV_VAL:-unset}' — set NODE_ENV=production in .env"
    FAIL=1
  fi

  if [ "$FAIL" = "1" ]; then
    echo ""
    fail "Pre-flight checks failed. Fix the warnings above before deploying. Pass SKIP_CHECKS=1 to bypass (not recommended)."
  fi
  info "Pre-flight checks passed."
fi

# ── Build and start ───────────────────────────────────────────────────────────
info "Building and starting production stack..."
docker compose -f docker-compose.yml --profile proxy up --build -d

# ── Run migrations ────────────────────────────────────────────────────────────
info "Applying database migrations..."
docker compose -f docker-compose.yml exec api npx prisma migrate deploy

info "Deployment complete."
echo ""
echo "  Verify: DOMAIN=yourdomain.com ./scripts/verify-vps-deployment.sh"
echo "  Logs:   docker compose -f docker-compose.yml logs -f"
echo "  Health: curl https://yourdomain.com/health"
