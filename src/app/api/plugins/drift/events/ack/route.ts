import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/plugins/drift/events/ack
 *
 * Dismiss (acknowledge) one or more drift events so they no longer
 * surface in the DriftBell badge count. Sets `acknowledgedAt` and
 * `acknowledgedBy` on each matching row.
 *
 * Body:
 *   { eventIds: string[], actor?: string }
 *
 * Special: eventIds = ["*"] dismisses ALL un-acked events visible
 * to the bell (drift_reindex / drift_failed / refreshed / drift_no_change
 * within the last 7 days).
 *
 * Returns:
 *   { acknowledged: number, skipped: number, ids: string[] }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      eventIds?: string[]
      actor?: string
    }
    const actor = body.actor ?? 'user'
    const ids = Array.isArray(body.eventIds) ? body.eventIds : []

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'eventIds must be a non-empty array (or ["*"] for all)' },
        { status: 400 },
      )
    }

    const now = new Date()
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const actionableActions = [
      'drift_reindex',
      'drift_no_change',
      'drift_failed',
      'refreshed',
    ]

    if (ids.includes('*')) {
      // Dismiss all un-acked drift events from the last 7 days
      const result = await db.pluginToggleHistory.updateMany({
        where: {
          action: { in: actionableActions },
          createdAt: { gte: since },
          acknowledgedAt: null,
        },
        data: {
          acknowledgedAt: now,
          acknowledgedBy: actor,
        },
      })
      return NextResponse.json({
        acknowledged: result.count,
        skipped: 0,
        ids: ['*'],
        actor,
        at: now.toISOString(),
      })
    }

    // Ack specific IDs — but only if they are currently un-acked
    const result = await db.pluginToggleHistory.updateMany({
      where: {
        id: { in: ids },
        acknowledgedAt: null,
      },
      data: {
        acknowledgedAt: now,
        acknowledgedBy: actor,
      },
    })

    return NextResponse.json({
      acknowledged: result.count,
      skipped: ids.length - result.count, // already-acked or not-found
      ids,
      actor,
      at: now.toISOString(),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/plugins/drift/events/ack]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
