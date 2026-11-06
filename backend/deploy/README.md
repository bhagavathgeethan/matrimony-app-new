# 🚀 Deploying to Hostinger VPS

Production deployment guide for the 3Knot Matrimony backend on a Hostinger VPS (Ubuntu).

---

## Prerequisites

| Requirement | Details |
|:---|:---|
| **Hostinger VPS** | KVM1 or higher (1 GB+ RAM recommended) |
| **Domain** | A domain with DNS A record pointing to the VPS IP |
| **SSH access** | Root access to the VPS |
| **PostgreSQL** | Already running at `187.127.178.200:5444` |
| **Git repo** | Your code pushed to a Git remote (GitHub, GitLab, etc.) |

---

## Quick Start

### 1. SSH into your VPS

```bash
ssh root@YOUR_VPS_IP
```

### 2. Run the server setup (one time only)

```bash
# Upload or clone the repo first, then run:
bash /path/to/repo/backend/deploy/setup-server.sh yourdomain.com
```

This installs Node.js 24, PM2, Nginx, Certbot, creates a `deploy` user, configures the firewall, and requests an SSL certificate.

### 3. Switch to the deploy user and clone the repo

```bash
su - deploy
git clone YOUR_REPO_URL /var/www/matrimony-app
cd /var/www/matrimony-app
```

### 4. Create the production `.env`

```bash
cp backend/.env.production backend/.env
nano backend/.env
```

Fill in the `TODO` values:
- `PUBLIC_BASE_URL` → your actual domain (e.g., `https://api.3knot.in`)
- `CORS_ORIGINS` → your frontend URLs
- `STORAGE_API_KEY` → your Depot API key
- `MEDIA_URL_SECRET` → generate with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- `ADMIN_PHONES` → your admin phone number in E.164 format

### 5. Deploy

```bash
bash backend/deploy/deploy.sh
```

This installs dependencies, builds the web app, and starts the PM2 process.

### 6. Verify

```bash
# PM2 status
pm2 status

# Health check
curl https://yourdomain.com/api/health

# View logs
pm2 logs matrimony-backend
```

---

## Updating After Code Changes

```bash
cd /var/www/matrimony-app
bash backend/deploy/deploy.sh
```

The script pulls the latest code, reinstalls dependencies, rebuilds the web app, and restarts PM2.

---

## Useful Commands

| Command | Purpose |
|:---|:---|
| `pm2 status` | Show running processes |
| `pm2 logs matrimony-backend` | Stream live logs |
| `pm2 logs matrimony-backend --lines 100` | Last 100 log lines |
| `pm2 monit` | Real-time CPU/memory monitor |
| `pm2 restart matrimony-backend` | Restart the backend |
| `pm2 stop matrimony-backend` | Stop the backend |
| `sudo nginx -t` | Test Nginx config |
| `sudo systemctl reload nginx` | Reload Nginx |
| `sudo certbot renew --dry-run` | Test SSL renewal |

---

## Architecture

```
Internet
  │
  ▼
Nginx (:443, SSL)
  ├── /ws        → WebSocket proxy → Node.js :5000
  ├── /api/*     → HTTP proxy     → Node.js :5000
  └── /*         → Static proxy   → Node.js :5000 (serves web/dist)
                        │
                        ▼
                   PostgreSQL (187.127.178.200:5444)
                   Depot Storage (depot.thestucompany.com)
```

---

## Files

| File | Purpose |
|:---|:---|
| `deploy/setup-server.sh` | One-time VPS setup (run as root) |
| `deploy/deploy.sh` | Deploy / update (run as deploy user) |
| `deploy/nginx.conf` | Nginx reverse proxy + SSL config |
| `deploy/ecosystem.config.js` | PM2 process configuration |
| `.env.production` | Production env template (copy to `.env`) |

---

## Troubleshooting

### Backend won't start
```bash
# Check PM2 logs for errors
pm2 logs matrimony-backend --err --lines 50

# Try running directly to see startup errors
cd /var/www/matrimony-app/backend
node src/server.js
```

### Database connection refused
- Verify the PostgreSQL host (`187.127.178.200:5444`) is reachable from the VPS
- Check if the VPS IP is whitelisted in PostgreSQL's `pg_hba.conf`
- Test: `node -e "require('pg').Pool({connectionString: process.env.DATABASE_URL}).query('SELECT 1').then(() => console.log('OK')).catch(console.error)"`

### WebSocket not connecting
- Ensure Nginx config has the `/ws` location block with `Upgrade` headers
- Check browser console for mixed-content errors (HTTP vs HTTPS)

### SSL certificate issues
```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# If certbot can't reach port 80, check firewall
sudo ufw status
```

