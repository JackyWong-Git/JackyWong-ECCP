#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${ECCP_APP_DIR:-/opt/eccp}"
BRANCH="${ECCP_DEPLOY_BRANCH:-agent/eccp-platform-v4-upgrade}"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${APP_DIR}/.deploy-backups/release-${STAMP}"
LOG_FILE="${BACKUP_DIR}/deploy.log"

mkdir -p "${BACKUP_DIR}"
exec > >(tee -a "${LOG_FILE}") 2>&1

cd "${APP_DIR}"

echo "[deploy] Backing up production state..."
cp -a .env "${BACKUP_DIR}/.env"
git rev-parse HEAD > "${BACKUP_DIR}/commit-before.txt"
git status --short > "${BACKUP_DIR}/status-before.txt"
git diff > "${BACKUP_DIR}/tracked-production.patch"
find backend -maxdepth 2 -name "*.sqlite3" -exec cp -a {} "${BACKUP_DIR}/" \;

echo "[deploy] Updating ${BRANCH}..."
git stash push -m "production-predeploy-${STAMP}" || true
git fetch origin "${BRANCH}"
git merge --ff-only "origin/${BRANCH}"

# Keep the production PyPI mirror override used by the current server image.
if git stash list | head -1 | grep -q "production-predeploy-${STAMP}"; then
  git checkout "stash@{0}" -- services/api/Dockerfile || true
fi

grep -q "^DJANGO_ALLOWED_HOSTS=" .env ||
  echo "DJANGO_ALLOWED_HOSTS=gtmc-eccp.club,www.gtmc-eccp.club,124.220.74.230,localhost,127.0.0.1" >> .env
grep -q "^DJANGO_CSRF_TRUSTED_ORIGINS=" .env ||
  echo "DJANGO_CSRF_TRUSTED_ORIGINS=https://gtmc-eccp.club,https://www.gtmc-eccp.club" >> .env
grep -q "^NEXT_APP_ORIGIN=" .env ||
  echo "NEXT_APP_ORIGIN=https://gtmc-eccp.club" >> .env

echo "[deploy] Installing dependencies and applying migrations..."
export PIP_INDEX_URL="${PIP_INDEX_URL:-https://pypi.tuna.tsinghua.edu.cn/simple}"
.venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate --noinput
.venv/bin/python manage.py collectstatic --noinput
pnpm install --frozen-lockfile

echo "[deploy] Validating and building..."
pnpm validate
pnpm build
docker compose up -d --build api worker

echo "[deploy] Switching application processes..."
pm2 restart eccp-web --update-env
pm2 restart eccp-django --update-env
pm2 save

sleep 15

echo "[deploy] Running health checks..."
curl -fsS http://127.0.0.1:5000/ >/dev/null
curl -fsS http://127.0.0.1:8000/accounts/login/ >/dev/null
curl -fsS http://127.0.0.1:8100/health | tee "${BACKUP_DIR}/api-health.json"
docker compose ps --status running | tee "${BACKUP_DIR}/compose-status.txt"
git rev-parse HEAD | tee "${BACKUP_DIR}/commit-after.txt"
touch "${BACKUP_DIR}/DEPLOY_OK"

echo
echo "[deploy] ECCP deployment completed successfully."
echo "[deploy] Backup: ${BACKUP_DIR}"
