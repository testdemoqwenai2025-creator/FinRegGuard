import { NextResponse } from 'next/server'
import { getRegistry, getRegistryStats } from '@/lib/plugins/registry'

/**
 * GET /api/plugins
 * Returns the full plugin registry: catalog metadata + DB state
 * (enabled, isDefault, template fetch status). Syncs catalog → DB on every call.
 *
 * Query params:
 *  - category=form|label|feature|document  (filter)
 *  - jurisdiction=US|EU|UK|...             (filter)
 *  - enabled=true|false                    (filter)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const category = url.searchParams.get('category')
    const jurisdiction = url.searchParams.get('jurisdiction')
    const enabledParam = url.searchParams.get('enabled')
    const enabled = enabledParam === 'true' ? true : enabledParam === 'false' ? false : null

    const registry = await getRegistry()

    let filtered = registry
    if (category) filtered = filtered.filter((p) => p.category === category)
    if (jurisdiction) filtered = filtered.filter((p) => p.jurisdiction === jurisdiction)
    if (enabled !== null) filtered = filtered.filter((p) => p.enabled === enabled)

    const stats = await getRegistryStats(registry)
    return NextResponse.json({
      plugins: filtered,
      stats,
      total: filtered.length,
      generatedAt: new Date().toISOString(),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/plugins GET]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
