#!/bin/bash
# ================================================================
# Signal — Auto Deploy & Dev Progress Script
# 运行在服务器上，自动拉取最新代码并重新部署
# 
# 定时运行: */2 * * * * /var/www/signal/auto-deploy.sh >> /var/log/signal-deploy.log 2>&1
# ================================================================
set -e

PROJECT="signal"
DEPLOY_DIR="/var/www/$PROJECT"
LOG_FILE="/var/log/signal-deploy.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "=== Auto-deploy check ==="

cd "$DEPLOY_DIR" || { log "ERROR: $DEPLOY_DIR not found"; exit 1; }

# ─── 1. Check for new commits ────────────────────────────────
git fetch origin main 2>/dev/null

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  log "No new commits. Local=$LOCAL"
  exit 0
fi

log "New commits detected! $LOCAL → $REMOTE"

# ─── 2. Pull latest code ──────────────────────────────────────
git pull origin main
log "Code updated."

# ─── 3. Install dependencies ──────────────────────────────────
log "Installing dependencies..."
npm install --production=false 2>&1 | tail -5

# ─── 4. Push database schema ──────────────────────────────────
log "Pushing Prisma schema..."
npx prisma db push 2>&1 | tail -3

# ─── 5. Build ─────────────────────────────────────────────────
log "Building application..."
NODE_ENV=production npx next build 2>&1 | tail -10

# ─── 6. Restart app ───────────────────────────────────────────
log "Restarting PM2..."
pm2 restart "$PROJECT"
pm2 save

log "=== Deploy complete! ==="
