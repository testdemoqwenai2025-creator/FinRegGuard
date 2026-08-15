#!/usr/bin/env bash
# scripts/deploy-preview.sh
#
# One-command deploy of RegGuard AI static preview to the public FinRegGuard repo.
#
# Usage:
#   npm run deploy:preview
#   bash scripts/deploy-preview.sh
#
# What it does:
#   1. Resolves GitHub token (from $FINREGGUARD_GH_TOKEN or legacy .gh-pages-deploy remote)
#   2. Clones FinRegGuard to .finregguard-staging/ (one-time; subsequent runs reuse it)
#   3. Builds static export with BUILD_STATIC=true NEXT_PUBLIC_BASE_PATH=/FinRegGuard
#      (API routes are temporarily moved out so `output: 'export'` succeeds)
#   4. Syncs out/ -> .finregguard-staging/ (preserves .git/)
#   5. Writes fresh README.md with deploy metadata + .nojekyll
#   6. Commits & pushes to FinRegGuard **gh-pages** branch
#   7. GitHub Pages auto-redeploys in ~30-60s (if Pages is configured for gh-pages)
#
# IMPORTANT: deploys go to the `gh-pages` branch, NOT `main`. The `main` branch
# holds the source code; `gh-pages` holds the static build that GitHub Pages
# serves. Pushing the static build to `main` would clobber the source code.
# Configure Pages at: https://github.com/<owner>/FinRegGuard/settings/pages
#   Source: Deploy from a branch
#   Branch: gh-pages / (root)
#
# Prerequisites:
#   - .gh-pages-deploy/ must exist with token in its remote URL (one-time setup)
#     OR FINREGGUARD_GH_TOKEN env var must be set
#   - npm install has been run (so node_modules/.bin/next exists)

set -euo pipefail

# ─── Config ─────────────────────────────────────────────────────────────────
PRIVATE_REPO_DIR="/home/z/my-project"
STAGING_DIR="/home/z/my-project/.finregguard-staging"
LEGACY_TOKEN_SOURCE="/home/z/my-project/.gh-pages-deploy"
APP_API_DIR="${PRIVATE_REPO_DIR}/src/app/api"
APP_API_BACKUP="${PRIVATE_REPO_DIR}/src/app/__api_static_backup"
OUT_DIR="${PRIVATE_REPO_DIR}/out"

PUBLIC_REPO_OWNER="testdemoqwenai2025-creator"
PUBLIC_REPO_NAME="FinRegGuard"
PRIVATE_REPO_NAME="FinRegGTP.BoT"
PUBLIC_PAGES_URL="https://${PUBLIC_REPO_OWNER}.github.io/${PUBLIC_REPO_NAME}/"

# ─── Color helpers (only if stdout is a TTY) ────────────────────────────────
if [ -t 1 ]; then
  GREEN='\033[0;32m'; BLUE='\033[0;34m'; RED='\033[0;31m'; YELLOW='\033[0;33m'; NC='\033[0m'
else
  GREEN=''; BLUE=''; RED=''; YELLOW=''; NC=''
fi
log()  { echo -e "${BLUE}▶${NC} $*"; }
ok()   { echo -e "${GREEN}✓${NC} $*"; }
err()  { echo -e "${RED}✗${NC} $*" >&2; }
warn() { echo -e "${YELLOW}!${NC} $*"; }

# ─── Step 1: Resolve GitHub token ───────────────────────────────────────────
log "Resolving GitHub token..."
GH_TOKEN="${FINREGGUARD_GH_TOKEN:-}"
if [ -z "$GH_TOKEN" ] && [ -d "$LEGACY_TOKEN_SOURCE/.git" ]; then
  GH_TOKEN=$(cd "$LEGACY_TOKEN_SOURCE" && git remote get-url origin 2>/dev/null \
    | sed -nE 's#.*://[^:]+:([^@]+)@.*#\1#p' || true)
fi

if [ -z "$GH_TOKEN" ]; then
  err "No GitHub token found."
  echo "  Either:" >&2
  echo "    • Set FINREGGUARD_GH_TOKEN env var" >&2
  echo "    • Ensure $LEGACY_TOKEN_SOURCE/.git exists with token in remote URL" >&2
  exit 1
fi
ok "GitHub token resolved (length: ${#GH_TOKEN})"

