'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History as TimeIcon, Clock, Database, Rewind } from 'lucide-react'
import { usePluginData } from '@/hooks/use-plugin-data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Snapshot = {
  id: string; timestamp: string
  complianceScore: number; openFindings: number; activePolicies: number
  trackedRegulations: number; riskItems: number; auditEvents: number
  activeCases: number; blockchainAnchors: number
  aiRecommendation: AIRec
}

export function TimeMachineView() {
  const { data: items, loading, error } = usePluginData<Snapshot[]>('time-machine', {
    select: (raw) => (raw as { snapshots?: Snapshot[] }).snapshots ?? [],
  })
  const [selected, setSelected] = useState<Snapshot | null>(null)

  useEffect(() => {
    if (items && items.length > 0 && !selected) setSelected(items[0])
  }, [items, selected])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>
  if (error) return <div className="p-6 text-rose-700">Failed to load snapshots: {error.message}</div>
  if (!items) return null

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Platform & Governance"
        title="Regulatory Time Machine"
        subtitle="Point-in-time queries: 'What was our compliance posture on 14 Aug 2024 at 3:47pm?' — instantly defensible for examinations. Every state snapshot anchored to chain."
        icon={TimeIcon}
        accent="from-slate-600 to-indigo-700"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Snapshots" value={items.length} sub="1 / 7 / 30 / 90 / 180 / 365d" icon={Database} tint="text-slate-700 bg-slate-100" />
        <KpiTile label="Granularity" value="1s" sub="point-in-time query" icon={Clock} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="Chain-Anchored" value="100%" sub="tamper-evident" icon={TimeIcon} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Examiner-Ready" value="✓" sub="defensible in court" icon={Rewind} tint="text-blue-700 bg-blue-50" />
      </div>

      <Card className="border-slate-200">
        <CardHeader className="pb-3"><CardTitle className="text-sm">Compliance Posture Over Time — click any snapshot to replay</CardTitle></CardHeader>
        <CardContent className="p-4">
          <div className="relative h-64">
            <svg viewBox="0 0 720 240" className="h-full w-full">
              {/* Grid lines */}
              {[0, 60, 120, 180, 240].map(y => (
                <line key={y} x1="0" y1={y} x2="720" y2={y} stroke="#e2e8f0" strokeWidth="1" />
              ))}
              {/* Compliance score line */}
              {(() => {
                const max = 100; const min = 60
                const points = items.slice().reverse().map((s, i) => {
                  const x = (i / (items.length - 1)) * 700 + 10
                  const y = 240 - ((s.complianceScore - min) / (max - min)) * 220
                  return `${x},${y}`
                }).join(' ')
                return (
                  <>
                    <polyline points={points} fill="none" stroke="#10b981" strokeWidth="2" />
                    {items.slice().reverse().map((s, i) => {
                      const x = (i / (items.length - 1)) * 700 + 10
                      const y = 240 - ((s.complianceScore - 60) / 40) * 220
                      return (
                        <g key={s.id} onClick={() => setSelected(s)} className="cursor-pointer">
                          <circle cx={x} cy={y} r={selected?.id === s.id ? 7 : 5}
                            fill={selected?.id === s.id ? '#1e293b' : '#10b981'}
                            stroke="white" strokeWidth="2" />
                          <text x={x} y={y - 12} textAnchor="middle" className="fill-slate-700 text-[10px] font-bold">
                            {s.complianceScore}
                          </text>
                          <text x={x} y={232} textAnchor="middle" className="fill-slate-500 text-[10px]">
                            {new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </text>
                        </g>
                      )
                    })}
                  </>
                )
              })()}
            </svg>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3 border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Snapshot · {new Date(selected.timestamp).toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              {[
                ['Compliance Score', selected.complianceScore, 'text-emerald-700'],
                ['Open Findings', selected.openFindings, 'text-rose-700'],
                ['Active Policies', selected.activePolicies, 'text-violet-700'],
                ['Tracked Regulations', selected.trackedRegulations, 'text-blue-700'],
                ['Risk Items', selected.riskItems, 'text-orange-700'],
                ['Audit Events', selected.auditEvents, 'text-slate-700'],
                ['Active Cases', selected.activeCases, 'text-amber-700'],
                ['Chain Anchors', selected.blockchainAnchors, 'text-fuchsia-700'],
              ].map(([label, val, color]) => (
                <div key={label as string} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
                  <p className={`mt-1 text-xl font-bold ${color}`}>{val}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <BooleanActionCard rec={selected.aiRecommendation} />
          </div>
        </div>
      )}
    </div>
  )
}
