'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, BrainCircuit, Gauge } from 'lucide-react'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Metric = {
  id: string
  metricId: string
  name: string
  jurisdiction: string
  baselineValue: number
  currentValue: number
  adaptiveThreshold: number
  driftPercent: number
  thresholdType: 'upper' | 'lower'
  anomalyScore: number // 0..1
  isBreached: boolean
  modelVersion: string
  anomaliesLast24h: number
  lastTrainedAt: string
  aiRecommendation: AIRec
}

type MetricsData = {
  metrics: Metric[]
  total: number
  summary: {
    breached: number
    highAnomaly: number
    withinThreshold: number
    avgAnomalyScore: number
    modelsInUse: number
    anomaliesLast24h: number
  }
}

function fmtNum(v: number) {
  if (v >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 })
  if (v >= 10) return v.toFixed(1)
  return v.toFixed(2)
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

export function AdaptiveThresholdsView() {
  const [data, setData] = useState<MetricsData | null>(null)
  const [selected, setSelected] = useState<Metric | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/adaptive-thresholds.json')
      .then(r => r.json())
      .then(d => {
        setData(d)
        const firstBreached = d.metrics?.find((m: Metric) => m.isBreached)
        const firstHigh = d.metrics?.find((m: Metric) => !m.isBreached && m.anomalyScore > 0.3)
        setSelected(firstBreached ?? firstHigh ?? d.metrics?.[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const s = data.summary

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Surveillance"
        title="Adaptive Thresholds & ML Anomaly Detection"
        subtitle="ML-driven baselines that adapt to seasonality and trend. Static rule thresholds are replaced by model-predicted ranges — isolation forest, EWMA, Prophet, and LSTM detect drift before it becomes a breach."
        icon={BrainCircuit}
        accent="from-rose-500 to-red-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Breached" value={s.breached} sub="above adaptive threshold" icon={AlertTriangle} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="High Anomaly" value={s.highAnomaly} sub="score > 0.5" icon={Activity} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Within Range" value={s.withinThreshold} sub="normal operation" icon={CheckCircle2} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Anomalies 24h" value={s.anomaliesLast24h} sub={`${s.modelsInUse} models in use`} icon={Gauge} tint="text-violet-700 bg-violet-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BrainCircuit className="h-3.5 w-3.5" />
              Metric Watchlist — sorted by anomaly score
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {[...data.metrics].sort((a, b) => b.anomalyScore - a.anomalyScore).map(m => {
                const TrendIcon = m.thresholdType === 'upper' ? TrendingUp : TrendingDown
                const driftTint = m.isBreached
                  ? 'text-rose-600'
                  : m.anomalyScore > 0.3 ? 'text-amber-600' : 'text-slate-500'
                const isSelected = selected?.id === m.id
                return (
                  <button key={m.id} onClick={() => setSelected(m)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-rose-50/40' : ''}`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200">
                      <TrendIcon className={`h-4 w-4 ${driftTint}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500">{m.metricId}</span>
                        {m.isBreached && (
                          <Badge variant="outline" className="text-[9px] border-rose-200 bg-rose-50 text-rose-700">
                            BREACHED
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[9px] text-slate-600">{m.modelVersion}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-slate-700">{m.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {m.jurisdiction} · baseline {fmtNum(m.baselineValue)} · current {fmtNum(m.currentValue)}
                      </p>
                      {/* Anomaly score bar */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full ${m.anomalyScore > 0.5 ? 'bg-rose-500' : m.anomalyScore > 0.2 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.max(2, m.anomalyScore * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{m.anomalyScore.toFixed(2)}</span>
                        <span className={`text-[10px] font-medium ${driftTint}`}>
                          {m.driftPercent > 0 ? '+' : ''}{m.driftPercent}%
                        </span>
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
                    <Gauge className="h-4 w-4 text-rose-600" />
                    {selected.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Metric ID', selected.metricId],
                    ['Jurisdiction', selected.jurisdiction],
                    ['Threshold Type', selected.thresholdType],
                    ['Baseline', fmtNum(selected.baselineValue)],
                    ['Current', fmtNum(selected.currentValue)],
                    ['Adaptive Threshold', fmtNum(selected.adaptiveThreshold)],
                    ['Drift', `${selected.driftPercent > 0 ? '+' : ''}${selected.driftPercent}%`],
                    ['Anomaly Score', selected.anomalyScore.toFixed(3)],
                    ['Breached', selected.isBreached ? 'YES' : 'no'],
                    ['Model', selected.modelVersion],
                    ['Anomalies 24h', `${selected.anomaliesLast24h}`],
                    ['Last Trained', relTime(selected.lastTrainedAt)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono text-right text-slate-800">{v}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Threshold visual */}
              <Card className="border-slate-200">
                <CardHeader className="pb-2"><CardTitle className="text-xs">Threshold Visualization</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <div className="relative h-16 rounded-md bg-slate-50 border border-slate-200 overflow-hidden">
                    {/* Threshold marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-400"
                      style={{
                        left: `${Math.min(95, (selected.adaptiveThreshold / (selected.baselineValue * 2)) * 100)}%`,
                      }}
                      title={`Adaptive threshold: ${fmtNum(selected.adaptiveThreshold)}`}
                    >
                      <span className="absolute -top-0 -right-12 text-[9px] text-rose-600 font-mono whitespace-nowrap">
                        thresh {fmtNum(selected.adaptiveThreshold)}
                      </span>
                    </div>
                    {/* Baseline marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-400"
                      style={{ left: `${(selected.baselineValue / (selected.baselineValue * 2)) * 100}%` }}
                      title={`Baseline: ${fmtNum(selected.baselineValue)}`}
                    />
                    {/* Current value marker */}
                    <div
                      className={`absolute top-0 bottom-0 w-1 ${selected.isBreached ? 'bg-rose-600' : 'bg-emerald-500'}`}
                      style={{ left: `${Math.min(98, (selected.currentValue / (selected.baselineValue * 2)) * 100)}%` }}
                      title={`Current: ${fmtNum(selected.currentValue)}`}
                    />
                    <div className="absolute bottom-1 left-2 text-[9px] text-slate-500">0</div>
                    <div className="absolute bottom-1 right-2 text-[9px] text-slate-500">{fmtNum(selected.baselineValue * 2)}</div>
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                    <span><span className="inline-block h-2 w-2 mr-1 align-middle bg-slate-400" />baseline</span>
                    <span><span className="inline-block h-2 w-2 mr-1 align-middle bg-rose-400" />adaptive threshold</span>
                    <span><span className={`inline-block h-2 w-2 mr-1 align-middle ${selected.isBreached ? 'bg-rose-600' : 'bg-emerald-500'}`} />current</span>
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
