'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileCheck2, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck } from 'lucide-react'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'
import { dataUrl } from '@/lib/data'

type SchremsFactors = {
  destinationSurveillance: 'low' | 'medium' | 'high'
  governmentAccessRisk: 'low' | 'medium' | 'high'
  redressAvailability: 'available' | 'limited' | 'none'
  supplementaryMeasures: string[]
}

type Tia = {
  id: string
  tiaId: string
  transferName: string
  sourceJurisdiction: string
  destinationJurisdiction: string
  transferMechanism: string
  sccVersion: string
  status: 'completed' | 'in-progress' | 'overdue' | 'blocked'
  residualRiskScore: number
  decisionDate: string | null
  startedAt: string
  nextReviewAt: string | null
  schremsIiFactors: SchremsFactors
  aiRecommendation: AIRec
}

type TiaData = {
  tias: Tia[]
  total: number
  summary: {
    completed: number
    inProgress: number
    overdue: number
    blocked: number
    avgResidualRisk: number
    schremsIiAnniversary: string
  }
}

const statusMeta: Record<Tia['status'], { icon: typeof CheckCircle2; tint: string; label: string }> = {
  completed:   { icon: CheckCircle2, tint: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Completed' },
  'in-progress': { icon: Clock, tint: 'text-amber-700 bg-amber-50 border-amber-200', label: 'In Progress' },
  overdue:     { icon: AlertTriangle, tint: 'text-orange-700 bg-orange-50 border-orange-200', label: 'Overdue' },
  blocked:     { icon: XCircle, tint: 'text-rose-700 bg-rose-50 border-rose-200', label: 'Blocked' },
}

const riskTint = (score: number) =>
  score <= 15 ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
  : score <= 35 ? 'text-amber-700 bg-amber-50 border-amber-200'
  : 'text-rose-700 bg-rose-50 border-rose-200'

const surveillanceTint = (level: string) =>
  level === 'high' ? 'text-rose-700 bg-rose-50'
  : level === 'medium' ? 'text-amber-700 bg-amber-50'
  : 'text-emerald-700 bg-emerald-50'

function relTime(iso: string | null) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 0) return `in ${Math.abs(Math.floor(diff / 86_400_000))}d`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

