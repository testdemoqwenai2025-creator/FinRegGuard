import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { retrieve } from '@/lib/ai/vector-store'
import type { Citation, RagFilter } from '@/components/shared/CitationList'

/**
 * GET /api/cases/[id]/citations
 *
 * Returns the RAG sources relevant to a specific compliance case. Replaces
 * the synthetic per-case citations that used to live in cases.json — now
 * citations are retrieved live from the vector store (KnowledgeChunk table)
 * using the case's title + description + regulator as the retrieval query.
 *
 * Path param:
 *   id — the case ID from public/data/cases.json (e.g. "case_1fda995f1fe348acad3617")
 *
 * Query params:
 *   topK — number of citations to retrieve (default 8, max 20)
 *
 * Flow:
 *   1. Load cases.json, find the case by id (404 if not found)
 *   2. Build a retrieval query: `${case.title} — ${case.description}`
 *   3. Build a RAG filter from the case's regulator + caseType:
 *        - regulator -> jurisdiction (SEC->US, FCA->UK, OFAC->US+GLOBAL, etc.)
 *        - caseType  -> categories (examination->form,rule; investigation->rule,feature; ...)
 *   4. Call retrieve() — returns ScoredChunk[] ranked by cosine similarity
 *   5. Map each chunk to a Citation, marking plugin chunks (sourceType === 'plugin')
 *      with isPlugin=true + pluginSlug from chunk metadata
 *   6. Return { caseId, query, citations, ragFilter, count, latencyMs }
 *
 * Static-build safety: this route only exists in dev/server mode (the /api
 * directory is excluded from static export). CaseManagementView falls back
 * to the synthetic citations embedded in cases.json when IS_STATIC_BUILD=true.
 */

// Regulator -> jurisdiction + categories mapping.
// Mirrors the Python REGULATOR_PLUGINS table in scripts/add-case-citations.py
// so the live retrieval respects the same scope the synthetic data used.
const REGULATOR_SCOPE: Record<string, { jurisdictions: string[]; categories: string[] }> = {
  SEC:     { jurisdictions: ['US'],            categories: ['form', 'rule', 'feature'] },
  FINRA:   { jurisdictions: ['US'],            categories: ['rule', 'form'] },
  FCA:     { jurisdictions: ['UK'],            categories: ['rule', 'feature', 'document'] },
  PRA:     { jurisdictions: ['UK'],            categories: ['rule', 'document'] },
  OFAC:    { jurisdictions: ['US', 'GLOBAL'],  categories: ['feature', 'rule', 'label'] },
  FATF:    { jurisdictions: ['GLOBAL'],        categories: ['rule'] },
  EBA:     { jurisdictions: ['EU'],            categories: ['form', 'rule', 'document'] },
  ESMA:    { jurisdictions: ['EU'],            categories: ['rule', 'document'] },
  MAS:     { jurisdictions: ['SG'],            categories: ['rule', 'form', 'feature'] },
  SFC:     { jurisdictions: ['HK'],            categories: ['rule', 'form'] },
  FSA:     { jurisdictions: ['JP'],            categories: ['rule'] },
  HHS_OCR: { jurisdictions: ['US'],            categories: ['rule', 'feature', 'document'] },
  'HHS-OCR': { jurisdictions: ['US'],          categories: ['rule', 'feature', 'document'] },
}

// Case type -> fallback categories when regulator is unknown/null.
const CASE_TYPE_CATEGORIES: Record<string, string[]> = {
  examination:          ['form', 'rule', 'document'],
  investigation:        ['rule', 'feature', 'document'],
  regulatory_request:   ['form', 'document'],
  internal_review:      ['document'],
}

type CaseRow = {
  id: string
  caseType: string
  title: string
  regulator: string | null
  description: string
}

// Load cases.json once per request (small file, fine to re-read).
async function loadCases(): Promise<CaseRow[]> {
  const filePath = path.join(process.cwd(), 'public', 'data', 'cases.json')
  const raw = await fs.readFile(filePath, 'utf8')
  const parsed = JSON.parse(raw) as { cases: CaseRow[] }
  return parsed.cases ?? []
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

    // 1. Load case from cases.json
    const cases = await loadCases()
    const caseRow = cases.find((c) => c.id === caseId)
    if (!caseRow) {
      return NextResponse.json(
        { error: `Case not found: ${caseId}` },
        { status: 404 },
      )
    }

    // 2. Build retrieval query — title + description gives the retriever
    //    the most context for finding relevant chunks. We append the
    //    regulator name so chunks about the same regulator rank higher.
    const query = [caseRow.title, caseRow.description, caseRow.regulator]
      .filter(Boolean)
      .join(' — ')

    // 3. Build RAG filter from regulator + caseType
    const scope = caseRow.regulator ? REGULATOR_SCOPE[caseRow.regulator] : null
    const jurisdictions = scope?.jurisdictions ?? []
    const categories = scope?.categories ?? CASE_TYPE_CATEGORIES[caseRow.caseType] ?? []
    // sourceTypes: include 'plugin' so plugin-provenance chunks are retrievable
    // alongside baseline corpus (regulation, policy, risk, document, external, guidance)
    const sourceTypes = ['plugin', 'regulation', 'policy', 'risk', 'document', 'guidance', 'external']

    const filter: RagFilter = { sourceTypes, jurisdictions, categories }

    // 4. Retrieve top-K chunks from the vector store
    let scored = await retrieve(query, topK, {
      sourceTypes,
      jurisdictions: jurisdictions.length > 0 ? jurisdictions : undefined,
      categories: categories.length > 0 ? categories : undefined,
    })

    // Fallback: if the strict jurisdiction filter returned very few results
    // (which happens when the case's regulator has few indexed chunks),
    // retry with a broader scope — drop the jurisdiction filter but keep
    // the category filter so results stay topically relevant.
    if (scored.length < 3 && jurisdictions.length > 0) {
      const broadened = await retrieve(query, topK, {
        sourceTypes,
        categories: categories.length > 0 ? categories : undefined,
      })
      if (broadened.length > scored.length) {
        scored = broadened
        // Mark the filter as "broadened" so the UI can show that we relaxed
        // the jurisdiction constraint.
        ;(filter as RagFilter & { broadened?: boolean }).broadened = true
      }
    }

    // 5. Map ScoredChunk[] -> Citation[]
    const citations: Citation[] = scored.map((chunk) => {
      const isPlugin = chunk.sourceType === 'plugin'
      const meta = chunk.metadata as Record<string, unknown> | null
      const pluginSlug = isPlugin
        ? (meta?.pluginSlug as string | undefined) ?? chunk.sourceId
        : null
      // Truncate snippet to 200 chars to keep cards compact
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
        // Cosine similarity is in [0, 1]; clamp to be safe
        score: Math.max(0, Math.min(1, chunk.score)),
        snippet,
        isPlugin,
        pluginSlug: pluginSlug ?? null,
      }
    })

    return NextResponse.json({
      caseId: caseRow.id,
      query,
      citations,
      ragFilter: filter,
      count: citations.length,
      latencyMs: Date.now() - start,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/cases/[id]/citations]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
