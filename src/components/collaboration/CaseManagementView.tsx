'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FolderKanban, Briefcase, Clock, AlertTriangle, FileText } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'
import { CitationList, type Citation, type RagFilter } from '@/components/shared/CitationList'

type Case = {
  id: string; caseType: string; title: string; regulator: string | null
  priority: string; status: string; assignee: string; dueDate: string
  description: string; createdAt: string; evidenceCount: number
  slaStatus: string; aiRecommendation: AIRec
  citations?: Citation[]
  ragFilter?: RagFilter | null
}

const priorityColor: Record<string, string> = {
  low: 'bg-slate-50 text-slate-700 border-slate-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
}

const slaColor: Record<string, string> = {
  on_track: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  at_risk: 'text-amber-700 bg-amber-50 border-amber-200',
  breach_imminent: 'text-rose-700 bg-rose-50 border-rose-200',
}

const typeIcon: Record<string, typeof Briefcase> = {
  examination: Briefcase,
  investigation: AlertTriangle,
  regulatory_request: FileText,
  internal_review: FolderKanban,
}

export function CaseManagementView() {
  const [items, setItems] = useState<Case[]>([])
  const [selected, setSelected] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('cases'))
      .then(r => r.json())
      .then(d => { setItems(d.cases ?? []); setSelected(d.cases?.[0] ?? null) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const critical = items.filter(c => c.priority === 'critical').length
  const open = items.filter(c => c.status !== 'closed').length
  const breach = items.filter(c => c.slaStatus === 'breach_imminent').length

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Collaboration & Trust"
        title="Case Management"
        subtitle="Examination, investigation and regulator-request workflows with SLA tracking and evidence packaging. Auto-assembles response packets — humans confirm release."
        icon={FolderKanban}
        accent="from-amber-500 to-orange-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Active Cases" value={open} sub="not closed" icon={FolderKanban} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Critical" value={critical} sub="board-level attention" icon={AlertTriangle} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="SLA Breach Risk" value={breach} sub="<5 days to due" icon={Clock} tint="text-orange-700 bg-orange-50" />
        <KpiTile label="Auto-Packets" value={items.filter(c => c.aiRecommendation.reviewerAction === 'approve_response_packet').length} sub="ready to release" icon={FileText} tint="text-emerald-700 bg-emerald-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Case Queue — sorted by SLA risk</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {[...items].sort((a, b) => {
                const order = ['breach_imminent', 'at_risk', 'on_track']
                return order.indexOf(a.slaStatus) - order.indexOf(b.slaStatus)
              }).map(c => {
                const Icon = typeIcon[c.caseType] ?? Briefcase
                const dueDate = new Date(c.dueDate)
                const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / 86400000)
                return (
                  <button key={c.id} onClick={() => setSelected(c)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${selected?.id === c.id ? 'bg-violet-50/40' : ''}`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-50">
                      <Icon className="h-4 w-4 text-amber-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${priorityColor[c.priority]}`}>{c.priority}</Badge>
                        <span className="text-xs font-semibold text-slate-700">{c.title}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {c.caseType.replace(/_/g, ' ')} · {c.regulator ?? 'internal'} · {c.assignee}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${slaColor[c.slaStatus]}`}>
                          {c.slaStatus.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-[10px] text-slate-400">{daysLeft}d left · {c.evidenceCount} evidence items</span>
                      </div>
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
                <CardHeader className="pb-3"><CardTitle className="text-sm">{selected.title}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Type', selected.caseType.replace(/_/g, ' ')],
                    ['Regulator', selected.regulator ?? 'Internal'],
                    ['Priority', selected.priority],
                    ['Status', selected.status.replace(/_/g, ' ')],
                    ['Assignee', selected.assignee],
                    ['Due Date', new Date(selected.dueDate).toLocaleDateString()],
                    ['SLA', selected.slaStatus.replace(/_/g, ' ')],
                    ['Evidence Items', `${selected.evidenceCount}`],
                    ['Created', new Date(selected.createdAt).toLocaleDateString()],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono text-right text-slate-800">{v}</span>
                    </div>
                  ))}
                  <p className="pt-2 text-slate-600">{selected.description}</p>
                </CardContent>
              </Card>

              {/* RAG sources — what the copilot retrieved to draft this case's
                  recommendation. Surfaces plugin provenance via CitationList. */}
              {selected.citations && selected.citations.length > 0 && (
                <Card className="border-emerald-200/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center gap-1.5 text-emerald-800">
                      <FileText className="h-3.5 w-3.5" />
                      RAG Sources
                      <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                        retrieved for case context
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CitationList
                      sources={selected.citations}
                      ragFilter={selected.ragFilter ?? null}
                      defaultExpanded={false}
                    />
                  </CardContent>
                </Card>
              )}

              <BooleanActionCard rec={selected.aiRecommendation} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
