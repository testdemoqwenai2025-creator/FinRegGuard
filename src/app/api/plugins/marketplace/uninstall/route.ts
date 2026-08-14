import { NextRequest, NextResponse } from 'next/server'
import { uninstallPlugin } from '@/lib/plugins/marketplace'

/**
 * POST /api/plugins/marketplace/uninstall
 * Uninstalls a user-added plugin. Refuses to uninstall catalog plugins.
 *
 * Body: { pluginId: string, actor?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { pluginId?: string; actor?: string }
    if (!body.pluginId) {
      return NextResponse.json({ error: 'pluginId required' }, { status: 400 })
    }
    const result = await uninstallPlugin(body.pluginId, body.actor ?? 'user')
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/plugins/marketplace/uninstall]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
