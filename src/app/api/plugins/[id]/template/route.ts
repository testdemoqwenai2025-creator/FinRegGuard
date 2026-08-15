import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/plugins/[id]/template
 * Returns the cached template (rawContent + parsedFields) for a plugin.
 * If no template is cached, returns 404 with a hint to refresh.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const template = await db.pluginTemplate.findUnique({
      where: { pluginId: id },
    })
    if (!template) {
      return NextResponse.json(
        { error: 'No cached template. POST /api/plugins/[id]/refresh to fetch.' },
        { status: 404 },
      )
    }
    return NextResponse.json({
      template: {
        ...template,
        parsedFields: template.parsedFieldsJson
          ? JSON.parse(template.parsedFieldsJson)
          : null,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/plugins/[id]/template GET]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
