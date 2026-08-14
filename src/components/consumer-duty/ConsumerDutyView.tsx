'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HeartHandshake, CheckCircle2, AlertTriangle, XCircle, FileText, Layers, BrainCircuit, UserCheck, Clock, FileBarChart2 } from 'lucide-react'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

// ─── Types ──────────────────────────────────────────────────────────────
type Outcome = {
  id: string
  outcome: string
  kpi: string
  target: number
  actual: number
  variance: number
  status: 'on-track' | 'at-risk' | 'breach'
  lastMeasuredAt: string
}

type AdmDecision = {
  id: string
  decisionId: string
  useCase: string
  regulation: string
  solelyAutomated: boolean
  humanReviewAvailable: boolean
  adverseActionNoticesSent30d: number
  humanReviewRequestsPending: number
  lastAuditAt: string
  aiRecommendation: AIRec
}

type Disclosure = {
  id: string
  slug: string
  product: string
  layer: string
  layerLabel: string
  jurisdiction: string
  lastUpdatedAt: string
  complexityScore: number
  readingGradeLevel: number
  wordCount: number
  aiRecommendation: AIRec
}

type ConsumerDutyData = {
  outcomes: Outcome[]
  admDecisions: AdmDecision[]
  disclosures: Disclosure[]
  summary: {
    consumerDutyOutcomes: { onTrack: number; atRisk: number; breach: number }
    admRights: {
      solelyAutomated: number
      humanReviewAvailable: number
      pendingReviewRequests: number
      noticesSent30d: number
    }
    layeredDisclosures: {
      total: number
      avgComplexity: number
      overdueRefresh: number
      highComplexity: number
    }
  }
}

// ─── Display metadata ───────────────────────────────────────────────────
const outcomeMeta: Record<string, { label: string; tint: string }> = {
  'products-services':     { label: 'Products & Services', tint: 'text-emerald-700 bg-emerald-50' },
  'price-value':           { label: 'Price & Value',       tint: 'text-amber-700 bg-amber-50' },
  'consumer-understanding':{ label: 'Consumer Understanding', tint: 'text-violet-700 bg-violet-50' },
  'consumer-support':      { label: 'Consumer Support',    tint: 'text-blue-700 bg-blue-50' },
}

