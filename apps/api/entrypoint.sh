#!/bin/sh
set -e

UPLOADS_DIR="/app/apps/api/uploads/avatars"
mkdir -p "$UPLOADS_DIR"

# If running as root (Docker Compose with bind-mounts), fix ownership and drop privileges.
# On PaaS (Railway, Render) the container may already run as non-root — just exec directly.
if [ "$(id -u)" = "0" ]; then
  chown -R nestjs:nodejs /app/apps/api/uploads
  exec su-exec nestjs "$@"
else
  exec "$@"
fi
