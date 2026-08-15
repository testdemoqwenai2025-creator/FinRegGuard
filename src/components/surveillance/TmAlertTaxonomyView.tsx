'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Radar, AlertTriangle, ShieldAlert, Cpu, Filter } from 'lucide-react'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'
import { dataUrl } from '@/lib/data'

type Category = {
  id: string
  code: string
  name: string
  category: string
  fatfRef: string
  detectionMethod: 'rule' | 'ml-model' | 'hybrid' | 'manual'
  riskSeverity: 'low' | 'medium' | 'high' | 'critical'
  autoEscalate: boolean
  alerts30d: number
  falsePositivePct: number
  avgResolutionHours: number
  description: string
  aiRecommendation: AIRec
}

type TaxData = {
  categories: Category[]
  total: number
  summary: {
    totalCategories: number
    totalAlerts30d: number
    avgFalsePositivePct: number
    autoEscalateCategories: number
    criticalSeverityCategories: number
    detectionMethods: { rule: number; 'ml-model': number; hybrid: number; manual: number }
  }
}

const severityTint: Record<string, string> = {
  critical: 'text-rose-700 bg-rose-50 border-rose-200',
  high: 'text-orange-700 bg-orange-50 border-orange-200',
  medium: 'text-amber-700 bg-amber-50 border-amber-200',
  low: 'text-emerald-700 bg-emerald-50 border-emerald-200',
}

const severityDot: Record<string, string> = {
  critical: 'bg-rose-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
}

const methodIcon: Record<string, typeof Cpu> = {
  rule: Filter,
  'ml-model': Cpu,
  hybrid: Radar,
  manual: AlertTriangle,
}

const severityRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

