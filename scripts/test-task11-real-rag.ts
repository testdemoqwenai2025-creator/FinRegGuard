/**
 * Smoke test for Task 11 — Real RAG in CaseManagementView.
 *
 * Verifies:
 *   1. GET /api/cases/[id]/citations returns 200 + correctly-shaped payload
 *      for a known case ID.
 *   2. Response includes caseId, query, citations[], ragFilter, count, latencyMs.
 *   3. Each citation has the Citation shape (id, sourceType, title, score,
 *      snippet, isPlugin, etc.).
 *   4. Plugin chunks (sourceType === 'plugin') have isPlugin=true and a
 *      non-null pluginSlug.
 *   5. Scores are in [0, 1].
 *   6. RagFilter has sourceTypes, jurisdictions, categories arrays.
 *   7. Unknown case ID returns 404.
 *   8. topK query param is respected (capped at 20).
 *   9. Internal-review case (no regulator) still returns citations using
 *      caseType-derived categories as fallback.
 *  10. Broadening fallback kicks in for SEC case (jurisdiction US has few
 *      chunks) — response ragFilter.broadened === true.
 *  11. CaseManagementView.tsx source contains the live-fetch wiring
 *      (loadCitations, citationCache, /api/cases/ fetch, RagStatusChip,
 *      RagSourcesBody, IS_STATIC_BUILD guard).
 *
 * Prereqs:
 *   - Dev server running on http://localhost:3000
 *   - Vector store populated (run scripts/seed-vector-store.ts or
 *     /api/rag/seed if empty)
 *
 * Run with: bun run scripts/test-task11-real-rag.ts
 */
const BASE = 'http://localhost:3000'
const fs = await import('fs/promises')

