import { NextRequest, NextResponse } from 'next/server'
import { setEnabled } from '@/lib/plugins/registry'
import { refreshTemplate } from '@/lib/plugins/templates'

/**
 * POST /api/plugins/[id]/toggle
 * Toggles a plugin's enabled state. Body: { enabled: boolean, actor?: string }
 *
 * Side effects on enable:
 *  - If no cached template exists, kicks off a template auto-fill
 *    (fetches from sourceUrl or synthesizes from defaultFieldsJson).
 *  - Records a `enabled` action in PluginToggleHistory.
 *
 * Side effects on disable:
 *  - Sets enabledAt = null (state preserved; can re-enable later).
 *  - Records a `disabled` action in PluginToggleHistory.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = (await req.json()) as { enabled?: boolean; actor?: string }
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled (boolean) required' },
        { status: 400 },
      )
    }

    await setEnabled(id, body.enabled, body.actor ?? 'user')

    // If enabling for the first time and no template yet, auto-fill it.
    let templateResult = null
    if (body.enabled) {
      // We can't easily check "first time" here without an extra query,
      // so we just attempt a refresh — if the content hasn't changed,
      // the SHA-256 hash will match and the DB write is idempotent.
      templateResult = await refreshTemplate(id, body.actor ?? 'user')
    }

    return NextResponse.json({
      ok: true,
      enabled: body.enabled,
      template: templateResult,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/plugins/[id]/toggle POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
