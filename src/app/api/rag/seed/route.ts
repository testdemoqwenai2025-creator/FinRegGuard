import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { indexChunks, clear, type ChunkInput } from '@/lib/ai/vector-store'
import { chunkText } from '@/lib/ai/chunker'

/**
 * POST /api/rag/seed
 *
 * Ingests existing Prisma data (Regulations, Policies, RiskItems) into the
 * vector store. Splits long text into chunks, vectorises, and upserts.
 *
 * Body: {
 *   sources?: string[]    // which source types to ingest (default: all)
 *   clear?: boolean       // wipe existing chunks first (default: false)
 *   maxChunkChars?: number
 * }
 *
 * Returns: { indexed: number, skipped: number, bySource: Record<string, number> }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      sources?: string[]
      clear?: boolean
      maxChunkChars?: number
    }

    const requestedSources = body.sources ?? ['regulation', 'policy', 'risk']
    const maxChunkChars = body.maxChunkChars ?? 500

    if (body.clear) {
      await clear()
    }

    const allChunks: ChunkInput[] = []
    const bySource: Record<string, number> = {}

    // ── Regulations ──────────────────────────────────────────────
    if (requestedSources.includes('regulation')) {
      const regulations = await db.regulation.findMany()
      let count = 0
      for (const r of regulations) {
        const fullText = `${r.title}\n\n${r.summary}\n\nJurisdiction: ${r.jurisdiction}\nRegulator: ${r.regulator}\nCategory: ${r.category}\nStatus: ${r.status}\nImpact: ${r.impactLevel}\nAffected: ${r.affectedUnits}`
        const chunks = chunkText(fullText, maxChunkChars)
        for (let i = 0; i < chunks.length; i++) {
          allChunks.push({
            sourceType: 'regulation',
            sourceId: r.id,
            title: `${r.title}${chunks.length > 1 ? ` (part ${i + 1}/${chunks.length})` : ''}`,
            content: chunks[i].text,
            jurisdiction: r.jurisdiction,
            category: r.category,
            metadata: {
              regulator: r.regulator,
              status: r.status,
              impactLevel: r.impactLevel,
              effectiveDate: r.effectiveDate,
              chunkIndex: i,
              totalChunks: chunks.length,
            },
          })
          count++
        }
      }
      bySource.regulation = count
    }

    // ── Policies ─────────────────────────────────────────────────
    if (requestedSources.includes('policy')) {
      const policies = await db.policy.findMany()
      let count = 0
      for (const p of policies) {
        const fullText = `${p.title}\n\nCategory: ${p.category}\nOwner: ${p.ownerUnit}\nVersion: ${p.version}\nStatus: ${p.status}\n\n${p.content}${p.aiSuggestion ? `\n\nAI Suggestion: ${p.aiSuggestion}` : ''}`
        const chunks = chunkText(fullText, maxChunkChars)
        for (let i = 0; i < chunks.length; i++) {
          allChunks.push({
            sourceType: 'policy',
            sourceId: p.id,
            title: `${p.title} — v${p.version}${chunks.length > 1 ? ` (part ${i + 1}/${chunks.length})` : ''}`,
            content: chunks[i].text,
            jurisdiction: null,
            category: p.category,
            metadata: {
              ownerUnit: p.ownerUnit,
              version: p.version,
              status: p.status,
              reviewDate: p.reviewDate,
              chunkIndex: i,
              totalChunks: chunks.length,
            },
          })
          count++
        }
      }
      bySource.policy = count
    }

    // ── Risk Items ───────────────────────────────────────────────
    if (requestedSources.includes('risk')) {
      const risks = await db.riskItem.findMany()
      let count = 0
      for (const r of risks) {
        const fullText = `Risk: ${r.businessUnit} — ${r.regulationArea}\n\nLikelihood: ${r.likelihood}/5\nImpact: ${r.impact}/5\nInherent Risk: ${r.inherentRisk}/25\nResidual Risk: ${r.residualRisk}/25\nTrend: ${r.trend}\nOwner: ${r.owner}\n\nMitigation Plan:\n${r.mitigationPlan}`
        const chunks = chunkText(fullText, maxChunkChars)
        for (let i = 0; i < chunks.length; i++) {
          allChunks.push({
            sourceType: 'risk',
            sourceId: r.id,
            title: `Risk: ${r.businessUnit} — ${r.regulationArea}${chunks.length > 1 ? ` (part ${i + 1}/${chunks.length})` : ''}`,
            content: chunks[i].text,
            jurisdiction: null,
            category: r.regulationArea,
            metadata: {
              businessUnit: r.businessUnit,
              likelihood: r.likelihood,
              impact: r.impact,
              inherentRisk: r.inherentRisk,
              residualRisk: r.residualRisk,
              trend: r.trend,
              owner: r.owner,
              chunkIndex: i,
              totalChunks: chunks.length,
            },
          })
          count++
        }
      }
      bySource.risk = count
    }

    if (allChunks.length === 0) {
      return NextResponse.json({
        indexed: 0,
        skipped: 0,
        bySource,
        message: 'No source records found to index. Populate Regulations/Policies/RiskItems first.',
      })
    }

    const result = await indexChunks(allChunks)

    return NextResponse.json({
      ...result,
      bySource,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/rag/seed]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
