import { NextRequest, NextResponse } from 'next/server'
import { getStats, retrieve } from '@/lib/ai/vector-store'

/**
 * GET /api/rag
 * Returns vector store statistics (chunk count, breakdowns).
 */
export async function GET() {
  const stats = await getStats()
  return NextResponse.json(stats)
}

/**
 * POST /api/rag
 * Query the vector store directly (without LLM) — useful for debugging
 * retrieval quality or building "related items" features.
 *
 * Body: { query: string, topK?: number, filter?: {...} }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      query: string
      topK?: number
      filter?: {
        sourceTypes?: string[]
        jurisdictions?: string[]
        categories?: string[]
      }
    }

    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json({ error: 'query required' }, { status: 400 })
    }

    const results = await retrieve(body.query, body.topK ?? 5, body.filter)
    return NextResponse.json({
      query: body.query,
      results,
      count: results.length,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/rag POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
