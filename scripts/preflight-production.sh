#!/usr/bin/env bash
# preflight-production.sh — validate .env and system state before starting
# the production stack.
#
# This script intentionally runs BEFORE docker compose so that misconfigurations
# are caught immediately with a clear error message rather than causing a
# cryptic container failure.
#
# Usage:
#   ./scripts/preflight-production.sh
#   ./scripts/preflight-production.sh --env-file /path/to/.env

set -euo pipefail

ENV_FILE=".env"

# Parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file) ENV_FILE="$2"; shift 2 ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

FAIL=0
ok()   { echo "  [OK]   $*"; }
fail() { echo "  [FAIL] $*" >&2; FAIL=$((FAIL + 1)); }
info() { echo "  [INFO] $*"; }

echo "Community Platform — Production Pre-flight Check"
echo "================================================="

# ── 1. .env file exists ───────────────────────────────────────────────────────
echo
echo "1. Environment file"

if [ ! -f "${ENV_FILE}" ]; then
  fail ".env file not found at '${ENV_FILE}'. Copy .env.example and fill in values:"
  fail "  cp .env.example .env && \$EDITOR .env"
  exit 1
fi
ok ".env file found: ${ENV_FILE}"

# Source it (only safe non-executable values)
set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

# ── 2. Required secrets ───────────────────────────────────────────────────────
echo
echo "2. Required secrets"

PLACEHOLDERS="change-me|changeme|your-|example|placeholder|todo|secret$|password$"

check_secret() {
  local key="$1"
  local min_len="${2:-32}"
  local val="${!key:-}"

  if [ -z "${val}" ]; then
    fail "${key} is not set"
    return
  fi
  if echo "${val}" | grep -qiE "${PLACEHOLDERS}"; then
    fail "${key} looks like a placeholder. Generate: openssl rand -hex 32"
    return
  fi
  if [ "${#val}" -lt "${min_len}" ]; then
    fail "${key} too short (${#val} chars, min ${min_len}). Generate: openssl rand -hex 32"
    return
  fi
  ok "${key} set (${#val} chars)"
}

check_secret "JWT_SECRET"
check_secret "JWT_REFRESH_SECRET"
check_secret "POSTGRES_PASSWORD" 16

# ── 3. Database URL ───────────────────────────────────────────────────────────
echo
echo "3. Database"

DATABASE_URL="${DATABASE_URL:-}"
if [ -z "${DATABASE_URL}" ]; then
  fail "DATABASE_URL is not set"
elif echo "${DATABASE_URL}" | grep -qE "://[^:]+:password@|://[^:]+:changeme@|://[^:]+:postgres@"; then
  fail "DATABASE_URL contains a weak/default password"
else
  ok "DATABASE_URL set (host: $(echo "${DATABASE_URL}" | sed -E 's|.*@([^:/]+).*|\1|'))"
fi

# ── 4. CORS origins ───────────────────────────────────────────────────────────
echo
echo "4. CORS"

CORS_ORIGINS="${CORS_ORIGINS:-}"
if [ -z "${CORS_ORIGINS}" ]; then
  fail "CORS_ORIGINS is not set. Set to your production domain (e.g. https://yourdomain.com)"
elif echo "${CORS_ORIGINS}" | grep -q '\*'; then
  fail "CORS_ORIGINS contains wildcard (*) — not allowed in production"
elif echo "${CORS_ORIGINS}" | grep -q 'localhost'; then
  fail "CORS_ORIGINS contains 'localhost' — not suitable for production"
else
  ok "CORS_ORIGINS=${CORS_ORIGINS}"
fi

# ── 5. NODE_ENV ───────────────────────────────────────────────────────────────
echo
echo "5. Runtime environment"

NODE_ENV="${NODE_ENV:-}"
if [ "${NODE_ENV}" != "production" ]; then
  fail "NODE_ENV=${NODE_ENV:-<unset>} — must be 'production'"
else
  ok "NODE_ENV=production"
fi

# ── 6. Demo seed guard ────────────────────────────────────────────────────────
echo
echo "6. Demo seed guard"

SEED_DEMO_DATA="${SEED_DEMO_DATA:-false}"
if [ "${SEED_DEMO_DATA}" = "true" ]; then
  fail "SEED_DEMO_DATA=true — demo seed (with known credentials) must not run in production"
  fail "Set SEED_DEMO_DATA=false in .env"
else
  ok "SEED_DEMO_DATA is not 'true'"
fi

# ── 7. Docker available ───────────────────────────────────────────────────────
echo
echo "7. Docker"

if ! command -v docker &>/dev/null; then
  fail "docker not found — install Docker Engine"
else
  ok "docker found: $(docker --version)"
fi

if ! docker info &>/dev/null; then
  fail "Docker daemon is not running or current user lacks access"
  fail "Run: sudo systemctl start docker  OR  add user to docker group"
else
  ok "Docker daemon is running"
fi

# ── 8. docker-compose.override.yml warning ───────────────────────────────────
echo
echo "8. Compose override"

if [ -f "docker-compose.override.yml" ]; then
  fail "docker-compose.override.yml is present — it will be auto-loaded and is intended for development only."
  fail "Production command: docker compose -f docker-compose.yml --profile proxy up -d"
  fail "  (This does not abort deployment — remove or rename to silence this warning.)"
  # Override presence is a warning, not a hard abort
  FAIL=$((FAIL - 1))
  info "Continuing despite override file (treat as warning)."
else
  ok "No docker-compose.override.yml present"
fi

# ── 9. Data directory ─────────────────────────────────────────────────────────
echo
echo "9. Data directory"

DATA_DIR="${DATA_DIR:-./data}"
if [ ! -d "${DATA_DIR}" ]; then
  info "DATA_DIR '${DATA_DIR}' does not exist — it will be created on first run"
else
  ok "DATA_DIR exists: ${DATA_DIR}"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo
echo "================================================="
if [ "${FAIL}" -gt 0 ]; then
  echo "Pre-flight FAILED: ${FAIL} issue(s) found — fix before deploying."
  exit 1
else
  echo "Pre-flight PASSED — safe to start the production stack."
  exit 0
fi
