'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShieldCheck, Lock, Globe, AlertTriangle, FileLock, Database, Trash2 } from 'lucide-react'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'
import { dataUrl } from '@/lib/data'

type Tier = {
  tier: string
  rank: number
  name: string
  description: string
  gdprArticleRefs: string[]
  piplArticleRefs: string[]
  encryptionAtRest: string
  encryptionInTransit: string
  accessControlModel: string
  retentionPeriodYears: number
  crossBorderAllowed: boolean
  crossBorderMechanism: string
  breachNotificationHours: number | null
  assetsCount: number
}

type Asset = {
  id: string
  assetName: string
  classification: string
  owner: string
  dataVolumeGB: number
  recordsCount: number
  lastClassifiedAt: string
  crossBorderTransferRequested: boolean
  residencyRegion: string
  breachIncidents12m: number
  destructionScheduledAt?: string
  aiRecommendation: AIRec
}

type SensData = {
  tiers: Tier[]
  assets: Asset[]
  total: number
  summary: {
    totalAssets: number
    totalDataVolumeGB: number
    restrictedAssets: number
    confidentialAssets: number
    internalAssets: number
    publicAssets: number
    deprecatedAssets: number
    breachIncidents12m: number
    crossBorderTransfersActive: number
    destructionScheduled: number
  }
}

const tierTint: Record<string, string> = {
  restricted: 'text-rose-700 bg-rose-50 border-rose-200',
  confidential: 'text-orange-700 bg-orange-50 border-orange-200',
  internal: 'text-amber-700 bg-amber-50 border-amber-200',
  public: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  deprecated: 'text-stone-700 bg-stone-100 border-stone-200',
}

const tierDot: Record<string, string> = {
  restricted: 'bg-rose-500',
  confidential: 'bg-orange-500',
  internal: 'bg-amber-400',
  public: 'bg-emerald-400',
  deprecated: 'bg-stone-500',
}

const tierIcon: Record<string, typeof ShieldCheck> = {
  restricted: Lock,
  confidential: FileLock,
  internal: Database,
  public: Globe,
  deprecated: Trash2,
}

const tierRank: Record<string, number> = { restricted: 0, confidential: 1, internal: 2, public: 3, deprecated: 4 }

function fmtVolume(gb: number): string {
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  return `${(gb * 1024).toFixed(0)} MB`
}

