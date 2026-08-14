'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Share2, FileText, FileCheck2, Database, ShieldCheck } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type GNode = { id: string; type: string; label: string; jurisdiction?: string }
type GEdge = { source: string; target: string; type: string }

const typeConfig: Record<string, { color: string; icon: typeof FileText; y: number }> = {
  regulation: { color: '#0ea5e9', icon: FileText, y: 0.15 },
  policy:     { color: '#8b5cf6', icon: FileCheck2, y: 0.4 },
  control:    { color: '#10b981', icon: ShieldCheck, y: 0.65 },
  evidence:   { color: '#f59e0b', icon: Database, y: 0.9 },
}

const edgeColor: Record<string, string> = {
  implements: '#0ea5e9',
  enforced_by: '#8b5cf6',
  evidenced_by: '#10b981',
}

export function KnowledgeGraphView() {
  const [nodes, setNodes] = useState<GNode[]>([])
  const [edges, setEdges] = useState<GEdge[]>([])
  const [rec, setRec] = useState<AIRec | null>(null)
  const [selected, setSelected] = useState<GNode | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('knowledge-graph'))
      .then(r => r.json())
      .then(d => { setNodes(d.nodes ?? []); setEdges(d.edges ?? []); setRec(d.aiRecommendation ?? null) })
      .finally(() => setLoading(false))
  }, [])

  const positions = useMemo(() => {
    const W = 720, H = 540
    const map = new Map<string, [number, number]>()
    const byType: Record<string, GNode[]> = {}
    nodes.forEach(n => { byType[n.type] = byType[n.type] ?? []; byType[n.type].push(n) })
    Object.entries(byType).forEach(([type, list]) => {
      const y = (typeConfig[type]?.y ?? 0.5) * H
      list.forEach((n, i) => {
        const x = ((i + 1) / (list.length + 1)) * W
        map.set(n.id, [x, y])
      })
    })
    return { map, W, H }
  }, [nodes])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Intelligence & Automation"
        title="Regulatory Knowledge Graph"
        subtitle="Regulation → policy → control → evidence as a navigable semantic graph with vector RAG retrieval. AI auto-curates new edges; humans confirm proposed links."
        icon={Share2}
        accent="from-indigo-500 to-purple-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Regulations" value={nodes.filter(n => n.type === 'regulation').length} icon={FileText} tint="text-sky-700 bg-sky-50" />
        <KpiTile label="Policies" value={nodes.filter(n => n.type === 'policy').length} icon={FileCheck2} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="Controls" value={nodes.filter(n => n.type === 'control').length} icon={ShieldCheck} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Evidence" value={nodes.filter(n => n.type === 'evidence').length} icon={Database} tint="text-amber-700 bg-amber-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Semantic Graph — layered by type, click to inspect</CardTitle></CardHeader>
          <CardContent className="p-2">
            <svg viewBox={`0 0 ${positions.W} ${positions.H}`} className="h-[540px] w-full rounded-lg bg-slate-50">
              {/* Layer labels */}
              {Object.entries(typeConfig).map(([t, cfg]) => (
                <text key={t} x={12} y={cfg.y * positions.H + 4} className="fill-slate-400 text-[10px] uppercase tracking-wide">
                  {t}
                </text>
              ))}
              {/* Edges */}
              {edges.map((e, i) => {
                const s = positions.map.get(e.source)
                const t = positions.map.get(e.target)
                if (!s || !t) return null
                return (
                  <line key={i} x1={s[0]} y1={s[1]} x2={t[0]} y2={t[1]}
                    stroke={edgeColor[e.type] ?? '#cbd5e1'}
                    strokeWidth={1.2} opacity={0.5}
                    strokeDasharray={e.type === 'evidenced_by' ? '4,3' : 'none'} />
                )
              })}
              {/* Nodes */}
              {nodes.map(n => {
                const [x, y] = positions.map.get(n.id) ?? [0, 0]
                const cfg = typeConfig[n.type] ?? typeConfig.regulation
                const isSelected = selected?.id === n.id
                return (
                  <g key={n.id} onClick={() => setSelected(n)} className="cursor-pointer">
                    <rect x={x - 70} y={y - 12} width={140} height={24} rx={6}
                      fill={cfg.color} opacity={isSelected ? 1 : 0.85}
                      stroke={isSelected ? '#1e293b' : '#fff'} strokeWidth={isSelected ? 2 : 1} />
                    <text x={x} y={y + 4} textAnchor="middle" className="fill-white text-[10px] font-medium">
                      {n.label.length > 22 ? n.label.slice(0, 22) + '…' : n.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3"><CardTitle className="text-sm capitalize">{selected.type}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="rounded-md bg-slate-50 p-2">
                  <p className="text-sm font-semibold text-slate-800">{selected.label}</p>
                </div>
                {selected.jurisdiction && (
                  <div className="flex justify-between border-b border-slate-50 pb-1.5">
                    <span className="text-slate-500">Jurisdiction</span>
                    <span className="font-mono text-slate-800">{selected.jurisdiction}</span>
                  </div>
                )}
                <div>
                  <p className="mb-1 text-slate-500">Linked nodes</p>
                  <div className="space-y-1">
                    {edges.filter(e => e.source === selected.id || e.target === selected.id).map((e, i) => {
                      const otherId = e.source === selected.id ? e.target : e.source
                      const other = nodes.find(n => n.id === otherId)
                      return (
                        <div key={i} className="flex items-center gap-2 rounded-md border border-slate-100 p-1.5">
                          <Badge variant="outline" className="text-[9px]">{e.type.replace(/_/g, ' ')}</Badge>
                          <span className="text-[11px] text-slate-700">{other?.label ?? otherId}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {rec && <BooleanActionCard rec={rec} />}
        </div>
      </div>
    </div>
  )
}
