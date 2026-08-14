'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Leaf, CloudRain, Factory, TrendingDown, Globe2 } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Metric = {
  id: string; sector: string
  scope1Emissions: number; scope2Emissions: number; scope3Emissions: number
  financedEmissions: number; taxonomyAlignment: number
  physicalRiskScore: number; transitionRiskScore: number
  reportingPeriod: string; pcafMethod: string
  aiRecommendation: AIRec
}

export function ClimateEsgView() {
  const [items, setItems] = useState<Metric[]>([])
  const [ngfs, setNgfs] = useState<any[]>([])
  const [selected, setSelected] = useState<Metric | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('climate'))
      .then(r => r.json())
      .then(d => { setItems(d.metrics ?? []); setNgfs(d.ngfsScenarios ?? []); setSelected(d.metrics?.[0] ?? null) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const totalFinanced = items.reduce((s, m) => s + m.financedEmissions, 0)
  const avgTaxonomy = items.reduce((s, m) => s + m.taxonomyAlignment, 0) / items.length

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Quant & Computational"
        title="Climate & ESG Risk"
        subtitle="PCAF financed emissions, EU Taxonomy alignment, NGFS scenarios and TNFD nature-related financial risk. Science-based target setting pre-computed."
        icon={Leaf}
        accent="from-emerald-500 to-teal-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Financed Emissions" value={`${(totalFinanced / 1e6).toFixed(1)} Mt`} sub="CO2e — PCAF methodology" icon={CloudRain} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Avg Taxonomy" value={`${avgTaxonomy.toFixed(1)}%`} sub="EU Taxonomy aligned" icon={Globe2} tint="text-teal-700 bg-teal-50" />
        <KpiTile label="Sectors Covered" value={items.length} sub={items[0]?.reportingPeriod ?? 'FY2025'} icon={Factory} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="NGFS Scenarios" value={ngfs.length} sub="transition pathways" icon={TrendingDown} tint="text-orange-700 bg-orange-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Sector-level Financed Emissions (PCAF Asset Classes)</CardTitle></CardHeader>
          <CardContent className="space-y-3 p-4">
            {items.sort((a,b) => b.financedEmissions - a.financedEmissions).map(m => {
              const max = Math.max(...items.map(i => i.financedEmissions), 1)
              return (
                <button key={m.id} onClick={() => setSelected(m)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${selected?.id === m.id ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{m.sector}</p>
                      <p className="text-[10px] text-slate-400">{m.pcafMethod} · {m.reportingPeriod}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-700">{(m.financedEmissions / 1e3).toFixed(1)}k tCO2e</p>
                      <p className="text-[10px] text-slate-400">financed</p>
                    </div>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${(m.financedEmissions / max) * 100}%` }} />
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[10px]">
                    <span className="text-slate-500">Taxonomy: <strong className="text-emerald-700">{m.taxonomyAlignment}%</strong></span>
                    <span className="text-slate-500">Physical: <strong className={m.physicalRiskScore > 60 ? 'text-rose-600' : 'text-slate-700'}>{m.physicalRiskScore}</strong></span>
                    <span className="text-slate-500">Transition: <strong className={m.transitionRiskScore > 60 ? 'text-amber-600' : 'text-slate-700'}>{m.transitionRiskScore}</strong></span>
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3"><CardTitle className="text-sm">NGFS Transition Scenarios — 30-yr cumulative loss ($B)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {ngfs.map(n => (
                <div key={n.name} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 p-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{n.name}</p>
                    <p className="text-[10px] text-slate-400">{n.warming} · {n.policy}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-rose-600">${n.cumLoss.toFixed(1)}B</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {selected && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Selected Sector</CardTitle></CardHeader>
              <CardContent className="space-y-1.5 text-xs">
                {[
                  ['Scope 1', `${selected.scope1Emissions.toLocaleString()} tCO2e`],
                  ['Scope 2', `${selected.scope2Emissions.toLocaleString()} tCO2e`],
                  ['Scope 3', `${selected.scope3Emissions.toLocaleString()} tCO2e`],
                  ['Financed', `${selected.financedEmissions.toLocaleString()} tCO2e`],
                  ['Taxonomy', `${selected.taxonomyAlignment}%`],
                  ['Physical Risk', `${selected.physicalRiskScore}/100`],
                  ['Transition Risk', `${selected.transitionRiskScore}/100`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-slate-50 pb-1">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-mono text-slate-800">{v}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {selected && <BooleanActionCard rec={selected.aiRecommendation} />}
        </div>
      </div>
    </div>
  )
}
