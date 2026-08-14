import { NextRequest, NextResponse } from 'next/server'
import { refreshTemplate } from '@/lib/plugins/templates'

/**
 * POST /api/plugins/[id]/refresh
 * Force-refreshes the cached template by re-fetching from sourceUrl.
 * Body: { actor?: string }
 *
 * Returns the fetch result (status, contentLength, contentHash, error?, skipped?).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = (await req.json().catch(() => ({}))) as { actor?: string }
    const result = await refreshTemplate(id, body.actor ?? 'user')
    return NextResponse.json({ ok: result.ok, result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/plugins/[id]/refresh POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
