import { NextRequest, NextResponse } from 'next/server'
import { setDefault } from '@/lib/plugins/registry'

/**
 * POST /api/plugins/[id]/default
 * Marks (or unmarks) a plugin as the default for its category+jurisdiction.
 * Body: { isDefault: boolean, actor?: string }
 *
 * When set to default, all sibling plugins with the same category+jurisdiction
 * have their `isDefault` flag cleared — exactly one default per pair.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = (await req.json()) as { isDefault?: boolean; actor?: string }
    if (typeof body.isDefault !== 'boolean') {
      return NextResponse.json(
        { error: 'isDefault (boolean) required' },
        { status: 400 },
      )
    }

    await setDefault(id, body.isDefault, body.actor ?? 'user')

    return NextResponse.json({
      ok: true,
      isDefault: body.isDefault,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/plugins/[id]/default POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
