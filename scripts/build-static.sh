#!/usr/bin/env bash
# Build a static export of RegGuard AI for GitHub Pages.
#
# Strategy: temporarily move /api routes out of the app dir (they require Prisma
# and a running server, which is incompatible with `output: 'export'`), run the
# static build, then restore them. The client components have already been
# refactored to fetch from /data/*.json when NEXT_PUBLIC_STATIC_BUILD=true, so
# the absence of /api routes during the static build is fine.
set -euo pipefail

PROJECT_ROOT="/home/z/my-project"
APP_API_DIR="${PROJECT_ROOT}/src/app/api"
APP_API_BACKUP="${PROJECT_ROOT}/src/app/__api_static_backup"
OUT_DIR="${PROJECT_ROOT}/out"

cd "${PROJECT_ROOT}"

# 1. Back up /api routes
if [ -d "${APP_API_DIR}" ]; then
  echo "→ Backing up /api routes to ${APP_API_BACKUP}"
  rm -rf "${APP_API_BACKUP}"
  mv "${APP_API_DIR}" "${APP_API_BACKUP}"
fi

# 2. Build static export
# NEXT_PUBLIC_BASE_PATH controls where the static assets are served from.
# Default: /FinRegGuard (for GitHub Pages at https://<user>.github.io/FinRegGuard/)
# Override: set BASE_PATH="" for CI testing (serves from root, no prefix)
# Note: use ${BASE_PATH-default} (without colon) so empty string is respected.
#   ${BASE_PATH:-default} would substitute default for empty string, which is
#   NOT what we want when CI explicitly passes BASE_PATH="".
BASE_PATH="${BASE_PATH-/FinRegGuard}"
echo "→ Running static export build (basePath: '${BASE_PATH}')"
BUILD_STATIC=true \
NEXT_PUBLIC_STATIC_BUILD=true \
NEXT_PUBLIC_BASE_PATH="${BASE_PATH}" \
bunx next build 2>&1 | tail -60

BUILD_RC=${PIPESTATUS[0]}

# 3. Restore /api routes (always, even if build failed)
if [ -d "${APP_API_BACKUP}" ]; then
  echo "→ Restoring /api routes"
  rm -rf "${APP_API_DIR}"
  mv "${APP_API_BACKUP}" "${APP_API_DIR}"
fi

if [ ${BUILD_RC} -ne 0 ]; then
  echo "✗ Build failed (exit code ${BUILD_RC})"
  exit ${BUILD_RC}
fi

# 4. Verify out/ exists
if [ ! -d "${OUT_DIR}" ]; then
  echo "✗ Expected ${OUT_DIR} but it does not exist"
  exit 1
fi

echo "✓ Static export built at ${OUT_DIR}"
ls -la "${OUT_DIR}" | head -20
echo "---"
echo "Total files: $(find ${OUT_DIR} -type f | wc -l)"
echo "Total size: $(du -sh ${OUT_DIR} | cut -f1)"
