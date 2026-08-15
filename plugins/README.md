# RegGuard Plugin System

This directory contains the plugin manifest — the canonical registry of
every capability the RegGuard AI application exposes.

## Files

- `plugin-manifest.schema.json` — JSON Schema (Draft 2020-12) defining the
  Plugin object shape. The contract.
- `manifest.json` — the actual registry, one entry per plugin (currently 46).
  The single source of truth for what the app can do.

## The contract

Every plugin entry declares:

- `key` — stable identifier, matches the ViewKey in code
- `name`, `description` — human-readable
- `category` — top-level grouping (core-compliance, surveillance, etc.)
- `status` — one of: `ready`, `in_progress`, `planned`, `deprecated`,
  `not_implemented`. **Absence is a first-class state.**
- `implementation` — references to where the plugin lives in the codebase
  (component path, viewKey, apiRoute, staticData path)
- `dynamism` — the static/dynamic capacity profile (see below)
- `audit` — per-plugin verification criteria (min content length, expected
  heading, requires back button, etc.)
- `dependencies` — keys of other plugins this one depends on

## Dynamism: the reserved-buffer pattern

Each plugin declares a `dynamism` level:

- **L0** — Pure static. No dynamic data. e.g. regulation text, framework
  definitions.
- **L1** — Static + periodic refresh. Structure is static, values refresh on
  a schedule. e.g. regulation status, KPI counts.
- **L2** — Static shell + dynamic data. Layout and metadata are static; live
  records fill in reserved slots. e.g. form instances, audit events.
- **L3** — Fully dynamic. No static fallback. e.g. AI chat, real-time
  surveillance.

The `dynamicSlots` array lists field paths (dotted notation) that are
reserved for dynamic population. These slots must exist as `null` in the
static JSON file — this is the "capacity reservation". When a live API
becomes available, it fills the nulls; no schema change, no rebuild.

See `STATIC-DYNAMIC-CAPACITY-PATTERN.txt` in the repo root for the full
rationale (the C dynamic array analogy).

## Enforcement

Two audit scripts verify the manifest against the codebase:

### `scripts/audit-plugins.ts` — static drift check

Runs locally (pre-commit hook) and in CI (GitHub Action). Verifies:

1. `implementation.component` file exists
2. `implementation.staticData` file exists
3. `implementation.apiRoute` directory exists
4. `dependencies` are all `ready`
5. `dynamism.dynamicSlots` are present as `null` in the static JSON
6. L3 plugins have an `apiRoute` (they're fully dynamic)
7. Optional: live URL returns 200 (with `--live` flag)

Exit code 1 on any drift. Blocks commits and PR merges.

### `scripts/audit-plugins-live.ts` — live browser audit

Runs in CI after the static build. For each plugin:

1. Clicks the sidebar item in a headless browser
2. Waits for render
3. Measures rendered text content length (catches empty/placeholder pages)
4. Checks expected heading is present
5. Checks Back button is present (all non-dashboard pages)
6. Counts console errors

Exit code 1 if any page renders < minContentLength chars or has console
errors.

## Workflow

1. **Add a new plugin**: add an entry to `manifest.json` with status
   `planned` or `in_progress`. Run `bun scripts/audit-plugins.ts` to verify
   the entry is well-formed.
2. **Implement the plugin**: create the component, add the viewKey to
   `page.tsx`, add static data if needed. Update the manifest entry to
   `status: "ready"`.
3. **Add dynamism**: if the plugin has dynamic data, declare `dynamism.level`
   and `dynamicSlots`. Add the slots as `null` in the static JSON. Run the
   audit to verify the slots are properly reserved.
4. **Commit**: the pre-commit hook runs the audit automatically. If it
   fails, fix the drift before pushing.
5. **Open a PR**: the GitHub Action runs both the static and live audits.
   The PR cannot merge until both pass.

## Why this exists

See `AGENTIC-WORKFLOW-LESSONS.txt` in the repo root. The short version:
agents are unreliable narrators. "Tests pass" doesn't mean "features work".
The manifest makes capabilities explicit and enumerable; the audit produces
evidence rather than claims.
