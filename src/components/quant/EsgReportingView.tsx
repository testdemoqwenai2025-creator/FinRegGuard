'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Leaf, FileBarChart2, CloudRain, Users, CheckCircle2, AlertTriangle,
  XCircle, TrendingDown, Globe2, Scale, HeartHandshake, Building2,
} from 'lucide-react'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

// ─── Types ──────────────────────────────────────────────────────────────
type EsgFramework = {
  id: string
  framework: string
  frameworkName: string
  jurisdiction: string
  materialityBasis: string
  scope: string
  scope3Required: boolean
  scope3Deferral: string
  assuranceLevel: string
  effectiveDate: string
  digitalTaxonomy: string
  scenarioAnalysisRequired: boolean
  scenarioApproach: string
  regulator: string
  applicableToInstitution: boolean
  aiRecommendation: AIRec
}

type ClimateScenario = {
  id: string
  scenario: string
  scenarioName: string
  temperatureOutcome2100: string
  transitionRiskLevel: string
  physicalRiskLevel: string
  policyStringency: string
  carbonPrice2030Usd: number
  carbonPrice2050Usd: number
  carbonPrice2040Usd?: number
  cumulativeGdpImpactPct: number
  cumulativeGdpImpact2100Pct?: number
  ngfsReleaseVersion: string
  keyCharacteristics: string
  supervisoryUse: string
  portfolioImpactUsd: number
  aiRecommendation: AIRec
}

type SocialMetric = {
  id: string
  category: string
  categoryIndex: number
  metricName: string
  frameworkRefs: string[]
  quantitativeThreshold: string
  currentValue: number | Record<string, number>
  targetValue?: number
  priorYearValue?: number
  totalCustomerBase?: number
  currentPct?: number
  yearOnYearChange?: number
  currentBreakdown?: Record<string, number>
  disclosureRequired: boolean
  dataSource: string
  aiRecommendation: AIRec
}

type EsgReportingData = {
  frameworks: EsgFramework[]
  climateScenarios: ClimateScenario[]
  socialMetrics: SocialMetric[]
  summary: {
    totalFrameworks: number
    totalScenarios: number
    totalSocialMetrics: number
    frameworksApplicable: number
    scenariosWithPhysicalRisk: number
    socialMetricsRequiringRemediation: number
    frameworkLabels: string[]
    scenarioLabels: string[]
    socialCategoryLabels: string[]
  }
}

// ─── Display metadata ───────────────────────────────────────────────────
const frameworkMeta: Record<string, { label: string; tint: string; icon: typeof FileBarChart2 }> = {
  issb_s1_s2:   { label: 'ISSB IFRS S1/S2',    tint: 'text-blue-700 bg-blue-50 border-blue-200',         icon: FileBarChart2 },
  esrs:         { label: 'ESRS (EU CSRD)',      tint: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: Globe2 },
  sec_climate:  { label: 'SEC Climate Rule',    tint: 'text-amber-700 bg-amber-50 border-amber-200',      icon: FileBarChart2 },
}

const scenarioMeta: Record<string, { label: string; tint: string; tempColor: string }> = {
  orderly_below_2C:               { label: 'Orderly Below 2C',        tint: 'text-emerald-700 bg-emerald-50 border-emerald-200',   tempColor: 'bg-emerald-400' },
  disorderly_delayed_transition:  { label: 'Disorderly Delayed',     tint: 'text-amber-700 bg-amber-50 border-amber-200',         tempColor: 'bg-amber-400' },
  hot_house_current_policies:     { label: 'Hot House World',        tint: 'text-rose-700 bg-rose-50 border-rose-200',            tempColor: 'bg-rose-500' },
  net_zero_2050:                  { label: 'Net Zero 2050',          tint: 'text-cyan-700 bg-cyan-50 border-cyan-200',            tempColor: 'bg-cyan-400' },
}

const socialCategoryMeta: Record<string, { label: string; tint: string; icon: typeof Scale }> = {
  algorithmic_fairness:        { label: 'Algorithmic Fairness',      tint: 'text-violet-700 bg-violet-50 border-violet-200', icon: Scale },
  customer_outcome_fairness:   { label: 'Customer Outcome Fairness', tint: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: HeartHandshake },
  workforce_diversity:         { label: 'Workforce Diversity',       tint: 'text-blue-700 bg-blue-50 border-blue-200',       icon: Users },
  community_investment:        { label: 'Community Investment',      tint: 'text-amber-700 bg-amber-50 border-amber-200',    icon: Building2 },
}

