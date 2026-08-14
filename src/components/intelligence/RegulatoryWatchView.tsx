'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Newspaper, Globe2, TrendingUp, Inbox } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Change = {
  id: string; source: string; title: string; jurisdiction: string
  publishedAt: string; impactScore: number; affectedPolicies: number
  status: string; summary: string; aiRecommendation: AIRec
}

const jurisColor: Record<string, string> = {
  US: 'bg-blue-50 text-blue-700 border-blue-200',
  EU: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  UK: 'bg-purple-50 text-purple-700 border-purple-200',
  SG: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  JP: 'bg-rose-50 text-rose-700 border-rose-200',
  Global: 'bg-slate-100 text-slate-700 border-slate-200',
}

const statusColor: Record<string, string> = {
  new: 'bg-rose-50 text-rose-700 border-rose-200',
  triaged: 'bg-amber-50 text-amber-700 border-amber-200',
  drafting: 'bg-violet-50 text-violet-700 border-violet-200',
  applied: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  dismissed: 'bg-slate-100 text-slate-500 border-slate-200',
}

export function RegulatoryWatchView() {
  const [items, setItems] = useState<Change[]>([])
  const [selected, setSelected] = useState<Change | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('regwatch'))
      .then(r => r.json())
      .then(d => { setItems(d.changes ?? []); setSelected(d.changes?.[0] ?? null) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const newItems = items.filter(i => i.status === 'new').length
  const highImpact = items.filter(i => i.impactScore >= 80).length
  const sources = new Set(items.map(i => i.source)).size

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Intelligence & Automation"
        title="Regulatory Watch"
        subtitle="Automated parsing of Federal Register, ESMA, FCA, MAS, FSB publications — classified, scored, and triaged by AI. High-impact changes auto-draft policy deltas."
        icon={Newspaper}
        accent="from-blue-500 to-cyan-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Sources Watched" value={sources} sub="Fed Register · ESMA · FCA · MAS · FSB" icon={Globe2} tint="text-blue-700 bg-blue-50" />
        <KpiTile label="New (7d)" value={newItems} sub="unread by team" icon={Inbox} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="High Impact" value={highImpact} sub="score ≥ 80" icon={TrendingUp} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Auto-Drafted" value={items.filter(i => i.aiRecommendation.reviewerAction === 'approve_auto_draft').length} sub="policy deltas ready" icon={Newspaper} tint="text-emerald-700 bg-emerald-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Regulatory Feed — sorted by impact score</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {[...items].sort((a, b) => b.impactScore - a.impactScore).map(c => (
                <button key={c.id} onClick={() => setSelected(c)}
                  className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${selected?.id === c.id ? 'bg-violet-50/40' : ''}`}>
                  <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-700">
                    {c.impactScore}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${jurisColor[c.jurisdiction] ?? jurisColor.Global}`}>{c.jurisdiction}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${statusColor[c.status]}`}>{c.status}</Badge>
                      <span className="text-[10px] text-slate-400">{c.source}</span>
                      {(c as any).dataSource === 'real_feed' && (
                        <Badge variant="outline" className="text-[10px] border-emerald-300 bg-emerald-50 text-emerald-700">● live</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-slate-800">{c.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{c.summary}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{c.affectedPolicies} policies affected · {new Date(c.publishedAt).toLocaleDateString()}</p>
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
                <CardHeader className="pb-3"><CardTitle className="text-sm">{selected.title}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Source', selected.source],
                    ['Jurisdiction', selected.jurisdiction],
                    ['Published', new Date(selected.publishedAt).toLocaleString()],
                    ['Impact Score', `${selected.impactScore}/100`],
                    ['Affected Policies', `${selected.affectedPolicies}`],
                    ['Status', selected.status],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono text-right text-slate-800">{v}</span>
                    </div>
                  ))}
                  <p className="pt-2 text-slate-600">{selected.summary}</p>
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