AUTH_URL="https://${PUBLIC_REPO_OWNER}:${GH_TOKEN}@github.com/${PUBLIC_REPO_OWNER}/${PUBLIC_REPO_NAME}.git"

# ─── Step 2: Clone or refresh staging dir ───────────────────────────────────
# Clone with --no-checkout initially, then checkout gh-pages branch explicitly.
# This ensures we're always on gh-pages (the deploy target), never main.
if [ ! -d "$STAGING_DIR/.git" ]; then
  log "First-time setup: cloning ${PUBLIC_REPO_NAME} to ${STAGING_DIR}..."
  git clone --quiet "$AUTH_URL" "$STAGING_DIR"
  ok "Cloned"
fi

cd "$STAGING_DIR"
git config user.name "RegGuard AI Builder"
git config user.email "builder@regguard.ai"
# Refresh remote URL in case token rotated
git remote set-url origin "$AUTH_URL" 2>/dev/null || true

# Ensure we're on gh-pages branch. If it doesn't exist yet (first deploy),
# create it as an orphan branch with just .nojekyll.
git fetch --quiet origin
if git show-ref --verify --quiet refs/heads/gh-pages; then
  git checkout --quiet gh-pages
  git reset --hard --quiet origin/gh-pages 2>/dev/null || true
else
  log "gh-pages branch does not exist — creating as orphan..."
  git checkout --quiet --orphan gh-pages
  git rm -rf --quiet . 2>/dev/null || true
  touch .nojekyll
  git add .nojekyll
  git commit --quiet -m "Initialize gh-pages branch" --allow-empty
fi
ok "On gh-pages branch at ${STAGING_DIR}"

# ─── Step 3: Build static export ────────────────────────────────────────────
log "Building static export (BUILD_STATIC=true NEXT_PUBLIC_BASE_PATH=/${PUBLIC_REPO_NAME})..."
cd "$PRIVATE_REPO_DIR"

# Clean previous build artifacts
rm -rf "$OUT_DIR" "${PRIVATE_REPO_DIR}/.next"

# Back up /api routes — they require Prisma + server, incompatible with `output: 'export'`
if [ -d "$APP_API_DIR" ]; then
  rm -rf "$APP_API_BACKUP"
  mv "$APP_API_DIR" "$APP_API_BACKUP"
fi

# Run next build directly (bypass package.json build script which targets standalone mode)
BUILD_STATIC=true \
NEXT_PUBLIC_STATIC_BUILD=true \
NEXT_PUBLIC_BASE_PATH="/${PUBLIC_REPO_NAME}" \
npx next build 2>&1 | tail -40

BUILD_RC=${PIPESTATUS[0]}

# Always restore /api routes (even if build failed)
if [ -d "$APP_API_BACKUP" ]; then
  rm -rf "$APP_API_DIR"
  mv "$APP_API_BACKUP" "$APP_API_DIR"
fi

if [ $BUILD_RC -ne 0 ]; then
  err "Build failed (exit code ${BUILD_RC})"
  exit $BUILD_RC
fi

if [ ! -d "$OUT_DIR" ]; then
  err "Build did not produce ${OUT_DIR}/"
  exit 1
fi
ok "Static export ready ($(find "$OUT_DIR" -type f | wc -l) files, $(du -sh "$OUT_DIR" | cut -f1))"

# ─── Step 4: Sync to staging ────────────────────────────────────────────────
log "Syncing build output to staging dir..."
cd "$STAGING_DIR"

# Wipe everything except .git
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

# Copy fresh build output (including hidden files)
cp -r "$OUT_DIR/." .

# Ensure .nojekyll exists (prevents GitHub Pages Jekyll processing, which would strip _next/)
touch .nojekyll

# Permissive robots.txt for the public preview
cat > robots.txt <<EOF
user-agent: *
disallow:
EOF

# ─── Step 5: Write fresh README with deploy metadata ────────────────────────
DEPLOY_DATE=$(date -u +"%Y-%m-%d %H:%M UTC")
DEPLOY_COMMIT=$(cd "$PRIVATE_REPO_DIR" && git rev-parse --short HEAD)
DEPLOY_BRANCH=$(cd "$PRIVATE_REPO_DIR" && git rev-parse --abbrev-ref HEAD)
DEPLOY_SUBJECT=$(cd "$PRIVATE_REPO_DIR" && git log -1 --pretty=%s)

