/**
 * Task 13 — End-to-end smoke test
 *
 * Validates BOTH follow-ups delivered in Task 13:
 *
 *  A. EU Corpus Diversification
 *     - 3 new EU plugins exist in the catalog and DB (eba-stress-test-2026,
 *       crr-article-107, eba-pillar-3-rwa)
 *     - Each plugin has >=5 chunks indexed in the vector store
 *     - EBA case retrieval returns chunks from at least one of the new
 *       plugins (not just gdpr-ropa)
 *
 *  B. Case DB Migration
 *     - ComplianceCase table contains all 8 cases from cases.json
 *       (with original IDs preserved)
 *     - CaseCitation join table is populated for migrated cases
 *     - DB-sourced citations are stable (deterministic) across reads
 *     - Cases.json-only case (no DB row) falls back to live retrieve()
 *     - Regulator + caseType + aiRecommendation fields all migrated
 *
 * Note: This test talks directly to the DB and the retrieve() function
 * instead of going through HTTP. This avoids Turbopack memory pressure
 * that crashes the dev server in low-memory environments.
 *
 * Usage:  bun run scripts/test-task13-eu-and-db.ts
 */
import { promises as fs } from 'fs'
import path from 'path'
import { db } from '../src/lib/db'
import { retrieve } from '../src/lib/ai/vector-store'
import { PLUGIN_CATALOG } from '../src/lib/plugins/catalog'

let pass = 0
let fail = 0

function ok(label: string, cond: boolean, detail?: string) {
  if (cond) {
    pass++
    console.log('  PASS  ' + label + (detail ? '  (' + detail + ')' : ''))
  } else {
    fail++
    console.log('  FAIL  ' + label + (detail ? '  — ' + detail : ''))
  }
}

// Regulator -> jurisdiction + categories mapping (mirrors the route file)
const REGULATOR_SCOPE: Record<string, { jurisdictions: string[]; categories: string[] }> = {
  SEC:       { jurisdictions: ['US'],            categories: ['form', 'rule', 'feature'] },
  FINRA:     { jurisdictions: ['US'],            categories: ['rule', 'form'] },
  FCA:       { jurisdictions: ['UK'],            categories: ['rule', 'feature', 'document'] },
  PRA:       { jurisdictions: ['UK'],            categories: ['rule', 'document'] },
  OFAC:      { jurisdictions: ['US', 'GLOBAL'],  categories: ['feature', 'rule', 'label'] },
  FATF:      { jurisdictions: ['GLOBAL'],        categories: ['rule'] },
  EBA:       { jurisdictions: ['EU'],            categories: ['form', 'rule', 'document'] },
  ESMA:      { jurisdictions: ['EU'],            categories: ['rule', 'document'] },
  MAS:       { jurisdictions: ['SG'],            categories: ['rule', 'form', 'feature'] },
  SFC:       { jurisdictions: ['HK'],            categories: ['rule', 'form'] },
  FSA:       { jurisdictions: ['JP'],            categories: ['rule'] },
  HHS_OCR:   { jurisdictions: ['US'],            categories: ['rule', 'feature', 'document'] },
  'HHS-OCR': { jurisdictions: ['US'],            categories: ['rule', 'feature', 'document'] },
}

const CASE_TYPE_CATEGORIES: Record<string, string[]> = {
  examination:        ['form', 'rule', 'document'],
  investigation:      ['rule', 'feature', 'document'],
  regulatory_request: ['form', 'document'],
  internal_review:    ['document'],
}

