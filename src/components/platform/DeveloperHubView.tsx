'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Code2, KeyRound, Webhook, BookOpen, Zap } from 'lucide-react'
import { dataUrl } from '@/lib/data'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type Key = {
  id: string; name: string; keyPrefix: string; scopes: string
  rateLimit: number; status: string; lastUsedAt: string | null
  createdAt: string; expiresAt: string; calls30d: number
  aiRecommendation: AIRec
}
type Endpoint = { method: string; path: string; auth: string; rateLimit: number }

const methodColor: Record<string, string> = {
  GET: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  POST: 'bg-blue-50 text-blue-700 border-blue-200',
  PUT: 'bg-amber-50 text-amber-700 border-amber-200',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
}

export function DeveloperHubView() {
  const [keys, setKeys] = useState<Key[]>([])
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [selected, setSelected] = useState<Key | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('developer'))
      .then(r => r.json())
      .then(d => { setKeys(d.keys ?? []); setEndpoints(d.endpoints ?? []); setSelected(d.keys?.[0] ?? null) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const active = keys.filter(k => k.status === 'active').length
  const totalCalls = keys.reduce((s, k) => s + k.calls30d, 0)

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Platform & Governance"
        title="Developer Hub"
        subtitle="REST + GraphQL API keys, webhooks, SDK docs and sandbox — embed compliance into business apps. Auto-rotates keys per 90-day policy."
        icon={Code2}
        accent="from-slate-700 to-gray-800"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="API Keys" value={keys.length} sub={`${active} active`} icon={KeyRound} tint="text-slate-700 bg-slate-100" />
        <KpiTile label="Calls (30d)" value={totalCalls > 1e6 ? `${(totalCalls / 1e6).toFixed(1)}M` : totalCalls.toLocaleString()} sub="across all keys" icon={Zap} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="Endpoints" value={endpoints.length} sub="REST v1" icon={Code2} tint="text-blue-700 bg-blue-50" />
        <KpiTile label="Webhooks" value={4} sub="regulatory events" icon={Webhook} tint="text-emerald-700 bg-emerald-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3"><CardTitle className="text-sm">API Keys</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {keys.map(k => (
              <button key={k.id} onClick={() => setSelected(k)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${selected?.id === k.id ? 'border-slate-400 bg-slate-50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                <KeyRound className="h-4 w-4 shrink-0 text-slate-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{k.name}</span>
                    <Badge variant="outline" className={`text-[10px] ${k.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                      {k.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-500">{k.keyPrefix}••••••••</p>
                  <p className="text-[10px] text-slate-400">
                    scopes: {k.scopes} · {k.rateLimit}/min · expires {k.expiresAt}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold text-slate-700">
                    {k.calls30d > 1e6 ? `${(k.calls30d / 1e6).toFixed(1)}M` : k.calls30d.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400">calls / 30d</p>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3"><CardTitle className="text-sm">REST API Endpoints</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {endpoints.map((e, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 p-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] font-mono ${methodColor[e.method]}`}>{e.method}</Badge>
                    <code className="text-[11px] text-slate-700">{e.path}</code>
                  </div>
                  <span className="text-[10px] text-slate-400">{e.rateLimit}/min</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {selected && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3"><CardTitle className="text-sm">Key Detail</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                {[
                  ['Name', selected.name],
                  ['Status', selected.status],
                  ['Scopes', selected.scopes],
                  ['Rate Limit', `${selected.rateLimit}/min`],
                  ['Last Used', selected.lastUsedAt ? new Date(selected.lastUsedAt).toLocaleString() : 'never'],
                  ['Created', new Date(selected.createdAt).toLocaleDateString()],
                  ['Expires', selected.expiresAt],
                  ['Calls (30d)', selected.calls30d.toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                    <span className="text-slate-500">{k}</span>
                    <span className="text-right font-mono text-slate-800">{v}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {selected && <BooleanActionCard rec={selected.aiRecommendation} />}

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/40">
            <CardContent className="p-3 text-xs">
              <div className="flex items-center gap-2 font-semibold text-blue-900">
                <BookOpen className="h-4 w-4" /> Quickstart
              </div>
              <pre className="mt-2 overflow-x-auto rounded-md bg-white p-2 text-[10px] text-slate-700">
{`curl -X GET \\
  -H "Authorization: Bearer $REGGUARD_KEY" \\
  https://api.regguard.ai/v1/regulations`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