function fmtRecords(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

export function DataSensitivityView() {
  const [data, setData] = useState<SensData | null>(null)
  const [selected, setSelected] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('data-sensitivity'))
      .then(r => r.json())
      .then(d => {
        setData(d)
        // Default-select the restricted asset with cross-border transfer requested (has actionable AI rec)
        const withAction = d.assets?.find((a: Asset) => a.classification === 'restricted' && a.crossBorderTransferRequested)
        const firstRestricted = d.assets?.find((a: Asset) => a.classification === 'restricted')
        setSelected(withAction ?? firstRestricted ?? d.assets?.[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const s = data.summary

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Platform & Governance"
        title="Data Sensitivity Classification"
        subtitle="Five-tier classification (Restricted / Confidential / Internal / Public / Deprecated) mapping every data asset to GDPR Articles 5, 9, 32 and PIPL Articles 28, 47 controls. Encryption, access model, retention, and cross-border transfer mechanism enforced per tier."
        icon={ShieldCheck}
        accent="from-emerald-500 to-teal-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Restricted" value={s.restrictedAssets} sub="GDPR Art.9 / PIPL Art.28" icon={Lock} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="Confidential" value={s.confidentialAssets} sub="GDPR Art.5/32 + SCCs" icon={FileLock} tint="text-orange-700 bg-orange-50" />
        <KpiTile label="Cross-Border" value={s.crossBorderTransfersActive} sub="active transfer requests" icon={Globe} tint="text-blue-700 bg-blue-50" />
        <KpiTile label="Breaches 12m" value={s.breachIncidents12m} sub="across all tiers" icon={AlertTriangle} tint="text-amber-700 bg-amber-50" />
      </div>

      {/* Tier matrix banner */}
      <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/40 to-teal-50/40">
        <CardContent className="py-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {data.tiers.map(t => {
              const Icon = tierIcon[t.tier] ?? ShieldCheck
              return (
                <div key={t.tier} className="rounded-md border border-slate-200 bg-white p-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${tierDot[t.tier]}`} />
                    <Icon className="h-3 w-3 text-slate-600" />
                    <span className="font-semibold text-slate-700">{t.name}</span>
                  </div>
                  <div className="mt-1 space-y-0.5 text-[10px] text-slate-500">
                    <div>Encrypt: <span className="font-mono text-slate-700">{t.encryptionAtRest}</span></div>
                    <div>Access: <span className="font-mono text-slate-700">{t.accessControlModel.toUpperCase()}</span></div>
                    <div>Retain: <span className="font-mono text-slate-700">{t.retentionPeriodYears === 0 ? 'delete' : t.retentionPeriodYears + 'y'}</span></div>
                    <div>X-border: <span className="font-mono text-slate-700">{t.crossBorderMechanism}</span></div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Asset registry */}
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-3.5 w-3.5" />
              Data Assets — sorted by tier (Restricted first)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {[...data.assets]
                .sort((a, b) => tierRank[a.classification] - tierRank[b.classification])
                .map(a => {
                  const Icon = tierIcon[a.classification] ?? ShieldCheck
                  const isSelected = selected?.id === a.id
                  const breachTint = a.breachIncidents12m > 0 ? 'text-rose-600' : 'text-emerald-600'
                  return (
                    <button key={a.id} onClick={() => setSelected(a)}
                      className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200">
                        <Icon className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500">{a.id}</span>
                          <Badge variant="outline" className={`text-[9px] ${tierTint[a.classification]}`}>
                            {a.classification}
                          </Badge>
                          {a.crossBorderTransferRequested && (
                            <Badge variant="outline" className="text-[9px] border-blue-200 bg-blue-50 text-blue-700">
                              <Globe className="h-2 w-2 mr-0.5" />X-border
                            </Badge>
                          )}
                          {a.breachIncidents12m > 0 && (
                            <Badge variant="outline" className="text-[9px] border-rose-300 bg-rose-100 text-rose-700">
                              {a.breachIncidents12m} BREACH
                            </Badge>
                          )}
                          {a.destructionScheduledAt && (
                            <Badge variant="outline" className="text-[9px] border-stone-300 bg-stone-100 text-stone-700">
                              DEPRECATED
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-slate-700">{a.assetName}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {a.owner} · {fmtVolume(a.dataVolumeGB)} · {fmtRecords(a.recordsCount)} records · {a.residencyRegion}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-[10px]">
                          <span className="text-slate-500">classified {relTime(a.lastClassifiedAt)}</span>
                          <span className={breachTint}>
                            {a.breachIncidents12m === 0 ? 'no breaches' : `${a.breachIncidents12m} breach in 12m`}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detail panel */}
        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <>
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    {selected.assetName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Asset ID', selected.id],
                    ['Classification', selected.classification],
                    ['Owner', selected.owner],
                    ['Data Volume', fmtVolume(selected.dataVolumeGB)],
                    ['Records', fmtRecords(selected.recordsCount)],
                    ['Residency Region', selected.residencyRegion],
                    ['Last Classified', relTime(selected.lastClassifiedAt)],
                    ['Cross-Border Requested', selected.crossBorderTransferRequested ? 'YES' : 'no'],
                    ['Breach Incidents 12m', `${selected.breachIncidents12m}`],
                    ...(selected.destructionScheduledAt
                      ? [['Destruction Scheduled', relTime(selected.destructionScheduledAt)] as [string, string]]
                      : []),
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono text-right text-slate-800">{v}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Tier controls card — show the controls applicable to this asset's tier */}
              {(() => {
                const tier = data.tiers.find(t => t.tier === selected.classification)
                if (!tier) return null
                return (
                  <Card className="border-slate-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-slate-600" />
                        {tier.name} Tier — Control Mapping
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-md border border-slate-100 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">Encryption at Rest</p>
                          <p className="font-mono text-slate-800">{tier.encryptionAtRest}</p>
                        </div>
                        <div className="rounded-md border border-slate-100 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">Encryption in Transit</p>
                          <p className="font-mono text-slate-800">{tier.encryptionInTransit}</p>
                        </div>
                        <div className="rounded-md border border-slate-100 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">Access Control</p>
                          <p className="font-mono text-slate-800">{tier.accessControlModel.toUpperCase()}</p>
                        </div>
                        <div className="rounded-md border border-slate-100 p-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">Retention</p>
                          <p className="font-mono text-slate-800">{tier.retentionPeriodYears === 0 ? 'delete (90 days)' : `${tier.retentionPeriodYears} years`}</p>
                        </div>
                      </div>
                      <div className="pt-1">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">GDPR Article References</p>
                        <div className="flex flex-wrap gap-1">
                          {tier.gdprArticleRefs.length === 0
                            ? <span className="text-[10px] text-slate-400 italic">none</span>
                            : tier.gdprArticleRefs.map(r => (
                              <Badge key={r} variant="outline" className="text-[9px] font-mono text-blue-700 border-blue-200 bg-blue-50">{r}</Badge>
                            ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">PIPL Article References</p>
                        <div className="flex flex-wrap gap-1">
                          {tier.piplArticleRefs.length === 0
                            ? <span className="text-[10px] text-slate-400 italic">none</span>
                            : tier.piplArticleRefs.map(r => (
                              <Badge key={r} variant="outline" className="text-[9px] font-mono text-purple-700 border-purple-200 bg-purple-50">{r}</Badge>
                            ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Cross-Border Mechanism</p>
                        <p className="font-mono text-slate-800">{tier.crossBorderMechanism}{tier.crossBorderAllowed ? '' : ' (blocked)'}</p>
                      </div>
                      {tier.breachNotificationHours !== null && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Breach Notification</p>
                          <p className="font-mono text-slate-800">Within {tier.breachNotificationHours} hours (GDPR Art.33)</p>
                        </div>
                      )}
                      <p className="pt-1 text-[11px] text-slate-600">{tier.description}</p>
                    </CardContent>
                  </Card>
                )
              })()}

              <BooleanActionCard rec={selected.aiRecommendation} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
