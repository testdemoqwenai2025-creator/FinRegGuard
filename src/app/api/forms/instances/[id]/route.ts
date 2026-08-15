/**
 * GET /api/forms/instances/[id]
 * =============================
 * Returns full detail of a FormInstance, including:
 *   - template (with full field schema)
 *   - fieldValues (with provenance, sourceConnector, reviewQueueItem)
 *   - reviewQueueItems
 *
 * This is the payload the FormInstanceView UI renders.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const instance = await db.formInstance.findUnique({
      where: { id },
      include: {
        template: true,
        fieldValues: {
          orderBy: { fieldPath: 'asc' },
          include: {
            provenance: true,
            sourceConnector: { select: { slug: true, name: true } },
            reviewQueueItem: true,
          },
        },
        reviewQueueItems: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!instance) {
      return NextResponse.json(
        { error: 'FormInstance not found', id },
        { status: 404 },
      )
    }

    return NextResponse.json({ instance })
  } catch (e) {
    console.error('Get form instance error:', e)
    return NextResponse.json(
      { error: 'Failed to fetch form instance', message: (e as Error).message },
      { status: 500 },
    )
  }
}
