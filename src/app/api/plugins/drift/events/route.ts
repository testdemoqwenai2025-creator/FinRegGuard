import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/plugins/drift/events
 *
 * Returns recent drift events from PluginToggleHistory so the UI can
 * surface them in a notification bell. Actions exposed:
 *   - drift_reindex (template changed → chunks re-indexed)
 *   - drift_no_change (scanned, no change)
 *   - drift_failed (refresh failed)
 *   - refreshed (manual refresh, may or may not have drifted)
 *
 * Query params:
 *   - since: ISO date string (default: 7 days ago)
 *   - limit: number of events (default: 50, max: 200)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const sinceParam = url.searchParams.get('since')
    const limitParam = parseInt(url.searchParams.get('limit') ?? '50', 10)
    const limit = Math.min(Math.max(limitParam, 1), 200)

    const since = sinceParam
      ? new Date(sinceParam)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago

    const events = await db.pluginToggleHistory.findMany({
      where: {
        action: {
          in: ['drift_reindex', 'drift_no_change', 'drift_failed', 'refreshed'],
        },
        createdAt: { gte: since },
      },
      include: {
        plugin: {
          select: {
            id: true,
            slug: true,
            name: true,
            category: true,
            jurisdiction: true,
            enabled: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Summary counts for the bell badge
    const summary = {
      total: events.length,
      drifted: events.filter((e) => e.action === 'drift_reindex').length,
      failed: events.filter((e) => e.action === 'drift_failed').length,
      refreshed: events.filter((e) => e.action === 'refreshed').length,
      since: since.toISOString(),
      latestAt: events[0]?.createdAt?.toISOString() ?? null,
    }

    return NextResponse.json({
      events: events.map((e) => ({
        id: e.id,
        action: e.action,
        actor: e.actor,
        notes: e.notes,
        createdAt: e.createdAt.toISOString(),
        plugin: e.plugin
          ? {
              id: e.plugin.id,
              slug: e.plugin.slug,
              name: e.plugin.name,
              category: e.plugin.category,
              jurisdiction: e.plugin.jurisdiction,
              enabled: e.plugin.enabled,
            }
          : null,
      })),
      summary,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/plugins/drift/events]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
