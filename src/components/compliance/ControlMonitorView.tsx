'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, Zap, Clock, CheckCircle2, AlertTriangle, XCircle, FileCheck2 } from 'lucide-react'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'
import { dataUrl } from '@/lib/data'

type ControlRun = {
  runAt: string
  result: 'pass' | 'warn' | 'fail'
  durationMs: number
  evidenceCount: number
  passRate: number
}

type Control = {
  id: string
  controlId: string
  name: string
  framework: string
  frequency: string
  owner: string
  status: 'passing' | 'degraded' | 'failing'
  lastRunAt: string
  nextRunAt: string
  evidenceCount: number
  passRate: number
  lastResult: 'pass' | 'warn' | 'fail'
  history: ControlRun[]
  aiRecommendation: AIRec
}

type CcmData = {
  controls: Control[]
  total: number
  summary: {
    passing: number
    degraded: number
    failing: number
    eventDriven: number
    batch: number
    scheduled: number
    totalEvidenceItems: number
    avgPassRate: number
  }
}

const statusMeta: Record<Control['status'], { icon: typeof CheckCircle2; tint: string; label: string }> = {
  passing:  { icon: CheckCircle2, tint: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Passing' },
  degraded: { icon: AlertTriangle, tint: 'text-amber-700 bg-amber-50 border-amber-200', label: 'Degraded' },
  failing:  { icon: XCircle, tint: 'text-rose-700 bg-rose-50 border-rose-200', label: 'Failing' },
}

const freqMeta: Record<string, { icon: typeof Zap; label: string; tint: string }> = {
  'real-time':    { icon: Zap, label: 'Real-time', tint: 'text-rose-600' },
  'batch-minute': { icon: Activity, label: 'Batch /min', tint: 'text-amber-600' },
  'batch-15min':  { icon: Activity, label: 'Batch /15min', tint: 'text-amber-600' },
  'batch-hourly': { icon: Activity, label: 'Batch hourly', tint: 'text-amber-600' },
  'event-driven': { icon: Zap, label: 'Event-driven', tint: 'text-violet-600' },
  'daily':        { icon: Clock, label: 'Daily', tint: 'text-slate-600' },
  'weekly':       { icon: Clock, label: 'Weekly', tint: 'text-slate-600' },
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 0) return `in ${Math.abs(Math.floor(diff / 60_000))}m`
  if (diff < 60_000) return `${Math.max(1, Math.floor(diff / 1000))}s ago`
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

export function ControlMonitorView() {
  const [data, setData] = useState<CcmData | null>(null)
  const [selected, setSelected] = useState<Control | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('ccm'))
      .then(r => r.json())
      .then(d => {
        setData(d)
        const firstFail = d.controls?.find((c: Control) => c.status === 'failing')
        const firstDegraded = d.controls?.find((c: Control) => c.status === 'degraded')
        setSelected(firstFail ?? firstDegraded ?? d.controls?.[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const s = data.summary

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Core Compliance"
        title="Continuous Control Monitoring"
        subtitle="Real-time and batch control testing across AML, KYC, trading, privacy, and operational resilience frameworks. Event-driven controls fire on activity; batch controls run on a cadence. Failures trigger remediation workflows."
        icon={Activity}
        accent="from-emerald-500 to-teal-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Controls Passing" value={s.passing} sub={`of ${data.total} total`} icon={CheckCircle2} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Degraded" value={s.degraded} sub="pass rate below 95%" icon={AlertTriangle} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Failing" value={s.failing} sub="immediate action" icon={XCircle} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="Evidence Items" value={s.totalEvidenceItems} sub={`avg pass ${s.avgPassRate}%`} icon={FileCheck2} tint="text-violet-700 bg-violet-50" />
      </div>

      <Card className="border-slate-200 bg-slate-50/50">
        <CardContent className="flex flex-wrap items-center gap-4 p-4 text-xs">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-rose-600" />
            <span className="font-semibold text-slate-700">{s.eventDriven} event-driven</span>
            <span className="text-slate-500">real-time + on-event</span>
          </div>
          <div className="h-4 w-px bg-slate-300" />
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-600" />
            <span className="font-semibold text-slate-700">{s.batch} batch</span>
            <span className="text-slate-500">minute / hourly / 15-min</span>
          </div>
          <div className="h-4 w-px bg-slate-300" />
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-600" />
            <span className="font-semibold text-slate-700">{s.scheduled} scheduled</span>
            <span className="text-slate-500">daily / weekly</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Control Registry — sorted by status risk</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {[...data.controls].sort((a, b) => {
                const order: Record<string, number> = { failing: 0, degraded: 1, passing: 2 }
                return order[a.status] - order[b.status]
              }).map(c => {
                const meta = statusMeta[c.status]
                const Icon = meta.icon
                const fmeta = freqMeta[c.frequency] ?? freqMeta['daily']
                const FIcon = fmeta.icon
                const isSelected = selected?.id === c.id
                return (
                  <button key={c.id} onClick={() => setSelected(c)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${meta.tint}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-500">{c.controlId}</span>
                        <Badge variant="outline" className={`text-[9px] ${meta.tint}`}>{meta.label}</Badge>
                        <Badge variant="outline" className="text-[9px] text-slate-600">
                          <FIcon className={`mr-0.5 h-2.5 w-2.5 ${fmeta.tint}`} />
                          {fmeta.label}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-slate-700">{c.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {c.framework} · {c.owner} · pass {c.passRate}%
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        last run {relTime(c.lastRunAt)} · {c.evidenceCount} evidence items
                      </p>
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
                    <span className="font-mono text-xs text-slate-500">{selected.controlId}</span>
                    <span className="text-slate-800">{selected.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Framework', selected.framework],
                    ['Frequency', selected.frequency.replace(/-/g, ' ')],
                    ['Owner', selected.owner],
                    ['Status', statusMeta[selected.status].label],
                    ['Pass Rate', `${selected.passRate}%`],
                    ['Evidence Items', `${selected.evidenceCount}`],
                    ['Last Run', relTime(selected.lastRunAt)],
                    ['Next Run', relTime(selected.nextRunAt)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono text-right text-slate-800">{v}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-2"><CardTitle className="text-xs">Recent Test Runs</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-end gap-2 h-20">
                    {selected.history.map((run, i) => {
                      const h = Math.max(10, (run.passRate / 100) * 80)
                      const tint = run.result === 'pass' ? 'bg-emerald-400' : run.result === 'warn' ? 'bg-amber-400' : 'bg-rose-400'
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className={`w-full rounded-t ${tint}`} style={{ height: `${h}px` }} title={`${run.passRate}% — ${run.result}`} />
                          <span className="text-[9px] text-slate-500">{relTime(run.runAt)}</span>
                        </div>
                      )
                    })}
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
