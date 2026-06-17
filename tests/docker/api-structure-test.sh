#!/bin/sh
# Container structure tests for the API image.
# Run: docker build -f apps/api/Dockerfile -t api-test . && sh tests/docker/api-structure-test.sh api-test
set -e

IMAGE="${1:-community-api:ci}"
FAIL=0

assert() {
  desc="$1"; shift
  if "$@" >/dev/null 2>&1; then
    echo "  PASS: $desc"
  else
    echo "  FAIL: $desc"
    FAIL=1
  fi
}

echo "=== API container structure tests ==="

echo "-- User & workdir --"
assert "runs as nestjs (uid 1001)" \
  docker run --rm "$IMAGE" id -u | grep -q 1001
assert "workdir is /app/apps/api" \
  docker run --rm "$IMAGE" pwd | grep -q /app/apps/api

echo "-- File permissions --"
assert "uploads/avatars exists and is writable" \
  docker run --rm "$IMAGE" sh -c 'touch /app/apps/api/uploads/avatars/.test && rm /app/apps/api/uploads/avatars/.test'

echo "-- Required files --"
assert "dist/main.js exists" \
  docker run --rm "$IMAGE" test -f /app/apps/api/dist/main.js
assert "prisma schema exists" \
  docker run --rm "$IMAGE" test -f /app/apps/api/prisma/schema.prisma
assert "node_modules present" \
  docker run --rm "$IMAGE" test -d /app/apps/api/node_modules

echo "-- Prisma client --"
assert "@prisma/client is generated" \
  docker run --rm "$IMAGE" test -d /app/apps/api/node_modules/.prisma/client

echo "-- Node.js --"
assert "node is available" \
  docker run --rm "$IMAGE" node --version

if [ "$FAIL" -eq 1 ]; then
  echo ""
  echo "FAILED: one or more checks did not pass"
  exit 1
fi
echo ""
echo "All checks passed"
