import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { retrieve } from '@/lib/ai/vector-store'
import type { Citation, RagFilter } from '@/components/shared/CitationList'

/**
 * GET /api/cases/[id]/citations
 *
 * Returns the RAG sources relevant to a specific compliance case.
 *
 * v3 (Task 13) — citation lookup is now a two-tier flow:
 *
 *   1. DB-first: look up the case in ComplianceCase and join its
 *      CaseCitation rows. Each row carries a denormalised chunk
 *      snapshot (title, snippet, sourceType, jurisdiction, category,
 *      pluginSlug) plus the relevanceScore and rank captured at
 *      insertion time. This is the deterministic path — citations
 *      are stable across requests, no retrieval variance.
 *
 *   2. Live-retrieval fallback: if the case has no CaseCitation rows
 *      (e.g. a newly-created case that hasn't been migrated, or a
 *      case.json-only case from the static export), fall back to
 *      calling retrieve() live with the same query+filter as before.
 *      This preserves backward compat with Task 11 behavior.
 *
 *   3. Static-build safety: if neither DB nor live retrieval is
 *      available (static export), the route returns the synthetic
 *      citations embedded in cases.json. CaseManagementView handles
 *      this fallback client-side.
 *
 * Path param:
 *   id — the case ID (e.g. "case_1fda995f1fe348acad3617")
 *
 * Query params:
 *   topK — number of citations to retrieve (default 8, max 20).
 *          For DB-sourced citations, topK truncates the persisted list.
 *          For live retrieval, topK is passed to retrieve().
 *   refresh — if "1", re-runs retrieve() and upserts CaseCitation rows
 *             before returning them. Used by the "Refresh citations"
 *             button in the UI when the corpus has changed.
 */

// Regulator -> jurisdiction + categories mapping.
// Mirrors the table in scripts/migrate-cases-to-db.ts.
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

type CaseRow = {
  id: string
  caseType: string
  title: string
  regulator: string | null
  description: string
}

// Fallback: load cases.json (used when no DB case exists)
async function loadCasesFromJson(): Promise<CaseRow[]> {
  const filePath = path.join(process.cwd(), 'public', 'data', 'cases.json')
  const raw = await fs.readFile(filePath, 'utf8')
  const parsed = JSON.parse(raw) as { cases: CaseRow[] }
  return parsed.cases ?? []
}

// Build the retrieval query+filter for a case (used by live-retrieval fallback)
function buildRetrievalInput(caseRow: CaseRow): {
  query: string
  filter: RagFilter & { broadened?: boolean }
} {
  const query = [caseRow.title, caseRow.description, caseRow.regulator]
    .filter(Boolean)
    .join(' — ')

  const scope = caseRow.regulator ? REGULATOR_SCOPE[caseRow.regulator] : null
  const jurisdictions = scope?.jurisdictions ?? []
  const categories = scope?.categories ?? CASE_TYPE_CATEGORIES[caseRow.caseType] ?? []
  const sourceTypes = ['plugin', 'regulation', 'policy', 'risk', 'document', 'guidance', 'external']

  const filter: RagFilter & { broadened?: boolean } = { sourceTypes, jurisdictions, categories }
  return { query, filter }
}

// Run retrieve() with broadening fallback (mirrors Task 11 behavior)
async function retrieveWithBroadening(
  query: string,
  topK: number,
  filter: RagFilter,
): Promise<{ scored: Awaited<ReturnType<typeof retrieve>>; broadened: boolean }> {
  let scored = await retrieve(query, topK, {
    sourceTypes: filter.sourceTypes,
    jurisdictions: filter.jurisdictions.length > 0 ? filter.jurisdictions : undefined,
    categories: filter.categories.length > 0 ? filter.categories : undefined,
  })
  let broadened = false
  if (scored.length < 3 && filter.jurisdictions.length > 0) {
    const broader = await retrieve(query, topK, {
      sourceTypes: filter.sourceTypes,
      categories: filter.categories.length > 0 ? filter.categories : undefined,
    })
    if (broader.length > scored.length) {
      scored = broader
      broadened = true
    }
  }
  return { scored, broadened }
}

// Map KnowledgeChunk ScoredChunk[] -> Citation[]
function mapScoredToCitations(scored: Awaited<ReturnType<typeof retrieve>>): Citation[] {
  return scored.map((chunk) => {
    const isPlugin = chunk.sourceType === 'plugin'
    const meta = chunk.metadata as Record<string, unknown> | null
    const pluginSlug = isPlugin
      ? (meta?.pluginSlug as string | undefined) ?? chunk.sourceId
      : null
    const snippet =
      chunk.content.length > 200
        ? chunk.content.slice(0, 200) + '…'
        : chunk.content
    return {
      id: chunk.id,
      sourceType: chunk.sourceType,
      sourceId: chunk.sourceId,
      title: chunk.title,
      jurisdiction: chunk.jurisdiction,
      category: chunk.category,
      score: Math.max(0, Math.min(1, chunk.score)),
      snippet,
      isPlugin,
      pluginSlug: pluginSlug ?? null,
    } satisfies Citation
  })
}

