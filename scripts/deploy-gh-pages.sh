#!/usr/bin/env bash
# Deploy the static `out/` directory to the `main` branch of the
# FinRegGuard GitHub repository. GitHub Pages is configured to serve from
# the root of `main`, so we orphan-commit the build artifacts directly.
set -euo pipefail

REPO_URL="${DEPLOY_GIT_URL:?Set DEPLOY_GIT_URL env var with the git remote URL including credentials}"
REPO_NAME="FinRegGuard"
PROJECT_ROOT="/home/z/my-project"
OUT_DIR="${PROJECT_ROOT}/out"
DEPLOY_WORK="${PROJECT_ROOT}/.gh-pages-deploy"

cd "${PROJECT_ROOT}"

if [ ! -d "${OUT_DIR}" ]; then
  echo "✗ ${OUT_DIR} does not exist — run build-static.sh first"
  exit 1
fi

# 1. Set up a clean deploy workspace
echo "→ Preparing deploy workspace at ${DEPLOY_WORK}"
rm -rf "${DEPLOY_WORK}"
mkdir -p "${DEPLOY_WORK}"
cd "${DEPLOY_WORK}"

# 2. Initialise a brand-new orphan git repo pointing at the GitHub remote
#    (Pages is configured to serve from the root of `main`, so we orphan-
#     commit the build artifacts directly onto main.)
git init -q -b gh-pages
git config user.name "RegGuard AI Builder"
git config user.email "builder@regguard.ai"
git remote add origin "${REPO_URL}"

# 3. Copy all static export files into the workspace
cp -r "${OUT_DIR}/." "${DEPLOY_WORK}/"
ls -la | head -20

# 4. Add a .nojekyll file so GitHub Pages doesn't strip _next/ folders
touch .nojekyll
echo "user-agent: *" > robots.txt
echo "disallow:" >> robots.txt

# 5. Commit and force-push to gh-pages branch
git add -A
git commit -q -m "Deploy RegGuard AI static preview to GitHub Pages

Built: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Source: Next.js 16 static export (output: 'export')
basePath: /FinRegGuard
Total files: $(find . -type f -not -path './.git/*' | wc -l)
Total size: $(du -sh . | cut -f1)"

echo "→ Pushing to gh-pages branch (force)..."
git push -f origin gh-pages 2>&1 | tail -20

echo "✓ Deployed to gh-pages branch"
echo "  Preview URL: https://testdemoqwenai2025-creator.github.io/${REPO_NAME}/"
