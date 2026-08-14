'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock, Cpu, Shield, Eye, KeyRound } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Config = {
  id: string; dataset: string; technique: string; enabled: boolean
  parameters: string; approvedBy: string | null; updatedAt: string
  aiRecommendation: AIRec
}

const techConfig: Record<string, { color: string; icon: typeof Lock; desc: string }> = {
  federated_learning: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Cpu, desc: 'Train on data without moving it — gradients aggregated centrally.' },
  homomorphic_encryption: { color: 'bg-violet-50 text-violet-700 border-violet-200', icon: Lock, desc: 'Compute on encrypted data — never decrypt server-side.' },
  differential_privacy: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Eye, desc: 'Add calibrated noise — bound re-identification risk by ε.' },
  secure_enclave: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Shield, desc: 'AWS Nitro / SGX — hardware-isolated execution.' },
}

export function PrivacyPetsView() {
  const [items, setItems] = useState<Config[]>([])
  const [selected, setSelected] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('pets'))
      .then(r => r.json())
      .then(d => { setItems(d.configs ?? []); setSelected(d.configs?.[0] ?? null) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const enabled = items.filter(c => c.enabled).length
  const pending = items.filter(c => !c.enabled).length

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Platform & Governance"
        title="Privacy & PETs Console"
        subtitle="Federated learning, homomorphic encryption, differential privacy and secure enclaves — toggle per dataset. AI computes the optimal privacy-utility tradeoff."
        icon={Lock}
        accent="from-slate-600 to-gray-700"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Datasets Protected" value={items.length} sub="across 4 PET techniques" icon={KeyRound} tint="text-slate-700 bg-slate-100" />
        <KpiTile label="Enabled" value={enabled} sub="active protection" icon={Shield} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Pending Activation" value={pending} sub="awaiting approval" icon={Lock} tint="text-amber-700 bg-amber-50" />
        <KpiTile label="Techniques" value={4} sub="FL · HE · DP · Enclave" icon={Cpu} tint="text-violet-700 bg-violet-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Dataset × PET Configurations</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {items.map(c => {
              const cfg = techConfig[c.technique] ?? techConfig.differential_privacy
              const Icon = cfg.icon
              return (
                <button key={c.id} onClick={() => setSelected(c)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${selected?.id === c.id ? 'border-slate-400 bg-slate-50' : 'border-slate-100 bg-white hover:bg-slate-50'} ${!c.enabled ? 'opacity-70' : ''}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${cfg.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{c.dataset}</span>
                      <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{c.technique.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">{cfg.desc}</p>
                  </div>
                  <Badge variant="outline" className={c.enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}>
                    {c.enabled ? '✓ Enabled' : 'Disabled'}
                  </Badge>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <>
              <Card className="border-slate-200">
                <CardHeader className="pb-3"><CardTitle className="text-sm">{selected.dataset}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Technique', selected.technique.replace(/_/g, ' ')],
                    ['Status', selected.enabled ? 'Enabled' : 'Disabled'],
                    ['Approved By', selected.approvedBy ?? '— pending —'],
                    ['Updated', new Date(selected.updatedAt).toLocaleString()],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono text-right text-slate-800">{v}</span>
                    </div>
                  ))}
                  <div className="pt-2">
                    <p className="mb-1 text-slate-500">Parameters</p>
                    <pre className="overflow-x-auto rounded-md bg-slate-50 p-2 text-[10px] text-slate-700">
                      {JSON.stringify(JSON.parse(selected.parameters), null, 2)}
                    </pre>
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
