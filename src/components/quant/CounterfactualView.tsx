'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GitFork, Sparkles, TrendingUp, AlertOctagon } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Scenario = {
  trigger: string; probability: number
  complianceImpact: string; riskImpact: string; costImpact: string
  aiRecommendation: AIRec
}

export function CounterfactualView() {
  const [items, setItems] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('counterfactual'))
      .then(r => r.json())
      .then(d => setItems(d.scenarios ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const highProb = items.filter(s => s.probability >= 60).length
  const totalCost = items.length // just count for KPI

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Quant & Computational"
        title="Counterfactual Simulator"
        subtitle="What-if engine: regress the entire compliance + risk posture against hypothetical futures (rate hikes, MiFID III passage, sovereign default). Machine pre-computes optimal response per scenario."
        icon={GitFork}
        accent="from-fuchsia-500 to-purple-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Counterfactuals" value={items.length} sub="modelled futures" icon={GitFork} tint="text-fuchsia-700 bg-fuchsia-50" />
        <KpiTile label="High-Probability" value={highProb} sub="≥60% likelihood" icon={TrendingUp} tint="text-orange-700 bg-orange-50" />
        <KpiTile label="Avg Probability" value={`${Math.round(items.reduce((s,i)=>s+i.probability,0)/items.length)}%`} sub="next 18 months" icon={Sparkles} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="Auto-Drafted" value={items.filter(s=>s.aiRecommendation.reviewerAction==='approve_drafting').length} sub="policy responses ready" icon={AlertOctagon} tint="text-emerald-700 bg-emerald-50" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((s, idx) => (
          <Card key={idx} className="border-slate-200">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{s.trigger}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className={
                      s.probability >= 60 ? 'border-rose-200 bg-rose-50 text-rose-700' :
                      s.probability >= 30 ? 'border-amber-200 bg-amber-50 text-amber-700' :
                      'border-slate-200 bg-slate-50 text-slate-600'
                    }>
                      {s.probability}% probability
                    </Badge>
                    <span className="text-[10px] text-slate-400">18-month horizon</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-16 w-16 rounded-full border-4 border-slate-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-700">{s.probability}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-md bg-rose-50/60 p-2">
                  <p className="text-[9px] uppercase tracking-wide text-rose-700">Compliance</p>
                  <p className="mt-0.5 font-medium text-slate-700">{s.complianceImpact}</p>
                </div>
                <div className="rounded-md bg-amber-50/60 p-2">
                  <p className="text-[9px] uppercase tracking-wide text-amber-700">Risk</p>
                  <p className="mt-0.5 font-medium text-slate-700">{s.riskImpact}</p>
                </div>
                <div className="rounded-md bg-emerald-50/60 p-2">
                  <p className="text-[9px] uppercase tracking-wide text-emerald-700">Cost</p>
                  <p className="mt-0.5 font-medium text-slate-700">{s.costImpact}</p>
                </div>
              </div>

              <BooleanActionCard rec={s.aiRecommendation} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
