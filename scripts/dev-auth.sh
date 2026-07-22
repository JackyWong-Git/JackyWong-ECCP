#!/bin/bash
set -Eeuo pipefail

ROOT_DIR="${COZE_WORKSPACE_PATH:-$(cd "$(dirname "$0")/.." && pwd)}"
VENV_DIR="${ROOT_DIR}/.venv"
AUTH_PORT="${AUTH_PORT:-8000}"

cd "${ROOT_DIR}"

if [[ "${SKIP_PYTHON_SETUP:-0}" != "1" ]]; then
  bash ./scripts/python-setup.sh
fi

if [[ "${ECCP_BOOTSTRAP_DEV_USER:-0}" == "1" ]]; then
  : "${ECCP_DEV_USERNAME:?ECCP_DEV_USERNAME is required when bootstrapping a development user}"
  : "${ECCP_DEV_PASSWORD:?ECCP_DEV_PASSWORD is required when bootstrapping a development user}"
  "${VENV_DIR}/bin/python" manage.py bootstrap_dev_user \
    --username "${ECCP_DEV_USERNAME}" \
    --password "${ECCP_DEV_PASSWORD}"
fi

echo "Django authentication: http://localhost:${AUTH_PORT}/accounts/login/"
exec "${VENV_DIR}/bin/python" manage.py runserver "0.0.0.0:${AUTH_PORT}"
