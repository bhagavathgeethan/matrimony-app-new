#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# 3Knot Matrimony — One-time Hostinger VPS setup
# Run as root:  bash setup-server.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/var/www/matrimony-app"
APP_USER="deploy"
NODE_MAJOR=24
DOMAIN="${1:-}"   # Pass your domain as first arg, e.g.: bash setup-server.sh api.3knot.in

echo "══════════════════════════════════════════════"
echo "  3Knot Backend — Hostinger VPS Setup"
echo "══════════════════════════════════════════════"

# ── 1. System packages ──────────────────────────────────────────────────────
echo "→ Updating system packages..."
apt update && apt upgrade -y
apt install -y curl git build-essential nginx certbot python3-certbot-nginx ufw

# ── 2. Node.js 24 via NodeSource ─────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt "$NODE_MAJOR" ]]; then
  echo "→ Installing Node.js ${NODE_MAJOR}.x..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt install -y nodejs
else
  echo "→ Node.js $(node -v) already installed, skipping."
fi
echo "  node $(node -v)  npm $(npm -v)"

# ── 3. PM2 process manager ──────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  echo "→ Installing PM2..."
  npm install -g pm2
else
  echo "→ PM2 $(pm2 -v) already installed, skipping."
fi

# ── 4. Create a non-root deploy user ────────────────────────────────────────
if ! id "$APP_USER" &>/dev/null; then
  echo "→ Creating user '${APP_USER}'..."
  useradd -m -s /bin/bash "$APP_USER"
  # Allow deploy user to restart nginx (needed for certbot renewal hooks)
  echo "${APP_USER} ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /usr/bin/certbot" >> /etc/sudoers.d/deploy
  chmod 0440 /etc/sudoers.d/deploy
else
  echo "→ User '${APP_USER}' already exists, skipping."
fi

# ── 5. Application directory ────────────────────────────────────────────────
echo "→ Setting up ${APP_DIR}..."
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ── 6. Firewall (UFW) ───────────────────────────────────────────────────────
echo "→ Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "  Firewall: SSH + Nginx (HTTP/HTTPS) allowed."

# ── 7. Nginx — remove default site ──────────────────────────────────────────
rm -f /etc/nginx/sites-enabled/default

# ── 8. Nginx config for the app ─────────────────────────────────────────────
echo "→ Installing Nginx config..."
cp "$(dirname "$0")/nginx.conf" /etc/nginx/sites-available/matrimony-backend

# Replace placeholder domain if provided
if [[ -n "$DOMAIN" ]]; then
  sed -i "s/yourdomain.com/${DOMAIN}/g" /etc/nginx/sites-available/matrimony-backend
  echo "  Domain set to: ${DOMAIN}"
else
  echo "  ⚠  No domain provided. Edit /etc/nginx/sites-available/matrimony-backend manually."
  echo "     Usage: bash setup-server.sh api.yourdomain.com"
fi

ln -sf /etc/nginx/sites-available/matrimony-backend /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
echo "  Nginx configured and restarted."

# ── 9. SSL certificate (if domain provided) ─────────────────────────────────
if [[ -n "$DOMAIN" ]]; then
  echo "→ Requesting SSL certificate for ${DOMAIN}..."
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN" --redirect || {
    echo "  ⚠  Certbot failed. Make sure DNS A record points to this server's IP first."
    echo "  Run manually: certbot --nginx -d ${DOMAIN}"
  }
  # Auto-renewal is installed by certbot automatically via systemd timer
  echo "  SSL auto-renewal: enabled (certbot timer)."
fi

# ── 10. PM2 startup hook ────────────────────────────────────────────────────
echo "→ Configuring PM2 startup..."
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" --no-daemon 2>/dev/null || true

# ── 11. Log rotation ────────────────────────────────────────────────────────
pm2 install pm2-logrotate 2>/dev/null || true
pm2 set pm2-logrotate:max_size 50M 2>/dev/null || true
pm2 set pm2-logrotate:retain 7 2>/dev/null || true

echo ""
echo "══════════════════════════════════════════════"
echo "  ✅ VPS setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Switch to deploy user:  su - ${APP_USER}"
echo "  2. Clone your repo:        git clone <YOUR_REPO_URL> ${APP_DIR}"
echo "  3. Create .env:            cp ${APP_DIR}/backend/.env.production ${APP_DIR}/backend/.env"
echo "  4. Edit .env:              nano ${APP_DIR}/backend/.env"
echo "  5. Run deploy:             cd ${APP_DIR} && bash backend/deploy/deploy.sh"
echo "══════════════════════════════════════════════"