export function TiaView() {
  const [data, setData] = useState<TiaData | null>(null)
  const [selected, setSelected] = useState<Tia | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('tia'))
      .then(r => r.json())
      .then(d => {
        setData(d)
        const firstBlocked = d.tias?.find((t: Tia) => t.status === 'blocked')
        const firstOverdue = d.tias?.find((t: Tia) => t.status === 'overdue')
        setSelected(firstBlocked ?? firstOverdue ?? d.tias?.[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const s = data.summary

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Platform & Governance"
        title="Transfer Impact Assessments"
        subtitle={`Post-Schrems II TIAs for cross-border personal data transfers. Each TIA documents the destination country's surveillance regime, government access risk, redress availability, and supplementary measures required to make the transfer lawful under GDPR Chapter V.`}
        icon={FileCheck2}
        accent="from-slate-600 to-gray-700"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Completed" value={s.completed} sub={`avg risk ${s.avgResidualRisk}/100`} icon={CheckCircle2} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="In Progress" value={s.inProgress} sub="documentation phase" icon={Clock} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Overdue" value={s.overdue} sub="legal review required" icon={AlertTriangle} tint="text-orange-700 bg-orange-50" />
        <KpiTile label="Blocked" value={s.blocked} sub="transfer suspended" icon={XCircle} tint="text-rose-700 bg-rose-50" />
      </div>

      <Card className="border-violet-200 bg-violet-50/40">
        <CardContent className="flex items-center gap-3 p-4 text-xs">
          <ShieldCheck className="h-5 w-5 text-violet-700 shrink-0" />
          <div>
            <p className="font-semibold text-violet-900">Schrems II Anniversary: {s.schremsIiAnniversary}</p>
            <p className="text-violet-700">
              CJEU invalidated the EU-US Privacy Shield on 16 July 2020. All transfers to the US must use SCCs (2021/914) + a TIA documenting supplementary measures.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileCheck2 className="h-3.5 w-3.5" />
              TIA Register — sorted by status risk
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {[...data.tias].sort((a, b) => {
                const order: Record<string, number> = { blocked: 0, overdue: 1, 'in-progress': 2, completed: 3 }
                return order[a.status] - order[b.status]
              }).map(t => {
                const meta = statusMeta[t.status]
                const Icon = meta.icon
                const isSelected = selected?.id === t.id
                return (
                  <button key={t.id} onClick={() => setSelected(t)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-violet-50/40' : ''}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${meta.tint}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500">{t.tiaId}</span>
                        <Badge variant="outline" className={`text-[9px] ${meta.tint}`}>{meta.label}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-slate-700">{t.transferName}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500 flex items-center gap-1">
                        <span className="font-mono">{t.sourceJurisdiction}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-mono">{t.destinationJurisdiction}</span>
                        <span>· {t.transferMechanism}</span>
                      </p>
                      {t.status === 'completed' && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          residual risk <span className={`font-mono font-semibold ${riskTint(t.residualRiskScore).split(' ')[0]}`}>{t.residualRiskScore}/100</span>
                          · decided {relTime(t.decisionDate)}
                        </p>
                      )}
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
                    <span className="font-mono text-xs text-slate-500">{selected.tiaId}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <p className="text-sm font-semibold text-slate-800 pb-1">{selected.transferName}</p>
                  {[
                    ['Transfer', `${selected.sourceJurisdiction} -> ${selected.destinationJurisdiction}`],
                    ['Mechanism', selected.transferMechanism],
                    ['SCC Version', selected.sccVersion],
                    ['Status', statusMeta[selected.status].label],
                    ['Started', relTime(selected.startedAt)],
                    ['Decision', selected.decisionDate ? relTime(selected.decisionDate) : 'pending'],
                    ['Next Review', selected.nextReviewAt ? relTime(selected.nextReviewAt) : '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono text-right text-slate-800">{v}</span>
                    </div>
                  ))}
                  {selected.status === 'completed' && (
                    <div className="pt-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-500">Residual Risk Score</span>
                        <Badge variant="outline" className={`text-[10px] ${riskTint(selected.residualRiskScore)}`}>
                          {selected.residualRiskScore}/100
                        </Badge>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full ${selected.residualRiskScore <= 15 ? 'bg-emerald-400' : selected.residualRiskScore <= 35 ? 'bg-amber-400' : 'bg-rose-400'}`}
                          style={{ width: `${selected.residualRiskScore}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Schrems II factors */}
              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Schrems II Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Destination surveillance</span>
                    <Badge variant="outline" className={`text-[9px] ${surveillanceTint(selected.schremsIiFactors.destinationSurveillance)}`}>
                      {selected.schremsIiFactors.destinationSurveillance}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Government access risk</span>
                    <Badge variant="outline" className={`text-[9px] ${surveillanceTint(selected.schremsIiFactors.governmentAccessRisk)}`}>
                      {selected.schremsIiFactors.governmentAccessRisk}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Redress availability</span>
                    <Badge variant="outline" className={`text-[9px] ${surveillanceTint(selected.schremsIiFactors.redressAvailability === 'available' ? 'low' : selected.schremsIiFactors.redressAvailability === 'limited' ? 'medium' : 'high')}`}>
                      {selected.schremsIiFactors.redressAvailability}
                    </Badge>
                  </div>
                  <div className="pt-2">
                    <p className="mb-1 text-slate-500">Supplementary measures</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.schremsIiFactors.supplementaryMeasures.map(m => (
                        <Badge key={m} variant="outline" className="text-[9px] border-violet-200 bg-violet-50 text-violet-700">
                          {m}
                        </Badge>
                      ))}
                    </div>
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
