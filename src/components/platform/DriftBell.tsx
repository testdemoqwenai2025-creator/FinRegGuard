'use client'

/**
 * DriftBell — notification bell for plugin template drift events.
 *
 * Polls /api/plugins/drift/events on mount + every 60s. Renders a bell
 * icon with an amber badge showing the count of drift events in the
 * last 7 days. Clicking opens a popover with the event list.
 *
 * Designed to be embedded in the PluginManagerView header.
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { Bell, AlertCircle, RefreshCw, CheckCircle2, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { IS_STATIC_BUILD } from '@/lib/data'

type DriftEvent = {
  id: string
  action: 'drift_reindex' | 'drift_no_change' | 'drift_failed' | 'refreshed'
  actor: string
  notes: string | null
  createdAt: string
  acknowledgedAt: string | null
  acknowledgedBy: string | null
  plugin: {
    id: string
    slug: string
    name: string
    category: string
    jurisdiction: string
    enabled: boolean
  } | null
}

type DriftEventsResponse = {
  events: DriftEvent[]
  summary: {
    total: number
    drifted: number
    failed: number
    refreshed: number
    since: string
    latestAt: string | null
  }
}

const POLL_INTERVAL_MS = 60_000

const ACTION_META: Record<
  DriftEvent['action'],
  { label: string; icon: typeof AlertCircle; tint: string }
> = {
  drift_reindex: {
    label: 'Drift detected',
    icon: AlertCircle,
    tint: 'text-amber-600 dark:text-amber-400',
  },
  drift_no_change: {
    label: 'No drift',
    icon: CheckCircle2,
    tint: 'text-emerald-600 dark:text-emerald-400',
  },
  drift_failed: {
    label: 'Refresh failed',
    icon: XCircle,
    tint: 'text-rose-600 dark:text-rose-400',
  },
  refreshed: {
    label: 'Refreshed',
    icon: RefreshCw,
    tint: 'text-slate-600 dark:text-slate-400',
  },
}

export function DriftBell() {
  const [events, setEvents] = useState<DriftEvent[]>([])
  const [summary, setSummary] = useState<DriftEventsResponse['summary'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    if (IS_STATIC_BUILD) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/plugins/drift/events?limit=50')
      if (!res.ok) return
      const data = (await res.json()) as DriftEventsResponse
      setEvents(data.events ?? [])
      setSummary(data.summary ?? null)
    } catch {
      // silently ignore — bell is non-critical UI
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [load])

  // Close popover when clicking outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const driftedCount = summary?.drifted ?? 0
  const failedCount = summary?.failed ?? 0
  const badgeCount = driftedCount + failedCount

  // Dismiss a single event by id — optimistically removes it from the
  // local list so the UI feels snappy, then persists via the ack route.
  const handleAck = useCallback(
    async (eventId: string) => {
      const prev = events
      setEvents((cur) => cur.filter((e) => e.id !== eventId))
      setSummary((s) =>
        s
          ? {
              ...s,
              total: Math.max(0, s.total - 1),
              drifted: Math.max(0, s.drifted - 1),
              failed: Math.max(0, s.failed - 1),
              refreshed: Math.max(0, s.refreshed - 1),
            }
          : s,
      )
      try {
        const res = await fetch('/api/plugins/drift/events/ack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventIds: [eventId], actor: 'user' }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      } catch {
        // Rollback on failure
        setEvents(prev)
        load()
      }
    },
    [events, load],
  )

  // Dismiss every un-acked event in the bell.
  const handleAckAll = useCallback(async () => {
    const prev = events
    const prevSummary = summary
    setEvents([])
    setSummary((s) => (s ? { ...s, total: 0, drifted: 0, failed: 0, refreshed: 0 } : s))
    try {
      const res = await fetch('/api/plugins/drift/events/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds: ['*'], actor: 'user' }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
    } catch {
      setEvents(prev)
      setSummary(prevSummary)
    }
  }, [events, summary])

  if (IS_STATIC_BUILD) {
    return null // bell requires the dev backend
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
          badgeCount > 0
            ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
            : 'border-border bg-background text-muted-foreground hover:bg-muted',
        )}
        aria-label={`Drift notifications (${badgeCount} events)`}
        title="Plugin template drift notifications"
      >
        <Bell className="h-4 w-4" />
        {badgeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-background shadow-lg">
          <div className="border-b border-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5" />
                Drift Notifications
              </p>
              <div className="flex items-center gap-2">
                {badgeCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={handleAckAll}
                    title="Dismiss all visible events"
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Dismiss all
                  </Button>
                )}
                <button
                  onClick={load}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                  title="Refresh"
                >
                  {loading ? 'Loading…' : 'Refresh'}
                </button>
              </div>
            </div>
            {summary && (
              <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground">
                <span>
                  <strong className="text-amber-600 dark:text-amber-400">{summary.drifted}</strong> drifted
                </span>
                <span>
                  <strong className="text-rose-600 dark:text-rose-400">{summary.failed}</strong> failed
                </span>
                <span>
                  <strong className="text-foreground">{summary.total}</strong> un-acked
                </span>
                {summary.latestAt && (
                  <span className="ml-auto">
                    latest {new Date(summary.latestAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </div>

          <ScrollArea className="max-h-80">
            <div className="p-2">
              {events.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-500" />
                  No drift events in the last 7 days.
                  <br />
                  <span className="text-[10px]">
                    Run a drift scan or wait for the next cron run.
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  {events.map((e) => {
                    const meta = ACTION_META[e.action]
                    const Icon = meta.icon
                    return (
                      <div
                        key={e.id}
                        className="group flex items-start gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs hover:bg-muted/40"
                      >
                        <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', meta.tint)} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold truncate">{meta.label}</span>
                            {e.plugin && (
                              <Badge
                                variant="outline"
                                className="text-[9px] py-0 px-1 shrink-0"
                              >
                                {e.plugin.slug}
                              </Badge>
                            )}
                          </div>
                          {e.plugin && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {e.plugin.name}
                              {e.plugin.enabled ? '' : ' (disabled)'}
                            </p>
                          )}
                          {e.notes && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                              {e.notes}
                            </p>
                          )}
                          <p className="text-[9px] text-muted-foreground/70 mt-0.5">
                            {new Date(e.createdAt).toLocaleString()} · by {e.actor}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAck(e.id)}
                          className="ml-1 mt-0.5 hidden h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 group-hover:flex"
                          title="Dismiss this event"
                          aria-label="Dismiss event"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-border p-2 text-[10px] text-muted-foreground">
            <p>
              Cron: <code className="font-mono bg-muted px-1 py-0.5 rounded">0 * * * * bun run scripts/scan-plugin-drift.ts</code>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