const riskTint: Record<string, string> = {
  low:      'text-emerald-700 bg-emerald-50 border-emerald-200',
  medium:   'text-amber-700 bg-amber-50 border-amber-200',
  high:     'text-orange-700 bg-orange-50 border-orange-200',
  extreme:  'text-rose-700 bg-rose-50 border-rose-200',
}

function fmtUsd(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `USD ${(n / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `USD ${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `USD ${(n / 1_000).toFixed(0)}k`
  return `USD ${n}`
}

function isRemediation(rec: AIRec): boolean {
  return rec.action.includes('REMEDIATION') || rec.action.includes('INVESTIGATE')
}

// ─── Main component ─────────────────────────────────────────────────────
export function EsgReportingView() {
  const [data, setData] = useState<EsgReportingData | null>(null)
  const [selectedFramework, setSelectedFramework] = useState<EsgFramework | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<ClimateScenario | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<SocialMetric | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/esg-reporting.json')
      .then(r => r.json())
      .then(d => {
        setData(d)
        // Default-select ESRS (most demanding) for framework, hot house for scenario, and any requiring remediation for social
        const esrs = d.frameworks?.find((f: EsgFramework) => f.framework === 'esrs')
        setSelectedFramework(esrs ?? d.frameworks?.[0] ?? null)
        const hotHouse = d.climateScenarios?.find((c: ClimateScenario) => c.scenario === 'hot_house_current_policies')
        setSelectedScenario(hotHouse ?? d.climateScenarios?.[0] ?? null)
        const remediation = d.socialMetrics?.find((m: SocialMetric) => isRemediation(m.aiRecommendation))
        setSelectedMetric(remediation ?? d.socialMetrics?.[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const s = data.summary

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Quant & Computational"
        title="ESG / Sustainability Reporting"
        subtitle="ISSB IFRS S1/S2 vs ESRS vs SEC Climate framework comparison (materiality basis, scope 3, assurance, effective dates), NGFS climate scenario analysis (Orderly / Disorderly / Hot House / Net Zero), and social capital metrics including algorithmic fairness as a first-class ESG metric."
        icon={Leaf}
        accent="from-emerald-500 to-teal-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Applicable Frameworks" value={s.frameworksApplicable} sub={`of ${s.totalFrameworks} frameworks`} icon={FileBarChart2} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Scenarios w/ High Physical Risk" value={s.scenariosWithPhysicalRisk} sub={`of ${s.totalScenarios} NGFS pathways`} icon={CloudRain} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="Social Metrics Needing Action" value={s.socialMetricsRequiringRemediation} sub={`of ${s.totalSocialMetrics} metrics`} icon={AlertTriangle} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Categories Tracked" value={s.socialCategoryLabels.length} sub="across social capital" icon={Users} tint="text-violet-700 bg-violet-50" />
      </div>

      <Tabs defaultValue="frameworks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="frameworks" className="text-xs gap-1.5">
            <FileBarChart2 className="h-3.5 w-3.5" />
            Frameworks (ISSB / ESRS / SEC)
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="text-xs gap-1.5">
            <CloudRain className="h-3.5 w-3.5" />
            Climate Scenarios (NGFS)
          </TabsTrigger>
          <TabsTrigger value="social" className="text-xs gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Social Capital
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Frameworks ────────────────────────────────────── */}
        <TabsContent value="frameworks" className="space-y-4 mt-4">
          {/* Framework comparison matrix banner */}
          <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/40 to-teal-50/40">
            <CardContent className="py-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {s.frameworkLabels.map(fw => {
                  const meta = frameworkMeta[fw]
                  const Icon = meta.icon
                  return (
                    <div key={fw} className="rounded-md border border-slate-200 bg-white p-2">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3 text-emerald-500" />
                        <span className="font-semibold text-slate-700 text-[11px]">{meta.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Framework registry */}
            <Card className="lg:col-span-3 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileBarChart2 className="h-3.5 w-3.5" />
                  ESG Disclosure Frameworks — comparison view
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[640px]">
                  {data.frameworks.map(f => {
                    const meta = frameworkMeta[f.framework]
                    const Icon = meta.icon
                    const isSelected = selectedFramework?.id === f.id
                    return (
                      <button key={f.id} onClick={() => setSelectedFramework(f)}
                        className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200">
                          <Icon className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[9px] ${meta.tint}`}>{f.regulator}</Badge>
                            {f.applicableToInstitution && (
                              <Badge variant="outline" className="text-[9px] border-emerald-200 bg-emerald-50 text-emerald-700">
                                APPLICABLE
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs font-semibold text-slate-700">{f.frameworkName}</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {f.jurisdiction}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className={`font-mono px-1 py-0.5 rounded ${f.materialityBasis === 'double' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-50'}`}>
                              {f.materialityBasis} materiality
                            </span>
                            <span className={`font-mono px-1 py-0.5 rounded ${f.scope3Required ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'}`}>
                              Scope 3: {f.scope3Required ? 'required' : 'optional'}
                            </span>
                            <span className="font-mono px-1 py-0.5 rounded text-slate-600 bg-slate-50">
                              assurance: {f.assuranceLevel.split('(')[0].trim()}
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
              {selectedFramework && (
                <>
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileBarChart2 className="h-4 w-4 text-emerald-600" />
                        {selectedFramework.frameworkName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {[
                        ['Framework', selectedFramework.frameworkName],
                        ['Regulator', selectedFramework.regulator],
                        ['Jurisdiction', selectedFramework.jurisdiction],
                        ['Materiality Basis', selectedFramework.materialityBasis],
                        ['Scope', selectedFramework.scope],
                        ['Scope 3 Required', selectedFramework.scope3Required ? 'YES' : 'NO'],
                        ['Scope 3 Deferral', selectedFramework.scope3Deferral],
                        ['Assurance Level', selectedFramework.assuranceLevel],
                        ['Effective Date', selectedFramework.effectiveDate],
                        ['Digital Taxonomy', selectedFramework.digitalTaxonomy],
                        ['Scenario Analysis', selectedFramework.scenarioAnalysisRequired ? 'REQUIRED' : 'not required'],
                        ['Scenario Approach', selectedFramework.scenarioApproach],
                        ['Applicable to Institution', selectedFramework.applicableToInstitution ? 'YES' : 'NO'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                          <span className="text-slate-500 shrink-0">{k}</span>
                          <span className="font-mono text-right text-slate-800 text-[11px]">{v}</span>
                        </div>
                      ))}

                      {/* Materiality visualization */}
                      <div className="pt-2">
                        <p className="text-slate-500 mb-1 text-[11px]">Materiality Comparison:</p>
                        <div className="space-y-1">
                          {data.frameworks.map(f => (
                            <div key={f.id} className="flex items-center gap-2 text-[11px]">
                              <span className="w-32 text-slate-600 truncate">{f.frameworkName}</span>
                              <div className="flex-1 relative h-4 rounded bg-slate-100 overflow-hidden">
                                <div
                                  className={`absolute top-0 bottom-0 ${f.materialityBasis === 'double' ? 'bg-emerald-500' : f.materialityBasis === 'financial' ? 'bg-blue-400' : 'bg-slate-400'}`}
                                  style={{ width: f.materialityBasis === 'double' ? '100%' : f.materialityBasis === 'financial' ? '60%' : '40%' }}
                                />
                              </div>
                              <span className="w-16 font-mono text-[10px] text-slate-500">{f.materialityBasis}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <BooleanActionCard rec={selectedFramework.aiRecommendation} />
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB 2: Climate Scenarios ────────────────────────────── */}
        <TabsContent value="scenarios" className="space-y-4 mt-4">
          {/* NGFS scenario pathway banner */}
          <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/40 to-teal-50/40">
            <CardContent className="py-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {s.scenarioLabels.map(sc => {
                  const meta = scenarioMeta[sc]
                  return (
                    <div key={sc} className="rounded-md border border-slate-200 bg-white p-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${meta.tempColor}`} />
                        <span className="font-semibold text-slate-700 text-[10px]">{meta.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Scenario registry */}
            <Card className="lg:col-span-3 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CloudRain className="h-3.5 w-3.5" />
                  NGFS Climate Scenarios V4.2 — sorted by temperature outcome
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[640px]">
                  {[...data.climateScenarios]
                    .sort((a, b) => {
                      // Sort by temperature outcome (lower first = more ambitious)
                      const tempRank: Record<string, number> = {
                        net_zero_2050: 0,
                        orderly_below_2C: 1,
                        disorderly_delayed_transition: 2,
                        hot_house_current_policies: 3,
                      }
                      return (tempRank[a.scenario] ?? 4) - (tempRank[b.scenario] ?? 4)
                    })
                    .map(c => {
                      const meta = scenarioMeta[c.scenario]
                      const isSelected = selectedScenario?.id === c.id
                      return (
                        <button key={c.id} onClick={() => setSelectedScenario(c)}
                          className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200">
                            <CloudRain className={`h-4 w-4 ${c.scenario === 'hot_house_current_policies' ? 'text-rose-500' : c.scenario === 'net_zero_2050' ? 'text-cyan-500' : 'text-emerald-500'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[9px] ${meta.tint}`}>{meta.label}</Badge>
                              <Badge variant="outline" className={`text-[9px] ${riskTint[c.transitionRiskLevel]}`}>
                                T:{c.transitionRiskLevel}
                              </Badge>
                              <Badge variant="outline" className={`text-[9px] ${riskTint[c.physicalRiskLevel]}`}>
                                P:{c.physicalRiskLevel}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-xs font-semibold text-slate-700">{c.temperatureOutcome2100}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {c.keyCharacteristics.slice(0, 80)}{c.keyCharacteristics.length > 80 ? '...' : ''}
                            </p>
                            <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                              <span>CO2 2030: <span className="font-mono text-slate-600">USD {c.carbonPrice2030Usd}/t</span></span>
                              <span>·</span>
                              <span>CO2 2050: <span className="font-mono text-slate-600">USD {c.carbonPrice2050Usd}/t</span></span>
                              <span>·</span>
                              <span className={c.portfolioImpactUsd < -300_000_000 ? 'text-rose-600 font-mono' : 'text-amber-600 font-mono'}>
                                {fmtUsd(c.portfolioImpactUsd)}
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
              {selectedScenario && (
                <>
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CloudRain className="h-4 w-4 text-emerald-600" />
                        {selectedScenario.scenarioName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {[
                        ['Scenario', selectedScenario.scenarioName],
                        ['NGFS Version', selectedScenario.ngfsReleaseVersion],
                        ['Temperature 2100', selectedScenario.temperatureOutcome2100],
                        ['Transition Risk', selectedScenario.transitionRiskLevel],
                        ['Physical Risk', selectedScenario.physicalRiskLevel],
                        ['Policy Stringency', selectedScenario.policyStringency],
                        ['Carbon Price 2030', `USD ${selectedScenario.carbonPrice2030Usd}/t CO2`],
                        ...(selectedScenario.carbonPrice2040Usd ? [['Carbon Price 2040', `USD ${selectedScenario.carbonPrice2040Usd}/t CO2`]] : []),
                        ['Carbon Price 2050', `USD ${selectedScenario.carbonPrice2050Usd}/t CO2`],
                        ['Cumulative GDP Impact 2050', `${selectedScenario.cumulativeGdpImpactPct}%`],
                        ...(selectedScenario.cumulativeGdpImpact2100Pct !== undefined ? [['Cumulative GDP Impact 2100', `${selectedScenario.cumulativeGdpImpact2100Pct}%`]] : []),
                        ['Portfolio Impact', fmtUsd(selectedScenario.portfolioImpactUsd)],
                        ['Supervisory Use', selectedScenario.supervisoryUse],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                          <span className="text-slate-500 shrink-0">{k}</span>
                          <span className="font-mono text-right text-slate-800 text-[11px]">{v}</span>
                        </div>
                      ))}
                      <p className="pt-2 text-[11px] text-slate-500 italic">{selectedScenario.keyCharacteristics}</p>

                      {/* Carbon price trajectory visualization */}
                      <div className="pt-2">
                        <p className="text-slate-500 mb-1 text-[11px]">Carbon Price Trajectory (USD/t CO2):</p>
                        <div className="relative h-20 rounded-md bg-slate-50 border border-slate-200 overflow-hidden">
                          {/* 2050 max marker */}
                          <div className="absolute top-0 bottom-0 left-0 right-0 grid grid-cols-3">
                            <div className="border-r border-slate-200 flex items-end justify-center pb-0.5">
                              <span className="text-[9px] text-slate-400 font-mono">2030</span>
                            </div>
                            <div className="border-r border-slate-200 flex items-end justify-center pb-0.5">
                              <span className="text-[9px] text-slate-400 font-mono">{selectedScenario.carbonPrice2040Usd ? '2040' : '2050'}</span>
                            </div>
                            <div className="flex items-end justify-center pb-0.5">
                              <span className="text-[9px] text-slate-400 font-mono">{selectedScenario.carbonPrice2040Usd ? '2050' : ''}</span>
                            </div>
                          </div>
                          {/* Bars */}
                          <div className="absolute inset-0 grid grid-cols-3 gap-1 px-1 pt-2">
                            <div className="flex items-end">
                              <div className="w-full bg-emerald-400 rounded-t" style={{ height: `${(selectedScenario.carbonPrice2030Usd / 700) * 100}%` }} />
                            </div>
                            {selectedScenario.carbonPrice2040Usd && (
                              <div className="flex items-end">
                                <div className="w-full bg-amber-400 rounded-t" style={{ height: `${(selectedScenario.carbonPrice2040Usd / 700) * 100}%` }} />
                              </div>
                            )}
                            <div className={`flex items-end ${!selectedScenario.carbonPrice2040Usd ? 'col-start-3' : ''}`}>
                              <div className={`w-full rounded-t ${selectedScenario.carbonPrice2050Usd >= 500 ? 'bg-rose-500' : selectedScenario.carbonPrice2050Usd >= 200 ? 'bg-orange-400' : 'bg-amber-300'}`} style={{ height: `${(selectedScenario.carbonPrice2050Usd / 700) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] font-mono text-slate-600">
                          <span>${selectedScenario.carbonPrice2030Usd}</span>
                          {selectedScenario.carbonPrice2040Usd && <span>${selectedScenario.carbonPrice2040Usd}</span>}
                          <span>${selectedScenario.carbonPrice2050Usd}</span>
                        </div>
                      </div>

                      {/* Portfolio impact bar */}
                      <div className="pt-2">
                        <p className="text-slate-500 mb-1 text-[11px]">Portfolio Impact Comparison:</p>
                        <div className="space-y-1">
                          {data.climateScenarios.map(c => (
                            <div key={c.id} className="flex items-center gap-2 text-[11px]">
                              <span className="w-32 text-slate-600 truncate">{c.scenarioName.split(' — ')[0]}</span>
                              <div className="flex-1 relative h-3 rounded bg-slate-100 overflow-hidden">
                                <div
                                  className={`absolute top-0 bottom-0 ${c.portfolioImpactUsd < -300_000_000 ? 'bg-rose-500' : c.portfolioImpactUsd < -100_000_000 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                  style={{ width: `${Math.min(100, Math.abs(c.portfolioImpactUsd) / 7_000_000)}%`, left: 0 }}
                                />
                              </div>
                              <span className="w-20 font-mono text-[10px] text-slate-600 text-right">
                                {fmtUsd(c.portfolioImpactUsd)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <BooleanActionCard rec={selectedScenario.aiRecommendation} />
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB 3: Social Capital ───────────────────────────────── */}
        <TabsContent value="social" className="space-y-4 mt-4">
          {/* Four-category framework banner */}
          <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/40 to-teal-50/40">
            <CardContent className="py-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {s.socialCategoryLabels.map(cat => {
                  const meta = socialCategoryMeta[cat]
                  const Icon = meta.icon
                  return (
                    <div key={cat} className="rounded-md border border-slate-200 bg-white p-2">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3 text-emerald-500" />
                        <span className="font-semibold text-slate-700 text-[10px]">{meta.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Social metric registry */}
            <Card className="lg:col-span-3 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  Social Capital Metrics — sorted by category then remediation priority
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[640px]">
                  {[...data.socialMetrics]
                    .sort((a, b) => {
                      if (a.categoryIndex !== b.categoryIndex) return a.categoryIndex - b.categoryIndex
                      // Remediation items first within each category
                      const ar = isRemediation(a.aiRecommendation) ? 0 : 1
                      const br = isRemediation(b.aiRecommendation) ? 0 : 1
                      return ar - br
                    })
                    .map(m => {
                      const meta = socialCategoryMeta[m.category]
                      const Icon = meta.icon
                      const isSelected = selectedMetric?.id === m.id
                      const needsAction = isRemediation(m.aiRecommendation)
                      const displayValue = typeof m.currentValue === 'number'
                        ? m.currentValue.toLocaleString()
                        : Object.values(m.currentValue).join(' / ')
                      return (
                        <button key={m.id} onClick={() => setSelectedMetric(m)}
                          className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200">
                            {needsAction
                              ? <AlertTriangle className="h-4 w-4 text-amber-500" />
                              : <Icon className="h-4 w-4 text-emerald-500" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[9px] ${meta.tint}`}>
                                {meta.label}
                              </Badge>
                              {needsAction && (
                                <Badge variant="outline" className="text-[9px] border-amber-300 bg-amber-100 text-amber-700">
                                  ACTION NEEDED
                                </Badge>
                              )}
                              {m.disclosureRequired && (
                                <Badge variant="outline" className="text-[9px] border-blue-200 bg-blue-50 text-blue-700">
                                  MANDATORY DISCLOSURE
                                </Badge>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs font-semibold text-slate-700">{m.metricName}</p>
                            <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                              <span className="font-mono text-slate-600">current: {displayValue}</span>
                              {m.targetValue !== undefined && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono text-slate-600">target: {m.targetValue.toLocaleString()}</span>
                                </>
                              )}
                              {m.yearOnYearChange !== undefined && (
                                <>
                                  <span>·</span>
                                  <span className={`font-mono ${m.yearOnYearChange < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    YoY: {m.yearOnYearChange > 0 ? '+' : ''}{m.yearOnYearChange}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {m.frameworkRefs.map(ref => (
                                <span key={ref} className="text-[9px] font-mono text-blue-700 bg-blue-50 border border-blue-200 rounded px-1 py-0.5">
                                  {ref}
                                </span>
                              ))}
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
              {selectedMetric && (
                <>
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-600" />
                        {selectedMetric.metricName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {[
                        ['Category', socialCategoryMeta[selectedMetric.category].label],
                        ['Metric Name', selectedMetric.metricName],
                        ['Quantitative Threshold', selectedMetric.quantitativeThreshold],
                        ['Disclosure Required', selectedMetric.disclosureRequired ? 'YES' : 'NO'],
                        ['Data Source', selectedMetric.dataSource],
                        ...(selectedMetric.targetValue !== undefined ? [['Target Value', selectedMetric.targetValue.toLocaleString()]] : []),
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                          <span className="text-slate-500 shrink-0">{k}</span>
                          <span className="font-mono text-right text-slate-800 text-[11px]">{v}</span>
                        </div>
                      ))}

                      {/* Current value */}
                      <div className="pt-2">
                        <p className="text-slate-500 mb-1 text-[11px]">Current Value:</p>
                        {typeof selectedMetric.currentValue === 'number' ? (
                          <p className="text-2xl font-bold text-slate-900">
                            {selectedMetric.currentValue.toLocaleString()}
                            {selectedMetric.currentPct !== undefined && (
                              <span className="ml-2 text-sm font-normal text-slate-500">
                                ({selectedMetric.currentPct}% of {selectedMetric.totalCustomerBase?.toLocaleString()})
                              </span>
                            )}
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {Object.entries(selectedMetric.currentValue).map(([band, pct]) => (
                              <div key={band} className="flex items-center gap-2 text-[11px]">
                                <span className="w-32 text-slate-600 truncate capitalize">{band.replace(/_/g, ' ')}</span>
                                <div className="flex-1 relative h-4 rounded bg-slate-100 overflow-hidden">
                                  <div
                                    className={`absolute top-0 bottom-0 ${pct >= 40 ? 'bg-emerald-500' : pct >= 30 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="w-10 font-mono text-right text-slate-700">{pct}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Breakdown if available */}
                      {selectedMetric.currentBreakdown && (
                        <div className="pt-2">
                          <p className="text-slate-500 mb-1 text-[11px]">Spend Breakdown:</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(selectedMetric.currentBreakdown).map(([cat, amt]) => (
                              <Badge key={cat} variant="outline" className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border-emerald-200">
                                {cat}: {fmtUsd(amt)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Year-on-year change */}
                      {selectedMetric.yearOnYearChange !== undefined && selectedMetric.priorYearValue !== undefined && (
                        <div className="pt-2">
                          <p className="text-slate-500 mb-1 text-[11px]">Year-on-Year Change:</p>
                          <p className={`text-base font-bold ${selectedMetric.yearOnYearChange < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {selectedMetric.yearOnYearChange > 0 ? '+' : ''}{selectedMetric.yearOnYearChange} (from {selectedMetric.priorYearValue.toLocaleString()})
                          </p>
                        </div>
                      )}

                      {/* Framework references */}
                      <div className="pt-2">
                        <p className="text-slate-500 mb-1 text-[11px]">Framework References:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedMetric.frameworkRefs.map(ref => (
                            <Badge key={ref} variant="outline" className="text-[9px] font-mono text-blue-700 bg-blue-50 border-blue-200">
                              {ref}
                            </Badge>
                          ))}
                        </div>
                      </div>
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
