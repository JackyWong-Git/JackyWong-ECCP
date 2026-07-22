#!/bin/bash
set -Eeuo pipefail

ROOT_DIR="${COZE_WORKSPACE_PATH:-$(cd "$(dirname "$0")/.." && pwd)}"
PYTHON_BIN="${PYTHON_BIN:-python3}"
VENV_DIR="${ROOT_DIR}/.venv"

cd "${ROOT_DIR}"
if [[ ! -x "${VENV_DIR}/bin/python" ]]; then
  echo "Creating Python virtual environment..."
  "${PYTHON_BIN}" -m venv "${VENV_DIR}"
fi

"${VENV_DIR}/bin/python" -m pip install --disable-pip-version-check -q -r requirements.txt
"${VENV_DIR}/bin/python" manage.py migrate --noinput
