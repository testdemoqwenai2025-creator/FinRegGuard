import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/plugins/[id]
 * Returns the full detail of a single plugin, including its cached template
 * (rawContent omitted if too large) and recent toggle history.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const plugin = await db.plugin.findUnique({
      where: { id },
      include: {
        template: true,
        history: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })
    if (!plugin) {
      return NextResponse.json({ error: 'Plugin not found' }, { status: 404 })
    }
    // Truncate rawContent if huge (it's already capped at 5MB at fetch time
    // but we trim further for the detail view to keep payloads reasonable)
    const MAX_DETAIL_BYTES = 64 * 1024
    const trimmedTemplate = plugin.template
      ? {
          ...plugin.template,
          rawContent:
            plugin.template.rawContent.length > MAX_DETAIL_BYTES
              ? plugin.template.rawContent.slice(0, MAX_DETAIL_BYTES) +
                `\n\n... [truncated; full size: ${plugin.template.rawContent.length} bytes]`
              : plugin.template.rawContent,
        }
      : null
    return NextResponse.json({
      plugin: { ...plugin, template: trimmedTemplate },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/plugins/[id] GET]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
