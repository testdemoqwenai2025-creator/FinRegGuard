# GCP Migration — API Route Backfill TODO

When this project moves from static export (current) to a hosted runtime on
GCP (Cloud Run / GKE / GCE), the static-export constraint disappears and we
can finally ship real `/api/*` routes for the plugins that currently survive
on static JSON alone.

The manifest is the source of truth for which routes are missing. This file
is the curated migration plan, ordered by declared dynamism level.

## Why this matters

Static export (`output: 'export'` in `next.config.ts`) forbids `src/app/api/*`
route handlers — Next.js refuses to build them. We worked around this with
the **reserved-buffer pattern** (see `STATIC-DYNAMIC-CAPACITY-PATTERN.txt`):
every plugin's static JSON ships with the full data shape, and any field
earmarked for future dynamism is present as `null`. The `usePluginData` hook
tries `/api/X` first, falls back to `/data/X.json` on failure or timeout.
That means **upgrading a plugin from L0 (static) to L2 (dynamic) is a no-op
for the UI** — the buffer is already there.

So backfilling the missing API routes is a pure additive operation: build
the route, populate the reserved slot, the UI starts showing live data. No
rebuild, no redesign, no broken UX.

## Priority order

Priority is determined by declared `dynamism.level` in `plugins/manifest.json`.
Higher levels claim more dynamism, so they have the most to gain from a real
backend.

### Priority 1 — Declared dynamic, no backend yet (HIGHEST urgency)

These plugins *claim* to be dynamic but have no `apiRoute`. They're currently
rendering from static JSON with the dynamic slots staying `null`. This is the
first class of lie we want to eliminate.

| # | key | level | category | notes |
|---|-----|-------|----------|-------|
| 1 | `control-monitor` | L2 | core-compliance | Has `realTimePassRate:null` reserved slot. Highest-value backfill. |

### Priority 2 — Surveillance plugins (declared L0 today, but logically L1/L2)

These are currently marked L0 because we have no backend. Logically they
should be L1 (periodic refresh) or L2 (live event stream). When the backend
exists, update the manifest's `dynamism.level` accordingly.

| # | key | category | suggested level |
|---|-----|----------|-----------------|
| 2 | `transaction-surveillance` | surveillance | L2 (event stream) |
| 3 | `comms-surveillance` | surveillance | L2 (event stream) |
| 4 | `sanctions-screening` | surveillance | L2 (event stream) |
| 5 | `network-graph` | surveillance | L1 (periodic refresh) |
| 6 | `adaptive-thresholds` | surveillance | L1 (periodic refresh) |
| 7 | `tm-alert-taxonomy` | surveillance | L0 (reference data) |

### Priority 3 — Quant / computational (mostly L1 candidate)

| # | key | category | suggested level |
|---|-----|----------|-----------------|
| 8 | `quant-lab` | quant-computational | L2 (live calc results) |
| 9 | `climate-esg` | quant-computational | L1 (periodic refresh) |
| 10 | `counterfactual` | quant-computational | L2 (on-demand calc) |
| 11 | `systemic-risk` | quant-computational | L1 (periodic refresh) |
| 12 | `esg-reporting` | quant-computational | L1 (periodic refresh) |

### Priority 4 — Intelligence / automation (L2/L3 candidates)

| # | key | category | suggested level |
|---|-----|----------|-----------------|
| 13 | `agent-console` | intelligence-automation | L3 (live multi-agent state) |
| 14 | `regulatory-watch` | intelligence-automation | L1 (periodic refresh) |
| 15 | `red-team` | intelligence-automation | L2 (on-demand scan) |
| 16 | `knowledge-graph` | intelligence-automation | L1 (periodic refresh) |
| 17 | `fairness-testing` | intelligence-automation | L2 (on-demand test) |
| 18 | `reporting-evolution` | intelligence-automation | L1 (periodic refresh) |
| 19 | `ai-model-risk` | intelligence-automation | L1 (periodic refresh) |
| 20 | `ai-governance` | intelligence-automation | L1 (periodic refresh) |

