#!/usr/bin/env bash
# Pre-commit hook: run the plugin manifest audit before allowing a commit.
#
# Catches three classes of drift between plugins/manifest.json and the codebase:
#   - STATUS DRIFT: manifest says "ready" but implementation file is missing
#   - DATA DRIFT: manifest references a staticData JSON file that doesn't exist
#   - DYNAMISM DRIFT: declared dynamicSlots not present as null in static JSON
#
# If any drift is detected, the commit is blocked. Fix the manifest or the code,
# then re-stage and try again.
#
# To bypass temporarily (NOT recommended): git commit --no-verify
#
# Install: this file lives at .git/hooks/pre-commit and must be executable.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# Only run if the manifest exists (don't block commits that don't touch it)
if [ ! -f "plugins/manifest.json" ]; then
  exit 0
fi

echo "→ Running plugin manifest audit (pre-commit)..."

# Run the audit. --json mode is silent on success, prints issues on failure.
OUTPUT=$(bun scripts/audit-plugins.ts 2>&1) || true

# Check the exit code properly
bun scripts/audit-plugins.ts > /dev/null 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "✗ Plugin manifest audit FAILED — commit blocked."
  echo ""
  echo "$OUTPUT" | grep -E "DRIFT|FAIL|with issues|EMPTY|THIN" | head -20
  echo ""
  echo "To see the full report, run: bun scripts/audit-plugins.ts"
  echo "To bypass (NOT recommended): git commit --no-verify"
  exit 1
fi

echo "✓ Plugin manifest audit passed."
exit 0
