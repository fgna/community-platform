#!/bin/sh
set -e

UPLOADS_DIR="/app/apps/api/uploads/avatars"

# When a host bind-mount replaces /app/apps/api/uploads, the directory is
# owned by root and the nestjs user (uid 1001) cannot write to it.
# Fix ownership before dropping privileges.
mkdir -p "$UPLOADS_DIR"
chown -R nestjs:nodejs /app/apps/api/uploads

exec su-exec nestjs "$@"