### Priority 5 — Collaboration / trust (mostly L1)

| # | key | category | suggested level |
|---|-----|----------|-----------------|
| 21 | `regulator-portal` | collaboration-trust | L2 (interactive submissions) |
| 22 | `whistleblower` | collaboration-trust | L2 (submission + status) |
| 23 | `chain-evidence` | collaboration-trust | L2 (evidence chain) |
| 24 | `digital-assets` | collaboration-trust | L1 (periodic refresh) |
| 25 | `regtech-feeds` | collaboration-trust | L1 (periodic refresh) |
| 26 | `crypto-regulation` | collaboration-trust | L1 (periodic refresh) |

### Priority 6 — Platform governance (mostly L0, low urgency)

| # | key | category | suggested level |
|---|-----|----------|-----------------|
| 27 | `privacy-pets` | platform-governance | L0 (reference) |
| 28 | `developer-hub` | platform-governance | L0 (reference) |
| 29 | `time-machine` | platform-governance | L0 (reference) |
| 30 | `rule-harmonizer` | platform-governance | L2 (on-demand compare) |
| 31 | `xcc` (compliance cards) | platform-governance | L0 (reference) |
| 32 | `localization-matrix` | platform-governance | L0 (reference) |
| 33 | `tia` | platform-governance | L2 (on-demand assessment) |
| 34 | `data-sensitivity` | platform-governance | L2 (on-demand classify) |

### Priority 7 — Core compliance (mostly L0/L1)

| # | key | category | suggested level |
|---|-----|----------|-----------------|
| 35 | `dashboard` | core-compliance | L1 (live KPI counts) |
| 36 | `reports` | core-compliance | L1 (live report list) |
| 37 | `consumer-duty` | core-compliance | L0 (reference) |

## How to backfill a route (checklist)

For each plugin above, when its turn comes:

1. **Decide the dynamism level.** Use the "suggested level" column as a starting
   point; the team should confirm based on the actual data source.
2. **Create `src/app/api/<key>/route.ts`** with at minimum a `GET` handler.
   For L2/L3 plugins, also add `POST`/`PATCH` as appropriate.
3. **Update the manifest** (`plugins/manifest.json`):
   - Set `implementation.apiRoute` to `src/app/api/<key>`
   - Set `dynamism.level` to the chosen level
   - Set `dynamism.refreshStrategy` and `dynamism.fallback` appropriately
4. **Migrate dynamic fields out of static JSON** (or leave them as nullable
   fallback). For L1/L2, the static JSON should keep the most recent snapshot
   plus `null` slots for fields that only the API can compute.
5. **Run both audits** — they should still pass:
   ```bash
   bun scripts/audit-plugins.ts        # static drift check
   bun scripts/audit-plugins-live.ts   # live browser check
   ```
6. **Manually verify** the page in the browser. The `usePluginData` hook will
   now fetch from `/api/<key>`; if it fails, it falls back to static JSON
   (this is intentional — graceful degradation).

## Verification

To regenerate this list at any time:

```bash
bun -e '
  const m = await Bun.file("plugins/manifest.json").json();
  const missing = m.plugins.filter(p => !p.implementation?.apiRoute);
  console.log(`Missing apiRoute: ${missing.length} / ${m.plugins.length}`);
  missing.forEach(p => console.log(`  ${p.key.padEnd(28)} [${p.dynamism?.level ?? "—"}] ${p.category}`));
'
```

The static audit (`scripts/audit-plugins.ts`) currently does NOT fail on a
missing apiRoute for L0/L1 plugins — only L3 plugins are required to have
one (because L3 claims full dynamism; a missing route there is a lie). As
we backfill routes and promote plugins to higher levels, the audit will
catch any regressions automatically.
