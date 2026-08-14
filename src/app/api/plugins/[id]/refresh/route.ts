import { NextRequest, NextResponse } from 'next/server'
import { refreshAndReindex } from '@/lib/plugins/rag-bridge'

/**
 * POST /api/plugins/[id]/refresh
 * Force-refreshes the cached template by re-fetching from sourceUrl.
 * Body: { actor?: string }
 *
 * Drift detection: compares the new content's SHA-256 hash to the cached
 * hash. If different, deletes the old chunks and re-indexes the new content
 * into the vector store. If the hash is unchanged, skips re-indexing (no drift).
 *
 * Returns the refresh report:
 *   - templateOk: did the fetch succeed?
 *   - driftDetected: did the content hash change?
 *   - previousHash / newHash: for comparison
 *   - chunksIndexed / chunksDeleted: vector store mutation counts
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = (await req.json().catch(() => ({}))) as { actor?: string }
    const result = await refreshAndReindex(id, body.actor ?? 'user')
    return NextResponse.json({ ok: result.templateOk, result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/plugins/[id]/refresh POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
