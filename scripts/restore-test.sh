#!/usr/bin/env bash
# restore-test.sh — verify a backup dump is valid and restorable.
#
# Restores the backup into a temporary test database (community_restore_test)
# inside the running postgres container, verifies key tables exist, then
# drops the test database. Does NOT touch the live production database.
#
# Usage:
#   ./scripts/restore-test.sh /path/to/backup.dump
#   ./scripts/restore-test.sh           # uses most recent backup in DATA_DIR/backups/

set -euo pipefail

DATA_DIR="${DATA_DIR:-./data}"
BACKUP_DIR="${DATA_DIR}/backups"
TEST_DB="community_restore_test"

# Resolve backup file
if [ $# -ge 1 ]; then
  BACKUP_FILE="$1"
else
  BACKUP_FILE=$(find "${BACKUP_DIR}" -name "community_*.dump" -printf '%T+ %p\n' 2>/dev/null \
    | sort -r | head -1 | awk '{print $2}')
  if [ -z "${BACKUP_FILE}" ]; then
    echo "ERROR: No backup found in ${BACKUP_DIR}" >&2
    echo "Run ./scripts/backup.sh first." >&2
    exit 1
  fi
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "ERROR: Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

echo "Community Platform — Restore Test"
echo "  Backup file: ${BACKUP_FILE}"
echo "  Test DB    : ${TEST_DB}"
echo

# ── Validate prerequisites ────────────────────────────────────────────────────
if ! docker inspect community_postgres &>/dev/null; then
  echo "ERROR: community_postgres container is not running." >&2
  exit 1
fi

POSTGRES_USER="${POSTGRES_USER:-postgres}"

# ── Copy dump into container ──────────────────────────────────────────────────
CONTAINER_DUMP="/tmp/restore_test_$(basename "${BACKUP_FILE}")"
echo "Copying dump into container..."
docker cp "${BACKUP_FILE}" "community_postgres:${CONTAINER_DUMP}"

# ── Create test database ──────────────────────────────────────────────────────
echo "Creating test database '${TEST_DB}'..."
docker exec community_postgres sh -c "
  PGPASSWORD=\"\${POSTGRES_PASSWORD}\" psql \
    -U \"${POSTGRES_USER}\" -d postgres \
    -c \"DROP DATABASE IF EXISTS ${TEST_DB};\" \
    -c \"CREATE DATABASE ${TEST_DB};\"
" 2>&1

# ── Restore into test database ────────────────────────────────────────────────
echo "Restoring backup into ${TEST_DB}..."
docker exec community_postgres sh -c "
  PGPASSWORD=\"\${POSTGRES_PASSWORD}\" pg_restore \
    -U \"${POSTGRES_USER}\" \
    -d \"${TEST_DB}\" \
    --no-owner --no-privileges \
    \"${CONTAINER_DUMP}\"
" 2>&1

# ── Verify key tables ─────────────────────────────────────────────────────────
echo "Verifying key tables exist..."
TABLES=("User" "Post" "Course" "Event" "RefreshToken")
FAIL=0
for table in "${TABLES[@]}"; do
  COUNT=$(docker exec community_postgres sh -c "
    PGPASSWORD=\"\${POSTGRES_PASSWORD}\" psql \
      -U \"${POSTGRES_USER}\" -d \"${TEST_DB}\" -tAc \
      \"SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '${table}';\"
  " 2>/dev/null | tr -d '[:space:]')
  if [ "${COUNT}" = "1" ]; then
    echo "  [OK] Table '${table}' exists"
  else
    echo "  [FAIL] Table '${table}' NOT found"
    FAIL=$((FAIL + 1))
  fi
done

# ── Cleanup ───────────────────────────────────────────────────────────────────
echo "Cleaning up test database and temp file..."
docker exec community_postgres sh -c "
  PGPASSWORD=\"\${POSTGRES_PASSWORD}\" psql \
    -U \"${POSTGRES_USER}\" -d postgres \
    -c \"DROP DATABASE IF EXISTS ${TEST_DB};\"
" 2>&1
docker exec community_postgres rm -f "${CONTAINER_DUMP}"

# ── Result ────────────────────────────────────────────────────────────────────
echo
if [ "${FAIL}" -gt 0 ]; then
  echo "RESTORE TEST FAILED: ${FAIL} table(s) missing — backup may be corrupted"
  exit 1
else
  echo "RESTORE TEST PASSED — backup is valid and restorable"
  exit 0
fi
