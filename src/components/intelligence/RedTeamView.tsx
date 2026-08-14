'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bug, ShieldCheck, ShieldX, AlertTriangle, Crosshair } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Test = {
  id: string; testName: string; attackVector: string
  target: string; result: string; severity: string
  evidence: string; remediation: string | null; timestamp: string
  aiRecommendation: AIRec
}

const resultConfig: Record<string, { color: string; icon: typeof Bug }> = {
  blocked: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ShieldCheck },
  detected: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle },
  bypassed: { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: ShieldX },
}

const sevColor: Record<string, string> = {
  low: 'bg-slate-50 text-slate-700 border-slate-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
}

export function RedTeamView() {
  const [items, setItems] = useState<Test[]>([])
  const [selected, setSelected] = useState<Test | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('redteam'))
      .then(r => r.json())
      .then(d => { setItems(d.tests ?? []); setSelected(d.tests?.[0] ?? null) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const bypassed = items.filter(t => t.result === 'bypassed').length
  const detected = items.filter(t => t.result === 'detected').length
  const blocked = items.filter(t => t.result === 'blocked').length

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Intelligence & Automation"
        title="Red Team Engine"
        subtitle="Adversarial agent that continuously attacks your own controls — simulating structuring, sanctions evasion, prompt injection and insider trading. Bypasses trigger auto-patch recommendations."
        icon={Bug}
        accent="from-red-500 to-rose-700"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Attacks Run" value={items.length} sub="last 14 days" icon={Crosshair} tint="text-red-700 bg-red-50" />
        <KpiTile label="Blocked" value={blocked} sub="control held" icon={ShieldCheck} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Detected" value={detected} sub="caught but not blocked" icon={AlertTriangle} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Bypassed" value={bypassed} sub="control gap — patch now" icon={ShieldX} tint="text-rose-700 bg-rose-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Adversarial Test Results — bypassed first</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {[...items].sort((a, b) => {
                const order = ['bypassed', 'detected', 'blocked']
                return order.indexOf(a.result) - order.indexOf(b.result)
              }).map(t => {
                const cfg = resultConfig[t.result] ?? resultConfig.blocked
                const Icon = cfg.icon
                return (
                  <button key={t.id} onClick={() => setSelected(t)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${selected?.id === t.id ? 'bg-violet-50/40' : ''}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${cfg.color.split(' ').slice(0,2).join(' ')}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{t.result}</Badge>
                        <Badge variant="outline" className={`text-[10px] ${sevColor[t.severity]}`}>{t.severity}</Badge>
                        <span className="text-xs font-semibold text-slate-700">{t.testName}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">Vector: {t.attackVector.replace(/_/g, ' ')} → {t.target}</p>
                      {t.remediation && <p className="mt-0.5 text-[11px] font-medium text-rose-700">⚡ Patch: {t.remediation}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-mono text-violet-600">{t.aiRecommendation.confidence}%</p>
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
                <CardHeader className="pb-3"><CardTitle className="text-sm">Test Detail</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Test', selected.testName],
                    ['Vector', selected.attackVector.replace(/_/g, ' ')],
                    ['Target', selected.target],
                    ['Result', selected.result],
                    ['Severity', selected.severity],
                    ['Timestamp', new Date(selected.timestamp).toLocaleString()],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono text-right text-slate-800">{v}</span>
                    </div>
                  ))}
                  <div className="pt-2">
                    <p className="mb-1 text-slate-500">Evidence</p>
                    <p className="rounded-md bg-slate-50 p-2 text-slate-700">{selected.evidence}</p>
                  </div>
                  {selected.remediation && (
                    <div className="pt-1">
                      <p className="mb-1 text-rose-600">Recommended Patch</p>
                      <p className="rounded-md bg-rose-50 p-2 text-rose-700">{selected.remediation}</p>
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