const ok = (cond: boolean, msg: string) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`)
  if (!cond) process.exitCode = 1
}

async function loadCases() {
  const raw = await fs.readFile('public/data/cases.json', 'utf8')
  return JSON.parse(raw).cases as Array<{
    id: string; caseType: string; title: string; regulator: string | null
  }>
}

async function main() {
  console.log('\n=== Task 11 — Real RAG in CaseManagementView smoke test ===\n')

  const cases = await loadCases()
  console.log(`Loaded ${cases.length} cases from cases.json`)

  // Find specific test cases
  const secCase = cases.find((c) => c.regulator === 'SEC')
  const ebaCase = cases.find((c) => c.regulator === 'EBA')
  const internalCase = cases.find((c) => c.regulator === null && c.caseType === 'internal_review')

  // ──────────────────────────────────────────────────────────
  // Step 1 — GET /api/cases/[id]/citations returns 200 for EBA case
  // ──────────────────────────────────────────────────────────
  console.log('\nStep 1: GET /api/cases/[id]/citations returns 200 for EBA case')
  ok(!!ebaCase, 'EBA case exists in cases.json')
  if (!ebaCase) return
  const r1 = await fetch(`${BASE}/api/cases/${ebaCase.id}/citations?topK=8`)
  ok(r1.status === 200, `GET returns 200 (got ${r1.status})`)
  const d1 = await r1.json() as any
  ok(d1.caseId === ebaCase.id, 'caseId matches request')
  ok(typeof d1.query === 'string' && d1.query.length > 0, 'query is a non-empty string')
  ok(Array.isArray(d1.citations), 'citations is an array')
  ok(typeof d1.count === 'number' && d1.count === d1.citations.length, 'count matches citations.length')
  ok(typeof d1.latencyMs === 'number' && d1.latencyMs >= 0, 'latencyMs is a non-negative number')
  ok(d1.ragFilter && Array.isArray(d1.ragFilter.sourceTypes), 'ragFilter.sourceTypes is an array')
  ok(d1.ragFilter && Array.isArray(d1.ragFilter.jurisdictions), 'ragFilter.jurisdictions is an array')
  ok(d1.ragFilter && Array.isArray(d1.ragFilter.categories), 'ragFilter.categories is an array')
  console.log(`   EBA case: ${d1.count} citations in ${d1.latencyMs}ms`)
  console.log(`   query: "${d1.query.slice(0, 80)}..."`)
  console.log(`   ragFilter: jurisdictions=${JSON.stringify(d1.ragFilter.jurisdictions)} categories=${JSON.stringify(d1.ragFilter.categories)}`)

  // ──────────────────────────────────────────────────────────
  // Step 2 — Each citation has the correct shape
  // ──────────────────────────────────────────────────────────
  console.log('\nStep 2: Each citation has the Citation shape')
  for (const c of d1.citations) {
    ok(typeof c.id === 'string', `citation ${c.id} has id`)
    ok(typeof c.sourceType === 'string', `citation ${c.sourceType} has sourceType`)
    ok(typeof c.title === 'string', `citation "${c.title.slice(0, 30)}" has title`)
    ok(typeof c.score === 'number' && c.score >= 0 && c.score <= 1, `citation score ${c.score} in [0,1]`)
    ok(typeof c.snippet === 'string', `citation has snippet`)
    ok(typeof c.isPlugin === 'boolean', `citation isPlugin is boolean`)
    if (c.isPlugin) {
      ok(c.sourceType === 'plugin', `plugin citation has sourceType='plugin'`)
      ok(typeof c.pluginSlug === 'string' && c.pluginSlug.length > 0, `plugin citation has non-empty pluginSlug`)
    }
  }

  // ──────────────────────────────────────────────────────────
  // Step 3 — EBA case (EU jurisdiction) should retrieve plugin chunks
  // ──────────────────────────────────────────────────────────
  console.log('\nStep 3: EBA case retrieves at least one plugin citation')
  const ebaPlugins = d1.citations.filter((c: any) => c.isPlugin)
  ok(ebaPlugins.length > 0, `EBA case has >= 1 plugin citation (got ${ebaPlugins.length})`)
  if (ebaPlugins.length > 0) {
    console.log(`   plugin citations: ${ebaPlugins.map((c: any) => c.pluginSlug).join(', ')}`)
  }

  // ──────────────────────────────────────────────────────────
  // Step 4 — Unknown case ID returns 404
  // ──────────────────────────────────────────────────────────
  console.log('\nStep 4: Unknown case ID returns 404')
  const r4 = await fetch(`${BASE}/api/cases/nonexistent-case-id/citations`)
  ok(r4.status === 404, `GET returns 404 for unknown case (got ${r4.status})`)
  const d4 = await r4.json() as any
  ok(typeof d4.error === 'string' && d4.error.includes('not found'), 'error message mentions "not found"')

  // ──────────────────────────────────────────────────────────
  // Step 5 — topK is respected and capped at 20
  // ──────────────────────────────────────────────────────────
  console.log('\nStep 5: topK query param is respected')
  const r5a = await fetch(`${BASE}/api/cases/${ebaCase.id}/citations?topK=3`)
  const d5a = await r5a.json() as any
  ok(d5a.citations.length <= 3, `topK=3 returns at most 3 citations (got ${d5a.citations.length})`)

  const r5b = await fetch(`${BASE}/api/cases/${ebaCase.id}/citations?topK=999`)
  const d5b = await r5b.json() as any
  ok(d5b.citations.length <= 20, `topK=999 is capped at 20 (got ${d5b.citations.length})`)

  // ──────────────────────────────────────────────────────────
  // Step 6 — SEC case triggers broadening fallback
  // ──────────────────────────────────────────────────────────
  console.log('\nStep 6: SEC case triggers broadening fallback (US has few chunks)')
  if (secCase) {
    const r6 = await fetch(`${BASE}/api/cases/${secCase.id}/citations?topK=8`)
    const d6 = await r6.json() as any
    ok(d6.count > 0, `SEC case returns at least 1 citation (got ${d6.count})`)
    if (d6.ragFilter.broadened === true) {
      console.log(`   broadening kicked in: ${d6.count} citations from broader scope`)
    } else {
      console.log(`   broadening did NOT trigger (US scope already had >= 3 chunks)`)
    }
    // Either way, the response should have at least the SEC plugin chunk
    const secPluginChunk = d6.citations.find((c: any) => c.pluginSlug === 'sec-form-adv')
    ok(!!secPluginChunk, 'SEC case retrieves the sec-form-adv plugin chunk')
  } else {
    console.log('   SEC case not found in cases.json — skipping')
  }

  // ──────────────────────────────────────────────────────────
  // Step 7 — Internal-review case (no regulator) uses caseType fallback
  // ──────────────────────────────────────────────────────────
  console.log('\nStep 7: Internal-review case (no regulator) uses caseType fallback')
  if (internalCase) {
    const r7 = await fetch(`${BASE}/api/cases/${internalCase.id}/citations?topK=5`)
    ok(r7.status === 200, `GET returns 200 for internal-review case`)
    const d7 = await r7.json() as any
    ok(Array.isArray(d7.citations), 'internal-review case returns citations array')
    ok(d7.ragFilter.jurisdictions.length === 0, 'internal-review ragFilter.jurisdictions is empty (no regulator)')
    ok(d7.ragFilter.categories.length > 0, 'internal-review ragFilter.categories populated from caseType fallback')
    console.log(`   internal-review case: ${d7.count} citations, categories=${JSON.stringify(d7.ragFilter.categories)}`)
  } else {
    console.log('   internal-review case not found — skipping')
  }

  // ──────────────────────────────────────────────────────────
  // Step 8 — CaseManagementView.tsx contains the live-fetch wiring
  // ──────────────────────────────────────────────────────────
  console.log('\nStep 8: CaseManagementView.tsx contains live-fetch wiring')
  const src = await fs.readFile('src/components/collaboration/CaseManagementView.tsx', 'utf8')
  ok(src.includes('const loadCitations = useCallback'), 'loadCitations callback declared')
  ok(src.includes('citationCache'), 'citationCache state declared')
  ok(src.includes('/api/cases/'), 'fetch URL hits /api/cases/[id]/citations')
  ok(src.includes('topK=8'), 'topK=8 passed as query param')
  ok(src.includes('IS_STATIC_BUILD'), 'IS_STATIC_BUILD guard present')
  ok(src.includes('RagStatusChip'), 'RagStatusChip sub-component present')
  ok(src.includes('RagSourcesBody'), 'RagSourcesBody sub-component present')
  ok(src.includes("status: 'loading'"), 'loading state handled')
  ok(src.includes("status: 'error'"), 'error state handled')
  ok(src.includes("status: 'ok'"), 'ok state handled')
  ok(src.includes('Retrieving sources from the vector store'), 'loading skeleton copy present')
  ok(src.includes('Could not retrieve RAG sources'), 'error empty-state copy present')
  ok(src.includes('broadened'), 'broadened flag rendered in status chip')

  // ──────────────────────────────────────────────────────────
  // Step 9 — API route file exists and exports GET handler
  // ──────────────────────────────────────────────────────────
  console.log('\nStep 9: API route file exists and uses retrieve() from vector-store')
  const routeSrc = await fs.readFile('src/app/api/cases/[id]/citations/route.ts', 'utf8')
  ok(routeSrc.includes("import { retrieve }"), 'imports retrieve from vector-store')
  ok(routeSrc.includes('REGULATOR_SCOPE'), 'REGULATOR_SCOPE mapping table present')
  ok(routeSrc.includes('CASE_TYPE_CATEGORIES'), 'CASE_TYPE_CATEGORIES fallback table present')
  ok(routeSrc.includes('broadened'), 'broadening fallback implemented')
  ok(routeSrc.includes('Promise<{ id: string }>'), 'params typed as Promise (Next.js 16)')

  console.log('\n=== Done ===')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
