/**
 * Smoke test for Task 10 — Acknowledged view in DriftBell.
 *
 * Verifies that:
 *   1. The default GET still excludes acknowledged events.
 *   2. GET with ?includeAcknowledged=true returns all events and the
 *      summary counts are still based on the un-acked subset.
 *   3. POST /api/plugins/drift/events/ack marks an event as acknowledged
 *      (sets acknowledgedAt + acknowledgedBy).
 *   4. After ack, the event disappears from the default GET but appears
 *      in the includeAcknowledged=true response with acknowledgedAt set.
 *   5. The DriftBell component file contains the new "Active" / "Acknowledged"
 *      tab toggle and the loadAcked lazy loader.
 *
 * Prereqs:
 *   - Dev server running on http://localhost:3000
 *   - SQLite DB with at least one drift event (run scripts/seed-plugin-drift.ts
 *     if empty)
 *
 * Run with: bun run scripts/test-task10-acked-view.ts
 */
const BASE = 'http://localhost:3000'

const ok = (cond: boolean, msg: string) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`)
  if (!cond) process.exitCode = 1
}

async function main() {
  console.log('\n=== Task 10 — Acknowledged view smoke test ===\n')

  // ──────────────────────────────────────────────────────────
  // Step 1 — Default GET excludes acknowledged events
  // ──────────────────────────────────────────────────────────
  console.log('Step 1: Default GET excludes acknowledged events')
  const r1 = await fetch(`${BASE}/api/plugins/drift/events?limit=200`)
  ok(r1.status === 200, 'GET returns 200')
  const d1 = await r1.json() as any
  ok(
    Array.isArray(d1.events) && d1.events.every((e: any) => e.acknowledgedAt === null),
    'every event has acknowledgedAt=null by default',
  )
  ok(
    d1.summary.total === d1.events.length,
    'summary.total equals events array length',
  )
  console.log(`   un-acked events: ${d1.events.length}`)

  if (d1.events.length === 0) {
    console.log('\n   No un-acked events to test with. Aborting rest of test.')
    console.log('   Run scripts/seed-plugin-drift.ts to add test data.')
    return
  }

  // Pick the most recent un-acked event to ack (then re-un-ack at the end)
  const target = d1.events[0]
  console.log(`   will ack event ${target.id} (${target.action} on ${target.plugin?.slug ?? 'unknown'})`)

  // ──────────────────────────────────────────────────────────
  // Step 2 — includeAcknowledged=true returns >= default count
  // ──────────────────────────────────────────────────────────
  console.log('\nStep 2: includeAcknowledged=true returns all events')
  const r2 = await fetch(`${BASE}/api/plugins/drift/events?limit=200&includeAcknowledged=true`)
  ok(r2.status === 200, 'GET returns 200')
  const d2 = await r2.json() as any
  ok(d2.events.length >= d1.events.length, 'response has >= events vs default')
  const ackedBefore = d2.events.filter((e: any) => e.acknowledgedAt !== null).length
  console.log(`   total: ${d2.events.length}, already-acked: ${ackedBefore}`)

  // ──────────────────────────────────────────────────────────
  // Step 3 — POST ack marks the target event
  // ──────────────────────────────────────────────────────────
  console.log('\nStep 3: POST ack marks event as acknowledged')
  const r3 = await fetch(`${BASE}/api/plugins/drift/events/ack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventIds: [target.id], actor: 'smoke-test' }),
  })
  ok(r3.status === 200, 'POST ack returns 200')
  const d3 = await r3.json() as any
  ok(d3.acknowledged === 1, `acknowledged count is 1 (got ${d3.acknowledged})`)
  ok(d3.ids.includes(target.id), 'returned ids include the target')
  ok(typeof d3.at === 'string', 'response includes ack timestamp')

  // ──────────────────────────────────────────────────────────
  // Step 4 — Default GET no longer includes the acked event
  // ──────────────────────────────────────────────────────────
  console.log('\nStep 4: Default GET excludes the newly-acked event')
  const r4 = await fetch(`${BASE}/api/plugins/drift/events?limit=200`)
  const d4 = await r4.json() as any
  ok(!d4.events.some((e: any) => e.id === target.id), 'acked event no longer in default response')
  ok(d4.summary.total === d1.summary.total - 1, 'summary.total decreased by 1')

  // ──────────────────────────────────────────────────────────
  // Step 5 — includeAcknowledged=true now shows the acked event with metadata
  // ──────────────────────────────────────────────────────────
  console.log('\nStep 5: includeAcknowledged=true shows acked event with metadata')
  const r5 = await fetch(`${BASE}/api/plugins/drift/events?limit=200&includeAcknowledged=true`)
  const d5 = await r5.json() as any
  const ackedEvt = d5.events.find((e: any) => e.id === target.id)
  ok(!!ackedEvt, 'acked event present in includeAcknowledged response')
  ok(!!ackedEvt?.acknowledgedAt, 'acknowledgedAt is set')
  ok(ackedEvt?.acknowledgedBy === 'smoke-test', `acknowledgedBy is "smoke-test" (got "${ackedEvt?.acknowledgedBy}")`)

  // ──────────────────────────────────────────────────────────
  // Step 6 — Component file contains the new view toggle + loadAcked
  // ──────────────────────────────────────────────────────────
  console.log('\nStep 6: DriftBell.tsx contains the new tab toggle + lazy loader')
  const fs = await import('fs/promises')
  const src = await fs.readFile('src/components/platform/DriftBell.tsx', 'utf8')
  ok(src.includes(`useState<'active' | 'acked'>`), 'view state declared with correct type')
  ok(src.includes('const loadAcked = useCallback'), 'loadAcked callback defined')
  ok(src.includes("includeAcknowledged=true"), 'loadAcked fetches with includeAcknowledged=true')
  ok(src.includes('Acknowledged'), 'Acknowledged tab label present in JSX')
  ok(src.includes('No dismissed events'), 'empty-state copy for acked view present')
  ok(src.includes('Dismissed '), 'acked event row shows "Dismissed" timestamp line')

  // ──────────────────────────────────────────────────────────
  // Cleanup — re-un-ack the event so we don't pollute the dataset.
  // We do this by directly setting acknowledgedAt=null via a raw SQL query
  // through a small Node script if prisma is available; otherwise skip.
  // ──────────────────────────────────────────────────────────
  console.log('\nCleanup: un-ack the test event (set acknowledgedAt back to NULL)')
  try {
    const { db } = await import('../src/lib/db')
    await db.pluginToggleHistory.update({
      where: { id: target.id },
      data: { acknowledgedAt: null, acknowledgedBy: null },
    })
    ok(true, `event ${target.id} un-acked for cleanup`)
    await db.$disconnect()
  } catch (err) {
    console.log(`   cleanup skipped: ${(err as Error).message}`)
  }

  console.log('\n=== Done ===')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
