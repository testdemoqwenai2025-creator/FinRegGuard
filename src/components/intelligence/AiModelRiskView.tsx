'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Brain, ShieldAlert, CheckCircle2, AlertTriangle, UserCheck, Calendar } from 'lucide-react'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'
import { dataUrl } from '@/lib/data'

type Model = {
  id: string
  modelId: string
  name: string
  tier: 'critical' | 'high' | 'medium' | 'low'
  useCase: string
  owner: string
  approvalAuthority: string
  deployedAt: string
  lastAuditAt: string
  nextAuditAt: string
  auditFrequencyMonths: number
  humanOverrideRequired: boolean
  overrideRatePct: number
  retrainingCadenceMonths: number
  lastRetrainedAt: string
  biasTestRequired: boolean
  lastBiasTestAt: string | null
  biasTestResult: 'pass' | 'warn' | 'fail' | 'n/a'
  disparateImpactRatio: number | null
  explainabilityMethod: string
  dataLineageDoc: string
  modelInventoryUrl: string
  status: string
  aiRecommendation: AIRec
}

type ModelData = {
  models: Model[]
  total: number
  summary: {
    totalModels: number
    critical: number
    high: number
    medium: number
    low: number
    humanOverrideRequired: number
    biasTestIssues: number
    quarantinePending: number
    avgDisparateImpactRatio: number
  }
}

const tierTint: Record<string, string> = {
  critical: 'text-rose-700 bg-rose-50 border-rose-200',
  high: 'text-orange-700 bg-orange-50 border-orange-200',
  medium: 'text-amber-700 bg-amber-50 border-amber-200',
  low: 'text-emerald-700 bg-emerald-50 border-emerald-200',
}

const tierDot: Record<string, string> = {
  critical: 'bg-rose-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
}

const tierRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

