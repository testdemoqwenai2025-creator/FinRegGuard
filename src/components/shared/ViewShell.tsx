'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Activity,
  AlertOctagon,
  ShieldCheck,
  Cpu,
  Database,
  Lock,
  Network,
  GitBranch,
  Boxes,
  Layers,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { dataUrl, IS_STATIC_BUILD } from '@/lib/data'

type Zone =
  | 'Core'
  | 'Surveillance'
  | 'Quant & Computational'
  | 'Intelligence & Automation'
  | 'Collaboration & Trust'
  | 'Platform & Governance'

const ZONE_COLORS: Record<Zone, string> = {
  'Core': 'from-emerald-50 to-teal-50/40 text-emerald-700 ring-emerald-100',
  'Surveillance': 'from-rose-50 to-orange-50/40 text-rose-700 ring-rose-100',
  'Quant & Computational': 'from-violet-50 to-fuchsia-50/40 text-violet-700 ring-violet-100',
  'Intelligence & Automation': 'from-blue-50 to-indigo-50/40 text-blue-700 ring-blue-100',
  'Collaboration & Trust': 'from-amber-50 to-yellow-50/40 text-amber-700 ring-amber-100',
  'Platform & Governance': 'from-slate-50 to-gray-50/40 text-slate-700 ring-slate-200',
}

const ZONE_ICONS: Record<Zone, LucideIcon> = {
  'Core': ShieldCheck,
  'Surveillance': Activity,
  'Quant & Computational': TrendingUp,
  'Intelligence & Automation': Cpu,
  'Collaboration & Trust': Boxes,
  'Platform & Governance': Layers,
}

interface MetricCard {
  label: string
  value: string
  trend?: string
  intent?: 'good' | 'warn' | 'bad' | 'neutral'
}

interface TableData {
  columns: string[]
  rows: (string | number)[][]
}

interface ChartSpec {
  type: 'bars' | 'donut' | 'line'
  title: string
  data: { label: string; value: number; color?: string }[]
}

export interface ViewPayload {
  metrics: MetricCard[]
  table?: TableData
  charts?: ChartSpec[]
  highlights?: { title: string; body: string; intent?: 'good' | 'warn' | 'bad' | 'neutral' }[]
}

const INTENT_BADGE: Record<string, string> = {
  good: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warn: 'bg-amber-50 text-amber-700 ring-amber-200',
  bad: 'bg-rose-50 text-rose-700 ring-rose-200',
  neutral: 'bg-slate-50 text-slate-700 ring-slate-200',
}

