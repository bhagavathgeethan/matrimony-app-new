#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# 3Knot Matrimony — Deploy / Update script
# Run from the repo root:  bash backend/deploy/deploy.sh
#
# What it does:
#   1. Pulls the latest code (if in a git repo)
#   2. Installs backend production dependencies
#   3. Builds the web app (if web/ exists)
#   4. Runs database migrations (happens on server start, but we do it early to catch errors)
#   5. Starts or restarts the PM2 process
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$REPO_DIR/backend"
WEB_DIR="$REPO_DIR/web"
SHARED_DIR="$REPO_DIR/shared"

echo "══════════════════════════════════════════════"
echo "  3Knot Backend — Deploying from ${REPO_DIR}"
echo "══════════════════════════════════════════════"

# ── 1. Pull latest code ─────────────────────────────────────────────────────
if [[ -d "$REPO_DIR/.git" ]]; then
  echo "→ Pulling latest code..."
  cd "$REPO_DIR"
  git pull --ff-only
else
  echo "→ Not a git repo, skipping pull."
fi

# ── 2. Backend dependencies ─────────────────────────────────────────────────
echo "→ Installing backend dependencies..."
cd "$BACKEND_DIR"
npm ci --omit=dev --no-audit --no-fund
echo "  ✓ Backend dependencies installed."

# ── 3. Build web app ────────────────────────────────────────────────────────
if [[ -f "$WEB_DIR/package.json" ]]; then
  echo "→ Building web app..."
  cd "$WEB_DIR"
  npm ci --no-audit --no-fund
  npm run build
  echo "  ✓ Web app built to ${WEB_DIR}/dist"
else
  echo "→ No web/package.json found, skipping web build."
fi

# ── 4. Check .env exists ────────────────────────────────────────────────────
if [[ ! -f "$BACKEND_DIR/.env" ]]; then
  echo ""
  echo "  ⚠  No .env file found at ${BACKEND_DIR}/.env"
  echo "  Copy the template:  cp ${BACKEND_DIR}/.env.production ${BACKEND_DIR}/.env"
  echo "  Then edit it:       nano ${BACKEND_DIR}/.env"
  echo ""
  exit 1
fi

# ── 5. Start / Restart PM2 ──────────────────────────────────────────────────
cd "$BACKEND_DIR"
ECOSYSTEM="$SCRIPT_DIR/ecosystem.config.js"

if pm2 describe matrimony-backend &>/dev/null; then
  echo "→ Restarting PM2 process..."
  pm2 restart "$ECOSYSTEM" --update-env
else
  echo "→ Starting PM2 process for the first time..."
  pm2 start "$ECOSYSTEM"
fi

# Save PM2 process list so it survives reboots
pm2 save

echo ""
echo "══════════════════════════════════════════════"
echo "  ✅ Deployment complete!"
echo ""
echo "  Status:   pm2 status"
echo "  Logs:     pm2 logs matrimony-backend"
echo "  Monitor:  pm2 monit"
echo "  Health:   curl http://localhost:5000/api/health"
echo "══════════════════════════════════════════════"

