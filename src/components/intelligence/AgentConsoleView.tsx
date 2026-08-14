'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Cpu, Bot, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Run = {
  id: string; agentName: string; agentDescription: string
  task: string; status: string; inputs: string; outputs: string
  toolsUsed: string; approvedBy: string | null
  startedAt: string; completedAt: string | null
  aiRecommendation: AIRec
}

const statusConfig: Record<string, { color: string; icon: typeof Bot }> = {
  queued: { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock },
  running: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Loader2 },
  awaiting_approval: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  complete: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  failed: { color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
}

const agentColor: Record<string, string> = {
  regulatory_watcher: 'from-sky-500 to-blue-600',
  policy_drafter: 'from-violet-500 to-fuchsia-600',
  control_tester: 'from-emerald-500 to-teal-600',
  regulator_liaison: 'from-amber-500 to-orange-600',
  sanctions_screener: 'from-rose-500 to-pink-600',
  red_team: 'from-red-500 to-rose-700',
  knowledge_curator: 'from-indigo-500 to-purple-600',
  report_generator: 'from-cyan-500 to-blue-600',
}

export function AgentConsoleView() {
  const [runs, setRuns] = useState<Run[]>([])
  const [selected, setSelected] = useState<Run | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('agents'))
      .then(r => r.json())
      .then(d => { setRuns(d.runs ?? []); setSelected(d.runs?.[0] ?? null) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const awaiting = runs.filter(r => r.status === 'awaiting_approval').length
  const running = runs.filter(r => r.status === 'running').length
  const complete = runs.filter(r => r.status === 'complete').length

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Intelligence & Automation"
        title="Multi-Agent Console"
        subtitle="Orchestration of regulatory watcher, policy drafter, control tester and regulator liaison agents — with human-in-the-loop approval gates. Machines act, humans confirm."
        icon={Cpu}
        accent="from-blue-500 to-indigo-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Agent Runs" value={runs.length} sub="last 72h" icon={Bot} tint="text-blue-700 bg-blue-50" />
        <KpiTile label="Running Now" value={running} sub="active orchestration" icon={Loader2} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="Awaiting Approval" value={awaiting} sub="Boolean gate" icon={Clock} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Completed" value={complete} sub="auto-logged to chain" icon={CheckCircle2} tint="text-emerald-700 bg-emerald-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Agent Activity — awaiting approval first</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {[...runs].sort((a, b) => {
                const order = ['awaiting_approval', 'running', 'queued', 'complete', 'failed']
                return order.indexOf(a.status) - order.indexOf(b.status)
              }).map(r => {
                const cfg = statusConfig[r.status] ?? statusConfig.queued
                const Icon = cfg.icon
                return (
                  <button key={r.id} onClick={() => setSelected(r)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${selected?.id === r.id ? 'bg-violet-50/40' : ''}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${agentColor[r.agentName] ?? 'from-slate-500 to-slate-600'}`}>
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">{r.agentName.replace(/_/g, ' ')}</span>
                        <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>
                          <Icon className={`mr-1 h-2.5 w-2.5 ${r.status === 'running' ? 'animate-spin' : ''}`} />
                          {r.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-600">{r.task}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Tools: {r.toolsUsed} · started {new Date(r.startedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-mono text-violet-600">{r.aiRecommendation.confidence}%</p>
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
                <CardHeader className="pb-3"><CardTitle className="text-sm">Run Detail · {selected.id}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="rounded-md bg-slate-50 p-2">
                    <p className="text-[10px] uppercase text-slate-500">Agent</p>
                    <p className="text-sm font-semibold text-slate-800">{selected.agentName.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-slate-500">{selected.agentDescription}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-2">
                    <p className="text-[10px] uppercase text-slate-500">Task</p>
                    <p className="text-xs text-slate-700">{selected.task}</p>
                  </div>
                  {[
                    ['Status', selected.status.replace(/_/g, ' ')],
                    ['Inputs', selected.inputs],
                    ['Outputs', selected.outputs],
                    ['Tools', selected.toolsUsed],
                    ['Approved By', selected.approvedBy ?? '—'],
                    ['Started', new Date(selected.startedAt).toLocaleString()],
                    ['Completed', selected.completedAt ? new Date(selected.completedAt).toLocaleString() : '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="text-right font-mono text-slate-800">{v}</span>
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
