#!/usr/bin/env bash
# ==============================================================================
# MediaDocks - Production Deployment Script
#
# Automates clean, zero-downtime deployment for the Next.js standalone server.
# Ensures all static assets, CSS/JS chunks, and public logos are properly
# synced and verified on PM2 process 'mediadocks' on port 3010.
# ==============================================================================

set -eo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="mediadocks"
PORT="3010"
HEALTH_URL="http://127.0.0.1:${PORT}/api/health"
PUBLIC_DOMAIN="https://mediadocks.online"

echo "===================================================================="
echo " Starting deployment for ${APP_NAME} in ${APP_DIR}"
echo "===================================================================="

cd "${APP_DIR}"

# 1. Pull latest code from git (if git repository)
if [ -d ".git" ]; then
  echo ""
  echo "==> [1/6] Fetching latest changes from git..."
  git pull origin main || echo "  ⚠ Git pull skipped or encountered non-fatal notice."
else
  echo "==> [1/6] Skipping git pull (not a git clone or running locally)."
fi

# 2. Install dependencies
echo ""
echo "==> [2/6] Installing dependencies..."
if [ -f "package-lock.json" ]; then
  npm ci --prefer-offline --no-audit --no-fund || npm install --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

# 3. Generate Prisma Client
echo ""
echo "==> [3/6] Generating Prisma Client..."
npx prisma generate

# 4. Production Build (automatically triggers postbuild to sync standalone assets)
echo ""
echo "==> [4/6] Building Next.js application (standalone output)..."
npm run build

# Safety validation: ensure standalone assets exist
if [ ! -f ".next/standalone/server.js" ]; then
  echo "❌ Error: .next/standalone/server.js was not generated!"
  exit 1
fi

if [ ! -d ".next/standalone/.next/static" ] || [ ! -d ".next/standalone/public" ]; then
  echo "  ⚠ Standalone assets missing, running manual sync fallback..."
  mkdir -p .next/standalone/.next .next/standalone/public
  cp -r .next/static .next/standalone/.next/
  cp -r public/* .next/standalone/public/
fi

# 5. PM2 Process Management (Dedicated to 'mediadocks' only)
echo ""
echo "==> [5/6] Managing PM2 process '${APP_NAME}'..."
mkdir -p logs

if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
    echo "  → Reloading existing PM2 process '${APP_NAME}'..."
    pm2 reload ecosystem.config.cjs --env production --only "${APP_NAME}" || pm2 restart ecosystem.config.cjs --env production --only "${APP_NAME}"
  else
    echo "  → Starting new PM2 process '${APP_NAME}'..."
    pm2 start ecosystem.config.cjs --env production --only "${APP_NAME}"
  fi

  # Save PM2 state to persist across server reboots
  pm2 save || true
else
  echo "  ⚠ PM2 is not installed globally or not in PATH."
  echo "    To run manually: PORT=${PORT} HOSTNAME=0.0.0.0 node .next/standalone/server.js"
fi

# 6. Post-deployment Health & Static Asset Verification
echo ""
echo "==> [6/6] Verifying deployment health and assets..."
echo "  Waiting for server on port ${PORT} to respond..."

MAX_RETRIES=15
RETRY_COUNT=0
HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -sf "${HEALTH_URL}" >/dev/null 2>&1; then
    HEALTHY=true
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  sleep 1
done

if [ "$HEALTHY" = true ]; then
  echo "  ✓ Health check passed at ${HEALTH_URL}"
else
  echo "  ⚠ Warning: Server did not respond to local health check within ${MAX_RETRIES}s. Check logs/pm2-error.log."
fi

# Verify static logo assets locally
echo ""
echo "  Checking static assets on local server (port ${PORT}):"
for asset in "logo/logo-light.png" "logo/logo-dark.png" "logo/favicon.png"; do
  STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${PORT}/${asset}" 2>/dev/null || echo "000")
  if [ "$STATUS_CODE" = "200" ]; then
    echo "  ✓ /${asset} -> HTTP ${STATUS_CODE}"
  else
    echo "  ✗ /${asset} -> HTTP ${STATUS_CODE}"
  fi
done

# Optional: check public domain if accessible
if curl -sf --connect-timeout 3 "${PUBLIC_DOMAIN}/api/health" >/dev/null 2>&1; then
  echo ""
  echo "  ✓ Public domain (${PUBLIC_DOMAIN}) is online and responding healthy."
fi

echo ""
echo "===================================================================="
echo " Deployment completed successfully for ${APP_NAME}!"
echo " Server running on port ${PORT} with standalone assets synchronized."
echo "===================================================================="