export function TmAlertTaxonomyView() {
  const [data, setData] = useState<TaxData | null>(null)
  const [selected, setSelected] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'auto-escalate' | 'high-fp'>('all')

  useEffect(() => {
    fetch(dataUrl('tm-alert-taxonomy'))
      .then(r => r.json())
      .then(d => {
        setData(d)
        // Default-select first critical + auto-escalate category
        const firstCritical = d.categories?.find((c: Category) => c.riskSeverity === 'critical' && c.autoEscalate)
        setSelected(firstCritical ?? d.categories?.[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const s = data.summary

  // Filtered list based on filter mode
  const filtered = data.categories.filter(c => {
    if (filter === 'auto-escalate') return c.autoEscalate
    if (filter === 'high-fp') return c.falsePositivePct >= 40
    return true
  })

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Surveillance"
        title="Transaction Monitoring Alert Taxonomy"
        subtitle="20 primary alert categories mapped to FATF RE-2023 typologies. Each category carries detection method (rule / ML / hybrid / manual), risk severity, auto-escalation flag, false-positive rate, and 30-day alert volume."
        icon={Radar}
        accent="from-cyan-500 to-blue-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Categories" value={s.totalCategories} sub="FATF RE-2023 aligned" icon={Radar} tint="text-cyan-700 bg-cyan-50" />
        <KpiTile label="Alerts 30d" value={s.totalAlerts30d.toLocaleString()} sub="across all categories" icon={AlertTriangle} tint="text-blue-700 bg-blue-50" />
        <KpiTile label="Avg FP Rate" value={`${s.avgFalsePositivePct}%`} sub="tuning opportunities exist" icon={Filter} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Auto-Escalate" value={s.autoEscalateCategories} sub="bypass L1 triage" icon={ShieldAlert} tint="text-rose-700 bg-rose-50" />
      </div>

      {/* Detection method breakdown banner */}
      <Card className="border-cyan-200/60 bg-gradient-to-br from-cyan-50/40 to-blue-50/40">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-semibold text-slate-700">Detection methods:</span>
            {[
              { method: 'rule', label: 'Rule-based', icon: Filter, count: s.detectionMethods.rule },
              { method: 'ml-model', label: 'ML model', icon: Cpu, count: s.detectionMethods['ml-model'] },
              { method: 'hybrid', label: 'Hybrid', icon: Radar, count: s.detectionMethods.hybrid },
              { method: 'manual', label: 'Manual', icon: AlertTriangle, count: s.detectionMethods.manual },
            ].map(m => {
              const Icon = m.icon
              return (
                <div key={m.method} className="flex items-center gap-1.5">
                  <Icon className="h-3 w-3 text-slate-500" />
                  <span className="text-slate-600">{m.label}</span>
                  <Badge variant="outline" className="text-[9px] text-slate-600">{m.count}</Badge>
                </div>
              )
            })}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-slate-500">Filter:</span>
              <button
                onClick={() => setFilter('all')}
                className={`rounded-full border px-2 py-0.5 text-[10px] ${filter === 'all' ? 'border-slate-400 bg-slate-100 text-slate-800' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
              >all</button>
              <button
                onClick={() => setFilter('auto-escalate')}
                className={`rounded-full border px-2 py-0.5 text-[10px] ${filter === 'auto-escalate' ? 'border-rose-400 bg-rose-100 text-rose-800' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
              >auto-escalate</button>
              <button
                onClick={() => setFilter('high-fp')}
                className={`rounded-full border px-2 py-0.5 text-[10px] ${filter === 'high-fp' ? 'border-amber-400 bg-amber-100 text-amber-800' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
              >FP &gt;= 40%</button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Category registry */}
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Radar className="h-3.5 w-3.5" />
              TM Categories — sorted by severity then alert volume
              {filter !== 'all' && (
                <Badge variant="outline" className="text-[9px] ml-1 text-cyan-700">
                  {filtered.length} of {data.categories.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {[...filtered]
                .sort((a, b) => {
                  const sevDiff = severityRank[a.riskSeverity] - severityRank[b.riskSeverity]
                  if (sevDiff !== 0) return sevDiff
                  return b.alerts30d - a.alerts30d
                })
                .map(c => {
                  const Icon = methodIcon[c.detectionMethod] ?? Filter
                  const isSelected = selected?.id === c.id
                  const fpTint = c.falsePositivePct >= 40 ? 'text-rose-600'
                    : c.falsePositivePct >= 25 ? 'text-amber-600'
                    : 'text-emerald-600'
                  return (
                    <button key={c.id} onClick={() => setSelected(c)}
                      className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-cyan-50/40' : ''}`}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200">
                        <Icon className={`h-4 w-4 ${severityDot[c.riskSeverity] ? 'text-slate-600' : 'text-slate-400'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500">{c.code}</span>
                          <Badge variant="outline" className={`text-[9px] ${severityTint[c.riskSeverity]}`}>
                            {c.riskSeverity}
                          </Badge>
                          {c.autoEscalate && (
                            <Badge variant="outline" className="text-[9px] border-rose-300 bg-rose-100 text-rose-700">
                              AUTO-ESCALATE
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[9px] text-slate-600">
                            {c.detectionMethod}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-slate-700">{c.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {c.alerts30d.toLocaleString()} alerts/30d · {c.avgResolutionHours}h avg · {c.fatfRef}
                        </p>
                        {/* FP bar */}
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full ${c.falsePositivePct >= 40 ? 'bg-rose-500' : c.falsePositivePct >= 25 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                              style={{ width: `${Math.min(100, c.falsePositivePct * 1.5)}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-mono ${fpTint}`}>
                            {c.falsePositivePct}% FP
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detail panel */}
        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <>
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Radar className="h-4 w-4 text-cyan-600" />
                    {selected.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Code', selected.code],
                    ['Category Slug', selected.category],
                    ['FATF Reference', selected.fatfRef],
                    ['Detection Method', selected.detectionMethod],
                    ['Risk Severity', selected.riskSeverity],
                    ['Auto-Escalate', selected.autoEscalate ? 'YES (bypass L1)' : 'no'],
                    ['Alerts 30d', selected.alerts30d.toLocaleString()],
                    ['False Positive Rate', `${selected.falsePositivePct}%`],
                    ['Avg Resolution', `${selected.avgResolutionHours} hours`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono text-right text-slate-800">{v}</span>
                    </div>
                  ))}
                  <p className="pt-2 text-slate-600">{selected.description}</p>
                </CardContent>
              </Card>

              {/* FP rate visualization */}
              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs">False-Positive Rate — tuning opportunity</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="relative h-12 rounded-md bg-slate-50 border border-slate-200 overflow-hidden">
                    {/* 25% tuning threshold marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400"
                      style={{ left: `${25 * 1.5}%` }}
                      title="FP tuning threshold (25%)"
                    >
                      <span className="absolute -top-0 -right-8 text-[9px] text-amber-600 font-mono whitespace-nowrap">
                        25%
                      </span>
                    </div>
                    {/* 40% critical threshold */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-400"
                      style={{ left: `${40 * 1.5}%` }}
                      title="FP critical threshold (40%)"
                    >
                      <span className="absolute -top-0 -right-8 text-[9px] text-rose-600 font-mono whitespace-nowrap">
                        40%
                      </span>
                    </div>
                    {/* Current value */}
                    <div
                      className={`absolute top-0 bottom-0 w-1 ${selected.falsePositivePct >= 40 ? 'bg-rose-500' : selected.falsePositivePct >= 25 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ left: `${Math.min(100, selected.falsePositivePct * 1.5)}%` }}
                      title={`Current FP: ${selected.falsePositivePct}%`}
                    >
                      <span className={`absolute -bottom-4 -left-4 text-[9px] font-mono ${selected.falsePositivePct >= 40 ? 'text-rose-700' : selected.falsePositivePct >= 25 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {selected.falsePositivePct}%
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-[10px] text-slate-500">
                    {selected.falsePositivePct >= 40
                      ? 'CRITICAL — FP rate above 40% indicates rule tuning or model retraining required'
                      : selected.falsePositivePct >= 25
                        ? 'WARN — FP rate above 25% suggests tuning opportunity exists'
                        : 'OK — FP rate within acceptable range (<25%)'}
                  </p>
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
