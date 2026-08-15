'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BrainCircuit, GitBranch, Sparkles, Scale, CheckCircle2, AlertTriangle,
  XCircle, FileText, Calendar, Activity, Layers, Target,
} from 'lucide-react'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'
import { dataUrl } from '@/lib/data'

// ─── Types ──────────────────────────────────────────────────────────────
type LifecyclePhase = {
  id: string
  modelId: string
  modelName: string
  tier: 'critical' | 'high' | 'medium' | 'low'
  phase: string
  phaseIndex: number
  approver: string
  approverRole: string
  enteredAt: string
  exitedAt: string | null
  artifacts: string[]
  exitCriteriaMet: boolean
  notes: string
  aiRecommendation: AIRec
}

type ExplainabilityLayer = {
  id: string
  modelId: string
  modelName: string
  tier: 'critical' | 'high' | 'medium' | 'low'
  layer: string
  layerIndex: number
  methods: string[]
  lastComputedAt: string
  nextRefreshAt: string | null
  audience: string
  topFeatures?: Array<{ feature: string; meanAbsShap?: number; importance?: number; rank: number }>
  consistencyCheck: string
  onDemandComputed30d?: number
  counterfactualCount?: number
  triangulationPassRate?: number
  triangulationThreshold?: number
  reasonCodeCount?: number
  plainLanguageRequired?: boolean
  reasonCodeDictionaryVersion?: string
  recentReasonCodes?: Array<{ code: string; shapFeature?: string; feature?: string; plainLanguage: string }>
  aiRecommendation: AIRec
}

type FairnessMetric = {
  id: string
  modelId: string
  modelName: string
  tier: 'critical' | 'high' | 'medium' | 'low'
  metric: string
  metricIndex: number
  formula: string
  threshold: string
  applicableTier: string[]
  protectedClass: string
  currentValue?: number
  currentTprDelta?: number
  currentFprDelta?: number
  thresholdValue: number
  status: 'pass' | 'warn' | 'fail'
  interventionTrigger: string
  lastComputedAt: string
  aiRecommendation: AIRec
}

type AIGovernanceData = {
  lifecyclePhases: LifecyclePhase[]
  explainabilityLayers: ExplainabilityLayer[]
  fairnessMetrics: FairnessMetric[]
  summary: {
    totalLifecycleRecords: number
    totalExplainabilityRecords: number
    totalFairnessRecords: number
    criticalModelsTracked: number
    modelsInPhase4Validation: number
    modelsWithFailingFairness: number
    modelsWithExplainabilityIssues: number
    phaseLabels: string[]
    layerLabels: string[]
    metricLabels: string[]
  }
}

