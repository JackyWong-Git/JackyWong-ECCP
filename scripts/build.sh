#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

run_build() {
  local babel_backup=""

  if [[ -f .babelrc ]]; then
    babel_backup=".babelrc.build-backup"
    mv .babelrc "${babel_backup}"
  fi

  trap 'if [[ -n "${babel_backup}" && -f "${babel_backup}" ]]; then mv "${babel_backup}" .babelrc; fi' RETURN

  echo "Building the Next.js project..."
  pnpm next build --webpack

  echo "Bundling server with tsup..."
  pnpm tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify
}

has_non_ascii_path() {
  LC_ALL=C grep -q '[^ -~]' <<<"$1"
}

rewrite_build_paths() {
  local from_path="$1"
  local to_path="$2"

  # Next records absolute source paths in build manifests. Rebase them after
  # moving a sanitized build back to the deployment workspace.
  while IFS= read -r -d '' file; do
    BUILD_SOURCE_PATH="${from_path}" BUILD_TARGET_PATH="${to_path}" \
      perl -0pi -e '
        BEGIN {
          $from = $ENV{"BUILD_SOURCE_PATH"};
          $to = $ENV{"BUILD_TARGET_PATH"};
        }
        s/\Q$from\E/$to/g;
      ' "${file}"
  done < <(rg -l -0 --hidden --glob '!cache' "${from_path}" .next)
}

if has_non_ascii_path "${COZE_WORKSPACE_PATH}"; then
  BUILD_DIR="$(mktemp -d /tmp/eccp-build-XXXXXX)"
  trap 'rm -rf "${BUILD_DIR}"' EXIT

  echo "Detected a non-ASCII workspace path, building in a sanitized temporary directory..."
  mkdir -p "${BUILD_DIR}"
  tar \
    --exclude='./node_modules' \
    --exclude='./.next' \
    --exclude='./dist' \
    --exclude='./repo.zip' \
    -cf - . | (cd "${BUILD_DIR}" && tar -xf -)
  ln -s "${COZE_WORKSPACE_PATH}/node_modules" "${BUILD_DIR}/node_modules"

  cd "${BUILD_DIR}"
  run_build

  cd "${COZE_WORKSPACE_PATH}"
  rm -rf .next dist
  cp -R "${BUILD_DIR}/.next" .next
  cp -R "${BUILD_DIR}/dist" dist
  rewrite_build_paths "${BUILD_DIR}" "${COZE_WORKSPACE_PATH}"
else
  run_build
fi

echo "Build completed successfully!"