const CHART_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function ViewShell({
  zone,
  title,
  subtitle,
  viewKey,
}: {
  zone: Zone
  title: string
  subtitle: string
  viewKey: string
}) {
  const [data, setData] = useState<ViewPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    // In static GitHub Pages builds, the dynamic /api/views/* routes are
    // stripped out (they don't exist on a static host). Skip the fetch
    // entirely and render the empty / "live preview" state instead of an
    // alarming "Endpoint unavailable" error.
    if (IS_STATIC_BUILD) {
      setLoading(false)
      setData(null)
      setError(null)
      return
    }

    setLoading(true)
    fetch(dataUrl(`views/${viewKey}`))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        if (active) {
          setData(d)
          setError(null)
        }
      })
      .catch((e) => {
        if (active) setError(e.message || 'Failed to load view data')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [viewKey])

  const ZoneIcon = ZONE_ICONS[zone]
  const zoneColorClass = ZONE_COLORS[zone]

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <ZoneIcon className="h-3.5 w-3.5" />
          {zone} Zone
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-600">
          {subtitle}
        </p>
      </div>

      <div className={`mb-6 flex flex-wrap items-center gap-3 rounded-lg bg-gradient-to-r ${zoneColorClass} px-4 py-3 ring-1`}>
        <Badge variant="outline" className="border-current/30 bg-white/60">
          <Sparkles className="mr-1 h-3 w-3" /> {IS_STATIC_BUILD ? 'Static preview' : 'Live'}
        </Badge>
        <span className="text-xs font-medium">Endpoint: <code className="font-mono">/api/views/{viewKey}</code></span>
        <span className="text-xs text-slate-500/80">·</span>
        <span className="text-xs text-slate-500/80">
          {IS_STATIC_BUILD
            ? 'static build · data served from /data/*.json'
            : loading
              ? 'fetching…'
              : error
                ? `error: ${error}`
                : `payload: ${data ? 'received' : 'empty'}`}
        </span>
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-3 w-20 rounded bg-slate-200" />
                <div className="h-6 w-32 rounded bg-slate-200" />
              </CardHeader>
              <CardContent>
                <div className="h-3 w-full rounded bg-slate-100" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && error && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertOctagon className="h-5 w-5" />
              Live endpoint not reachable
            </CardTitle>
            <CardDescription className="text-amber-700">
              The dev-server view payload at <code>/api/views/{viewKey}</code> could not be loaded
              ({error}). This is expected in static-only builds — the rest of the app continues
              to work using the bundled JSON files in <code>/data/</code>.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!loading && data && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.metrics.map((m, i) => (
              <Card key={i} className="border-slate-200 bg-white">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs uppercase tracking-wider">
                    {m.label}
                  </CardDescription>
                  <CardTitle className="text-2xl">{m.value}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {m.trend && (
                    <Badge variant="outline" className={INTENT_BADGE[m.intent || 'neutral']}>
                      {m.trend}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {data.charts && data.charts.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.charts.map((c, i) => (
                <ChartCard key={i} spec={c} />
              ))}
            </div>
          )}

          {data.highlights && data.highlights.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {data.highlights.map((h, i) => (
                <Card key={i} className="border-slate-200 bg-white">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${h.intent === 'good' ? 'bg-emerald-500' : h.intent === 'warn' ? 'bg-amber-500' : h.intent === 'bad' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                      <CardTitle className="text-base">{h.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">{h.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {data.table && (
            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="h-4 w-4 text-slate-400" />
                  Live records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                        {data.table.columns.map((c, i) => (
                          <th key={i} className="px-3 py-2 font-semibold">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.table.rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-3 py-2 align-top text-slate-700">
                              {typeof cell === 'string' && cell.length > 60 ? (
                                <span title={cell} className="block max-w-md truncate">{cell}</span>
                              ) : (
                                String(cell)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Network className="h-3.5 w-3.5" />
              Wired to Prisma SQLite · 16 models · streaming-ready
            </span>
            <span className="flex items-center gap-1">
              <GitBranch className="h-3.5 w-3.5" />
              RegGuard AI v2.0.0 · {zone} zone
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function ChartCard({ spec }: { spec: ChartSpec }) {
  if (spec.type === 'bars') {
    const max = Math.max(...spec.data.map((d) => d.value), 1)
    return (
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">{spec.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {spec.data.map((d, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{d.label}</span>
                  <span className="font-mono font-medium text-slate-900">{d.value.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(d.value / max) * 100}%`,
                      background: d.color || CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (spec.type === 'donut') {
    const total = spec.data.reduce((s, d) => s + d.value, 0) || 1
    let cumulative = 0
    return (
      <Card className="border-slate-200 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">{spec.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative h-24 w-24 shrink-0">
              <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                {spec.data.map((d, i) => {
                  const fraction = d.value / total
                  const offset = cumulative
                  cumulative += fraction
                  return (
                    <circle
                      key={i}
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="none"
                      stroke={d.color || CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth="3.5"
                      strokeDasharray={`${fraction * 100} ${100 - fraction * 100}`}
                      strokeDashoffset={-offset * 100}
                    />
                  )
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                {total.toLocaleString()}
              </div>
            </div>
            <div className="flex-1 space-y-1">
              {spec.data.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.color || CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-slate-600">{d.label}</span>
                  </span>
                  <span className="font-mono text-slate-900">{((d.value / total) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const max = Math.max(...spec.data.map((d) => d.value), 1)
  const min = Math.min(...spec.data.map((d) => d.value), 0)
  const range = max - min || 1
  const points = spec.data
    .map((d, i) => {
      const x = (i / (spec.data.length - 1 || 1)) * 100
      const y = 100 - ((d.value - min) / range) * 100
      return `${x},${y}`
    })
    .join(' ')
  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-700">{spec.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-24 w-full">
          <polyline
            points={points}
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
          {spec.data.map((d, i) => (
            <span key={i}>{d.label}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export { Lock }