function relTime(iso: string | null): string {
  if (!iso) return 'n/a'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

function daysUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

export function AiModelRiskView() {
  const [data, setData] = useState<ModelData | null>(null)
  const [selected, setSelected] = useState<Model | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('ai-model-risk'))
      .then(r => r.json())
      .then(d => {
        setData(d)
        // Default-select the first critical-tier model with bias issues, else first critical
        const withIssue = d.models?.find((m: Model) =>
          m.tier === 'critical' && (m.biasTestResult === 'warn' || m.biasTestResult === 'fail'))
        const firstCritical = d.models?.find((m: Model) => m.tier === 'critical')
        setSelected(withIssue ?? firstCritical ?? d.models?.[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const s = data.summary

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Intelligence & Automation"
        title="AI/ML Model Risk Tiers"
        subtitle="Four-tier classification (Critical / High / Medium / Low) for deployed AI/ML models with governance requirements, human-override mandates, audit frequencies, and bias testing cadence. Aligned with EU AI Act risk categories and Federal Reserve SR 11-7."
        icon={Brain}
        accent="from-violet-500 to-purple-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Critical Tier" value={s.critical} sub="board approval + 6mo audit" icon={ShieldAlert} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="High Tier" value={s.high} sub="CEO/CRO sign-off + 12mo audit" icon={AlertTriangle} tint="text-orange-700 bg-orange-50" />
        <KpiTile label="Human Override" value={s.humanOverrideRequired} sub="models requiring manual review" icon={UserCheck} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Bias Test Issues" value={s.biasTestIssues} sub="warn/fail DIR or stale test" icon={AlertTriangle} tint="text-rose-700 bg-rose-50" />
      </div>

      {/* Tier governance framework banner */}
      <Card className="border-violet-200/60 bg-gradient-to-br from-violet-50/40 to-purple-50/40">
        <CardContent className="py-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { tier: 'critical', label: 'Critical', gov: 'Board + MRC', audit: '6mo', dir: '>= 0.80' },
              { tier: 'high',     label: 'High',     gov: 'CEO + CRO',  audit: '12mo', dir: '>= 0.80' },
              { tier: 'medium',   label: 'Medium',   gov: 'Senior Compliance', audit: '18mo', dir: 'recommended' },
              { tier: 'low',      label: 'Low',      gov: 'Team Lead',  audit: '24mo', dir: 'n/a' },
            ].map(t => (
              <div key={t.tier} className="rounded-md border border-slate-200 bg-white p-2">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${tierDot[t.tier]}`} />
                  <span className="font-semibold text-slate-700">{t.label}</span>
                </div>
                <div className="mt-1 space-y-0.5 text-[10px] text-slate-500">
                  <div>Gov: <span className="font-mono text-slate-700">{t.gov}</span></div>
                  <div>Audit: <span className="font-mono text-slate-700">{t.audit}</span></div>
                  <div>DIR: <span className="font-mono text-slate-700">{t.dir}</span></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Model registry */}
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-3.5 w-3.5" />
              Model Inventory — sorted by tier then bias test status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {[...data.models]
                .sort((a, b) => {
                  // Sort by tier first (critical -> low)
                  const tierDiff = tierRank[a.tier] - tierRank[b.tier]
                  if (tierDiff !== 0) return tierDiff
                  // Then by bias test result (fail -> warn -> pass -> n/a)
                  const biasRank: Record<string, number> = { fail: 0, warn: 1, pass: 2, 'n/a': 3 }
                  return (biasRank[a.biasTestResult] ?? 4) - (biasRank[b.biasTestResult] ?? 4)
                })
                .map(m => {
                  const isSelected = selected?.id === m.id
                  const biasTint = m.biasTestResult === 'fail' ? 'text-rose-600'
                    : m.biasTestResult === 'warn' ? 'text-amber-600'
                    : m.biasTestResult === 'pass' ? 'text-emerald-600'
                    : 'text-slate-400'
                  const auditDaysUntil = daysUntil(m.nextAuditAt)
                  const auditTint = auditDaysUntil < 30 ? 'text-rose-600' : auditDaysUntil < 90 ? 'text-amber-600' : 'text-slate-500'
                  return (
                    <button key={m.id} onClick={() => setSelected(m)}
                      className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-violet-50/40' : ''}`}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200">
                        <Brain className={`h-4 w-4 ${biasTint}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500">{m.modelId}</span>
                          <Badge variant="outline" className={`text-[9px] ${tierTint[m.tier]}`}>
                            {m.tier}
                          </Badge>
                          {m.humanOverrideRequired && (
                            <Badge variant="outline" className="text-[9px] border-blue-200 bg-blue-50 text-blue-700">
                              <UserCheck className="h-2 w-2 mr-0.5" />override
                            </Badge>
                          )}
                          {m.status.includes('quarantine') && (
                            <Badge variant="outline" className="text-[9px] border-rose-300 bg-rose-100 text-rose-700">
                              QUARANTINE
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-slate-700">{m.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {m.owner} · {m.useCase.slice(0, 60)}{m.useCase.length > 60 ? '...' : ''}
                        </p>
                        {/* Bias + audit indicators */}
                        <div className="mt-1.5 flex items-center gap-3 text-[10px]">
                          {m.disparateImpactRatio !== null && (
                            <span className={`font-mono ${biasTint}`}>
                              DIR {m.disparateImpactRatio.toFixed(2)}
                            </span>
                          )}
                          <span className={`flex items-center gap-0.5 ${auditTint}`}>
                            <Calendar className="h-2.5 w-2.5" />
                            audit in {auditDaysUntil}d
                          </span>
                          {m.biasTestRequired && (
                            <span className={biasTint}>
                              bias: {m.biasTestResult}
                            </span>
                          )}
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
                    <Brain className="h-4 w-4 text-violet-600" />
                    {selected.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Model ID', selected.modelId],
                    ['Tier', selected.tier],
                    ['Use Case', selected.useCase],
                    ['Owner', selected.owner],
                    ['Approval Authority', selected.approvalAuthority],
                    ['Deployed', relTime(selected.deployedAt)],
                    ['Last Audit', relTime(selected.lastAuditAt)],
                    ['Next Audit', `${daysUntil(selected.nextAuditAt)}d`],
                    ['Audit Frequency', `${selected.auditFrequencyMonths} months`],
                    ['Retraining Cadence', `${selected.retrainingCadenceMonths} months`],
                    ['Last Retrained', relTime(selected.lastRetrainedAt)],
                    ['Human Override', selected.humanOverrideRequired ? 'REQUIRED' : 'not required'],
                    ['Override Rate', `${selected.overrideRatePct}%`],
                    ['Bias Test Required', selected.biasTestRequired ? 'yes' : 'no'],
                    ['Last Bias Test', relTime(selected.lastBiasTestAt)],
                    ['Bias Result', selected.biasTestResult],
                    ['Disparate Impact Ratio', selected.disparateImpactRatio !== null ? selected.disparateImpactRatio.toFixed(3) : 'n/a'],
                    ['Explainability', selected.explainabilityMethod],
                    ['Status', selected.status],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono text-right text-slate-800">{v}</span>
                    </div>
                  ))}
                  <p className="pt-1 text-[10px] text-slate-400">
                    Data lineage: <span className="font-mono">{selected.dataLineageDoc}</span>
                  </p>
                </CardContent>
              </Card>

              {/* DIR threshold visualization */}
              {selected.disparateImpactRatio !== null && (
                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs">EEOC 4/5ths Rule — Disparate Impact Ratio</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="relative h-12 rounded-md bg-slate-50 border border-slate-200 overflow-hidden">
                      {/* 0.80 threshold marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-rose-400"
                        style={{ left: '80%' }}
                        title="EEOC 4/5ths threshold (0.80)"
                      >
                        <span className="absolute -top-0 -right-12 text-[9px] text-rose-600 font-mono whitespace-nowrap">
                          0.80
                        </span>
                      </div>
                      {/* Current value marker */}
                      <div
                        className={`absolute top-0 bottom-0 w-1 ${selected.disparateImpactRatio >= 0.80 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ left: `${selected.disparateImpactRatio * 100}%` }}
                        title={`Current DIR: ${selected.disparateImpactRatio.toFixed(3)}`}
                      >
                        <span className={`absolute -bottom-4 -left-4 text-[9px] font-mono ${selected.disparateImpactRatio >= 0.80 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {selected.disparateImpactRatio.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-4 text-[10px] text-slate-500">
                      {selected.disparateImpactRatio >= 0.80
                        ? 'PASS — ratio at or above EEOC 4/5ths threshold'
                        : 'FAIL — ratio below 0.80 indicates potential adverse impact on protected class'}
                    </p>
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
