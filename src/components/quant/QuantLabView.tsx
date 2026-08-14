'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FlaskConical, TrendingUp, DollarSign, Activity, BarChart3 } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Scenario = {
  id: string; scenarioType: string; description: string
  detail: string; timeHorizon: string; p99Loss: number
  expectedLoss: number; capitalImpact: number; status: string
  createdAt: string; aiRecommendation: AIRec
  distribution: number[]
}

const typeColor: Record<string, string> = {
  CCAR: 'bg-blue-50 text-blue-700 border-blue-200',
  EBA: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  BoE_ACS: 'bg-purple-50 text-purple-700 border-purple-200',
  FRTB_IMA: 'bg-violet-50 text-violet-700 border-violet-200',
  NGFS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  custom: 'bg-slate-100 text-slate-700 border-slate-200',
}

export function QuantLabView() {
  const [items, setItems] = useState<Scenario[]>([])
  const [selected, setSelected] = useState<Scenario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('quant'))
      .then(r => r.json())
      .then(d => { setItems(d.scenarios ?? []); setSelected(d.scenarios?.[0] ?? null) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const maxP99 = Math.max(...items.map(s => s.p99Loss), 1)
  const breaches = items.filter(s => s.p99Loss > 200).length

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Quant & Computational"
        title="Quant Lab"
        subtitle="Monte Carlo capital adequacy, FRTB IMA, CCAR/EBA/BoE stress testing with 10,000+ scenario paths. P99 VaR breaches auto-flagged; derisking actions pre-computed."
        icon={FlaskConical}
        accent="from-violet-500 to-indigo-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Scenarios" value={items.length} sub="across 6 frameworks" icon={BarChart3} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="Max P99 Loss" value={`$${maxP99.toFixed(0)}M`} sub="worst scenario" icon={TrendingUp} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="VaR Breaches" value={breaches} sub="P99 > $200M" icon={Activity} tint="text-orange-700 bg-orange-50" />
        <KpiTile label="Capital Impact" value={`$${items.reduce((s,i)=>s+i.capitalImpact,0).toFixed(0)}M`} sub="aggregate" icon={DollarSign} tint="text-emerald-700 bg-emerald-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Scenario Library — Monte Carlo P&L distributions</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {items.map(s => (
                <button key={s.id} onClick={() => setSelected(s)}
                  className={`w-full border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${selected?.id === s.id ? 'bg-violet-50/40' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${typeColor[s.scenarioType]}`}>{s.scenarioType.replace(/_/g, ' ')}</Badge>
                      <span className="text-xs font-semibold text-slate-700">{s.description}</span>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${s.p99Loss > 200 ? 'text-rose-600' : 'text-slate-700'}`}>${s.p99Loss.toFixed(1)}M</p>
                      <p className="text-[10px] text-slate-400">P99 · {s.timeHorizon}</p>
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{s.detail}</p>
                  {/* Mini histogram of distribution */}
                  <div className="mt-2 flex h-6 items-end gap-px">
                    {s.distribution.slice(0, 40).map((v, i) => {
                      const max = Math.max(...s.distribution, 1)
                      const h = Math.max(2, (v / max) * 100)
                      return <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: v > s.p99Loss * 0.7 ? '#fb7185' : '#a78bfa' }} />
                    })}
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                    <span>EL ${s.expectedLoss.toFixed(1)}M</span>
                    <span>Capital ${s.capitalImpact.toFixed(1)}M</span>
                    <span>{s.aiRecommendation.confidence}% conf</span>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <>
              <Card className="border-slate-200">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Scenario Detail</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Type', selected.scenarioType.replace(/_/g, ' ')],
                    ['Horizon', selected.timeHorizon],
                    ['P99 Loss', `$${selected.p99Loss.toFixed(1)}M`],
                    ['Expected Loss', `$${selected.expectedLoss.toFixed(2)}M`],
                    ['Capital Impact', `$${selected.capitalImpact.toFixed(1)}M`],
                    ['Status', selected.status],
                    ['Simulated', `${selected.distribution.length} paths`],
                    ['Created', new Date(selected.createdAt).toLocaleString()],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono font-medium text-slate-800">{v}</span>
                    </div>
                  ))}
                  <p className="pt-2 text-slate-600">{selected.detail}</p>
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
