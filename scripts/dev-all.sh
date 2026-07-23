#!/bin/bash
set -Eeuo pipefail

ROOT_DIR="${COZE_WORKSPACE_PATH:-$(cd "$(dirname "$0")/.." && pwd)}"
APP_PORT="${DEPLOY_RUN_PORT:-5000}"
AUTH_PORT="${AUTH_PORT:-8000}"
API_PORT="${API_PORT:-8100}"

cd "${ROOT_DIR}"

bash ./scripts/python-setup.sh

SKIP_PYTHON_SETUP=1 NEXT_APP_ORIGIN="http://localhost:${APP_PORT}" AUTH_PORT="${AUTH_PORT}" bash ./scripts/dev-auth.sh &
AUTH_PID=$!
SKIP_PYTHON_SETUP=1 API_PORT="${API_PORT}" bash ./scripts/dev-api.sh &
API_PID=$!

cleanup() {
  kill "${AUTH_PID}" 2>/dev/null || true
  kill "${API_PID}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

NEXT_PUBLIC_DJANGO_URL="http://localhost:${AUTH_PORT}" \
DJANGO_INTERNAL_URL="http://127.0.0.1:${AUTH_PORT}" \
ECCP_API_INTERNAL_URL="http://127.0.0.1:${API_PORT}" \
DEPLOY_RUN_PORT="${APP_PORT}" \
bash ./scripts/dev.sh
