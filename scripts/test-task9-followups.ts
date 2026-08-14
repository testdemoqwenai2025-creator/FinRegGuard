/**
 * Smoke test for Task 9 follow-ups:
 *   (a) PluginCard per-plugin drift indicator + last-refreshed timestamp
 *   (b) "Drifted only" filter tab in Plugin Manager
 *   (c) CitationList wired into CaseManagementView
 *   (d) POST /api/plugins/drift/events/ack endpoint + bell dismiss UI
 *
 * Run with: bun run scripts/test-task9-followups.ts
 */
import { db } from '../src/lib/db'

const BASE = 'http://localhost:3000'
const ok = (cond: boolean, msg: string) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`)
  if (!cond) process.exitCode = 1
}

async function main() {
  // ────────────────────────────────────────────────────────────
  // Step 1 — GET /api/plugins/drift/events excludes acknowledged by default
  // ────────────────────────────────────────────────────────────
  console.log('\n── Step 1: GET /api/plugins/drift/events default excludes acked ──')
  const r1 = await fetch(`${BASE}/api/plugins/drift/events?limit=200`)
  ok(r1.status === 200, 'GET returns 200')
  const d1 = await r1.json() as any
  ok(Array.isArray(d1.events), 'events is array')
  ok(typeof d1.summary.total === 'number', 'summary.total is number')
  ok(d1.summary.total === d1.events.length, 'summary.total matches events.length')
  ok(
    d1.events.every((e: any) => e.acknowledgedAt === null),
    'every event has acknowledgedAt=null by default',
  )
  ok(
    d1.events.every((e: any) => 'acknowledgedBy' in e),
    'every event has acknowledgedBy field',
  )
  console.log(`   ${d1.events.length} un-acked events, summary:`, d1.summary)

  // ────────────────────────────────────────────────────────────
  // Step 2 — GET with includeAcknowledged=true shows all events
  // ────────────────────────────────────────────────────────────
  console.log('\n── Step 2: includeAcknowledged=true returns ALL events ──')
  const r2 = await fetch(`${BASE}/api/plugins/drift/events?limit=200&includeAcknowledged=true`)
  const d2 = await r2.json() as any
  ok(r2.status === 200, 'GET returns 200')
  ok(d2.events.length >= d1.events.length, 'includeAcknowledged returns >= default count')

  // Count un-acked vs acked in the unfiltered set
  const ackedCount = d2.events.filter((e: any) => e.acknowledgedAt !== null).length
  console.log(`   total events (incl acked): ${d2.events.length}, acked: ${ackedCount}`)

  // ────────────────────────────────────────────────────────────
  // Step 3 — POST /api/plugins/drift/events/ack with specific IDs
  // ────────────────────────────────────────────────────────────
  console.log('\n── Step 3: POST ack specific event IDs ──')
  // Pick 1 un-acked event to dismiss
  const target = d1.events[0]
  if (!target) {
    console.log('   (skipped — no un-acked events to dismiss)')
  } else {
    const r3 = await fetch(`${BASE}/api/plugins/drift/events/ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventIds: [target.id], actor: 'smoke-test' }),
    })
    ok(r3.status === 200, 'POST returns 200')
    const d3 = await r3.json() as any
    ok(d3.acknowledged === 1, `acknowledged count is 1 (got ${d3.acknowledged})`)
    ok(d3.ids.includes(target.id), 'response ids includes the target')
    ok(typeof d3.at === 'string', 'at is ISO string')
    console.log(`   acked ${d3.acknowledged} event: ${target.id}`)

    // Verify in DB
    const dbRow = await db.pluginToggleHistory.findUnique({ where: { id: target.id } })
    ok(dbRow?.acknowledgedAt !== null, 'DB row has acknowledgedAt set')
    ok(dbRow?.acknowledgedBy === 'smoke-test', 'DB row has acknowledgedBy=smoke-test')

    // Re-fetch — event should be hidden from default response
    const r3b = await fetch(`${BASE}/api/plugins/drift/events?limit=200`)
    const d3b = await r3b.json() as any
    ok(!d3b.events.some((e: any) => e.id === target.id), 'acked event is hidden from default GET')
  }

  // ────────────────────────────────────────────────────────────
  // Step 4 — POST ack with ["*"] dismisses ALL remaining un-acked
  // ────────────────────────────────────────────────────────────
  console.log('\n── Step 4: POST ack ["*"] dismisses all un-acked ──')
  const r4 = await fetch(`${BASE}/api/plugins/drift/events/ack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventIds: ['*'], actor: 'smoke-test' }),
  })
  ok(r4.status === 200, 'POST returns 200')
  const d4 = await r4.json() as any
  ok(d4.acknowledged >= 0, `acknowledged count is non-negative (got ${d4.acknowledged})`)
  ok(d4.ids.includes('*'), 'response ids includes "*"')
  console.log(`   bulk-acked ${d4.acknowledged} events`)

  // Verify GET now returns empty
  const r4b = await fetch(`${BASE}/api/plugins/drift/events?limit=200`)
  const d4b = await r4b.json() as any
  ok(d4b.events.length === 0, `default GET returns 0 events after dismiss-all (got ${d4b.events.length})`)
  ok(d4b.summary.total === 0, 'summary.total is 0')

  // ────────────────────────────────────────────────────────────
  // Step 5 — POST ack with empty eventIds is rejected
  // ────────────────────────────────────────────────────────────
  console.log('\n── Step 5: POST ack with empty eventIds returns 400 ──')
  const r5 = await fetch(`${BASE}/api/plugins/drift/events/ack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventIds: [], actor: 'smoke-test' }),
  })
  ok(r5.status === 400, `empty eventIds rejected with 400 (got ${r5.status})`)

  // ────────────────────────────────────────────────────────────
  // Step 6 — Reset: clear acknowledgedAt on all rows so the bell
  // has fresh events to display after the smoke test runs.
  // ────────────────────────────────────────────────────────────
  console.log('\n── Step 6: Reset — clear acknowledgedAt on all rows ──')
  const reset = await db.pluginToggleHistory.updateMany({
    where: { acknowledgedAt: { not: null } },
    data: { acknowledgedAt: null, acknowledgedBy: null },
  })
  console.log(`   reset ${reset.count} rows back to un-acked`)

  // ────────────────────────────────────────────────────────────
  // Step 7 — PluginManagerView (a+b): verify the plugin list endpoint
  // is unaffected by the ack changes, and the drift lookup map can be
  // built from the events response.
  // ────────────────────────────────────────────────────────────
  console.log('\n── Step 7: PluginCard drift lookup derivation ──')
  const r7 = await fetch(`${BASE}/api/plugins/drift/events?limit=200`)
  const d7 = await r7.json() as any
  const driftByPlugin = new Map<string, { latestAction: string; latestAt: string }>()
  for (const e of d7.events) {
    if (!e.plugin) continue
    if (!driftByPlugin.has(e.plugin.id)) {
      driftByPlugin.set(e.plugin.id, { latestAction: e.action, latestAt: e.createdAt })
    }
  }
  ok(driftByPlugin.size > 0, `drift map has entries (${driftByPlugin.size} plugins)`)
  console.log(`   built drift lookup for ${driftByPlugin.size} plugins`)

  // ────────────────────────────────────────────────────────────
  // Step 8 — CaseManagementView (c): verify cases.json has citations
  // ────────────────────────────────────────────────────────────
  console.log('\n── Step 8: cases.json has citations + ragFilter per case ──')
  const fs = await import('fs')
  const path = '/home/z/my-project/public/data/cases.json'
  const casesData = JSON.parse(fs.readFileSync(path, 'utf-8')) as { cases: any[] }
  ok(casesData.cases.length > 0, `cases.json has ${casesData.cases.length} cases`)
  let allHaveCitations = true
  let anyPluginSources = false
  for (const c of casesData.cases) {
    if (!Array.isArray(c.citations) || c.citations.length === 0) {
      allHaveCitations = false
      console.log(`   ✗ case ${c.id} missing citations`)
      continue
    }
    if (c.citations.some((x: any) => x.isPlugin === true)) {
      anyPluginSources = true
    }
    // Verify citation shape
    for (const cit of c.citations) {
      ok(typeof cit.id === 'string', 'citation.id is string')
      ok(typeof cit.title === 'string', 'citation.title is string')
      ok(typeof cit.score === 'number' && cit.score >= 0 && cit.score <= 1, 'citation.score is 0..1')
      ok(typeof cit.snippet === 'string', 'citation.snippet is string')
    }
  }
  ok(allHaveCitations, 'every case has at least one citation')
  ok(anyPluginSources, 'at least one case has plugin-sourced citations')
  ok(
    casesData.cases.every((c: any) => c.ragFilter && Array.isArray(c.ragFilter.sourceTypes)),
    'every case has ragFilter.sourceTypes',
  )

  // ────────────────────────────────────────────────────────────
  // Step 9 — CitationList component imports cleanly
  // ────────────────────────────────────────────────────────────
  console.log('\n── Step 9: CitationList component export check ──')
  const citationListPath = '/home/z/my-project/src/components/shared/CitationList.tsx'
  ok(fs.existsSync(citationListPath), 'CitationList.tsx exists')
  const src = fs.readFileSync(citationListPath, 'utf-8')
  ok(src.includes('export function CitationList'), 'CitationList is exported')
  ok(src.includes('export function RetrievalScopeBar'), 'RetrievalScopeBar is exported')
  ok(src.includes('export function CitationCard'), 'CitationCard is exported')
  ok(src.includes('export function prettyPluginName'), 'prettyPluginName is exported')

  // ────────────────────────────────────────────────────────────
  // Step 10 — DriftBell UI wiring (d)
  // ────────────────────────────────────────────────────────────
  console.log('\n── Step 10: DriftBell dismiss UI wiring ──')
  const bellPath = '/home/z/my-project/src/components/platform/DriftBell.tsx'
  const bellSrc = fs.readFileSync(bellPath, 'utf-8')
  ok(bellSrc.includes("fetch('/api/plugins/drift/events/ack'"), 'DriftBell calls ack endpoint')
  ok(bellSrc.includes('handleAck'), 'DriftBell has handleAck function')
  ok(bellSrc.includes('handleAckAll'), 'DriftBell has handleAckAll function')
  ok(bellSrc.includes('Dismiss all'), 'DriftBell has Dismiss all button')
  ok(bellSrc.includes("eventIds: ['*']"), 'Dismiss-all uses ["*"] payload')
  ok(bellSrc.includes('acknowledgedAt'), 'DriftEvent type has acknowledgedAt')

  // ────────────────────────────────────────────────────────────
  // Step 11 — PluginManagerView (a+b) wiring
  // ────────────────────────────────────────────────────────────
  console.log('\n── Step 11: PluginManagerView drift-tab + card wiring ──')
  const pmvPath = '/home/z/my-project/src/components/platform/PluginManagerView.tsx'
  const pmvSrc = fs.readFileSync(pmvPath, 'utf-8')
  ok(pmvSrc.includes("'drifted'"), 'category state accepts "drifted"')
  ok(pmvSrc.includes('Drifted ('), 'Drifted tab is rendered')
  ok(pmvSrc.includes('driftStatus={driftByPlugin.get'), 'driftStatus passed to PluginCard')
  ok(pmvSrc.includes('driftStatus?: DriftStatus'), 'PluginCard accepts driftStatus prop')
  ok(pmvSrc.includes('DRIFT_DOT_META'), 'DRIFT_DOT_META color map defined')
  ok(pmvSrc.includes('relativeTime('), 'relativeTime helper used')
  ok(pmvSrc.includes('loadDrift'), 'loadDrift fetch function defined')
  ok(pmvSrc.includes('driftedPluginCount'), 'driftedPluginCount drives tab badge')

  // ────────────────────────────────────────────────────────────
  // Step 12 — CaseManagementView (c) wiring
  // ────────────────────────────────────────────────────────────
  console.log('\n── Step 12: CaseManagementView CitationList wiring ──')
  const cmvPath = '/home/z/my-project/src/components/collaboration/CaseManagementView.tsx'
  const cmvSrc = fs.readFileSync(cmvPath, 'utf-8')
  ok(cmvSrc.includes("from '@/components/shared/CitationList'"), 'imports CitationList')
  ok(cmvSrc.includes('selected.citations'), 'reads selected.citations')
  ok(cmvSrc.includes('selected.ragFilter'), 'reads selected.ragFilter')
  ok(cmvSrc.includes('RAG Sources'), 'renders "RAG Sources" card title')

  console.log('\n────────────────────────────────────────────')
  console.log(`Smoke test complete. Exit code: ${process.exitCode ?? 0}`)
}

main()
  .catch((err) => {
    console.error('Smoke test crashed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
