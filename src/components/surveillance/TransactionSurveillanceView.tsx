'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, AlertOctagon, TrendingUp, ShieldAlert, Zap } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Alert = {
  id: string; alertType: string; severity: string; accountId: string
  counterparty: string; amount: number; currency: string
  jurisdiction: string; channel: string; riskScore: number
  status: string; triggeredRule: string; narrative: string
  timestamp: string; aiRecommendation: AIRec
}

const sevColor: Record<string, string> = {
  low: 'bg-slate-50 text-slate-700 border-slate-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
}

const statusColor: Record<string, string> = {
  open: 'bg-rose-50 text-rose-700 border-rose-200',
  under_review: 'bg-amber-50 text-amber-700 border-amber-200',
  escalated: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  closed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  false_positive: 'bg-slate-100 text-slate-500 border-slate-200',
}

export function TransactionSurveillanceView() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [selected, setSelected] = useState<Alert | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('surveillance'))
      .then(r => r.json())
      .then(d => {
        setAlerts(d.alerts ?? [])
        setSummary(d.summary)
        setSelected(d.alerts?.[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Surveillance"
        title="Transaction Surveillance"
        subtitle="Real-time AML/CFT alert monitoring with sub-second decisioning on SWIFT, SEPA, RTP and crypto rails. Machine triages every alert — humans only confirm Boolean decisions."
        icon={Activity}
        accent="from-rose-500 to-orange-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiTile label="Total Alerts" value={summary?.total ?? alerts.length} sub="last 7 days" icon={AlertOctagon} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="Critical / High" value={`${summary?.bySeverity?.critical ?? 0} / ${summary?.bySeverity?.high ?? 0}`} sub="require action" icon={ShieldAlert} tint="text-orange-700 bg-orange-50" />
        <KpiTile label="Avg Risk Score" value={summary?.avgRiskScore ?? 0} sub="across all alerts" icon={TrendingUp} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="Auto-Actioned" value={summary?.autoActioned ?? 0} sub="≥95% confidence" icon={Zap} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="SLA Breaches" value={summary?.slaBreaches ?? 0} sub="open >24h" icon={AlertOctagon} tint="text-fuchsia-700 bg-fuchsia-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Alert Queue — ranked by AI priority</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {alerts.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className={`flex w-full items-center gap-3 border-b border-slate-100 p-3 text-left transition-colors hover:bg-slate-50 ${selected?.id === a.id ? 'bg-violet-50/40' : ''}`}
                >
                  <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-700">
                    {a.riskScore}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] capitalize ${sevColor[a.severity]}`}>{a.severity}</Badge>
                      <span className="text-xs font-semibold text-slate-700">{a.alertType.replace(/_/g, ' ')}</span>
                      <Badge variant="outline" className={`text-[10px] ${statusColor[a.status]}`}>{a.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{a.narrative}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {a.accountId} · {a.channel} · {a.currency} {a.amount.toLocaleString()} · {a.counterparty}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-mono text-violet-600">{a.aiRecommendation.confidence}%</p>
                    <p className="text-[10px] text-slate-400">{a.triggeredRule}</p>
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
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Alert Detail · {selected.id}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Counterparty', selected.counterparty],
                    ['Amount', `${selected.currency} ${selected.amount.toLocaleString()}`],
                    ['Channel', selected.channel],
                    ['Jurisdiction', selected.jurisdiction],
                    ['Account', selected.accountId],
                    ['Triggered Rule', selected.triggeredRule],
                    ['Risk Score', `${selected.riskScore}/100`],
                    ['Timestamp', new Date(selected.timestamp).toLocaleString()],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono font-medium text-slate-800">{v}</span>
                    </div>
                  ))}
                  <div className="pt-2">
                    <p className="mb-1 text-slate-500">Narrative</p>
                    <p className="rounded-md bg-slate-50 p-2 text-slate-700">{selected.narrative}</p>
                  </div>
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
