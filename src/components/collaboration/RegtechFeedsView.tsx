'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Landmark, Radio, CheckCircle2, AlertTriangle, XCircle, Globe2, Activity } from 'lucide-react'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'
import { dataUrl } from '@/lib/data'

type Feed = {
  id: string
  slug: string
  name: string
  regulator: string
  jurisdiction: string
  endpoint: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  lastPollAt: string
  nextPollAt: string
  recordsPulled: number
  errorCount: number
  authScheme: string
  rateLimitPerMin: number
  avgLatencyMs: number
  aiRecommendation: AIRec
}

type FeedsData = {
  feeds: Feed[]
  total: number
  summary: {
    healthy: number
    degraded: number
    unhealthy: number
    totalRecordsPulled: number
    totalErrors: number
    regulatorsCovered: number
    jurisdictionsCovered: number
  }
}

const statusMeta: Record<Feed['status'], { icon: typeof CheckCircle2; tint: string; label: string; dot: string }> = {
  healthy:   { icon: CheckCircle2, tint: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Healthy', dot: 'bg-emerald-500' },
  degraded:  { icon: AlertTriangle, tint: 'text-amber-700 bg-amber-50 border-amber-200', label: 'Degraded', dot: 'bg-amber-500' },
  unhealthy: { icon: XCircle, tint: 'text-rose-700 bg-rose-50 border-rose-200', label: 'Unhealthy', dot: 'bg-rose-500' },
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 0) return `in ${Math.abs(Math.floor(diff / 60_000))}m`
  if (diff < 60_000) return `${Math.max(1, Math.floor(diff / 1000))}s ago`
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

export function RegtechFeedsView() {
  const [data, setData] = useState<FeedsData | null>(null)
  const [selected, setSelected] = useState<Feed | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('regtech-feeds'))
      .then(r => r.json())
      .then(d => {
        setData(d)
        const firstUnhealthy = d.feeds?.find((f: Feed) => f.status === 'unhealthy')
        const firstDegraded = d.feeds?.find((f: Feed) => f.status === 'degraded')
        setSelected(firstUnhealthy ?? firstDegraded ?? d.feeds?.[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const s = data.summary

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Collaboration & Trust"
        title="RegTech API Supervision Feeds"
        subtitle="Live data ingestion from regulator supervisory APIs — FCA Digital Gateway, MAS SGFINd, ESMA DORA Register, SEC EDGAR, FINRA Rulebook, and more. Automated polling, rate-limit tracking, and failover when feeds go down."
        icon={Landmark}
        accent="from-amber-500 to-orange-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Feeds Healthy" value={s.healthy} sub={`of ${data.total} total`} icon={CheckCircle2} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Degraded" value={s.degraded} sub="partial failures" icon={AlertTriangle} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Unhealthy" value={s.unhealthy} sub="needs failover" icon={XCircle} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="Records Pulled" value={s.totalRecordsPulled} sub={`${s.regulatorsCovered} regulators`} icon={Radio} tint="text-violet-700 bg-violet-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe2 className="h-3.5 w-3.5" />
              Active Feeds — sorted by health
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {[...data.feeds].sort((a, b) => {
                const order: Record<string, number> = { unhealthy: 0, degraded: 1, healthy: 2 }
                return order[a.status] - order[b.status]
              }).map(f => {
                const meta = statusMeta[f.status]
                const Icon = meta.icon
                const isSelected = selected?.id === f.id
                return (
                  <button key={f.id} onClick={() => setSelected(f)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-amber-50/40' : ''}`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white">
                      <Landmark className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">{f.name}</span>
                        <Badge variant="outline" className={`text-[9px] ${meta.tint}`}>
                          <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {f.regulator} · {f.jurisdiction} · {f.authScheme}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                        <span><Activity className="inline h-2.5 w-2.5 mr-0.5" />{f.avgLatencyMs}ms</span>
                        <span>{f.recordsPulled} records</span>
                        {f.errorCount > 0 && <span className="text-rose-500">{f.errorCount} errors</span>}
                        <span className="ml-auto">last poll {relTime(f.lastPollAt)}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <>
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-amber-600" />
                    {selected.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Slug', selected.slug],
                    ['Regulator', selected.regulator],
                    ['Jurisdiction', selected.jurisdiction],
                    ['Auth Scheme', selected.authScheme],
                    ['Rate Limit', `${selected.rateLimitPerMin}/min`],
                    ['Status', statusMeta[selected.status].label],
                    ['Records Pulled', `${selected.recordsPulled}`],
                    ['Errors (24h)', `${selected.errorCount}`],
                    ['Avg Latency', `${selected.avgLatencyMs}ms`],
                    ['Last Poll', relTime(selected.lastPollAt)],
                    ['Next Poll', relTime(selected.nextPollAt)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono text-right text-slate-800">{v}</span>
                    </div>
                  ))}
                  <div className="pt-2">
                    <p className="mb-1 text-slate-500">Endpoint</p>
                    <code className="block overflow-x-auto rounded-md bg-slate-50 p-2 text-[10px] text-slate-700">
                      {selected.endpoint}
                    </code>
                  </div>
                </CardContent>
              </Card>

              <BooleanActionCard rec={selected.aiRecommendation} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
