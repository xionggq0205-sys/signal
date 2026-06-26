#!/bin/bash
# ================================================================
# Signal — 一键部署脚本 for Ubuntu/Debian
# 目标服务器: 150.109.12.160
# Usage: ssh user@150.109.12.160 "bash -s" < deploy.sh
# ================================================================
set -e

PROJECT="signal"
DEPLOY_DIR="/var/www/$PROJECT"
NODE_VERSION="22"
REPO="https://github.com/xionggq0205-sys/$PROJECT.git"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo "========================================"
echo "  Signal — Market Validation Platform"
echo "  Deploy to $(hostname)"
echo "========================================"
echo ""

# ─── 1. System Check ────────────────────────────────────────
log "Checking system..."

# Check sudo access
sudo -n true 2>/dev/null || err "Need sudo access (run: sudo -v first)"

# ─── 2. Install Dependencies ─────────────────────────────────
log "Installing dependencies..."

# Node.js via nodesource
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
  sudo apt-get install -y nodejs
  log "Node.js $(node -v) installed"
else
  log "Node.js $(node -v) already installed"
fi

# Git
if ! command -v git &>/dev/null; then
  sudo apt-get install -y git
fi

# SQLite
if ! dpkg -l | grep -q sqlite3; then
  sudo apt-get install -y sqlite3
fi

# PM2 (process manager)
if ! command -v pm2 &>/dev/null; then
  sudo npm install -g pm2
  log "PM2 installed"
else
  log "PM2 $(pm2 -v) already installed"
fi

# Nginx (reverse proxy)
if ! command -v nginx &>/dev/null; then
  sudo apt-get install -y nginx
  log "Nginx installed"
else
  log "Nginx $(nginx -v 2>&1 | head -1) already installed"
fi

# ─── 3. Clone / Update Code ─────────────────────────────────
if [ -d "$DEPLOY_DIR/.git" ]; then
  log "Updating existing code..."
  cd "$DEPLOY_DIR"
  git pull origin main
else
  log "Cloning repository..."
  mkdir -p "$DEPLOY_DIR"
  git clone "$REPO" "$DEPLOY_DIR"
fi

cd "$DEPLOY_DIR"

# ─── 4. Environment Setup ───────────────────────────────────
log "Setting up environment..."

if [ ! -f .env.local ]; then
  if [ -f .env.example ]; then
    cp .env.example .env.local
    warn "Created .env.local from template — EDIT THIS FILE with your API keys!"
  else
    warn "No .env.example found — create .env.local manually"
  fi
fi

# ─── 5. Install & Build ─────────────────────────────────────
log "Installing npm dependencies..."
npm install --production=false

log "Generating Prisma client & pushing schema..."
npx prisma db push

log "Building application..."
NODE_ENV=production npx next build

# ─── 6. PM2 Startup ───────────────────────────────────────
log "Configuring PM2..."

# Stop existing if running
pm2 delete "$PROJECT" 2>/dev/null || true

pm2 start npm --name "$PROJECT" -- start -- -p 3100
pm2 save
sudo env PATH=$PATH pm2 startup systemd -u ubuntu --hp /home/ubuntu

log "PM2: $PROJECT started on :3100"

# ─── 7. Nginx Reverse Proxy ──────────────────────────────
log "Configuring Nginx..."

cat | sudo tee /etc/nginx/sites-available/$PROJECT <<'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

# Enable site
sudo ln -sf /etc/nginx/sites-available/$PROJECT /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test & reload
sudo nginx -t && sudo systemctl reload nginx
log "Nginx configured: :80 → :3100"

# ─── 8. Cron (scheduled scanning) ────────────────────────
log "Configuring cron for background scanning..."

# Add cron job to run scan every 6 hours
CRON_JOB="0 */6 * * * curl -s http://localhost:3100/api/cron/scan > /dev/null 2>&1"
(crontab -l 2>/dev/null | grep -v "api/cron/scan"; echo "$CRON_JOB") | crontab -
log "Cron configured: scan runs every 6 hours"

# ─── 9. Done ─────────────────────────────────────────────
echo ""
echo "========================================"
echo "  Deploy Complete!"
echo "========================================"
echo ""
echo "  App:      http://$(hostname -I | awk '{print $1}')"
echo "  Status:   pm2 status"
echo "  Logs:     pm2 logs $PROJECT"
echo "  Restart:  pm2 restart $PROJECT"
echo ""
echo "  ⚠ NEXT: Edit .env.local with your API keys:"
echo "     vim $DEPLOY_DIR/.env.local"
echo ""
echo "  After editing, restart: pm2 restart $PROJECT"
echo ""
