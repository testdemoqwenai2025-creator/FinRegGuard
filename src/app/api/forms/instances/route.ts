/**
 * GET /api/forms/instances
 * =========================
 * Lists all FormInstance rows, most recent first.
 *
 * Optional query params:
 *   ?limit=50           — max results (default 50)
 *   ?status=in_review   — filter by status
 *   ?template=edd-form-framework  — filter by template slug
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 200)
  const status = url.searchParams.get('status') || undefined
  const templateSlug = url.searchParams.get('template') || undefined

  try {
    const where: { status?: string; template?: { slug: string } } = {}
    if (status) where.status = status
    if (templateSlug) where.template = { slug: templateSlug }

    const instances = await db.formInstance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        template: {
          select: { slug: true, name: true, formType: true, regulator: true, jurisdiction: true },
        },
        _count: {
          select: {
            fieldValues: true,
            reviewQueueItems: true,
          },
        },
      },
    })

    return NextResponse.json({
      count: instances.length,
      instances,
    })
  } catch (e) {
    console.error('List form instances error:', e)
    return NextResponse.json(
      { error: 'Failed to list form instances', message: (e as Error).message },
      { status: 500 },
    )
  }
}
