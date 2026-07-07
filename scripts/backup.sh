#!/usr/bin/env bash
# backup.sh — create a point-in-time PostgreSQL backup.
#
# Backups are written to DATA_DIR/backups/ (default: ./data/backups/).
# Retention: keeps the 30 most recent backups and deletes older ones.
#
# Usage:
#   ./scripts/backup.sh
#   DATA_DIR=/mnt/data ./scripts/backup.sh
#   ./scripts/backup.sh --no-prune      # keep all backups

set -euo pipefail

DATA_DIR="${DATA_DIR:-./data}"
BACKUP_DIR="${DATA_DIR}/backups"
RETENTION_COUNT=30
NO_PRUNE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-prune) NO_PRUNE=true; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

TIMESTAMP=$(date -u '+%Y%m%d_%H%M%SZ')
BACKUP_FILE="${BACKUP_DIR}/community_${TIMESTAMP}.dump"

echo "Community Platform — Database Backup"
echo "  Timestamp : ${TIMESTAMP}"
echo "  Output    : ${BACKUP_FILE}"

# ── Validate prerequisites ────────────────────────────────────────────────────
if ! docker inspect community_postgres &>/dev/null; then
  echo "ERROR: community_postgres container is not running." >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

# ── Create backup ─────────────────────────────────────────────────────────────
# pg_dump runs inside the postgres container to avoid needing a local psql client.
# -Fc produces a custom-format archive (compressed, restoreable with pg_restore).
docker exec community_postgres sh -c "
  PGPASSWORD=\"\${POSTGRES_PASSWORD}\" pg_dump \
    -U \"\${POSTGRES_USER:-postgres}\" \
    -d \"\${POSTGRES_DB:-community_platform}\" \
    -Fc
" > "${BACKUP_FILE}"

SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
echo "  Backup size: ${SIZE}"
echo "  Backup complete: ${BACKUP_FILE}"

# ── Prune old backups ─────────────────────────────────────────────────────────
if [ "${NO_PRUNE}" = "false" ]; then
  TOTAL=$(find "${BACKUP_DIR}" -name "community_*.dump" | wc -l)
  if [ "${TOTAL}" -gt "${RETENTION_COUNT}" ]; then
    TO_DELETE=$((TOTAL - RETENTION_COUNT))
    echo "  Pruning ${TO_DELETE} old backup(s) (keeping ${RETENTION_COUNT})..."
    find "${BACKUP_DIR}" -name "community_*.dump" -printf '%T+ %p\n' \
      | sort | head -n "${TO_DELETE}" | awk '{print $2}' \
      | xargs rm -f
    echo "  Pruning complete."
  fi
fi

echo
echo "  Available backups:"
ls -lh "${BACKUP_DIR}"/community_*.dump 2>/dev/null || echo "  (none)"
