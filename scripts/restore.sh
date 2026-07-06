#!/bin/bash
# Restore a community_platform database from a pg_dump -Fc backup file.
#
# The backup file must have been produced by the `backup` Compose profile:
#   docker compose --profile backup run --rm backup
# which writes files to ${DATA_DIR:-./data}/backups/community_YYYYMMDD_HHMMSS.dump
#
# Usage:
#   ./scripts/restore.sh <path-to-dump-file>
#   ./scripts/restore.sh data/backups/community_20260706_020000.dump
#
# What this script does:
#   1. Stops the api container so no writes occur during restore.
#   2. Drops and re-creates the target database inside the running postgres container.
#   3. Copies the dump file into the postgres container.
#   4. Restores with pg_restore --no-owner --role.
#   5. Starts the api container again.
#   6. Re-applies any pending migrations (safe — idempotent).
#
# WARNING: This script drops the existing database. All data in it will be lost.
# Only run this with a dump file you trust and after confirming the right environment.
#
# Exit codes: 0 = success, 1 = error

set -euo pipefail

DUMP_FILE="${1:-}"
if [ -z "$DUMP_FILE" ]; then
  echo "Usage: $0 <path-to-dump-file>"
  echo "Example: $0 data/backups/community_20260706_020000.dump"
  exit 1
fi

if [ ! -f "$DUMP_FILE" ]; then
  echo "Error: dump file not found: $DUMP_FILE"
  exit 1
fi

DUMP_FILE="$(realpath "$DUMP_FILE")"

# ── Load env ────────────────────────────────────────────────────────────────
_POSTGRES_USER="${POSTGRES_USER:-}"
_POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
_POSTGRES_DB="${POSTGRES_DB:-}"

if [ -f ".env" ]; then
  set -a
  . "./.env"
  set +a
fi

[ -n "$_POSTGRES_USER" ]     && POSTGRES_USER="$_POSTGRES_USER"
[ -n "$_POSTGRES_PASSWORD" ] && POSTGRES_PASSWORD="$_POSTGRES_PASSWORD"
[ -n "$_POSTGRES_DB" ]       && POSTGRES_DB="$_POSTGRES_DB"

PGUSER="${POSTGRES_USER:-postgres}"
PGDB="${POSTGRES_DB:-community_platform}"
PGPASS="${POSTGRES_PASSWORD:-password}"

# ── Verify postgres container is running ───────────────────────────────────
if ! docker ps --format '{{.Names}}' | grep -q "community_postgres"; then
  echo "Error: community_postgres container is not running."
  echo "Start it with: docker compose -f docker-compose.yml --profile proxy up -d postgres"
  exit 1
fi

echo ""
echo "=== Community Platform Database Restore ==="
echo "Dump file:  $DUMP_FILE"
echo "Target DB:  $PGDB"
echo "Postgres:   community_postgres"
echo ""
echo "WARNING: This will DROP and recreate the '$PGDB' database."
echo "All existing data will be permanently lost."
echo ""
read -r -p "Type 'yes' to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

# ── Stop api to prevent writes during restore ───────────────────────────────
echo ""
echo "1/5  Stopping api container..."
docker compose stop api 2>/dev/null || true

# ── Drop and recreate database ───────────────────────────────────────────────
echo "2/5  Dropping and recreating database '$PGDB'..."
docker exec community_postgres sh -c "
  PGPASSWORD='$PGPASS' psql -U '$PGUSER' -d postgres -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$PGDB' AND pid <> pg_backend_pid();\" 2>/dev/null
  PGPASSWORD='$PGPASS' psql -U '$PGUSER' -d postgres -c \"DROP DATABASE IF EXISTS \\\"$PGDB\\\";\"
  PGPASSWORD='$PGPASS' psql -U '$PGUSER' -d postgres -c \"CREATE DATABASE \\\"$PGDB\\\" OWNER '$PGUSER';\"
"

# ── Copy dump into container and restore ────────────────────────────────────
echo "3/5  Copying dump file into container..."
DUMP_BASENAME="$(basename "$DUMP_FILE")"
docker cp "$DUMP_FILE" "community_postgres:/tmp/$DUMP_BASENAME"

echo "4/5  Restoring with pg_restore..."
docker exec community_postgres sh -c "
  PGPASSWORD='$PGPASS' pg_restore \
    --no-owner \
    --role='$PGUSER' \
    --username='$PGUSER' \
    --dbname='$PGDB' \
    --host=localhost \
    '/tmp/$DUMP_BASENAME'
  rm -f '/tmp/$DUMP_BASENAME'
"

# ── Restart api and run migrations ──────────────────────────────────────────
echo "5/5  Restarting api and applying any pending migrations..."
docker compose start api
# Give api a few seconds to start before running migrate
sleep 5
docker compose exec api npx prisma migrate deploy

echo ""
echo "=== Restore complete ==="
echo "Run ./scripts/smoke-test.sh to verify the restored instance."
