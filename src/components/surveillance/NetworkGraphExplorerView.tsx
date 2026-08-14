'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Network, Users, GitFork, AlertTriangle } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type GNode = {
  id: string; label: string; type: string
  riskScore: number; jurisdiction: string; isFlagged: boolean
}
type GEdge = {
  id: string; source: string; target: string
  type: string; weight: number; currency: string; timestamp: string
}
type Cluster = { id: string; label: string; risk: number; nodeCount: number }

const typeColor: Record<string, string> = {
  person: '#8b5cf6',
  company: '#0ea5e9',
  account: '#10b981',
  address: '#f97316',
  crypto_wallet: '#f43f5e',
}

// Deterministic position by hashing id — gives a stable "constellation"
function pos(id: string, w: number, h: number, idx: number, total: number): [number, number] {
  // Place in a circular layout with some jitter from hash
  const angle = (idx / total) * 2 * Math.PI
  const hash = id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)
  const radius = (0.25 + ((hash & 0xff) / 255) * 0.18) * Math.min(w, h)
  return [w / 2 + Math.cos(angle) * radius, h / 2 + Math.sin(angle) * radius]
}

export function NetworkGraphExplorerView() {
  const [nodes, setNodes] = useState<GNode[]>([])
  const [edges, setEdges] = useState<GEdge[]>([])
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [rec, setRec] = useState<AIRec | null>(null)
  const [selected, setSelected] = useState<GNode | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('network'))
      .then(r => r.json())
      .then(d => {
        setNodes(d.nodes ?? [])
        setEdges(d.edges ?? [])
        setClusters(d.clusters ?? [])
        setRec(d.aiRecommendation ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  const positions = useMemo(() => {
    const W = 720, H = 540
    const map = new Map<string, [number, number]>()
    nodes.forEach((n, i) => map.set(n.id, pos(n.id, W, H, i, nodes.length)))
    return { map, W, H }
  }, [nodes])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const flagged = nodes.filter(n => n.isFlagged).length
  const totalFlow = edges.reduce((s, e) => s + e.weight, 0)

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Surveillance"
        title="Entity Network Explorer"
        subtitle="Force-directed graph of counterparties, beneficial owners and fund flows — turning money laundering from a row problem into a graph problem. Louvain community detection runs live."
        icon={Network}
        accent="from-violet-500 to-fuchsia-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Entities" value={nodes.length} sub="persons · companies · accounts · wallets" icon={Users} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="Relationships" value={edges.length} sub="ownership · txn · shared address" icon={GitFork} tint="text-sky-700 bg-sky-50" />
        <KpiTile label="Flagged" value={flagged} sub="risk ≥ 75" icon={AlertTriangle} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="Total Flow" value={`$${(totalFlow / 1e6).toFixed(1)}M`} sub={`across ${edges.length} edges`} icon={Network} tint="text-emerald-700 bg-emerald-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Network Topology — click a node to inspect</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <svg viewBox={`0 0 ${positions.W} ${positions.H}`} className="h-[540px] w-full rounded-lg bg-slate-50">
              {/* Edges */}
              {edges.map(e => {
                const s = positions.map.get(e.source)
                const t = positions.map.get(e.target)
                if (!s || !t) return null
                const isHigh = e.weight > 1_000_000
                return (
                  <line key={e.id} x1={s[0]} y1={s[1]} x2={t[0]} y2={t[1]}
                    stroke={isHigh ? '#fb7185' : '#cbd5e1'}
                    strokeWidth={isHigh ? 1.5 : 0.6}
                    opacity={isHigh ? 0.7 : 0.35} />
                )
              })}
              {/* Nodes */}
              {nodes.map(n => {
                const [x, y] = positions.map.get(n.id) ?? [0, 0]
                const r = n.isFlagged ? 9 : 6
                const color = typeColor[n.type] ?? '#64748b'
                const isSelected = selected?.id === n.id
                return (
                  <g key={n.id} onClick={() => setSelected(n)} className="cursor-pointer">
                    {n.isFlagged && (
                      <circle cx={x} cy={y} r={r + 5} fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.5" className="animate-pulse" />
                    )}
                    <circle cx={x} cy={y} r={r + (isSelected ? 3 : 0)} fill={color}
                      stroke={isSelected ? '#1e293b' : '#fff'} strokeWidth={isSelected ? 2 : 1} />
                    {n.riskScore >= 75 && (
                      <text x={x} y={y - r - 6} textAnchor="middle" className="fill-rose-600 text-[9px] font-bold">
                        {n.riskScore}
                      </text>
                    )}
                  </g>
                )
              })}
              {/* Legend */}
              <g transform="translate(12, 12)">
                {Object.entries(typeColor).map(([t, c], i) => (
                  <g key={t} transform={`translate(0, ${i * 16})`}>
                    <circle cx="6" cy="6" r="5" fill={c} />
                    <text x="18" y="9" className="fill-slate-700 text-[10px] capitalize">{t.replace(/_/g, ' ')}</text>
                  </g>
                ))}
              </g>
            </svg>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Detected Clusters — Louvain community detection</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {clusters.map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{c.label}</p>
                    <p className="text-[10px] text-slate-400">{c.nodeCount} entities</p>
                  </div>
                  <Badge variant="outline" className={c.risk >= 80 ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>
                    risk {c.risk}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {selected && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Selected Entity</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                {[
                  ['Label', selected.label],
                  ['Type', selected.type],
                  ['Jurisdiction', selected.jurisdiction],
                  ['Risk Score', `${selected.riskScore}/100`],
                  ['Flagged', selected.isFlagged ? 'YES — high risk' : 'No'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-mono font-medium text-slate-800">{v}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {rec && <BooleanActionCard rec={rec} />}
        </div>
      </div>
    </div>
  )
}
