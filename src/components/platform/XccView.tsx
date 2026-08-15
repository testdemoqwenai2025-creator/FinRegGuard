'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileCheck2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { usePluginData } from '@/hooks/use-plugin-data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Card_ = {
  id: string; decisionId: string; decision: string
  regulation: string; policyRef: string; evidence: string
  reasoning: string; confidence: number; generatedAt: string
  aiRecommendation: AIRec
}

const decisionConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  approved: { color: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  declined: { color: 'border-rose-200 bg-rose-50 text-rose-700', icon: XCircle },
  flagged:  { color: 'border-amber-200 bg-amber-50 text-amber-700', icon: AlertCircle },
}

export function XccView() {
  const { data: items, loading, error } = usePluginData<Card_[]>('xcc', {
    select: (raw) => (raw as { cards?: Card_[] }).cards ?? [],
  })
  const [selected, setSelected] = useState<Card_ | null>(null)

  useEffect(() => {
    if (items && items.length > 0 && !selected) setSelected(items[0])
  }, [items, selected])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>
  if (error) return <div className="p-6 text-rose-700">Failed to load XCC cards: {error.message}</div>
  if (!items) return null

  const approved = items.filter(c => c.decision === 'approved').length
  const declined = items.filter(c => c.decision === 'declined').length
  const flagged = items.filter(c => c.decision === 'flagged').length

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Platform & Governance"
        title="Explainable Compliance Cards"
        subtitle="Every approve / flag / decline decision ships with a one-page cited explanation — defensible in court, mandated by EU AI Act Art 13. Anchored to chain."
        icon={FileCheck2}
        accent="from-emerald-500 to-cyan-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="XCC Cards" value={items.length} sub="decisions explained" icon={FileCheck2} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Approved" value={approved} sub="auto-published" icon={CheckCircle2} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Flagged" value={flagged} sub="human review" icon={AlertCircle} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Declined" value={declined} sub="with citation" icon={XCircle} tint="text-rose-700 bg-rose-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Decision Registry — newest first</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {[...items].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()).map(c => {
                const cfg = decisionConfig[c.decision] ?? decisionConfig.flagged
                const Icon = cfg.icon
                return (
                  <button key={c.id} onClick={() => setSelected(c)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${selected?.id === c.id ? 'bg-violet-50/40' : ''}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${cfg.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] capitalize ${cfg.color}`}>{c.decision}</Badge>
                        <span className="text-xs font-semibold text-slate-700">{c.decisionId}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">{c.regulation} · {c.policyRef}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-600">{c.reasoning}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-slate-700">{c.confidence}%</p>
                      <p className="text-[10px] text-slate-400">confidence</p>
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
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className={`capitalize ${decisionConfig[selected.decision].color}`}>
                      {selected.decision}
                    </Badge>
                    {selected.decisionId}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="rounded-md bg-slate-50 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Citation</p>
                    <p className="mt-1 text-slate-700"><strong>Regulation:</strong> {selected.regulation}</p>
                    <p className="text-slate-700"><strong>Policy:</strong> {selected.policyRef}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-slate-500">Reasoning</p>
                    <p className="rounded-md border border-slate-100 bg-white p-2 leading-relaxed text-slate-700">
                      {selected.reasoning}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-slate-500">Evidence Anchor</p>
                    <p className="rounded-md bg-emerald-50/40 p-2 font-mono text-[10px] text-emerald-700">{selected.evidence}</p>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-1.5">
                    <span className="text-slate-500">Confidence</span>
                    <span className="font-mono font-bold text-slate-800">{selected.confidence}%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-1.5">
                    <span className="text-slate-500">Generated</span>
                    <span className="font-mono text-slate-800">{new Date(selected.generatedAt).toLocaleString()}</span>
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