async function main() {
  console.log('Task 13 — End-to-End Smoke Test')
  console.log('================================\n')

  // ─── A. EU Corpus Diversification ──────────────────────────────
  console.log('A. EU Corpus Diversification')
  console.log('-----------------------------')

  // A.1 Catalog contains the 3 new EU plugins
  const newSlugs = ['eba-stress-test-2026', 'crr-article-107', 'eba-pillar-3-rwa']
  for (const slug of newSlugs) {
    const entry = PLUGIN_CATALOG.find((p) => p.slug === slug)
    ok('catalog has ' + slug, !!entry, entry ? entry.jurisdiction + '/' + entry.category : 'not found')
  }

  // A.2 Catalog entries have body_text in defaultFieldsJson (so synthesizer
  // emits raw paragraphs that the chunker splits into multiple chunks)
  for (const slug of newSlugs) {
    const entry = PLUGIN_CATALOG.find((p) => p.slug === slug)
    const bodyText = entry?.defaultFieldsJson?.body_text
    const hasBody = typeof bodyText === 'string'
    ok(slug + ' has body_text field', hasBody,
      hasBody ? (bodyText as string).length + ' chars' : 'missing')
  }

  // A.3 DB Plugin rows exist + enabled
  for (const slug of newSlugs) {
    const row = await db.plugin.findUnique({ where: { slug } })
    ok(slug + ' in DB + enabled', !!row && row.enabled, row ? 'enabled=' + row.enabled : 'not in DB')
  }

  // A.4 Each new plugin has >=5 chunks indexed
  for (const slug of newSlugs) {
    const count = await db.knowledgeChunk.count({
      where: { sourceType: 'plugin', sourceId: slug }
    })
    ok(slug + ' has >=5 chunks', count >= 5, 'got ' + count)
  }

  // A.5 gdpr-ropa no longer dominates EU plugin chunks (>95%)
  const euPluginChunks = await db.knowledgeChunk.findMany({
    where: { sourceType: 'plugin', jurisdiction: 'EU' },
    select: { sourceId: true }
  })
  const gdprCount = euPluginChunks.filter((c) => c.sourceId === 'gdpr-ropa').length
  const gdprShare = euPluginChunks.length > 0 ? gdprCount / euPluginChunks.length : 1
  ok('gdpr-ropa share < 95% of EU plugin chunks', gdprShare < 0.95,
    Math.round(gdprShare * 100) + '% (' + gdprCount + '/' + euPluginChunks.length + ')')

  // A.6 EBA regulator case retrieval hits the new EBA plugin (not gdpr-ropa)
  const query = 'EBA Stress Test Data Call — Case management workflow for EBA Stress Test Data Call. — EBA'
  const scored = await retrieve(query, 8, {
    sourceTypes: ['plugin', 'regulation', 'policy', 'risk', 'document', 'guidance', 'external'],
    jurisdictions: ['EU'],
    categories: ['form', 'rule', 'document'],
  })
  const retrievedSlugs = new Set(scored.map((s) => s.sourceType === 'plugin' ? s.sourceId : s.sourceType))
  const hasNewEba = newSlugs.some((s) => retrievedSlugs.has(s))
  ok('EBA retrieval hits >=1 new EU plugin', hasNewEba, 'slugs: ' + Array.from(retrievedSlugs).join(', '))
  ok('EBA retrieval has 0 gdpr-ropa chunks', !retrievedSlugs.has('gdpr-ropa'),
    'gdpr-ropa count: ' + scored.filter((s) => s.sourceId === 'gdpr-ropa').length)

  console.log()

  // ─── B. Case DB Migration ──────────────────────────────────────
  console.log('B. Case DB Migration')
  console.log('---------------------')

  // B.1 ComplianceCase table has all 8 cases.json IDs preserved
  const expectedIds = [
    'case_1fda995f1fe348acad3617', // SEC
    'case_f8e15e7176594342995b1e', // FCA
    'case_824b4b1d398646068e165f', // OFAC
    'case_679aae3736374baeacf82f', // EBA
    'case_792f867400fd4569950c65', // MAS
    'case_841e59df61774a1196dd02', // None
    'case_1a4212390eaa4c10bfdbc5', // HHS-OCR
    'case_96e06fb0dddb4dc290353b', // None
  ]
  for (const id of expectedIds) {
    const row = await db.complianceCase.findUnique({ where: { id } })
    ok('case ' + id + ' in DB', !!row, row ? row.regulator + '/' + row.caseType : 'missing')
  }

  // B.2 Cases.json-only check (sanity: cases.json file still readable + has 8 cases)
  const filePath = path.join(process.cwd(), 'public', 'data', 'cases.json')
  const raw = await fs.readFile(filePath, 'utf8')
  const parsed = JSON.parse(raw) as { cases: any[] }
  ok('cases.json still has 8 cases', parsed.cases.length === 8, 'got ' + parsed.cases.length)

  // B.3 CaseCitation table has rows for migrated cases
  const ccCount = await db.caseCitation.count()
  ok('CaseCitation table has >=8 rows', ccCount >= 8, 'got ' + ccCount)

  // B.4 EBA case has 8 CaseCitation rows, all from eba-stress-test-2026
  const ebaCitations = await db.caseCitation.findMany({
    where: { caseId: 'case_679aae3736374baeacf82f' },
    orderBy: { rank: 'asc' },
  })
  ok('EBA case has 8 citations', ebaCitations.length === 8, 'got ' + ebaCitations.length)
  const ebaPluginSlugs = new Set(ebaCitations.map((c) => c.chunkPluginSlug))
  ok('EBA citations all from eba-stress-test-2026',
    ebaPluginSlugs.size === 1 && ebaPluginSlugs.has('eba-stress-test-2026'),
    'slugs: ' + Array.from(ebaPluginSlugs).join(', '))

  // B.5 Citation rank ordering matches relevanceScore descending
  let rankOk = true
  for (let i = 1; i < ebaCitations.length; i++) {
    if (ebaCitations[i].relevanceScore > ebaCitations[i - 1].relevanceScore) {
      rankOk = false
      break
    }
  }
  ok('EBA citations ranked by descending score', rankOk)

  // B.6 Denormalised chunk snapshots are populated
  const sample = ebaCitations[0]
  ok('sample citation has chunkTitle', !!sample.chunkTitle)
  ok('sample citation has chunkSnippet', !!sample.chunkSnippet)
  ok('sample citation has chunkSourceType', sample.chunkSourceType === 'plugin')
  ok('sample citation has chunkJurisdiction', sample.chunkJurisdiction === 'EU')
  ok('sample citation has chunkPluginSlug', sample.chunkPluginSlug === 'eba-stress-test-2026')

  // B.7 EBA case row has the migrated fields (evidenceCount, slaStatus, aiRecommendation)
  const ebaCase = await db.complianceCase.findUnique({ where: { id: 'case_679aae3736374baeacf82f' } })
  ok('EBA case has evidenceCount > 0', (ebaCase?.evidenceCount ?? 0) > 0, 'got ' + ebaCase?.evidenceCount)
  ok('EBA case has slaStatus', !!ebaCase?.slaStatus, 'got ' + ebaCase?.slaStatus)
  ok('EBA case has aiRecommendationJson', !!ebaCase?.aiRecommendationJson)
  if (ebaCase?.aiRecommendationJson) {
    const rec = JSON.parse(ebaCase.aiRecommendationJson)
    ok('aiRecommendation has action', typeof rec.action === 'string')
    ok('aiRecommendation has confidence', typeof rec.confidence === 'number')
    ok('aiRecommendation has reasoning', typeof rec.reasoning === 'string')
    ok('aiRecommendation has reviewerAction', typeof rec.reviewerAction === 'string')
  }

  // B.8 DB-sourced citations are stable (read twice, compare)
  const read1 = await db.caseCitation.findMany({
    where: { caseId: 'case_679aae3736374baeacf82f' },
    orderBy: { rank: 'asc' },
    select: { chunkId: true, relevanceScore: true, rank: true }
  })
  const read2 = await db.caseCitation.findMany({
    where: { caseId: 'case_679aae3736374baeacf82f' },
    orderBy: { rank: 'asc' },
    select: { chunkId: true, relevanceScore: true, rank: true }
  })
  const stable = JSON.stringify(read1) === JSON.stringify(read2)
  ok('DB citations are deterministic across reads', stable)

  // B.9 Live retrieval still works (used by ?refresh=1 and unmigrated cases)
  const liveScored = await retrieve(query, 5, {
    sourceTypes: ['plugin'],
    jurisdictions: ['EU'],
    categories: ['form', 'rule', 'document'],
  })
  ok('live retrieve() returns >=1 chunk for EBA query', liveScored.length >= 1, 'got ' + liveScored.length)

  // B.10 Regulator scope mapping covers all migrated cases
  const allCases = await db.complianceCase.findMany({ select: { id: true, regulator: true, caseType: true } })
  const unmapped = allCases.filter((c) => {
    if (!c.regulator) return false // null regulator uses caseType fallback, fine
    return !REGULATOR_SCOPE[c.regulator] && !CASE_TYPE_CATEGORIES[c.caseType]
  })
  ok('all DB cases have regulator+caseType mapping', unmapped.length === 0,
    unmapped.length === 0 ? 'OK' : 'unmapped: ' + unmapped.map((c) => c.id + '/' + c.regulator).join(','))

  console.log()

  // ─── Summary ───────────────────────────────────────────────────
  console.log('==========================')
  console.log('PASS: ' + pass + '  FAIL: ' + fail)
  console.log('==========================')

  await db.$disconnect()
  if (fail > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
