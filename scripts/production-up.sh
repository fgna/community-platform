#!/usr/bin/env bash
# production-up.sh — safely start (or update) the production stack.
#
# This script:
#   1. Runs pre-flight checks (validates .env and system state)
#   2. Pulls latest images / rebuilds from current code
#   3. Starts the stack (excluding docker-compose.override.yml)
#   4. Runs database migrations
#   5. Optionally runs the post-deployment verification script
#
# NEVER run: docker compose up (without -f) on a production server —
# that command auto-loads docker-compose.override.yml which is for dev only.
#
# Usage:
#   ./scripts/production-up.sh [--skip-preflight] [--no-verify] [--profile proxy]

set -euo pipefail

SKIP_PREFLIGHT=false
NO_VERIFY=false
COMPOSE_PROFILE=""
ENV_FILE=".env"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-preflight) SKIP_PREFLIGHT=true; shift ;;
    --no-verify)      NO_VERIFY=true; shift ;;
    --profile)        COMPOSE_PROFILE="--profile $2"; shift 2 ;;
    --env-file)       ENV_FILE="$2"; shift 2 ;;
    *) echo "Unknown argument: $1" >&2; echo "Usage: $0 [--skip-preflight] [--no-verify] [--profile proxy]" >&2; exit 1 ;;
  esac
done

echo "Community Platform — Production Deploy"
echo "========================================"
echo "Started: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo

# ── Step 1: Pre-flight checks ─────────────────────────────────────────────────
if [ "${SKIP_PREFLIGHT}" = "false" ]; then
  echo "Step 1: Running pre-flight checks..."
  ./scripts/preflight-production.sh --env-file "${ENV_FILE}"
  echo
else
  echo "Step 1: Pre-flight checks SKIPPED (--skip-preflight)"
  echo
fi

# ── Step 2: Build and start ───────────────────────────────────────────────────
echo "Step 2: Building and starting production stack..."
echo "  Command: docker compose -f docker-compose.yml ${COMPOSE_PROFILE} up --build -d --wait --wait-timeout 180"
echo

# shellcheck disable=SC2086
docker compose -f docker-compose.yml ${COMPOSE_PROFILE} up --build -d --wait --wait-timeout 180

echo
echo "  Stack started successfully."

# ── Step 3: Database migrations ───────────────────────────────────────────────
echo
echo "Step 3: Running database migrations..."
docker exec community_api npx prisma migrate deploy
echo "  Migrations complete."

# ── Step 4: Verification ──────────────────────────────────────────────────────
if [ "${NO_VERIFY}" = "false" ] && [ -f "./scripts/verify-vps-deployment.sh" ]; then
  echo
  echo "Step 4: Running post-deployment verification..."
  ./scripts/verify-vps-deployment.sh
else
  echo
  echo "Step 4: Verification SKIPPED"
fi

echo
echo "========================================"
echo "Deploy complete: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