const statusMeta: Record<Outcome['status'], { icon: typeof CheckCircle2; tint: string; label: string }> = {
  'on-track': { icon: CheckCircle2, tint: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'On Track' },
  'at-risk':  { icon: AlertTriangle, tint: 'text-amber-700 bg-amber-50 border-amber-200', label: 'At Risk' },
  'breach':   { icon: XCircle, tint: 'text-rose-700 bg-rose-50 border-rose-200', label: 'Breach' },
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

// ─── Main component ─────────────────────────────────────────────────────
export function ConsumerDutyView() {
  const [data, setData] = useState<ConsumerDutyData | null>(null)
  const [selectedAdm, setSelectedAdm] = useState<AdmDecision | null>(null)
  const [selectedDisc, setSelectedDisc] = useState<Disclosure | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/consumer-duty.json')
      .then(r => r.json())
      .then(d => {
        setData(d)
        const firstAdmFail = d.admDecisions?.find((a: AdmDecision) => a.solelyAutomated && !a.humanReviewAvailable)
        setSelectedAdm(firstAdmFail ?? d.admDecisions?.[0] ?? null)
        const firstHighComplex = d.disclosures?.find((x: Disclosure) => x.complexityScore > 60)
        setSelectedDisc(firstHighComplex ?? d.disclosures?.[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const s = data.summary

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Core Compliance"
        title="Consumer Duty & AI Rights"
        subtitle="FCA Consumer Duty outcomes monitoring, GDPR Art.22 / ECOA adverse-action rights for automated decisions, and layered disclosure inventory (key facts, TILA box, IPID, ESIS). Consumer protection in AI finance — right to human review, fair-value testing, and plain-language disclosures."
        icon={HeartHandshake}
        accent="from-emerald-500 to-teal-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Outcomes On Track" value={s.consumerDutyOutcomes.onTrack} sub={`of ${data.outcomes.length} KPIs`} icon={CheckCircle2} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="At Risk + Breach" value={s.consumerDutyOutcomes.atRisk + s.consumerDutyOutcomes.breach} sub="needs attention" icon={AlertTriangle} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="ADM Notices (30d)" value={s.admRights.noticesSent30d} sub="adverse action sent" icon={FileText} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="Pending Reviews" value={s.admRights.pendingReviewRequests} sub="human review queue" icon={UserCheck} tint="text-rose-700 bg-rose-50" />
      </div>

      <Tabs defaultValue="outcomes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="outcomes" className="text-xs gap-1.5">
            <HeartHandshake className="h-3.5 w-3.5" />
            Consumer Duty
          </TabsTrigger>
          <TabsTrigger value="adm" className="text-xs gap-1.5">
            <BrainCircuit className="h-3.5 w-3.5" />
            ADM Rights
          </TabsTrigger>
          <TabsTrigger value="disclosures" className="text-xs gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            Layered Disclosures
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Consumer Duty Outcomes ─────────────────────────── */}
        <TabsContent value="outcomes" className="space-y-4 mt-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">FCA Consumer Duty — Four Outcomes Monitoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(['products-services', 'price-value', 'consumer-understanding', 'consumer-support'] as const).map(outcomeKey => {
                const outcomeKpis = data.outcomes.filter(o => o.outcome === outcomeKey)
                if (outcomeKpis.length === 0) return null
                const meta = outcomeMeta[outcomeKey]
                return (
                  <div key={outcomeKey} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className={`text-[10px] ${meta.tint}`}>{meta.label}</Badge>
                      <span className="text-[10px] text-slate-400">{outcomeKpis.length} KPIs</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {outcomeKpis.map(o => {
                        const sm = statusMeta[o.status]
                        const Icon = sm.icon
                        const pct = Math.min(100, (o.actual / Math.max(o.target, 0.01)) * 100)
                        return (
                          <div key={o.id} className="rounded-md border border-slate-100 bg-white p-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-[11px] text-slate-700">{o.kpi}</p>
                              <Badge variant="outline" className={`text-[9px] shrink-0 ${sm.tint}`}>
                                <Icon className="mr-0.5 h-2.5 w-2.5" />
                                {sm.label}
                              </Badge>
                            </div>
                            <div className="mt-1 flex items-baseline gap-1">
                              <span className="text-sm font-mono font-semibold text-slate-800">{o.actual}</span>
                              <span className="text-[10px] text-slate-500">/ target {o.target}</span>
                              <span className={`ml-auto text-[10px] font-mono ${o.variance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {o.variance > 0 ? '+' : ''}{o.variance}
                              </span>
                            </div>
                            <div className="mt-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full ${o.status === 'on-track' ? 'bg-emerald-400' : o.status === 'at-risk' ? 'bg-amber-400' : 'bg-rose-400'}`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: ADM Rights ──────────────────────────────────────── */}
        <TabsContent value="adm" className="space-y-4 mt-4">
          <Card className="border-amber-200 bg-amber-50/40">
            <CardContent className="flex items-start gap-3 p-4 text-xs">
              <BrainCircuit className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">GDPR Art.22 + ECOA Adverse Action</p>
                <p className="text-amber-700">
                  EU data subjects have the right not to be subject to solely-automated decisions with legal/significant effects (Art.22), plus the right to obtain human intervention. US ECOA Reg B requires adverse-action notices within 30 days of credit denial, citing key factors.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3 border-slate-200">
              <CardHeader className="pb-3"><CardTitle className="text-sm">ADM Decision Registry</CardTitle></CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[480px]">
                  {data.admDecisions.map(a => {
                    const isSelected = selectedAdm?.id === a.id
                    const risk = a.solelyAutomated && !a.humanReviewAvailable ? 'high'
                      : a.humanReviewRequestsPending > 0 ? 'medium'
                      : 'low'
                    const riskTint = risk === 'high' ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : risk === 'medium' ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    return (
                      <button key={a.id} onClick={() => setSelectedAdm(a)}
                        className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${riskTint}`}>
                          <BrainCircuit className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-500">{a.decisionId}</span>
                            {a.solelyAutomated && (
                              <Badge variant="outline" className="text-[9px] border-rose-200 bg-rose-50 text-rose-700">
                                SOLELY AUTOMATED
                              </Badge>
                            )}
                            {!a.humanReviewAvailable && (
                              <Badge variant="outline" className="text-[9px] border-rose-200 bg-rose-50 text-rose-700">
                                NO HUMAN REVIEW
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs font-semibold text-slate-700">{a.useCase}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{a.regulation}</p>
                          <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                            <span>{a.adverseActionNoticesSent30d} notices (30d)</span>
                            {a.humanReviewRequestsPending > 0 && (
                              <span className="text-amber-600">{a.humanReviewRequestsPending} pending reviews</span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              {selectedAdm && (
                <>
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-500">{selectedAdm.decisionId}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <p className="text-sm font-semibold text-slate-800">{selectedAdm.useCase}</p>
                      {[
                        ['Regulation', selectedAdm.regulation],
                        ['Solely Automated', selectedAdm.solelyAutomated ? 'YES' : 'no'],
                        ['Human Review Available', selectedAdm.humanReviewAvailable ? 'YES' : 'NO'],
                        ['Notices Sent (30d)', `${selectedAdm.adverseActionNoticesSent30d}`],
                        ['Pending Reviews', `${selectedAdm.humanReviewRequestsPending}`],
                        ['Last Audit', relTime(selectedAdm.lastAuditAt)],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                          <span className="text-slate-500">{k}</span>
                          <span className={`font-mono text-right ${v === 'NO' || v === 'YES' ? (v === 'YES' ? 'text-rose-700' : 'text-emerald-700') : 'text-slate-800'}`}>{v}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <BooleanActionCard rec={selectedAdm.aiRecommendation} />
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB 3: Layered Disclosures ─────────────────────────────── */}
        <TabsContent value="disclosures" className="space-y-4 mt-4">
          <Card className="border-violet-200 bg-violet-50/40">
            <CardContent className="flex items-start gap-3 p-4 text-xs">
              <Layers className="h-5 w-5 text-violet-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-violet-900">Layered Disclosure Approach</p>
                <p className="text-violet-700">
                  Consumer Duty guidance expects disclosures to be layered: headline rate (APR / AER) → key facts (TILA box, IPID, ESIS) → full T&Cs. Each layer targets a different consumer engagement depth. Reading grade level should target grade 8 or below.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Disclosure Inventory — by complexity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[480px]">
                  {[...data.disclosures].sort((a, b) => b.complexityScore - a.complexityScore).map(d => {
                    const isSelected = selectedDisc?.id === d.id
                    const complexityTint = d.complexityScore > 60 ? 'text-rose-700 bg-rose-50 border-rose-200'
                      : d.complexityScore > 35 ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    return (
                      <button key={d.id} onClick={() => setSelectedDisc(d)}
                        className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${complexityTint}`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px]">{d.layerLabel}</Badge>
                            <Badge variant="outline" className="text-[9px] text-slate-600">{d.jurisdiction}</Badge>
                          </div>
                          <p className="mt-0.5 text-xs font-semibold text-slate-700">{d.product}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            grade {d.readingGradeLevel} · {d.wordCount} words · updated {relTime(d.lastUpdatedAt)}
                          </p>
                          {/* Complexity bar */}
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full ${d.complexityScore > 60 ? 'bg-rose-400' : d.complexityScore > 35 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                style={{ width: `${d.complexityScore}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{d.complexityScore}/100</span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              {selectedDisc && (
                <>
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileBarChart2 className="h-4 w-4 text-violet-600" />
                        {selectedDisc.layerLabel}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <p className="text-sm font-semibold text-slate-800">{selectedDisc.product}</p>
                      {[
                        ['Layer', selectedDisc.layer],
                        ['Jurisdiction', selectedDisc.jurisdiction],
                        ['Last Updated', relTime(selectedDisc.lastUpdatedAt)],
                        ['Complexity Score', `${selectedDisc.complexityScore}/100`],
                        ['Reading Grade Level', `Grade ${selectedDisc.readingGradeLevel}`],
                        ['Word Count', `${selectedDisc.wordCount}`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                          <span className="text-slate-500">{k}</span>
                          <span className="font-mono text-right text-slate-800">{v}</span>
                        </div>
                      ))}
                      {selectedDisc.readingGradeLevel > 8 && (
                        <p className="pt-2 text-[10px] text-rose-600">
                          <Clock className="inline h-3 w-3 mr-1" />
                          Above Consumer Duty target (grade 8) — simplification recommended.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  <BooleanActionCard rec={selectedDisc.aiRecommendation} />
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
