'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquareWarning, Radio, Flame, ShieldAlert, Mic } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Event = {
  id: string; channel: string; participantA: string; participantB: string
  desk: string; signalType: string; riskScore: number
  transcript: string; status: string; timestamp: string
  aiRecommendation: AIRec
}

const signalColor: Record<string, string> = {
  insider_trading: 'bg-rose-50 text-rose-700 border-rose-200',
  market_abuse: 'bg-rose-50 text-rose-700 border-rose-200',
  collusion: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  off_channel: 'bg-amber-50 text-amber-700 border-amber-200',
  swearing: 'bg-slate-50 text-slate-700 border-slate-200',
  front_running: 'bg-orange-50 text-orange-700 border-orange-200',
  wash_trade: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  spoofing: 'bg-orange-50 text-orange-700 border-orange-200',
}

const channelIcon: Record<string, typeof Mic> = {
  email: MessageSquareWarning, voice: Mic, teams: MessageSquareWarning,
  bloomberg_chat: Radio, mobile: Radio, slack: MessageSquareWarning, refinitiv: Radio,
}

export function CommsSurveillanceView() {
  const [events, setEvents] = useState<Event[]>([])
  const [selected, setSelected] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('comms'))
      .then(r => r.json())
      .then(d => { setEvents(d.events ?? []); setSelected(d.events?.[0] ?? null) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const critical = events.filter(e => e.riskScore >= 80).length
  const byChannel: Record<string, number> = {}
  events.forEach(e => { byChannel[e.channel] = (byChannel[e.channel] ?? 0) + 1 })

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Surveillance"
        title="Communications Surveillance"
        subtitle="NLP-driven surveillance of voice, email, Bloomberg chat and mobile — detecting market abuse, collusion and off-channel activity per MiFID II Article 16."
        icon={MessageSquareWarning}
        accent="from-rose-500 to-pink-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Events (7d)" value={events.length} sub="across 7 channels" icon={Radio} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="High-Risk (≥80)" value={critical} sub="auto-escalated" icon={Flame} tint="text-orange-700 bg-orange-50" />
        <KpiTile label="Top Channel" value={Object.entries(byChannel).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? '—'} sub={`${Object.entries(byChannel).sort((a,b)=>b[1]-a[1])[0]?.[1] ?? 0} events`} icon={MessageSquareWarning} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="NLP Model" value="v4.2" sub="91% precision" icon={ShieldAlert} tint="text-emerald-700 bg-emerald-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Communication Events — NLP-flagged</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {events.map(e => {
                const Icon = channelIcon[e.channel] ?? MessageSquareWarning
                return (
                  <button key={e.id} onClick={() => setSelected(e)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${selected?.id === e.id ? 'bg-violet-50/40' : ''}`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rose-50">
                      <Icon className="h-4 w-4 text-rose-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] capitalize ${signalColor[e.signalType] ?? 'bg-slate-50'}`}>
                          {e.signalType.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs font-semibold text-slate-700">{e.channel}</span>
                        <span className="text-[10px] text-slate-400">· {e.desk}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-600">{e.transcript}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{e.participantA} → {e.participantB}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-rose-600">{e.riskScore}</p>
                      <p className="text-[10px] text-violet-600">{e.aiRecommendation.confidence}%</p>
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
                <CardHeader className="pb-3"><CardTitle className="text-sm">Event Detail</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Channel', selected.channel],
                    ['Desk', selected.desk],
                    ['Participant A', selected.participantA],
                    ['Participant B', selected.participantB],
                    ['Signal', selected.signalType.replace(/_/g, ' ')],
                    ['Risk Score', `${selected.riskScore}/100`],
                    ['Status', selected.status],
                    ['Timestamp', new Date(selected.timestamp).toLocaleString()],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono font-medium text-slate-800">{v}</span>
                    </div>
                  ))}
                  <div className="pt-2">
                    <p className="mb-1 text-slate-500">Transcript snippet</p>
                    <p className="rounded-md bg-rose-50/40 p-2 italic text-slate-700">&ldquo;{selected.transcript}&rdquo;</p>
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
