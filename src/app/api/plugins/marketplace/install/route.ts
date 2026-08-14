import { NextRequest, NextResponse } from 'next/server'
import { installPluginFromUrl } from '@/lib/plugins/marketplace'

/**
 * POST /api/plugins/marketplace/install
 * Installs a plugin from a URL — true DeepSeek-style "load from web".
 *
 * Body: { url: string, actor?: string, autoEnable?: boolean }
 *
 * Two modes:
 *  (A) Manifest mode: URL returns JSON with { manifestVersion, name, ... }
 *  (B) Auto-discovery mode: URL returns HTML/PDF — metadata inferred from URL
 *
 * Returns the install result (pluginId, slug, name, action, contentLength).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      url?: string
      actor?: string
      autoEnable?: boolean
    }
    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json({ error: 'url required' }, { status: 400 })
    }
    const result = await installPluginFromUrl(body.url, {
      actor: body.actor ?? 'user',
      autoEnable: body.autoEnable ?? true,
    })
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/plugins/marketplace/install]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
