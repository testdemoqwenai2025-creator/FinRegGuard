/**
 * GET /api/forms/review-queue
 * ===========================
 * Lists ReviewQueueItem rows (optionally filtered by status).
 *
 * Optional query params:
 *   ?limit=50            — max results (default 50)
 *   ?status=pending      — pending | assigned | approved | edited | rejected | escalated
 *   ?team=KYC            — KYC | MLRO | Licensing | Sanctions | DPO
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 200)
  const status = url.searchParams.get('status') || undefined
  const team = url.searchParams.get('team') || undefined

  try {
    const where: { status?: string; assignedTeam?: string } = {}
    if (status) where.status = status
    if (team) where.assignedTeam = team

    const items = await db.reviewQueueItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        fieldValue: {
          include: {
            instance: {
              select: {
                id: true,
                entityId: true,
                entityName: true,
                template: { select: { slug: true, name: true } },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      count: items.length,
      items,
    })
  } catch (e) {
    console.error('List review queue error:', e)
    return NextResponse.json(
      { error: 'Failed to list review queue items', message: (e as Error).message },
      { status: 500 },
    )
  }
}
