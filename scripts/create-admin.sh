#!/usr/bin/env bash
# create-admin.sh — create the first admin user in a fresh production deployment.
#
# Run this ONCE after initial deployment to bootstrap the admin account.
# The demo seed (prisma/seed.ts) must NOT be used in production.
#
# Usage:
#   ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=StrongPass123! ./scripts/create-admin.sh
#
# Or interactively:
#   ./scripts/create-admin.sh

set -euo pipefail

echo "Community Platform — Create Admin User"
echo "========================================"

# ── Collect inputs ────────────────────────────────────────────────────────────
ADMIN_EMAIL="${ADMIN_EMAIL:-}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
ADMIN_NAME="${ADMIN_NAME:-Platform Admin}"

if [ -z "${ADMIN_EMAIL}" ]; then
  read -r -p "Admin email: " ADMIN_EMAIL
fi

if [ -z "${ADMIN_PASSWORD}" ]; then
  read -r -s -p "Admin password (min 12 chars): " ADMIN_PASSWORD
  echo
fi

# ── Validate ──────────────────────────────────────────────────────────────────
if [ -z "${ADMIN_EMAIL}" ] || [ -z "${ADMIN_PASSWORD}" ]; then
  echo "ERROR: email and password are required." >&2
  exit 1
fi

if [ "${#ADMIN_PASSWORD}" -lt 12 ]; then
  echo "ERROR: password must be at least 12 characters." >&2
  exit 1
fi

if ! echo "${ADMIN_EMAIL}" | grep -qE "^[^@]+@[^@]+\.[^@]+$"; then
  echo "ERROR: invalid email address: ${ADMIN_EMAIL}" >&2
  exit 1
fi

# ── Create via API ────────────────────────────────────────────────────────────
if ! docker inspect community_api &>/dev/null; then
  echo "ERROR: community_api container is not running. Start the stack first." >&2
  exit 1
fi

echo "Creating admin user: ${ADMIN_EMAIL}..."

docker exec community_api node -e "
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

async function main() {
  const prisma = new PrismaClient();
  try {
    const email = '${ADMIN_EMAIL}'.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.role === 'ADMIN') {
        console.log('Admin user already exists:', email);
        process.exit(0);
      } else {
        await prisma.user.update({
          where: { email },
          data: { role: 'ADMIN', isActive: true },
        });
        console.log('Upgraded existing user to ADMIN:', email);
        process.exit(0);
      }
    }
    const passwordHash = await argon2.hash('${ADMIN_PASSWORD}');
    await prisma.user.create({
      data: {
        email,
        name: '${ADMIN_NAME}',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log('Admin user created:', email);
  } finally {
    await prisma.\$disconnect();
  }
}
main().catch((e) => { console.error(e.message); process.exit(1); });
"

echo
echo "Admin user ready. Log in at your platform URL."
