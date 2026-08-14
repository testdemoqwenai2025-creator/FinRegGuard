'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Network, AlertTriangle, TrendingDown, Building2 } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type GNode = {
  id: string; name: string; assetSize: number
  debtRank: number; systemicScore: number
  tier1Capital: number; country: string; isSystemic: boolean
}
type GEdge = { source: string; target: string; exposure: number; type: string }
type Cascade = { trigger: string; banksAffected: number; cumulativeLoss: number; duration: string }

function pos(id: string, w: number, h: number, idx: number, total: number): [number, number] {
  const angle = (idx / total) * 2 * Math.PI
  const hash = id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)
  const radius = (0.22 + ((hash & 0xff) / 255) * 0.16) * Math.min(w, h)
  return [w / 2 + Math.cos(angle) * radius, h / 2 + Math.sin(angle) * radius]
}

export function SystemicRiskView() {
  const [nodes, setNodes] = useState<GNode[]>([])
  const [edges, setEdges] = useState<GEdge[]>([])
  const [cascades, setCascades] = useState<Cascade[]>([])
  const [rec, setRec] = useState<AIRec | null>(null)
  const [selected, setSelected] = useState<GNode | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('systemic'))
      .then(r => r.json())
      .then(d => { setNodes(d.nodes ?? []); setEdges(d.edges ?? []); setCascades(d.cascades ?? []); setRec(d.aiRecommendation ?? null) })
      .finally(() => setLoading(false))
  }, [])

  const positions = useMemo(() => {
    const W = 720, H = 540
    const map = new Map<string, [number, number]>()
    nodes.forEach((n, i) => map.set(n.id, pos(n.id, W, H, i, nodes.length)))
    return { map, W, H }
  }, [nodes])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const systemic = nodes.filter(n => n.isSystemic).length
  const totalExposure = edges.reduce((s, e) => s + e.exposure, 0)

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Quant & Computational"
        title="Systemic Risk & Contagion"
        subtitle="DebtRank and interbank exposure graphs — model cascading failures and central-clearing chokepoints. Top-3 systemic nodes pre-identified for haircuts."
        icon={Network}
        accent="from-orange-500 to-red-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Banks Modelled" value={nodes.length} sub="G-SIBs + D-SIBs" icon={Building2} tint="text-sky-700 bg-sky-50" />
        <KpiTile label="Systemic Nodes" value={systemic} sub="score ≥ 0.70" icon={AlertTriangle} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="Interbank Exposures" value={`$${totalExposure.toFixed(0)}B`} sub={`${edges.length} edges`} icon={Network} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="Worst Cascade" value={`$${Math.max(...cascades.map(c => c.cumulativeLoss), 0).toFixed(0)}B`} sub="cumulative loss" icon={TrendingDown} tint="text-orange-700 bg-orange-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Interbank Network — node size = DebtRank, red = systemic</CardTitle></CardHeader>
          <CardContent className="p-2">
            <svg viewBox={`0 0 ${positions.W} ${positions.H}`} className="h-[540px] w-full rounded-lg bg-slate-50">
              {edges.map((e, i) => {
                const s = positions.map.get(e.source)
                const t = positions.map.get(e.target)
                if (!s || !t) return null
                const isHigh = e.exposure > 30
                return <line key={i} x1={s[0]} y1={s[1]} x2={t[0]} y2={t[1]}
                  stroke={isHigh ? '#fb923c' : '#e2e8f0'}
                  strokeWidth={isHigh ? 1.4 : 0.5}
                  opacity={isHigh ? 0.6 : 0.3} />
              })}
              {nodes.map(n => {
                const [x, y] = positions.map.get(n.id) ?? [0, 0]
                const r = 4 + n.debtRank * 40
                const isSelected = selected?.id === n.id
                return (
                  <g key={n.id} onClick={() => setSelected(n)} className="cursor-pointer">
                    {n.isSystemic && (
                      <circle cx={x} cy={y} r={r + 4} fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.5" className="animate-pulse" />
                    )}
                    <circle cx={x} cy={y} r={r + (isSelected ? 2 : 0)}
                      fill={n.isSystemic ? '#ef4444' : '#0ea5e9'}
                      stroke={isSelected ? '#1e293b' : '#fff'}
                      strokeWidth={isSelected ? 2 : 1} />
                    <text x={x} y={y + r + 12} textAnchor="middle" className="fill-slate-700 text-[9px] font-medium">
                      {n.name.split(' ')[0]}
                    </text>
                  </g>
                )
              })}
            </svg>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Cascade Simulations — single-bank failure</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {cascades.map((c, i) => (
                <div key={i} className="rounded-lg border border-rose-100 bg-rose-50/40 p-3">
                  <p className="text-xs font-semibold text-slate-800">{c.trigger}</p>
                  <div className="mt-1 flex items-center gap-3 text-[10px]">
                    <span className="text-slate-500">Banks affected: <strong className="text-rose-700">{c.banksAffected}</strong></span>
                    <span className="text-slate-500">Loss: <strong className="text-rose-700">${c.cumulativeLoss.toFixed(1)}B</strong></span>
                    <span className="text-slate-500">{c.duration}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {selected && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3"><CardTitle className="text-sm">{selected.name}</CardTitle></CardHeader>
              <CardContent className="space-y-1.5 text-xs">
                {[
                  ['Country', selected.country],
                  ['Assets', `$${selected.assetSize.toFixed(0)}B`],
                  ['DebtRank', selected.debtRank.toFixed(3)],
                  ['Systemic Score', selected.systemicScore.toFixed(2)],
                  ['Tier 1 Capital', `${selected.tier1Capital}%`],
                  ['Systemic', selected.isSystemic ? 'YES — G-SIB' : 'No'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-slate-50 pb-1">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-mono text-slate-800">{v}</span>
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
