'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MailWarning, Lock, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Report = {
  id: string; category: string; severity: string
  description: string; anonymous: boolean; status: string
  triageScore: number; assignedTo: string | null
  encryptedHash: string; createdAt: string; aiRecommendation: AIRec
}

const catColor: Record<string, string> = {
  fraud: 'bg-rose-50 text-rose-700 border-rose-200',
  market_abuse: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  harassment: 'bg-amber-50 text-amber-700 border-amber-200',
  safety: 'bg-orange-50 text-orange-700 border-orange-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
}

const sevColor: Record<string, string> = {
  low: 'bg-slate-50 text-slate-700 border-slate-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
}

export function WhistleblowerView() {
  const [items, setItems] = useState<Report[]>([])
  const [selected, setSelected] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('whistleblower'))
      .then(r => r.json())
      .then(d => { setItems(d.reports ?? []); setSelected(d.reports?.[0] ?? null) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const critical = items.filter(r => r.severity === 'critical').length
  const high = items.filter(r => r.severity === 'high').length
  const resolved = items.filter(r => r.status === 'resolved').length

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Collaboration & Trust"
        title="Whistleblower Channel"
        subtitle="End-to-end encrypted anonymous intake with LLM triage. Catches problems before regulators do. Every report hashed and anchored — no PII stored."
        icon={MailWarning}
        accent="from-amber-500 to-red-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Reports" value={items.length} sub="last 60 days" icon={MailWarning} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Critical" value={critical} sub="immediate escalation" icon={ShieldAlert} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="High" value={high} sub="ethics committee" icon={ShieldAlert} tint="text-orange-700 bg-orange-50" />
        <KpiTile label="Resolved" value={resolved} sub="closed loop" icon={CheckCircle2} tint="text-emerald-700 bg-emerald-50" />
      </div>

      <div className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/40 p-4 text-xs text-emerald-900">
        <div className="flex items-center gap-2 font-semibold">
          <Lock className="h-4 w-4" /> End-to-end encrypted · zero-knowledge intake
        </div>
        <p className="mt-1 text-emerald-800/80">
          Whistleblower identity is sealed in a separate enclave. Compliance officers see only the sanitized description and the cryptographic hash.
          Anonymous reporting is the default; named reporting requires explicit opt-in.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Intake Queue — sorted by triage score</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[560px]">
              {[...items].sort((a, b) => b.triageScore - a.triageScore).map(r => (
                <button key={r.id} onClick={() => setSelected(r)}
                  className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${selected?.id === r.id ? 'bg-violet-50/40' : ''}`}>
                  <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md bg-amber-50 text-xs font-bold text-amber-700">
                    {r.triageScore}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${catColor[r.category]}`}>{r.category.replace(/_/g, ' ')}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${sevColor[r.severity]}`}>{r.severity}</Badge>
                      <Badge variant="outline" className="text-[10px] border-slate-200 bg-slate-50 text-slate-600">{r.status}</Badge>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{r.description}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {r.encryptedHash.slice(0, 18)}… · {new Date(r.createdAt).toLocaleDateString()} · {r.assignedTo ?? 'unassigned'}
                    </p>
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
                <CardHeader className="pb-3"><CardTitle className="text-sm">Report Detail · sanitized</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Category', selected.category.replace(/_/g, ' ')],
                    ['Severity', selected.severity],
                    ['Triage Score', `${selected.triageScore}/100`],
                    ['Status', selected.status],
                    ['Anonymous', selected.anonymous ? 'Yes (default)' : 'No — opted in'],
                    ['Assigned To', selected.assignedTo ?? '—'],
                    ['Encrypted Hash', selected.encryptedHash.slice(0, 24) + '…'],
                    ['Received', new Date(selected.createdAt).toLocaleString()],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="text-right font-mono text-slate-800">{v}</span>
                    </div>
                  ))}
                  <div className="pt-2">
                    <p className="mb-1 text-slate-500">Sanitized Description</p>
                    <p className="rounded-md bg-amber-50/40 p-2 text-slate-700">{selected.description}</p>
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
