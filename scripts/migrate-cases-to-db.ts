/**
 * Task 13 — Case DB Migration
 *
 * Migrates cases from public/data/cases.json into the ComplianceCase
 * table. Preserves the original case IDs (e.g. "case_1fda995f1fe348acad3617")
 * so existing URLs continue to work.
 *
 * For each case, runs retrieve() once and persists the top-K results as
 * CaseCitation rows. This replaces the live-retrieval path that the
 * /api/cases/[id]/citations route used to do on every request — the API
 * now reads from CaseCitation instead.
 *
 * Idempotent: re-running this script overwrites existing CaseCitation
 * rows for each case (deletes then re-inserts). Safe to re-run after
 * adding new plugins or refreshing case data.
 *
 * Usage:  bun run scripts/migrate-cases-to-db.ts
 */
import { promises as fs } from 'fs'
import path from 'path'
import { db } from '../src/lib/db'
import { retrieve } from '../src/lib/ai/vector-store'
import type { Citation, RagFilter } from '../src/components/shared/CitationList'

// Regulator -> jurisdiction + categories mapping.
// Mirrors the table in src/app/api/cases/[id]/citations/route.ts so the
// migration produces the same retrieval scope the live API used.
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

type CaseJson = {
  id: string
  caseType: string
  title: string
  regulator: string | null
  priority: string
  status: string
  assignee: string
  dueDate: string
  description: string
  createdAt: string
  evidenceCount: number
  slaStatus: string
  aiRecommendation?: {
    action: string
    confidence: number
    reasoning: string
    reviewerAction: string
  }
  citations?: Citation[]
  ragFilter?: RagFilter
}

const TOP_K = 8

async function main() {
  console.log('Task 13 — Case DB Migration')
  console.log('============================\n')

  // 1. Read cases.json
  const filePath = path.join(process.cwd(), 'public', 'data', 'cases.json')
  const raw = await fs.readFile(filePath, 'utf8')
  const parsed = JSON.parse(raw) as { cases: CaseJson[]; total: number }
  console.log('1. Loaded ' + parsed.cases.length + ' cases from cases.json\n')

  // 2. Upsert each case into ComplianceCase + populate CaseCitation
  console.log('2. Migrating cases:')
  for (const c of parsed.cases) {
    // Upsert case row (preserve original ID)
    const caseRow = await db.complianceCase.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        caseType: c.caseType,
        title: c.title,
        regulator: c.regulator,
        priority: c.priority,
        status: c.status,
        assignee: c.assignee,
        dueDate: new Date(c.dueDate),
        description: c.description,
        createdAt: new Date(c.createdAt),
        evidenceCount: c.evidenceCount ?? 0,
        slaStatus: c.slaStatus ?? 'on_track',
        aiRecommendationJson: c.aiRecommendation ? JSON.stringify(c.aiRecommendation) : null,
      },
      update: {
        caseType: c.caseType,
        title: c.title,
        regulator: c.regulator,
        priority: c.priority,
        status: c.status,
        assignee: c.assignee,
        dueDate: new Date(c.dueDate),
        description: c.description,
        createdAt: new Date(c.createdAt),
        evidenceCount: c.evidenceCount ?? 0,
        slaStatus: c.slaStatus ?? 'on_track',
        aiRecommendationJson: c.aiRecommendation ? JSON.stringify(c.aiRecommendation) : null,
      },
    })

    // Build retrieval query (same as the API route)
    const query = [c.title, c.description, c.regulator].filter(Boolean).join(' — ')

    // Build RAG filter (same as the API route)
    const scope = c.regulator ? REGULATOR_SCOPE[c.regulator] : null
    const jurisdictions = scope?.jurisdictions ?? []
    const categories = scope?.categories ?? CASE_TYPE_CATEGORIES[c.caseType] ?? []
    const sourceTypes = ['plugin', 'regulation', 'policy', 'risk', 'document', 'guidance', 'external']

    let scored = await retrieve(query, TOP_K, {
      sourceTypes,
      jurisdictions: jurisdictions.length > 0 ? jurisdictions : undefined,
      categories: categories.length > 0 ? categories : undefined,
    })

    // Broadening fallback (mirrors the API route)
    let broadened = false
    if (scored.length < 3 && jurisdictions.length > 0) {
      const broader = await retrieve(query, TOP_K, {
        sourceTypes,
        categories: categories.length > 0 ? categories : undefined,
      })
      if (broader.length > scored.length) {
        scored = broader
        broadened = true
      }
    }

    // Delete existing CaseCitation rows for this case (idempotent re-runs)
    await db.caseCitation.deleteMany({ where: { caseId: caseRow.id } })

    // Insert new CaseCitation rows (with denormalised chunk snapshots)
    let inserted = 0
    for (let i = 0; i < scored.length; i++) {
      const chunk = scored[i]
      const meta = chunk.metadata as Record<string, unknown> | null
      const isPlugin = chunk.sourceType === 'plugin'
      const pluginSlug = isPlugin
        ? (meta?.pluginSlug as string | undefined) ?? chunk.sourceId
        : null
      const snippet =
        chunk.content.length > 200
          ? chunk.content.slice(0, 200) + '…'
          : chunk.content

      await db.caseCitation.create({
        data: {
          caseId: caseRow.id,
          chunkId: chunk.id,
          relevanceScore: Math.max(0, Math.min(1, chunk.score)),
          rank: i,
          chunkTitle: chunk.title,
          chunkSnippet: snippet,
          chunkSourceType: chunk.sourceType,
          chunkJurisdiction: chunk.jurisdiction,
          chunkCategory: chunk.category,
          chunkPluginSlug: pluginSlug,
        },
      })
      inserted++
    }

    const slugSummary = scored.length > 0
      ? Array.from(new Set(scored.map((s) => s.sourceType === 'plugin' ? s.sourceId : s.sourceType))).join(', ')
      : '(none)'
    console.log('   ' + c.id + ' | ' + (c.regulator ?? 'NONE').padEnd(7) + ' | ' + c.caseType.padEnd(18) + ' | citations=' + inserted + (broadened ? ' (broadened)' : '') + ' | sources: ' + slugSummary)
  }

  // 3. Verify
  console.log('\n3. Verification:')
  const dbCases = await db.complianceCase.count()
  const dbCitations = await db.caseCitation.count()
  console.log('   ComplianceCase rows: ' + dbCases)
  console.log('   CaseCitation rows:   ' + dbCitations)

  // Show one example case with its citations
  const sample = await db.complianceCase.findFirst({
    where: { regulator: 'EBA' },
    include: { citations: { orderBy: { rank: 'asc' } } },
  })
  if (sample) {
    console.log('\n   Sample EBA case citations:')
    console.log('   Case: ' + sample.title)
    for (const cit of sample.citations) {
      console.log('     #' + cit.rank + ' [score=' + cit.relevanceScore.toFixed(3) + '] ' + (cit.chunkPluginSlug ?? cit.chunkSourceType).padEnd(28) + ' | ' + cit.chunkTitle.slice(0, 60))
    }
  }

  console.log('\nDone.')
  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
