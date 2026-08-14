'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FolderKanban, Briefcase, Clock, AlertTriangle, FileText, RefreshCw } from 'lucide-react'
import { dataUrl, IS_STATIC_BUILD } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'
import { CitationList, type Citation, type RagFilter } from '@/components/shared/CitationList'

type Case = {
  id: string; caseType: string; title: string; regulator: string | null
  priority: string; status: string; assignee: string; dueDate: string
  description: string; createdAt: string; evidenceCount: number
  slaStatus: string; aiRecommendation: AIRec
  // Static-build fallback: cases.json still embeds synthetic citations
  // so the view degrades gracefully when /api is unavailable.
  citations?: Citation[]
  ragFilter?: RagFilter | null
}

// Live-fetch state for one case's citations.
type CitationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; citations: Citation[]; ragFilter: RagFilter | null; latencyMs: number; broadened?: boolean }
  | { status: 'error'; message: string }

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
  // Per-case citation cache so switching back to a previously-viewed case
  // is instant rather than refetching every time.
  const [citationCache, setCitationCache] = useState<Record<string, CitationState>>({})

  useEffect(() => {
    fetch(dataUrl('cases'))
      .then(r => r.json())
      .then(d => { setItems(d.cases ?? []); setSelected(d.cases?.[0] ?? null) })
      .finally(() => setLoading(false))
  }, [])

  // Fetch live citations for the selected case. Skipped in static-build mode
  // (where /api is unavailable) — falls back to selected.citations from JSON.
  const loadCitations = useCallback(async (caseId: string) => {
    if (IS_STATIC_BUILD) return // static export: use embedded citations
    setCitationCache((cur) => ({
      ...cur,
      [caseId]: { status: 'loading' },
    }))
    try {
      const res = await fetch(`/api/cases/${encodeURIComponent(caseId)}/citations?topK=8`)
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(errBody.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as {
        citations: Citation[]
        ragFilter: RagFilter & { broadened?: boolean }
        latencyMs: number
      }
      setCitationCache((cur) => ({
        ...cur,
        [caseId]: {
          status: 'ok',
          citations: data.citations,
          ragFilter: data.ragFilter,
          latencyMs: data.latencyMs,
          broadened: data.ragFilter.broadened,
        },
      }))
    } catch (err) {
      setCitationCache((cur) => ({
        ...cur,
        [caseId]: { status: 'error', message: err instanceof Error ? err.message : 'Unknown error' },
      }))
    }
  }, [])

  // Whenever the selected case changes, kick off a citation fetch (if not cached).
  useEffect(() => {
    if (!selected) return
    if (citationCache[selected.id]) return // already cached (or loading)
    loadCitations(selected.id)
  }, [selected, citationCache, loadCitations])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const critical = items.filter(c => c.priority === 'critical').length
  const open = items.filter(c => c.status !== 'closed').length
  const breach = items.filter(c => c.slaStatus === 'breach_imminent').length

  // Resolve which citations to render for the currently-selected case.
  // Priority: live fetch (if ok) > static fallback (cases.json) > empty.
  const liveState = selected ? citationCache[selected.id] : undefined
  const renderCitations: Citation[] =
    liveState?.status === 'ok' ? liveState.citations :
    (selected?.citations ?? [])
  const renderRagFilter: RagFilter | null =
    liveState?.status === 'ok' ? liveState.ragFilter :
    (selected?.ragFilter ?? null)

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

              {/* RAG sources — live-fetched from /api/cases/[id]/citations.
                  Falls back to embedded synthetic citations in static-build
                  mode (where /api is unavailable). */}
              <Card className="border-emerald-200/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center justify-between gap-1.5 text-emerald-800">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      RAG Sources
                      <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                        retrieved for case context
                      </span>
                    </span>
                    {/* Status chip on the right side of the header */}
                    <RagStatusChip
                      state={liveState}
                      isStatic={IS_STATIC_BUILD}
                      hasFallback={!!selected.citations && selected.citations.length > 0}
                      onRetry={() => loadCitations(selected.id)}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <RagSourcesBody
                    state={liveState}
                    citations={renderCitations}
                    ragFilter={renderRagFilter}
                    isStatic={IS_STATIC_BUILD}
                    hasFallback={!!selected.citations && selected.citations.length > 0}
                  />
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

// ─── Helper sub-components for the RAG Sources card ──────────────────────

function RagStatusChip({
  state,
  isStatic,
  hasFallback,
  onRetry,
}: {
  state: CitationState | undefined
  isStatic: boolean
  hasFallback: boolean
  onRetry: () => void
}) {
  if (isStatic) {
    return (
      <span className="text-[9px] font-normal text-slate-500">
        static
      </span>
    )
  }
  if (!state || state.status === 'idle') {
    return null
  }
  if (state.status === 'loading') {
    return (
      <span className="flex items-center gap-1 text-[9px] font-normal text-slate-500">
        <RefreshCw className="h-2.5 w-2.5 animate-spin" />
        retrieving…
      </span>
    )
  }
  if (state.status === 'error') {
    return (
      <button
        onClick={onRetry}
        className="flex items-center gap-1 text-[9px] font-normal text-rose-600 hover:text-rose-700"
        title={state.message}
      >
        <RefreshCw className="h-2.5 w-2.5" />
        retry
      </button>
    )
  }
  // status === 'ok'
  return (
    <span className="text-[9px] font-normal text-slate-500" title={`Retrieved in ${state.latencyMs}ms`}>
      {state.latencyMs}ms{state.broadened ? ' · broadened' : ''}
      {!hasFallback && ''}
    </span>
  )
}

function RagSourcesBody({
  state,
  citations,
  ragFilter,
  isStatic,
  hasFallback,
}: {
  state: CitationState | undefined
  citations: Citation[]
  ragFilter: RagFilter | null
  isStatic: boolean
  hasFallback: boolean
}) {
  // Static build: render the embedded synthetic citations without status UI.
  if (isStatic) {
    if (citations.length === 0) return <EmptyRag />
    return <CitationList sources={citations} ragFilter={ragFilter} defaultExpanded={false} />
  }

  // Loading state — only show skeleton if we don't have fallback citations
  // to display in the meantime.
  if (state?.status === 'loading' && !hasFallback) {
    return (
      <div className="py-6 text-center text-[10px] text-muted-foreground">
        <RefreshCw className="mx-auto mb-1.5 h-4 w-4 animate-spin text-emerald-500" />
        Retrieving sources from the vector store…
      </div>
    )
  }

  // Error state — show fallback if available, otherwise error message.
  if (state?.status === 'error') {
    if (citations.length > 0) {
      return (
        <div>
          <p className="mb-1.5 text-[9px] text-rose-600">
            Live retrieval failed — showing cached fallback. ({state.message})
          </p>
          <CitationList sources={citations} ragFilter={ragFilter} defaultExpanded={false} />
        </div>
      )
    }
    return (
      <div className="py-6 text-center text-[10px] text-rose-600">
        <AlertTriangle className="mx-auto mb-1.5 h-4 w-4" />
        Could not retrieve RAG sources.
        <br />
        <span className="text-[9px] text-muted-foreground">{state.message}</span>
      </div>
    )
  }

  // OK or idle — render citations (may be empty).
  if (citations.length === 0) return <EmptyRag />
  return <CitationList sources={citations} ragFilter={ragFilter} defaultExpanded={false} />
}

function EmptyRag() {
  return (
    <div className="py-6 text-center text-[10px] text-muted-foreground">
      <FileText className="mx-auto mb-1.5 h-4 w-4 text-slate-400" />
      No sources retrieved for this case.
      <br />
      <span className="text-[9px]">
        Try running a drift scan or indexing more plugins.
      </span>
    </div>
  )
}
