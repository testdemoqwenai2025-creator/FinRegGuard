'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Scale, CheckCircle2, AlertTriangle, XCircle, Users, BrainCircuit, ShieldAlert } from 'lucide-react'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type FairnessMetrics = {
  disparateImpactRatio: number
  demographicParityDiff: number
  equalOpportunityDiff: number
  predictiveParity: number
  calibrationByGroup: number
  falsePositiveRateRatio: number
}

type ProtectedGroup = {
  name: string
  approvalRate: number
  count: number
}

type ProtectedClass = {
  attribute: string
  groups: ProtectedGroup[]
}

type FairModel = {
  id: string
  modelId: string
  name: string
  useCase: string
  lastTestedAt: string
  fairnessMetrics: FairnessMetrics
  status: 'passing' | 'warning' | 'failing'
  eeocFourFifthsRulePassed: boolean
  protectedClassBreakdown: ProtectedClass[]
  proxyAttributesDetected: string[]
  remediationActions: string[]
  aiRecommendation: AIRec
}

type FairData = {
  models: FairModel[]
  total: number
  summary: {
    passing: number
    warning: number
    failing: number
    eeocRulePassed: number
    avgDisparateImpactRatio: number
    modelsWithProxiesDetected: number
  }
}

const statusMeta: Record<FairModel['status'], { icon: typeof CheckCircle2; tint: string; label: string }> = {
  passing:  { icon: CheckCircle2, tint: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Passing' },
  warning:  { icon: AlertTriangle, tint: 'text-amber-700 bg-amber-50 border-amber-200', label: 'Warning' },
  failing:  { icon: XCircle, tint: 'text-rose-700 bg-rose-50 border-rose-200', label: 'Failing' },
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

// EEOC 4/5ths rule: disparate impact ratio must be >= 0.80
const EEOC_THRESHOLD = 0.80

export function FairnessTestingView() {
  const [data, setData] = useState<FairData | null>(null)
  const [selected, setSelected] = useState<FairModel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/fairness.json')
      .then(r => r.json())
      .then(d => {
        setData(d)
        const firstFail = d.models?.find((m: FairModel) => m.status === 'failing')
        const firstWarn = d.models?.find((m: FairModel) => m.status === 'warning')
        setSelected(firstFail ?? firstWarn ?? d.models?.[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const s = data.summary

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Intelligence & Automation"
        title="Algorithmic Discrimination Testing"
        subtitle="Fairness metrics across protected classes — disparate impact ratio (EEOC 4/5ths rule), demographic parity, equal opportunity, predictive parity, calibration. Disparate impact testing, proxy attribute detection, and remediation tracking for AI/ML credit, insurance, fraud, hiring, and pricing models."
        icon={Scale}
        accent="from-blue-500 to-indigo-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Models Passing" value={s.passing} sub={`of ${data.total} tested`} icon={CheckCircle2} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Warnings" value={s.warning} sub="below threshold" icon={AlertTriangle} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Failing" value={s.failing} sub="EEOC violation risk" icon={XCircle} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="Avg DIR" value={s.avgDisparateImpactRatio.toFixed(2)} sub="disparate impact ratio" icon={Scale} tint="text-violet-700 bg-violet-50" />
      </div>

      <Card className="border-amber-200 bg-amber-50/40">
        <CardContent className="flex items-start gap-3 p-4 text-xs">
          <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">EEOC 4/5ths Rule</p>
            <p className="text-amber-700">
              The US Equal Employment Opportunity Commission requires the selection rate for any protected group to be at least 80% (4/5ths) of the rate for the highest-selected group. A disparate impact ratio below 0.80 indicates potential discrimination requiring remediation under ECOA, FCRA, and Title VII.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BrainCircuit className="h-3.5 w-3.5" />
              Model Fairness Register — sorted by risk
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {[...data.models].sort((a, b) => a.fairnessMetrics.disparateImpactRatio - b.fairnessMetrics.disparateImpactRatio).map(m => {
                const meta = statusMeta[m.status]
                const Icon = meta.icon
                const isSelected = selected?.id === m.id
                const dir = m.fairnessMetrics.disparateImpactRatio
                const dirTint = dir >= 0.90 ? 'text-emerald-600' : dir >= 0.80 ? 'text-amber-600' : 'text-rose-600'
                return (
                  <button key={m.id} onClick={() => setSelected(m)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-blue-50/40' : ''}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${meta.tint}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500">{m.modelId}</span>
                        <Badge variant="outline" className={`text-[9px] ${meta.tint}`}>{meta.label}</Badge>
                        {m.proxyAttributesDetected.length > 0 && (
                          <Badge variant="outline" className="text-[9px] border-rose-200 bg-rose-50 text-rose-700">
                            {m.proxyAttributesDetected.length} proxy attr
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-slate-700">{m.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{m.useCase}</p>
                      {/* Disparate impact bar */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden relative">
                          <div
                            className={`h-full ${dir >= 0.90 ? 'bg-emerald-400' : dir >= 0.80 ? 'bg-amber-400' : 'bg-rose-400'}`}
                            style={{ width: `${Math.min(100, dir * 100)}%` }}
                          />
                          {/* 0.80 threshold marker */}
                          <div className="absolute top-0 bottom-0 w-px bg-slate-700" style={{ left: `${EEOC_THRESHOLD * 100}%` }} title="EEOC 4/5 threshold" />
                        </div>
                        <span className={`text-[10px] font-mono font-semibold ${dirTint}`}>
                          {dir.toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-400">tested {relTime(m.lastTestedAt)}</p>
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
                    <span className="font-mono text-xs text-slate-500">{selected.modelId}</span>
                    <span className="text-slate-800">{selected.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <p className="text-[11px] text-slate-600">{selected.useCase}</p>
                  {[
                    ['Status', statusMeta[selected.status].label],
                    ['EEOC 4/5 Rule', selected.eeocFourFifthsRulePassed ? 'PASS' : 'FAIL'],
                    ['Last Tested', relTime(selected.lastTestedAt)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono text-right text-slate-800">{v}</span>
                    </div>
                  ))}
                  {/* Fairness metrics grid */}
                  <div className="pt-2 grid grid-cols-2 gap-2">
                    {([
                      ['Disparate Impact Ratio', selected.fairnessMetrics.disparateImpactRatio.toFixed(2), selected.fairnessMetrics.disparateImpactRatio >= 0.80],
                      ['Demographic Parity Diff', selected.fairnessMetrics.demographicParityDiff.toFixed(2), selected.fairnessMetrics.demographicParityDiff <= 0.10],
                      ['Equal Opportunity Diff', selected.fairnessMetrics.equalOpportunityDiff.toFixed(2), selected.fairnessMetrics.equalOpportunityDiff <= 0.10],
                      ['Predictive Parity', selected.fairnessMetrics.predictiveParity.toFixed(2), selected.fairnessMetrics.predictiveParity >= 0.90],
                      ['Calibration by Group', selected.fairnessMetrics.calibrationByGroup.toFixed(2), selected.fairnessMetrics.calibrationByGroup >= 0.90],
                      ['FPR Ratio', selected.fairnessMetrics.falsePositiveRateRatio.toFixed(2), selected.fairnessMetrics.falsePositiveRateRatio <= 1.25],
                    ] as Array<[string, string, boolean]>).map(([label, val, ok]) => (
                      <div key={label} className="flex flex-col rounded-md border border-slate-100 bg-slate-50 px-2 py-1">
                        <span className="text-[9px] text-slate-500">{label}</span>
                        <span className={`text-sm font-mono font-semibold ${ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Protected class breakdown */}
              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Protected Class Approval Rates
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {selected.protectedClassBreakdown.map(pc => (
                    <div key={pc.attribute} className="mb-2">
                      <p className="text-[10px] text-slate-500 mb-1">{pc.attribute}</p>
                      <div className="flex flex-wrap gap-1">
                        {pc.groups.map(g => {
                          const tint = g.approvalRate >= 0.65 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : g.approvalRate >= 0.55 ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                          return (
                            <Badge key={g.name} variant="outline" className={`text-[9px] ${tint}`}>
                              {g.name}: {(g.approvalRate * 100).toFixed(0)}%
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {selected.proxyAttributesDetected.length > 0 && (
                <Card className="border-rose-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center gap-1.5 text-rose-800">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Proxy Attributes Detected
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {selected.proxyAttributesDetected.map(p => (
                        <Badge key={p} variant="outline" className="text-[9px] border-rose-200 bg-rose-50 text-rose-700">
                          {p}
                        </Badge>
                      ))}
                    </div>
                    {selected.remediationActions.length > 0 && (
                      <div>
                        <p className="text-[10px] text-slate-500 mb-1">Remediation Actions</p>
                        <ul className="space-y-0.5">
                          {selected.remediationActions.map(a => (
                            <li key={a} className="text-[10px] text-slate-700 flex items-start gap-1.5">
                              <span className="text-rose-500 mt-0.5">→</span>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <BooleanActionCard rec={selected.aiRecommendation} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