cat > README.md <<EOF
# RegGuard AI — Public Preview & Observability Dashboard

> **Automated regulatory compliance monitoring** for banks, insurers, pharma, and hospitals. Track regulation changes, auto-update policies, and generate immutable audit trails.

![Status](https://img.shields.io/badge/status-preview%20v2.3-blue)
![License](https://img.shields.io/badge/license-proprietary-red)
![Pages](https://img.shields.io/badge/GitHub%20Pages-live-success)

## Repository Purpose

This is the **public preview repository** for the RegGuard AI prototype. It contains **only the static export** (HTML, CSS, JavaScript chunks, JSON data) of the application — **no source code** is included here.

The full source code, Prisma schemas, API routes, and development tooling live in the **private** repository:

- **Source code (private):** [\`FinRegGTP.BoT\`](https://github.com/${PUBLIC_REPO_OWNER}/${PRIVATE_REPO_NAME})
- **Live preview (this repo):** [\`FinRegGuard\`](${PUBLIC_PAGES_URL})

This split enables stakeholders, investors, and reviewers to **observe the prototype in action** without exposing the algorithmic IP, internal data models, or proprietary integrations.

## Live Preview

The static site is served via GitHub Pages at:

\`\`\`
${PUBLIC_PAGES_URL}
\`\`\`

## What's Inside

The preview showcases **29 state-machine views** across **6 regulatory zones**:

| Zone | Sample Views |
|------|--------------|
| **Financial Supervision** | RegWatch, Surveillance, Systemic Risk |
| **Data & Privacy** | GDPR, HIPAA, Cross-Border Mapping |
| **Digital Assets** | Crypto Compliance, Sanctions, Travel Rule |
| **Climate & ESG** | Climate Risk, TCFD, ESG Disclosures |
| **AI Governance** | EU AI Act, Model Registry, Explainability |
| **Developer & Ops** | Audit Trail, Knowledge Graph, API Portal |

## Update Process

The static export in this repository is regenerated from the private source repo on every release. The deployment workflow:

1. \`BUILD_STATIC=true NEXT_PUBLIC_BASE_PATH=/${PUBLIC_REPO_NAME} next build\` (in private repo)
2. Copy \`out/\` export output to replace contents of this repo
3. Commit and push to \`main\` branch
4. GitHub Pages auto-redeploys

## License and Usage

This preview is **proprietary**. You may view and share the live preview link for evaluation purposes. The underlying source code is not for distribution. All rights reserved by the RegGuard AI team.

---

_Last deployed: ${DEPLOY_DATE} from commit \`${DEPLOY_COMMIT}\` on branch \`${DEPLOY_BRANCH}\`_
_Source commit subject: ${DEPLOY_SUBJECT}_
EOF

ok "README.md written"

# ─── Step 6: Commit & push ──────────────────────────────────────────────────
log "Committing changes..."
git add -A

# Bail out cleanly if there's nothing to deploy
if git diff --cached --quiet; then
  warn "No changes to deploy (working tree clean — content identical to last deploy)"
  exit 0
fi

git commit --quiet -m "Deploy RegGuard AI static preview

Deployed: ${DEPLOY_DATE}
Source commit: ${DEPLOY_COMMIT}
Source branch: ${DEPLOY_BRANCH}
Source subject: ${DEPLOY_SUBJECT}
Total files: $(find . -type f -not -path './.git/*' | wc -l)
Total size: $(du -sh --exclude=.git . | cut -f1)"

log "Pushing to ${PUBLIC_REPO_OWNER}/${PUBLIC_REPO_NAME} gh-pages..."
git push --quiet origin gh-pages

ok "Pushed to https://github.com/${PUBLIC_REPO_OWNER}/${PUBLIC_REPO_NAME}/tree/gh-pages"
echo ""
ok "Live in ~30-60s at: ${PUBLIC_PAGES_URL}"
echo ""
echo "  ⚠  If the URL still 404s, ensure GitHub Pages is configured:"
echo "     https://github.com/${PUBLIC_REPO_OWNER}/${PUBLIC_REPO_NAME}/settings/pages"
echo "     Source: Deploy from a branch → Branch: gh-pages / (root)"
