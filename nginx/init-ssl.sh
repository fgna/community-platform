#!/bin/bash
set -euo pipefail

# Load .env if present in the current directory.
# Explicit shell exports (e.g. DOMAIN=foo ./nginx/init-ssl.sh) take precedence
# because set -a / . only sets variables that are not already in the environment.
if [ -f ".env" ]; then
  set -a
  # shellcheck source=../.env
  . "./.env"
  set +a
fi

DOMAIN="${DOMAIN:?DOMAIN is not set — add DOMAIN=yourdomain.com to .env or export it before running this script}"
EMAIL="${SSL_EMAIL:?SSL_EMAIL is not set — add SSL_EMAIL=you@yourdomain.com to .env or export it before running this script}"
DATA_DIR="${DATA_DIR:-./data}"
STAGING="${SSL_STAGING:-0}"

CERTBOT_DIR="$DATA_DIR/certbot"
SSL_DIR="$DATA_DIR/certbot/conf/live/$DOMAIN"

if [ -f "$SSL_DIR/fullchain.pem" ]; then
  echo "Certificates already exist for $DOMAIN — skipping provisioning."
  echo "To force renewal: docker compose run --rm certbot renew --force-renewal"
  exit 0
fi

echo "=== SSL Certificate Provisioning ==="
echo "Domain:  $DOMAIN"
echo "Email:   $EMAIL"
echo "Staging: $STAGING"
echo ""

mkdir -p "$CERTBOT_DIR/conf" "$CERTBOT_DIR/www"

echo "1/3  Starting nginx in HTTP-only mode..."
NGINX_CONF_TEMPLATE=default-no-ssl.conf.template \
  docker compose up -d nginx

echo "2/3  Requesting certificate from Let's Encrypt..."
STAGING_FLAG=""
if [ "$STAGING" = "1" ]; then
  STAGING_FLAG="--staging"
fi

docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  $STAGING_FLAG \
  -d "$DOMAIN"

echo "3/3  Restarting nginx with SSL..."
docker compose down nginx
docker compose up -d nginx

echo ""
echo "=== Done! HTTPS is now active for $DOMAIN ==="