// Persist retrieved chunks as CaseCitation rows (used by ?refresh=1 and
// as a side-effect of the live-retrieval fallback so future requests
// get the deterministic DB path).
async function persistCitations(
  caseId: string,
  scored: Awaited<ReturnType<typeof retrieve>>,
): Promise<void> {
  await db.caseCitation.deleteMany({ where: { caseId } })
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
        caseId,
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
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const start = Date.now()
  try {
    const { id: caseId } = await params
    const url = new URL(req.url)
    const topKParam = parseInt(url.searchParams.get('topK') ?? '8', 10)
    const topK = Math.min(Math.max(topKParam, 1), 20)
    const refresh = url.searchParams.get('refresh') === '1'

    // ─── Path 1: DB-first (deterministic) ─────────────────────────
    // Look up the case + its CaseCitation rows. If we have citations,
    // return them directly — no retrieval, no LLM call, ~5ms latency.
    const dbCase = await db.complianceCase.findUnique({
      where: { id: caseId },
      include: {
        citations: {
          orderBy: { rank: 'asc' },
          take: topK,
        },
      },
    })

    if (dbCase && dbCase.citations.length > 0 && !refresh) {
      // Map CaseCitation rows -> Citation[] (using the denormalised snapshot)
      const citations: Citation[] = dbCase.citations.map((row) => ({
        id: row.chunkId,
        sourceType: row.chunkSourceType,
        sourceId: row.chunkPluginSlug ?? row.chunkId,
        title: row.chunkTitle,
        jurisdiction: row.chunkJurisdiction,
        category: row.chunkCategory,
        score: row.relevanceScore,
        snippet: row.chunkSnippet,
        isPlugin: row.chunkSourceType === 'plugin',
        pluginSlug: row.chunkPluginSlug,
      }))

      // Reconstruct the ragFilter from the case's regulator+caseType
      const scope = dbCase.regulator ? REGULATOR_SCOPE[dbCase.regulator] : null
      const jurisdictions = scope?.jurisdictions ?? []
      const categories = scope?.categories ?? CASE_TYPE_CATEGORIES[dbCase.caseType] ?? []
      const sourceTypes = ['plugin', 'regulation', 'policy', 'risk', 'document', 'guidance', 'external']
      const filter: RagFilter = { sourceTypes, jurisdictions, categories }

      return NextResponse.json({
        caseId: dbCase.id,
        query: [dbCase.title, dbCase.description, dbCase.regulator].filter(Boolean).join(' — '),
        citations,
        ragFilter: filter,
        count: citations.length,
        latencyMs: Date.now() - start,
        source: 'db',
      })
    }

    // ─── Path 2: live-retrieval fallback ─────────────────────────
    // Either the case isn't in the DB, or it has no CaseCitation rows,
    // or the caller requested ?refresh=1. Fall back to calling retrieve()
    // live, then persist the results so the next request gets the fast path.
    let caseRow: CaseRow | null = dbCase
      ? {
          id: dbCase.id,
          caseType: dbCase.caseType,
          title: dbCase.title,
          regulator: dbCase.regulator,
          description: dbCase.description,
        }
      : null

    // If still no case, try cases.json (covers cases that haven't been migrated)
    if (!caseRow) {
      const cases = await loadCasesFromJson()
      caseRow = cases.find((c) => c.id === caseId) ?? null
    }

    if (!caseRow) {
      return NextResponse.json(
        { error: 'Case not found: ' + caseId },
        { status: 404 },
      )
    }

    const { query, filter } = buildRetrievalInput(caseRow)
    const { scored, broadened } = await retrieveWithBroadening(query, topK, filter)
    if (broadened) {
      ;(filter as RagFilter & { broadened?: boolean }).broadened = true
    }

    const citations = mapScoredToCitations(scored)

    // Persist for next time (only if the case exists in DB — if it came
    // from cases.json only, skip persistence since there's no caseId FK)
    if (dbCase || (await db.complianceCase.findUnique({ where: { id: caseId } }))) {
      try {
        await persistCitations(caseId, scored)
      } catch (err) {
        // Persistence failure is non-fatal — return the live results anyway.
        console.warn('[/api/cases/[id]/citations] persistCitations failed:', err)
      }
    }

    return NextResponse.json({
      caseId: caseRow.id,
      query,
      citations,
      ragFilter: filter,
      count: citations.length,
      latencyMs: Date.now() - start,
      source: 'live' + (broadened ? '+broadened' : ''),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/cases/[id]/citations]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
