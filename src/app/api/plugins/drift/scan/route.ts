import { NextRequest, NextResponse } from 'next/server'
import { scanAllForDrift } from '@/lib/plugins/rag-bridge'

/**
 * POST /api/plugins/drift/scan
 * Scans ALL enabled plugins for template drift.
 *
 * For each enabled plugin:
 *   1. Fetches the latest template from its sourceUrl
 *   2. Compares the new SHA-256 hash to the cached hash
 *   3. If different, re-indexes the chunks in the vector store
 *
 * Body: { actor?: string }
 *
 * Returns a summary: { scanned, drifted, reindexed, failed, details[] }
 *
 * Designed to be called by:
 *   - The "Scan All" button in the Plugin Manager UI
 *   - A cron job (scripts/scan-plugin-drift.ts)
 *   - External schedulers via authenticated REST call
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { actor?: string }
    const result = await scanAllForDrift(body.actor ?? 'system')
    return NextResponse.json({
      ok: true,
      ...result,
      scannedAt: new Date().toISOString(),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/plugins/drift/scan]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * GET /api/plugins/drift/scan
 * Returns metadata about the drift scan endpoint (for health checks).
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/plugins/drift/scan',
    method: 'POST',
    description: 'Scan all enabled plugins for template drift via SHA-256 hash comparison',
    body: { actor: 'string (optional)' },
    response: {
      scanned: 'number — total enabled plugins checked',
      drifted: 'number — plugins whose content hash changed',
      reindexed: 'number — plugins whose chunks were re-indexed',
      failed: 'number — plugins that failed to refresh',
      details: 'Array<{ pluginId, slug, name, driftDetected, chunksIndexed, error? }>',
    },
  })
}
