import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/plugins/[id]/history
 * Returns the toggle history for a plugin (most recent 100 entries).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const history = await db.pluginToggleHistory.findMany({
      where: { pluginId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json({ history, count: history.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/plugins/[id]/history GET]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
