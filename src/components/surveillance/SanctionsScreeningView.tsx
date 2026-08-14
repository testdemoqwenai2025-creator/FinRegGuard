'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShieldAlert, ShieldCheck, Crosshair, Lock } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Hit = {
  id: string; listName: string; matchType: string
  matchedName: string; listedEntity: string; entityId: string
  score: number; status: string; reviewedBy: string | null
  action: string | null; timestamp: string; aiRecommendation: AIRec
}

const matchColor: Record<string, string> = {
  exact: 'bg-rose-100 text-rose-800 border-rose-300',
  fuzzy: 'bg-orange-100 text-orange-800 border-orange-300',
  partial: 'bg-amber-100 text-amber-800 border-amber-300',
  phonetic: 'bg-violet-100 text-violet-800 border-violet-300',
}

const statusColor: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  true_positive: 'bg-rose-50 text-rose-700 border-rose-200',
  false_positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  escalated: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
}

export function SanctionsScreeningView() {
  const [hits, setHits] = useState<Hit[]>([])
  const [selected, setSelected] = useState<Hit | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('sanctions'))
      .then(r => r.json())
      .then(d => { setHits(d.hits ?? []); setSelected(d.hits?.[0] ?? null) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const truePos = hits.filter(h => h.status === 'true_positive').length
  const pending = hits.filter(h => h.status === 'pending').length
  const blocked = hits.filter(h => h.status === 'true_positive' && h.score >= 90).length

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Surveillance"
        title="Sanctions Screening"
        subtitle="Real-time OFAC, UN, EU, HMT, MAS list screening with fuzzy / phonetic / exact match scoring. OFAC 50% Rule ownership-chain analysis applied automatically."
        icon={ShieldAlert}
        accent="from-rose-600 to-red-700"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Pending Hits" value={pending} sub="awaiting review" icon={Crosshair} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="True Positives" value={truePos} sub="confirmed matches" icon={ShieldAlert} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="Auto-Blocked" value={blocked} sub="score ≥ 90" icon={Lock} tint="text-fuchsia-700 bg-fuchsia-50" />
        <KpiTile label="Lists Monitored" value={7} sub="OFAC · UN · EU · HMT · MAS · OFSI" icon={ShieldCheck} tint="text-emerald-700 bg-emerald-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Screening Hits — by score descending</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {hits.sort((a, b) => b.score - a.score).map(h => (
                <button key={h.id} onClick={() => setSelected(h)}
                  className={`flex w-full items-center gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${selected?.id === h.id ? 'bg-violet-50/40' : ''}`}>
                  <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md bg-rose-50 text-xs font-bold text-rose-700">
                    {h.score}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${matchColor[h.matchType]}`}>{h.matchType}</Badge>
                      <span className="truncate text-xs font-semibold text-slate-700">{h.matchedName}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-400">{h.listName} · {h.entityId}</p>
                    <Badge variant="outline" className={`mt-1 text-[10px] ${statusColor[h.status]}`}>{h.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-mono text-violet-600">{h.aiRecommendation.confidence}%</p>
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
                <CardHeader className="pb-3"><CardTitle className="text-sm">Hit Detail</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['List', selected.listName],
                    ['Match Type', selected.matchType],
                    ['Matched Name', selected.matchedName],
                    ['Listed Entity', selected.listedEntity],
                    ['Entity ID', selected.entityId],
                    ['Score', `${selected.score}/100`],
                    ['Status', selected.status.replace(/_/g, ' ')],
                    ['Reviewed By', selected.reviewedBy ?? 'auto-triage-v3'],
                    ['Action', selected.action ?? '—'],
                    ['Timestamp', new Date(selected.timestamp).toLocaleString()],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono text-right font-medium text-slate-800">{v}</span>
                    </div>
                  ))}
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
