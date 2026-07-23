#!/bin/bash
set -Eeuo pipefail

ROOT_DIR="${COZE_WORKSPACE_PATH:-$(cd "$(dirname "$0")/.." && pwd)}"
VENV_DIR="${ROOT_DIR}/.venv"
API_PORT="${API_PORT:-8100}"

cd "${ROOT_DIR}"
if [[ "${SKIP_PYTHON_SETUP:-0}" != "1" ]]; then
  bash ./scripts/python-setup.sh
fi

echo "FastAPI business service: http://localhost:${API_PORT}/docs"
cd services/api
exec "${VENV_DIR}/bin/python" -m uvicorn app.main:app --reload --host 0.0.0.0 --port "${API_PORT}"
