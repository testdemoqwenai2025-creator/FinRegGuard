import { NextRequest, NextResponse } from 'next/server'
import { setEnabled } from '@/lib/plugins/registry'
import { refreshTemplate } from '@/lib/plugins/templates'
import { indexPluginChunks, deindexPluginChunks } from '@/lib/plugins/rag-bridge'

/**
 * POST /api/plugins/[id]/toggle
 * Toggles a plugin's enabled state. Body: { enabled: boolean, actor?: string }
 *
 * Side effects on enable:
 *  - If no cached template exists, kicks off a template auto-fill
 *    (fetches from sourceUrl or synthesizes from defaultFieldsJson).
 *  - Indexes the template chunks into the vector store (sourceType='plugin',
 *    sourceId=plugin.slug) so the RAG pipeline can retrieve from it.
 *  - Records an `enabled` action in PluginToggleHistory.
 *
 * Side effects on disable:
 *  - Removes the plugin's chunks from the vector store (cached template
 *    is preserved so re-enabling is fast — only the chunks are deleted).
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

    // Load the plugin slug BEFORE toggling (needed for de-indexing on disable)
    const { db } = await import('@/lib/db')
    const plugin = await db.plugin.findUnique({
      where: { id },
      select: { slug: true, name: true },
    })
    if (!plugin) {
      return NextResponse.json({ error: 'Plugin not found' }, { status: 404 })
    }

    await setEnabled(id, body.enabled, body.actor ?? 'user')

    let templateResult = null
    let ragResult = null

    if (body.enabled) {
      // Enable flow: refresh template + index chunks
      templateResult = await refreshTemplate(id, body.actor ?? 'user')
      ragResult = await indexPluginChunks(id)
    } else {
      // Disable flow: de-index chunks (template preserved for re-enable)
      ragResult = await deindexPluginChunks(plugin.slug)
    }

    return NextResponse.json({
      ok: true,
      enabled: body.enabled,
      template: templateResult,
      rag: ragResult,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/plugins/[id]/toggle POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
