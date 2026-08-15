'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Scale, Globe2, GitCompare, CheckCircle2 } from 'lucide-react'
import { usePluginData } from '@/hooks/use-plugin-data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Comparison = {
  id: string; topic: string; jurisdictions: string
  differences: string; harmonizationPath: string | null
  impactScore: number; affectedPolicies: number; createdAt: string
  aiRecommendation: AIRec
}

export function RuleHarmonizerView() {
  const { data: items, loading, error } = usePluginData<Comparison[]>('harmonizer', {
    select: (raw) => (raw as { comparisons?: Comparison[] }).comparisons ?? [],
  })
  const [selected, setSelected] = useState<Comparison | null>(null)

  useEffect(() => {
    if (items && items.length > 0 && !selected) setSelected(items[0])
  }, [items, selected])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>
  if (error) return <div className="p-6 text-rose-700">Failed to load comparisons: {error.message}</div>
  if (!items) return null

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Platform & Governance"
        title="Cross-Jurisdiction Rule Harmonizer"
        subtitle="Visual diff engine across US / EU / UK / APAC rules — operate one global program with local variations. AI pre-computes EU-baseline harmonization path."
        icon={Scale}
        accent="from-slate-600 to-purple-700"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Topics Compared" value={items.length} sub="across jurisdictions" icon={GitCompare} tint="text-slate-700 bg-slate-100" />
        <KpiTile label="Jurisdictions" value="US · EU · UK · SG" sub="global program" icon={Globe2} tint="text-blue-700 bg-blue-50" />
        <KpiTile label="Avg Impact" value={Math.round(items.reduce((s,i)=>s+i.impactScore,0)/items.length)} sub="harmonization score" icon={Scale} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="Auto-Harmonizable" value={items.filter(i=>i.harmonizationPath).length} sub="EU-baseline applied" icon={CheckCircle2} tint="text-emerald-700 bg-emerald-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Rule Comparisons — by impact score</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[...items].sort((a,b) => b.impactScore - a.impactScore).map(c => (
              <button key={c.id} onClick={() => setSelected(c)}
                className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${selected?.id === c.id ? 'border-slate-400 bg-slate-50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                <Scale className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{c.topic}</span>
                    <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-700">
                      impact {c.impactScore}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">{c.jurisdictions}</p>
                  <p className="mt-1 text-[11px] text-slate-600">{c.differences}</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <>
              <Card className="border-slate-200">
                <CardHeader className="pb-3"><CardTitle className="text-sm">{selected.topic}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Jurisdictions', selected.jurisdictions],
                    ['Impact Score', `${selected.impactScore}/100`],
                    ['Affected Policies', `${selected.affectedPolicies}`],
                    ['Created', new Date(selected.createdAt).toLocaleDateString()],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="text-right font-mono text-slate-800">{v}</span>
                    </div>
                  ))}
                  <div className="pt-2">
                    <p className="mb-1 text-slate-500">Differences</p>
                    <p className="rounded-md bg-rose-50/40 p-2 text-slate-700">{selected.differences}</p>
                  </div>
                  {selected.harmonizationPath && (
                    <div className="pt-1">
                      <p className="mb-1 text-emerald-700">Harmonization Path</p>
                      <p className="rounded-md bg-emerald-50/40 p-2 text-emerald-800">{selected.harmonizationPath}</p>
                    </div>
                  )}
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