// ─── Display metadata ───────────────────────────────────────────────────
const phaseMeta: Record<string, { label: string; short: string; tint: string }> = {
  problem_definition:        { label: 'Problem Definition',          short: 'P1', tint: 'text-blue-700 bg-blue-50 border-blue-200' },
  data_acquisition:          { label: 'Data Acquisition',            short: 'P2', tint: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  model_development:         { label: 'Model Development',           short: 'P3', tint: 'text-violet-700 bg-violet-50 border-violet-200' },
  pre_deployment_validation: { label: 'Pre-Deployment Validation',   short: 'P4', tint: 'text-amber-700 bg-amber-50 border-amber-200' },
  deployment:                { label: 'Deployment',                  short: 'P5', tint: 'text-orange-700 bg-orange-50 border-orange-200' },
  production_monitoring:     { label: 'Production Monitoring',       short: 'P6', tint: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
}

const layerMeta: Record<string, { label: string; tint: string }> = {
  global:           { label: 'Global (Model-Aggregate)',  tint: 'text-blue-700 bg-blue-50 border-blue-200' },
  local:            { label: 'Local (Per-Prediction)',    tint: 'text-violet-700 bg-violet-50 border-violet-200' },
  decision_context: { label: 'Decision-Context (Customer)', tint: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
}

const metricMeta: Record<string, { label: string; tint: string }> = {
  demographic_parity:    { label: 'Demographic Parity',  tint: 'text-blue-700 bg-blue-50 border-blue-200' },
  equalized_odds:        { label: 'Equalized Odds',       tint: 'text-violet-700 bg-violet-50 border-violet-200' },
  predictive_parity:     { label: 'Predictive Parity',   tint: 'text-amber-700 bg-amber-50 border-amber-200' },
  individual_fairness:   { label: 'Individual Fairness',  tint: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
}

const tierTint: Record<string, string> = {
  critical: 'text-rose-700 bg-rose-50 border-rose-200',
  high:     'text-orange-700 bg-orange-50 border-orange-200',
  medium:   'text-amber-700 bg-amber-50 border-amber-200',
  low:      'text-emerald-700 bg-emerald-50 border-emerald-200',
}

const statusTint: Record<string, string> = {
  pass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  warn: 'text-amber-700 bg-amber-50 border-amber-200',
  fail: 'text-rose-700 bg-rose-50 border-rose-200',
}

function relTime(iso: string | null): string {
  if (!iso) return 'n/a'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

// ─── Main component ─────────────────────────────────────────────────────
export function AiGovernanceView() {
  const [data, setData] = useState<AIGovernanceData | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<LifecyclePhase | null>(null)
  const [selectedLayer, setSelectedLayer] = useState<ExplainabilityLayer | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<FairnessMetric | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('ai-governance'))
      .then(r => r.json())
      .then(d => {
        setData(d)
        // Default-select the most interesting records
        const failPhase = d.lifecyclePhases?.find((p: LifecyclePhase) => !p.exitCriteriaMet)
        setSelectedPhase(failPhase ?? d.lifecyclePhases?.[0] ?? null)
        const failLayer = d.explainabilityLayers?.find((l: ExplainabilityLayer) => l.consistencyCheck.startsWith('FAIL'))
        setSelectedLayer(failLayer ?? d.explainabilityLayers?.[0] ?? null)
        const failMetric = d.fairnessMetrics?.find((m: FairnessMetric) => m.status === 'fail')
        setSelectedMetric(failMetric ?? d.fairnessMetrics?.[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const s = data.summary

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Intelligence & Automation"
        title="AI/ML Governance Frameworks"
        subtitle="Six-phase model lifecycle (Problem Definition → Production Monitoring), multi-layered explainability (SHAP / counterfactual / decision-context), and a four-metric fairness matrix (demographic parity, equalized odds, predictive parity, individual fairness). Aligned with EU AI Act, NIST AI RMF, SR 11-7, and EEOC 4/5ths Rule."
        icon={BrainCircuit}
        accent="from-violet-500 to-purple-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Critical Models" value={s.criticalModelsTracked} sub="tracked across 6 phases" icon={BrainCircuit} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="Phase 4 Validation" value={s.modelsInPhase4Validation} sub="awaiting validation sign-off" icon={GitBranch} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Explainability Issues" value={s.modelsWithExplainabilityIssues} sub="layer checks failing" icon={Sparkles} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="Fairness Failures" value={s.modelsWithFailingFairness} sub="metric below threshold" icon={AlertTriangle} tint="text-rose-700 bg-rose-50" />
      </div>

      <Tabs defaultValue="lifecycle" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lifecycle" className="text-xs gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            Lifecycle (6-Phase)
          </TabsTrigger>
          <TabsTrigger value="explainability" className="text-xs gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Explainability (3-Layer)
          </TabsTrigger>
          <TabsTrigger value="fairness" className="text-xs gap-1.5">
            <Scale className="h-3.5 w-3.5" />
            Fairness (4-Metric)
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Lifecycle ─────────────────────────────────────── */}
        <TabsContent value="lifecycle" className="space-y-4 mt-4">
          {/* Phase framework banner */}
          <Card className="border-violet-200/60 bg-gradient-to-br from-violet-50/40 to-purple-50/40">
            <CardContent className="py-3">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                {s.phaseLabels.map((phase, i) => {
                  const meta = phaseMeta[phase]
                  return (
                    <div key={phase} className="rounded-md border border-slate-200 bg-white p-2">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[10px] font-semibold text-slate-400">{meta.short}</span>
                        <span className="font-semibold text-slate-700 truncate text-[10px]">{meta.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Phase registry */}
            <Card className="lg:col-span-3 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5" />
                  Model Phase Records — sorted by model then phase index
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[640px]">
                  {[...data.lifecyclePhases]
                    .sort((a, b) => {
                      if (a.modelId !== b.modelId) return a.modelId.localeCompare(b.modelId)
                      return a.phaseIndex - b.phaseIndex
                    })
                    .map(p => {
                      const meta = phaseMeta[p.phase]
                      const isSelected = selectedPhase?.id === p.id
                      const done = p.exitCriteriaMet
                      return (
                        <button key={p.id} onClick={() => setSelectedPhase(p)}
                          className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-violet-50/40' : ''}`}>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200">
                            {done
                              ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              : <Activity className="h-4 w-4 text-amber-500 animate-pulse" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-500">{p.modelId}</span>
                              <Badge variant="outline" className={`text-[9px] ${tierTint[p.tier]}`}>{p.tier}</Badge>
                              <Badge variant="outline" className={`text-[9px] ${meta.tint}`}>{meta.short}</Badge>
                            </div>
                            <p className="mt-0.5 text-xs font-semibold text-slate-700">{p.modelName}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {meta.label} · approver: <span className="font-mono">{p.approver}</span>
                            </p>
                            <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                              <span>entered {relTime(p.enteredAt)}</span>
                              <span>·</span>
                              <span>{done ? `exited ${relTime(p.exitedAt)}` : 'in progress'}</span>
                              <span>·</span>
                              <span>{p.artifacts.length} artifacts</span>
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
              {selectedPhase && (
                <>
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-violet-600" />
                        {selectedPhase.modelName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {[
                        ['Model ID', selectedPhase.modelId],
                        ['Tier', selectedPhase.tier],
                        ['Phase', phaseMeta[selectedPhase.phase].label],
                        ['Phase Index', `P${selectedPhase.phaseIndex} of 6`],
                        ['Approver', selectedPhase.approver],
                        ['Approver Role', selectedPhase.approverRole],
                        ['Entered Phase', relTime(selectedPhase.enteredAt)],
                        ['Exited Phase', selectedPhase.exitedAt ? relTime(selectedPhase.exitedAt) : 'in progress'],
                        ['Exit Criteria Met', selectedPhase.exitCriteriaMet ? 'YES' : 'NO'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                          <span className="text-slate-500">{k}</span>
                          <span className="font-mono text-right text-slate-800">{v}</span>
                        </div>
                      ))}
                      <div className="pt-2">
                        <p className="text-slate-500 mb-1">Artifacts ({selectedPhase.artifacts.length}):</p>
                        <ul className="space-y-1">
                          {selectedPhase.artifacts.map(a => (
                            <li key={a} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                              <FileText className="h-3 w-3 mt-0.5 text-slate-400 shrink-0" />
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="pt-2 text-[11px] text-slate-500 italic">{selectedPhase.notes}</p>
                    </CardContent>
                  </Card>

                  <BooleanActionCard rec={selectedPhase.aiRecommendation} />
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB 2: Explainability ────────────────────────────────── */}
        <TabsContent value="explainability" className="space-y-4 mt-4">
          {/* Layer framework banner */}
          <Card className="border-violet-200/60 bg-gradient-to-br from-violet-50/40 to-fuchsia-50/40">
            <CardContent className="py-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {[
                  { layer: 'global',           audience: 'Auditors / regulators',        methods: 'SHAP summary, feature importance, PDP, ICE' },
                  { layer: 'local',            audience: 'Data scientists / compliance', methods: 'SHAP waterfall, counterfactual, LIME' },
                  { layer: 'decision_context', audience: 'Affected customer',           methods: 'Reason codes, plain-language, recourse path' },
                ].map(l => (
                  <div key={l.layer} className="rounded-md border border-slate-200 bg-white p-2">
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3 w-3 text-violet-500" />
                      <span className="font-semibold text-slate-700 text-[11px]">{layerMeta[l.layer].label}</span>
                    </div>
                    <div className="mt-1 space-y-0.5 text-[10px] text-slate-500">
                      <div>{l.audience}</div>
                      <div className="font-mono text-slate-600">{l.methods}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Layer registry */}
            <Card className="lg:col-span-3 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Explainability Records — sorted by model then layer index
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[640px]">
                  {[...data.explainabilityLayers]
                    .sort((a, b) => {
                      if (a.modelId !== b.modelId) return a.modelId.localeCompare(b.modelId)
                      return a.layerIndex - b.layerIndex
                    })
                    .map(l => {
                      const meta = layerMeta[l.layer]
                      const isSelected = selectedLayer?.id === l.id
                      const isFail = l.consistencyCheck.startsWith('FAIL')
                      return (
                        <button key={l.id} onClick={() => setSelectedLayer(l)}
                          className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-violet-50/40' : ''}`}>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200">
                            {isFail
                              ? <XCircle className="h-4 w-4 text-rose-500" />
                              : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-500">{l.modelId}</span>
                              <Badge variant="outline" className={`text-[9px] ${tierTint[l.tier]}`}>{l.tier}</Badge>
                              <Badge variant="outline" className={`text-[9px] ${meta.tint}`}>L{l.layerIndex}</Badge>
                            </div>
                            <p className="mt-0.5 text-xs font-semibold text-slate-700">{l.modelName}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {meta.label} · {l.methods.length} methods
                            </p>
                            <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                              <span>computed {relTime(l.lastComputedAt)}</span>
                              {l.onDemandComputed30d !== undefined && (
                                <>
                                  <span>·</span>
                                  <span>{l.onDemandComputed30d} on-demand (30d)</span>
                                </>
                              )}
                              {l.triangulationPassRate !== undefined && (
                                <>
                                  <span>·</span>
                                  <span className={l.triangulationPassRate < (l.triangulationThreshold ?? 1) ? 'text-rose-600 font-mono' : 'text-emerald-600 font-mono'}>
                                    tri {Math.round(l.triangulationPassRate * 100)}%
                                  </span>
                                </>
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
              {selectedLayer && (
                <>
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-600" />
                        {selectedLayer.modelName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {[
                        ['Model ID', selectedLayer.modelId],
                        ['Tier', selectedLayer.tier],
                        ['Layer', layerMeta[selectedLayer.layer].label],
                        ['Layer Index', `L${selectedLayer.layerIndex} of 3`],
                        ['Audience', selectedLayer.audience],
                        ['Last Computed', relTime(selectedLayer.lastComputedAt)],
                        ['Next Refresh', selectedLayer.nextRefreshAt ? relTime(selectedLayer.nextRefreshAt) : 'on-demand only'],
                        ['Methods', selectedLayer.methods.join(', ')],
                        ...(selectedLayer.onDemandComputed30d !== undefined ? [['On-Demand 30d', String(selectedLayer.onDemandComputed30d)]] : []),
                        ...(selectedLayer.counterfactualCount !== undefined ? [['Counterfactual Count', String(selectedLayer.counterfactualCount)]] : []),
                        ...(selectedLayer.triangulationPassRate !== undefined ? [['Triangulation Pass Rate', `${Math.round(selectedLayer.triangulationPassRate * 100)}% (threshold ${Math.round((selectedLayer.triangulationThreshold ?? 0) * 100)}%)`]] : []),
                        ...(selectedLayer.reasonCodeCount !== undefined ? [['Reason Code Count', String(selectedLayer.reasonCodeCount)]] : []),
                        ...(selectedLayer.reasonCodeDictionaryVersion ? [['Reason Code Dict', selectedLayer.reasonCodeDictionaryVersion]] : []),
                        ...(selectedLayer.plainLanguageRequired !== undefined ? [['Plain Language Required', selectedLayer.plainLanguageRequired ? 'YES' : 'NO']] : []),
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                          <span className="text-slate-500">{k}</span>
                          <span className="font-mono text-right text-slate-800 text-[11px]">{v}</span>
                        </div>
                      ))}
                      {selectedLayer.topFeatures && selectedLayer.topFeatures.length > 0 && (
                        <div className="pt-2">
                          <p className="text-slate-500 mb-1">Top Features (by mean |SHAP| or importance):</p>
                          <div className="space-y-1">
                            {selectedLayer.topFeatures.slice(0, 5).map(f => (
                              <div key={f.feature} className="flex items-center justify-between text-[11px]">
                                <span className="font-mono text-slate-700">{f.rank}. {f.feature}</span>
                                <span className="font-mono text-slate-500">
                                  {f.meanAbsShap !== undefined ? f.meanAbsShap.toFixed(3) : f.importance !== undefined ? f.importance.toFixed(3) : 'n/a'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedLayer.recentReasonCodes && selectedLayer.recentReasonCodes.length > 0 && (
                        <div className="pt-2">
                          <p className="text-slate-500 mb-1">Recent Reason Codes:</p>
                          <div className="space-y-1.5">
                            {selectedLayer.recentReasonCodes.map(rc => (
                              <div key={rc.code} className="rounded-md border border-slate-100 bg-slate-50 p-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] text-violet-700">{rc.code}</span>
                                  <span className="font-mono text-[10px] text-slate-500">{rc.shapFeature ?? rc.feature}</span>
                                </div>
                                <p className="mt-0.5 text-[10px] text-slate-700">{rc.plainLanguage}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className={`pt-2 text-[11px] italic ${selectedLayer.consistencyCheck.startsWith('FAIL') ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {selectedLayer.consistencyCheck}
                      </p>
                    </CardContent>
                  </Card>

                  <BooleanActionCard rec={selectedLayer.aiRecommendation} />
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB 3: Fairness ──────────────────────────────────────── */}
        <TabsContent value="fairness" className="space-y-4 mt-4">
          {/* Metric framework banner */}
          <Card className="border-violet-200/60 bg-gradient-to-br from-violet-50/40 to-purple-50/40">
            <CardContent className="py-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {s.metricLabels.map(metric => {
                  const meta = metricMeta[metric]
                  return (
                    <div key={metric} className="rounded-md border border-slate-200 bg-white p-2">
                      <div className="flex items-center gap-1.5">
                        <Scale className="h-3 w-3 text-violet-500" />
                        <span className="font-semibold text-slate-700 text-[10px]">{meta.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Metric registry */}
            <Card className="lg:col-span-3 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Scale className="h-3.5 w-3.5" />
                  Fairness Metric Records — sorted by model then metric index
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[640px]">
                  {[...data.fairnessMetrics]
                    .sort((a, b) => {
                      if (a.modelId !== b.modelId) return a.modelId.localeCompare(b.modelId)
                      return a.metricIndex - b.metricIndex
                    })
                    .map(m => {
                      const meta = metricMeta[m.metric]
                      const isSelected = selectedMetric?.id === m.id
                      const statusIcon = m.status === 'pass' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        : m.status === 'warn' ? <AlertTriangle className="h-4 w-4 text-amber-500" />
                        : <XCircle className="h-4 w-4 text-rose-500" />
                      const currentVal = m.currentValue ?? (m.currentTprDelta !== undefined && m.currentFprDelta !== undefined ? Math.max(m.currentTprDelta, m.currentFprDelta) : null)
                      return (
                        <button key={m.id} onClick={() => setSelectedMetric(m)}
                          className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-violet-50/40' : ''}`}>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200">
                            {statusIcon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-500">{m.modelId}</span>
                              <Badge variant="outline" className={`text-[9px] ${tierTint[m.tier]}`}>{m.tier}</Badge>
                              <Badge variant="outline" className={`text-[9px] ${meta.tint}`}>M{m.metricIndex}</Badge>
                              <Badge variant="outline" className={`text-[9px] ${statusTint[m.status]}`}>{m.status}</Badge>
                            </div>
                            <p className="mt-0.5 text-xs font-semibold text-slate-700">{m.modelName}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {meta.label} · {m.protectedClass}
                            </p>
                            {currentVal !== null && (
                              <div className="mt-1 flex items-center gap-3 text-[10px]">
                                <span className={`font-mono ${m.status === 'pass' ? 'text-emerald-600' : m.status === 'warn' ? 'text-amber-600' : 'text-rose-600'}`}>
                                  current {currentVal.toFixed(3)}
                                </span>
                                <span className="font-mono text-slate-400">
                                  threshold {m.thresholdValue.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Detail panel */}
            <div className="lg:col-span-2 space-y-4">
              {selectedMetric && (
                <>
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Scale className="h-4 w-4 text-violet-600" />
                        {selectedMetric.modelName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {[
                        ['Model ID', selectedMetric.modelId],
                        ['Tier', selectedMetric.tier],
                        ['Metric', metricMeta[selectedMetric.metric].label],
                        ['Metric Index', `M${selectedMetric.metricIndex} of 4`],
                        ['Protected Class', selectedMetric.protectedClass],
                        ['Formula', selectedMetric.formula],
                        ['Threshold', selectedMetric.threshold],
                        ['Applicable Tiers', selectedMetric.applicableTier.join(', ')],
                        ['Last Computed', relTime(selectedMetric.lastComputedAt)],
                        ['Status', selectedMetric.status],
                        ['Intervention', selectedMetric.interventionTrigger],
                        ...(selectedMetric.currentValue !== undefined ? [['Current Value', selectedMetric.currentValue.toFixed(3)]] : []),
                        ...(selectedMetric.currentTprDelta !== undefined ? [['Current TPR Delta', selectedMetric.currentTprDelta.toFixed(3)]] : []),
                        ...(selectedMetric.currentFprDelta !== undefined ? [['Current FPR Delta', selectedMetric.currentFprDelta.toFixed(3)]] : []),
                        ['Threshold Value', selectedMetric.thresholdValue.toFixed(2)],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                          <span className="text-slate-500 shrink-0">{k}</span>
                          <span className="font-mono text-right text-slate-800 text-[11px]">{v}</span>
                        </div>
                      ))}

                      {/* Threshold visualization */}
                      {selectedMetric.currentValue !== undefined && (
                        <div className="pt-2">
                          <p className="text-slate-500 mb-1 text-[11px]">Current vs Threshold:</p>
                          <div className="relative h-8 rounded-md bg-slate-50 border border-slate-200 overflow-hidden">
                            <div
                              className={`absolute top-0 bottom-0 w-0.5 bg-rose-400`}
                              style={{ left: `${selectedMetric.thresholdValue * 100}%` }}
                              title={`Threshold: ${selectedMetric.thresholdValue.toFixed(2)}`}
                            >
                              <span className="absolute -top-0 -right-12 text-[9px] text-rose-600 font-mono whitespace-nowrap">
                                thr {selectedMetric.thresholdValue.toFixed(2)}
                              </span>
                            </div>
                            <div
                              className={`absolute top-0 bottom-0 w-1 ${selectedMetric.status === 'pass' ? 'bg-emerald-500' : selectedMetric.status === 'warn' ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ left: `${selectedMetric.currentValue * 100}%` }}
                              title={`Current: ${selectedMetric.currentValue.toFixed(3)}`}
                            >
                              <span className={`absolute -bottom-4 -left-4 text-[9px] font-mono ${selectedMetric.status === 'pass' ? 'text-emerald-700' : selectedMetric.status === 'warn' ? 'text-amber-700' : 'text-rose-700'}`}>
                                {selectedMetric.currentValue.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <p className="mt-4 text-[10px] text-slate-500">
                            {selectedMetric.status === 'pass'
                              ? `PASS — within ${selectedMetric.threshold}`
                              : selectedMetric.status === 'warn'
                                ? 'WARN — investigate (delta above threshold)'
                                : 'FAIL — mandatory remediation triggered'}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <BooleanActionCard rec={selectedMetric.aiRecommendation} />
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
