'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Wallet, Bitcoin, ShieldAlert, Lock, Coins } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Event = {
  id: string; asset: string; wallet: string; counterparty: string
  amount: number; eventType: string; riskScore: number; status: string
  chain: string; timestamp: string; narrative: string; aiRecommendation: AIRec
}

const eventColor: Record<string, string> = {
  travel_rule: 'bg-blue-50 text-blue-700 border-blue-200',
  sanctions_screen: 'bg-rose-50 text-rose-700 border-rose-200',
  mixer_detection: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  ofac_match: 'bg-rose-100 text-rose-800 border-rose-300',
}

const statusColor: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  blocked: 'bg-rose-50 text-rose-700 border-rose-200',
  escalated: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  compliant: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  auto_clear: 'bg-slate-100 text-slate-600 border-slate-200',
  monitor: 'bg-violet-50 text-violet-700 border-violet-200',
}

export function DigitalAssetsView() {
  const [items, setItems] = useState<Event[]>([])
  const [selected, setSelected] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('digital-assets'))
      .then(r => r.json())
      .then(d => { setItems(d.events ?? []); setSelected(d.events?.[0] ?? null) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const blocked = items.filter(e => e.status === 'blocked').length
  const pending = items.filter(e => e.status === 'pending').length
  const compliant = items.filter(e => e.status === 'compliant').length
  const totalValue = items.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Collaboration & Trust"
        title="Digital Asset Compliance"
        subtitle="FATF Travel Rule, on-chain sanctions screening, mixer detection and CBDC compliance for crypto flows. Real-time OFAC SDN check on every wallet."
        icon={Wallet}
        accent="from-orange-500 to-amber-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Events (7d)" value={items.length} sub={`$${totalValue.toFixed(0)}k flow`} icon={Coins} tint="text-orange-700 bg-orange-50" />
        <KpiTile label="Blocked" value={blocked} sub="OFAC / sanctions" icon={Lock} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="Pending Travel Rule" value={pending} sub="data collection" icon={ShieldAlert} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Compliant" value={compliant} sub="auto-cleared" icon={Bitcoin} tint="text-emerald-700 bg-emerald-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Crypto Compliance Feed — blocked & escalated first</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {[...items].sort((a, b) => b.riskScore - a.riskScore).map(e => (
                <button key={e.id} onClick={() => setSelected(e)}
                  className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${selected?.id === e.id ? 'bg-violet-50/40' : ''}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-orange-50 font-mono text-[10px] font-bold text-orange-700">
                    {e.asset}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${eventColor[e.eventType]}`}>
                        {e.eventType.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${statusColor[e.status]}`}>
                        {e.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-slate-800">{e.amount} {e.asset}</p>
                    <p className="text-[10px] text-slate-400">
                      {e.wallet} → {e.counterparty}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{e.narrative}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-rose-600">{e.riskScore}</p>
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
                <CardHeader className="pb-3"><CardTitle className="text-sm">Event Detail</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Asset', selected.asset],
                    ['Amount', `${selected.amount} ${selected.asset}`],
                    ['Event Type', selected.eventType.replace(/_/g, ' ')],
                    ['Risk Score', `${selected.riskScore}/100`],
                    ['Status', selected.status.replace(/_/g, ' ')],
                    ['Chain', selected.chain],
                    ['Wallet', selected.wallet],
                    ['Counterparty', selected.counterparty],
                    ['Timestamp', new Date(selected.timestamp).toLocaleString()],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="text-right font-mono text-slate-800">{v}</span>
                    </div>
                  ))}
                  <p className="pt-2 text-slate-600">{selected.narrative}</p>
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
