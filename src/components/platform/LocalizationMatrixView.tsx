'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Globe2, MapPin, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Lock } from 'lucide-react'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'

type TransferRule = {
  destination: string
  allowed: 'allowed-domestic' | 'allowed-adequacy' | 'allowed-scc' | 'allowed-consent' | 'restricted-residency' | 'conditional'
  mechanism: string
}

type Regulation = {
  id: string
  code: string
  name: string
  jurisdiction: string
  effectiveDate: string
  residencyRequired: boolean
  transferMechanisms: string[]
  scope: string
  dataTypes: string[]
  maxPenaltyUsd: number
  transferRules: TransferRule[]
  lastReviewedAt: string
  aiRecommendation: AIRec
}

type LocData = {
  regulations: Regulation[]
  total: number
  summary: {
    jurisdictionsCovered: number
    residencyRequired: number
    crossBorderAllowed: number
    totalTransferRules: number
    highestPenaltyUsd: number
  }
}

const ruleTint: Record<TransferRule['allowed'], { dot: string; label: string; tint: string }> = {
  'allowed-domestic':   { dot: 'bg-emerald-500', label: 'Domestic', tint: 'text-emerald-700 bg-emerald-50' },
  'allowed-adequacy':   { dot: 'bg-emerald-500', label: 'Adequacy', tint: 'text-emerald-700 bg-emerald-50' },
  'allowed-scc':        { dot: 'bg-amber-500',   label: 'SCC',      tint: 'text-amber-700 bg-amber-50' },
  'allowed-consent':    { dot: 'bg-amber-500',   label: 'Consent',  tint: 'text-amber-700 bg-amber-50' },
  'conditional':        { dot: 'bg-slate-400',   label: 'Conditional', tint: 'text-slate-700 bg-slate-100' },
  'restricted-residency': { dot: 'bg-rose-500',  label: 'Residency', tint: 'text-rose-700 bg-rose-50' },
}

function fmtUsd(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1000).toFixed(0)}K`
  return `$${v}`
}

export function LocalizationMatrixView() {
  const [data, setData] = useState<LocData | null>(null)
  const [selected, setSelected] = useState<Regulation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/localization.json')
      .then(r => r.json())
      .then(d => {
        setData(d)
        const firstResidency = d.regulations?.find((r: Regulation) => r.residencyRequired)
        setSelected(firstResidency ?? d.regulations?.[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const s = data.summary

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Platform & Governance"
        title="Cross-Border Data Localization Matrix"
        subtitle="Per-jurisdiction rules for cross-border personal data flows: GDPR (EU), PIPL (China), 152-FZ (Russia), DPDP (India), LGPD (Brazil), CCPA/CPRA (California), PIPEDA (Canada), POPIA (South Africa), APPI (Japan), PDPA (Singapore)."
        icon={Globe2}
        accent="from-slate-600 to-gray-700"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Jurisdictions" value={s.jurisdictionsCovered} sub="data protection regimes" icon={Globe2} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="Residency Required" value={s.residencyRequired} sub="in-country storage mandate" icon={Lock} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="Cross-Border Permitted" value={s.crossBorderAllowed} sub="with safeguards" icon={CheckCircle2} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Highest Penalty" value={fmtUsd(s.highestPenaltyUsd)} sub="GDPR max" icon={AlertTriangle} tint="text-amber-700 bg-amber-50" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              Regulation Matrix — residency first
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {[...data.regulations].sort((a, b) => Number(b.residencyRequired) - Number(a.residencyRequired)).map(r => {
                const isSelected = selected?.id === r.id
                return (
                  <button key={r.id} onClick={() => setSelected(r)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-violet-50/40' : ''}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${r.residencyRequired ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                      {r.residencyRequired ? <Lock className="h-4 w-4" /> : <Globe2 className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono">{r.code}</Badge>
                        <span className="text-xs font-semibold text-slate-700">{r.name}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {r.jurisdiction} · effective {r.effectiveDate}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.transferMechanisms.slice(0, 3).map(m => (
                          <Badge key={m} variant="outline" className="text-[9px] text-slate-600">
                            {m}
                          </Badge>
                        ))}
                        {r.transferMechanisms.length > 3 && (
                          <Badge variant="outline" className="text-[9px] text-slate-400">
                            +{r.transferMechanisms.length - 3}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400">
                        max penalty {fmtUsd(r.maxPenaltyUsd)}
                      </p>
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
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">{selected.code}</span>
                    <span className="text-slate-800">{selected.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Jurisdiction', selected.jurisdiction],
                    ['Effective Date', selected.effectiveDate],
                    ['Residency Required', selected.residencyRequired ? 'YES — in-country' : 'No'],
                    ['Max Penalty', fmtUsd(selected.maxPenaltyUsd)],
                    ['Last Reviewed', new Date(selected.lastReviewedAt).toLocaleDateString()],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono text-right text-slate-800">{v}</span>
                    </div>
                  ))}
                  <div className="pt-2">
                    <p className="mb-1 text-slate-500">Scope</p>
                    <p className="text-[11px] text-slate-700">{selected.scope}</p>
                  </div>
                  <div className="pt-2">
                    <p className="mb-1 text-slate-500">Data Types</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.dataTypes.map(t => (
                        <Badge key={t} variant="outline" className="text-[9px]">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="mb-1 text-slate-500">Transfer Mechanisms</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.transferMechanisms.map(m => (
                        <Badge key={m} variant="outline" className="text-[9px] border-violet-200 bg-violet-50 text-violet-700">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transfer destination matrix */}
              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3" />
                    Outbound Transfer Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-1.5">
                    {selected.transferRules.map(rule => {
                      const meta = ruleTint[rule.allowed]
                      return (
                        <div key={rule.destination} className={`flex items-center justify-between rounded-md px-2 py-1 text-[10px] ${meta.tint}`}>
                          <span className="font-mono">{rule.destination}</span>
                          <span className="flex items-center gap-1">
                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                        </div>
                      )
                    })}
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
