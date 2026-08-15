'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Wallet, Landmark, Send, ShieldAlert, CheckCircle2, AlertTriangle,
  XCircle, FileText, Calendar, Building2, Globe2, Lock, Network, Database,
} from 'lucide-react'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'
import { usePluginData } from '@/hooks/use-plugin-data'

// ─── Types ──────────────────────────────────────────────────────────────
type MicaCasp = {
  id: string
  applicantName: string
  applicantLei: string
  registeredOffice: string
  homeNca: string
  serviceClasses: string[]
  capitalRequirementEur: number
  capitalBufferEur: number
  clientCryptoUnderCustodyEur?: number
  whitePaperPublished: boolean
  conflictOfInterestDisclosed: boolean
  parentUndertaking?: string
  intendedPassportingStates?: string[]
  submissionDate: string
  acknowledgementDate: string | null
  decisionDate: string | null
  status: 'authorized' | 'in_review' | 'deficient' | 'withdrawn'
  authorizationNumber: string | null
  esmaRegisterListed: boolean
  aiRecommendation: AIRec
}

type TravelRuleMessage = {
  id: string
  messageId: string
  messageType: string
  originatorVaspName: string
  originatorVaspLei: string
  originatorWalletAddress: string
  originatorName: string
  originatorPhysicalAddress?: string
  originatorNationalId?: string
  originatorDateOfBirth?: string
  beneficiaryVaspName: string
  beneficiaryVaspLei?: string
  beneficiaryWalletAddress: string
  beneficiaryName: string
  transactionAmount: number
  transactionCurrency: string
  transactionHash?: string
  transactionChain?: string
  openvaspaPayloadVersion: string
  timestamp: string
  preCheckStatus?: string
  sanctionsScreeningStatus?: string
  sanctionsHitDetail?: string
  beneficiaryConfirmationStatus?: string
  sunrisePeriodApplicable?: boolean
  sunrisePeriodStrategy?: string
  cancellationReason?: string
  cancellationDetail?: string
  aiRecommendation: AIRec
}

type DefiPillar = {
  id: string
  pillar: string
  pillarIndex: number
  responsibleParty: string
  protocolName: string
  protocolType: string
  daoLegalPersonality?: boolean
  daoLegalForm?: string
  treasuryValueUsd?: number
  treasuryAssetBreakdown?: Record<string, number>
  riskSeverity: string
  kycImplemented?: boolean
  sanctionsScreeningImplemented?: boolean
  travelRuleImplemented?: boolean
  transactionMonitoringImplemented?: boolean
  sanctionsScreeningTreasuryInflows?: boolean
  sanctionsScreeningTreasuryOutflows?: boolean
  daoSanctionsPolicyDocumented?: boolean
  sanctionedListStatus?: string
  sanctionedAt?: string
  sanctioningAuthority?: string
  sanctionsProgram?: string
  oracleProvider?: string
  oracleBackupProvider?: string
  circuitBreakerThresholdPct?: number
  twapWindowSeconds?: number
  historicalAccuracyPct?: number
  slaInPlace?: boolean
  slaUptimePct?: number
  slaAccuracyBps?: number
  userDisclosureProvided?: boolean
  lastOracleIncidentAt?: string
  lastOracleIncidentDetail?: string
  regulatoryReference: string
  aiRecommendation: AIRec
}

type CryptoRegulationData = {
  micaCasps: MicaCasp[]
  travelRuleMessages: TravelRuleMessage[]
  defiPillars: DefiPillar[]
  summary: {
    totalCaspApplications: number
    authorizedCasps: number
    caspsInReview: number
    caspsDeficient: number
    totalTravelRuleMessages: number
    travelRuleBlocked: number
    travelRuleSunrisePeriod: number
    totalDefiPillars: number
    sanctionedDaos: number
    caspsWithWhitePaper: number
    pillarLabels: string[]
    caspServiceClasses: string[]
  }
}

// ─── Display metadata ───────────────────────────────────────────────────
const statusMeta: Record<string, { label: string; tint: string; icon: typeof CheckCircle2 }> = {
  authorized:  { label: 'Authorized',  tint: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  in_review:   { label: 'In Review',   tint: 'text-blue-700 bg-blue-50 border-blue-200',         icon: Calendar },
  deficient:   { label: 'Deficient',   tint: 'text-rose-700 bg-rose-50 border-rose-200',         icon: AlertTriangle },
  withdrawn:   { label: 'Withdrawn',   tint: 'text-slate-700 bg-slate-50 border-slate-200',      icon: XCircle },
}

const messageTypeMeta: Record<string, { label: string; tint: string }> = {
  transfer_request:               { label: 'Transfer Request',       tint: 'text-blue-700 bg-blue-50 border-blue-200' },
  transfer_pre_check:             { label: 'Pre-Check',              tint: 'text-violet-700 bg-violet-50 border-violet-200' },
  transfer_confirmation:          { label: 'Confirmation',           tint: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  transfer_cancellation:          { label: 'Cancellation',           tint: 'text-amber-700 bg-amber-50 border-amber-200' },
  transfer_beneficiary_confirmation: { label: 'Beneficiary Confirm', tint: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
}

const pillarMeta: Record<string, { label: string; tint: string; icon: typeof Building2 }> = {
  front_end_regulation: { label: 'Front-End Regulation', tint: 'text-blue-700 bg-blue-50 border-blue-200',       icon: Building2 },
  treasury_sanctions:   { label: 'Treasury Sanctions',   tint: 'text-rose-700 bg-rose-50 border-rose-200',      icon: ShieldAlert },
  oracle_oversight:     { label: 'Oracle Oversight',     tint: 'text-violet-700 bg-violet-50 border-violet-200', icon: Network },
}

const severityTint: Record<string, string> = {
  low:      'text-emerald-700 bg-emerald-50 border-emerald-200',
  medium:   'text-amber-700 bg-amber-50 border-amber-200',
  high:     'text-orange-700 bg-orange-50 border-orange-200',
  critical: 'text-rose-700 bg-rose-50 border-rose-200',
}

function fmtEur(n: number): string {
  if (n >= 1_000_000_000) return `EUR ${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `EUR ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `EUR ${(n / 1_000).toFixed(0)}k`
  return `EUR ${n}`
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000_000) return `USD ${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `USD ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `USD ${(n / 1_000).toFixed(0)}k`
  return `USD ${n}`
}

function relTime(iso: string | null): string {
  if (!iso) return 'n/a'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

function shortAddr(addr: string): string {
  if (addr.length <= 14) return addr
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`
}

// ─── Main component ─────────────────────────────────────────────────────
export function CryptoRegulationView() {
  const { data, loading, error } = usePluginData<CryptoRegulationData>('crypto-regulation')
  const [selectedCasp, setSelectedCasp] = useState<MicaCasp | null>(null)
  const [selectedMsg, setSelectedMsg] = useState<TravelRuleMessage | null>(null)
  const [selectedPillar, setSelectedPillar] = useState<DefiPillar | null>(null)

  // Derive the default selections once data arrives — pick the most
  // actionable item in each category (deficient CASP, blocked travel-rule
  // message, sanctioned DeFi pillar) so the detail panels are immediately
  // useful on first render.
  useEffect(() => {
    if (!data) return
    const deficient = data.micaCasps?.find((c) => c.status === 'deficient')
    setSelectedCasp(deficient ?? data.micaCasps?.[0] ?? null)
    const blocked = data.travelRuleMessages?.find((m) => m.sanctionsScreeningStatus === 'hit')
    setSelectedMsg(blocked ?? data.travelRuleMessages?.[0] ?? null)
    const sanctioned = data.defiPillars?.find((p) => p.sanctionedListStatus === 'sanctioned')
    setSelectedPillar(sanctioned ?? data.defiPillars?.[0] ?? null)
  }, [data])

  if (loading || !data) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>
  if (error) return <div className="p-6 text-rose-700">Failed to load crypto regulation data: {error.message}</div>

  const s = data.summary

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Collaboration & Trust"
        title="Digital Assets & Crypto Regulations"
        subtitle="EU MiCA CASP authorization (5 service classes, capital, white paper, passporting), FATF Travel Rule (R.16, OpenVASPA, IVMS101, sunrise period), and DeFi compliance challenges (front-end regulation, treasury sanctions, oracle oversight). Covers global landscape comparison: EU MiCA vs US fragmentation vs Singapore/HK licensing."
        icon={Wallet}
        accent="from-amber-500 to-orange-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Authorized CASPs" value={s.authorizedCasps} sub={`of ${s.totalCaspApplications} applications`} icon={CheckCircle2} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Travel Rule Blocked" value={s.travelRuleBlocked} sub={`of ${s.totalTravelRuleMessages} messages`} icon={ShieldAlert} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="Sanctioned DAOs" value={s.sanctionedDaos} sub="blocked from all transactions" icon={XCircle} tint="text-rose-700 bg-rose-50" />
        <KpiTile label="Sunrise Period" value={s.travelRuleSunrisePeriod} sub="EDD strategy applied" icon={Globe2} tint="text-amber-700 bg-amber-50" />
      </div>

      <Tabs defaultValue="mica" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mica" className="text-xs gap-1.5">
            <Landmark className="h-3.5 w-3.5" />
            MiCA CASPs
          </TabsTrigger>
          <TabsTrigger value="travel-rule" className="text-xs gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Travel Rule
          </TabsTrigger>
          <TabsTrigger value="defi" className="text-xs gap-1.5">
            <Network className="h-3.5 w-3.5" />
            DeFi Compliance
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: MiCA CASPs ───────────────────────────────────── */}
        <TabsContent value="mica" className="space-y-4 mt-4">
          {/* Service class framework banner */}
          <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50/40 to-orange-50/40">
            <CardContent className="py-3">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {[
                  { cls: 'custody_administration',   label: 'Custody',           capital: 'EUR 125k' },
                  { cls: 'exchange_platform',        label: 'Trading Platform',  capital: 'EUR 125k' },
                  { cls: 'exchange_fiat_crypto',     label: 'Fiat-Crypto',       capital: 'EUR 125k' },
                  { cls: 'exchange_crypto_crypto',   label: 'Crypto-Crypto',     capital: 'EUR 125k' },
                  { cls: 'placement_of_crypto_assets', label: 'Placement',       capital: 'EUR 150k' },
                ].map(c => (
                  <div key={c.cls} className="rounded-md border border-slate-200 bg-white p-2">
                    <div className="flex items-center gap-1.5">
                      <Wallet className="h-3 w-3 text-amber-500" />
                      <span className="font-semibold text-slate-700 text-[10px]">{c.label}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] font-mono text-slate-500">{c.capital}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* CASP registry */}
            <Card className="lg:col-span-3 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Landmark className="h-3.5 w-3.5" />
                  CASP Authorization Applications — sorted by status then submission date
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[640px]">
                  {[...data.micaCasps]
                    .sort((a, b) => {
                      const statusRank: Record<string, number> = { deficient: 0, in_review: 1, authorized: 2, withdrawn: 3 }
                      const sr = (statusRank[a.status] ?? 4) - (statusRank[b.status] ?? 4)
                      if (sr !== 0) return sr
                      return new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
                    })
                    .map(c => {
                      const sm = statusMeta[c.status]
                      const Icon = sm.icon
                      const isSelected = selectedCasp?.id === c.id
                      return (
                        <button key={c.id} onClick={() => setSelectedCasp(c)}
                          className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-amber-50/40' : ''}`}>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200">
                            <Icon className="h-4 w-4 text-slate-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-500">{c.applicantLei.slice(0, 12)}...</span>
                              <Badge variant="outline" className={`text-[9px] ${sm.tint}`}>
                                <Icon className="mr-0.5 h-2.5 w-2.5" />
                                {sm.label}
                              </Badge>
                            </div>
                            <p className="mt-0.5 text-xs font-semibold text-slate-700">{c.applicantName}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {c.registeredOffice} · NCA: <span className="font-mono">{c.homeNca}</span>
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-1">
                              {c.serviceClasses.map(cls => (
                                <span key={cls} className="text-[9px] font-mono text-amber-700 bg-amber-50 border border-amber-200 rounded px-1 py-0.5">
                                  {cls.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                              <span>submitted {relTime(c.submissionDate)}</span>
                              <span>·</span>
                              <span>{fmtEur(c.capitalRequirementEur + c.capitalBufferEur)} total</span>
                              {c.esmaRegisterListed && (
                                <>
                                  <span>·</span>
                                  <span className="text-emerald-600 font-mono">ESMA listed</span>
                                </>
                              )}
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
              {selectedCasp && (
                <>
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-amber-600" />
                        {selectedCasp.applicantName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {[
                        ['Legal Name', selectedCasp.applicantName],
                        ['LEI', selectedCasp.applicantLei],
                        ['Registered Office', selectedCasp.registeredOffice],
                        ['Home NCA', selectedCasp.homeNca],
                        ['Status', statusMeta[selectedCasp.status].label],
                        ['Authorization Number', selectedCasp.authorizationNumber ?? 'not yet issued'],
                        ['Parent Undertaking', selectedCasp.parentUndertaking ?? 'none'],
                        ['Service Classes', `${selectedCasp.serviceClasses.length} of 5`],
                        ['Capital Requirement', fmtEur(selectedCasp.capitalRequirementEur)],
                        ['Capital Buffer', fmtEur(selectedCasp.capitalBufferEur)],
                        ['Total Capital', fmtEur(selectedCasp.capitalRequirementEur + selectedCasp.capitalBufferEur)],
                        ...(selectedCasp.clientCryptoUnderCustodyEur !== undefined ? [['Client Crypto Under Custody', fmtEur(selectedCasp.clientCryptoUnderCustodyEur)]] : []),
                        ['White Paper Published', selectedCasp.whitePaperPublished ? 'YES' : 'NO'],
                        ['Conflict of Interest Disclosed', selectedCasp.conflictOfInterestDisclosed ? 'YES' : 'NO'],
                        ['ESMA Central Register', selectedCasp.esmaRegisterListed ? 'LISTED' : 'NOT LISTED'],
                        ['Submission Date', relTime(selectedCasp.submissionDate)],
                        ['Acknowledgement Date', selectedCasp.acknowledgementDate ? relTime(selectedCasp.acknowledgementDate) : 'pending'],
                        ['Decision Date', selectedCasp.decisionDate ? relTime(selectedCasp.decisionDate) : 'pending'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                          <span className="text-slate-500">{k}</span>
                          <span className="font-mono text-right text-slate-800 text-[11px]">{v}</span>
                        </div>
                      ))}
                      {selectedCasp.intendedPassportingStates && selectedCasp.intendedPassportingStates.length > 0 && (
                        <div className="pt-2">
                          <p className="text-slate-500 mb-1">Intended Passporting States:</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedCasp.intendedPassportingStates.map(state => (
                              <Badge key={state} variant="outline" className="text-[9px] font-mono text-blue-700 bg-blue-50 border-blue-200">
                                {state}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <BooleanActionCard rec={selectedCasp.aiRecommendation} />
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB 2: Travel Rule ──────────────────────────────────── */}
        <TabsContent value="travel-rule" className="space-y-4 mt-4">
          {/* Threshold + sunrise period banner */}
          <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50/40 to-orange-50/40">
            <CardContent className="py-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { label: 'Cross-border Threshold', value: 'USD/EUR 1,000', note: 'FATF R.16' },
                  { label: 'US BSA Threshold', value: 'USD 3,000', note: 'FinCEN 2024 NRF final rule' },
                  { label: 'Singapore Threshold', value: 'SGD 1,500', note: 'MAS PSN02' },
                  { label: 'UK Threshold', value: 'GBP 1,000', note: 'MLR 2017 amendment' },
                ].map(t => (
                  <div key={t.label} className="rounded-md border border-slate-200 bg-white p-2">
                    <div className="text-[10px] font-semibold text-slate-700">{t.label}</div>
                    <div className="mt-0.5 text-[11px] font-mono text-amber-700">{t.value}</div>
                    <div className="mt-0.5 text-[9px] text-slate-400">{t.note}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Message registry */}
            <Card className="lg:col-span-3 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Send className="h-3.5 w-3.5" />
                  OpenVASPA Messages — sorted by timestamp (most recent first)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[640px]">
                  {[...data.travelRuleMessages]
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map(m => {
                      const meta = messageTypeMeta[m.messageType] ?? { label: m.messageType, tint: 'text-slate-700 bg-slate-50 border-slate-200' }
                      const isSelected = selectedMsg?.id === m.id
                      const isBlocked = m.sanctionsScreeningStatus === 'hit'
                      return (
                        <button key={m.id} onClick={() => setSelectedMsg(m)}
                          className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-amber-50/40' : ''}`}>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200">
                            {isBlocked
                              ? <ShieldAlert className="h-4 w-4 text-rose-500" />
                              : m.messageType === 'transfer_cancellation'
                                ? <AlertTriangle className="h-4 w-4 text-amber-500" />
                                : <Send className="h-4 w-4 text-blue-500" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-500">{m.messageId}</span>
                              <Badge variant="outline" className={`text-[9px] ${meta.tint}`}>{meta.label}</Badge>
                              {m.sunrisePeriodApplicable && (
                                <Badge variant="outline" className="text-[9px] border-amber-300 bg-amber-100 text-amber-700">
                                  SUNRISE
                                </Badge>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs font-semibold text-slate-700">
                              {m.transactionAmount.toLocaleString()} {m.transactionCurrency}
                              {m.transactionChain && (
                                <span className="ml-1 text-[10px] font-mono text-slate-400">· {m.transactionChain}</span>
                              )}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              <span className="font-mono">{m.originatorVaspName}</span>
                              <span className="text-slate-400"> → </span>
                              <span className="font-mono">{m.beneficiaryVaspName}</span>
                            </p>
                            <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                              <span>{relTime(m.timestamp)}</span>
                              {m.preCheckStatus && (
                                <>
                                  <span>·</span>
                                  <span className={m.preCheckStatus === 'passed' ? 'text-emerald-600 font-mono' : 'text-rose-600 font-mono'}>
                                    pre-check: {m.preCheckStatus}
                                  </span>
                                </>
                              )}
                              {m.sanctionsScreeningStatus && (
                                <>
                                  <span>·</span>
                                  <span className={m.sanctionsScreeningStatus === 'clear' ? 'text-emerald-600 font-mono' : 'text-rose-600 font-mono'}>
                                    sanctions: {m.sanctionsScreeningStatus}
                                  </span>
                                </>
                              )}
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
              {selectedMsg && (
                <>
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Send className="h-4 w-4 text-amber-600" />
                        OpenVASPA Message
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {[
                        ['Message ID', selectedMsg.messageId],
                        ['Message Type', (messageTypeMeta[selectedMsg.messageType]?.label ?? selectedMsg.messageType)],
                        ['OpenVASPA Version', selectedMsg.openvaspaPayloadVersion],
                        ['Timestamp', relTime(selectedMsg.timestamp)],
                        ['Transaction Amount', `${selectedMsg.transactionAmount.toLocaleString()} ${selectedMsg.transactionCurrency}`],
                        ...(selectedMsg.transactionHash ? [['Transaction Hash', shortAddr(selectedMsg.transactionHash)]] : []),
                        ...(selectedMsg.transactionChain ? [['Chain', selectedMsg.transactionChain]] : []),
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                          <span className="text-slate-500">{k}</span>
                          <span className="font-mono text-right text-slate-800 text-[11px]">{v}</span>
                        </div>
                      ))}

                      {/* Originator block */}
                      <div className="pt-2">
                        <p className="text-slate-500 mb-1 text-[11px] font-semibold">Originator</p>
                        <div className="rounded-md border border-blue-100 bg-blue-50/40 p-2 space-y-1">
                          {[
                            ['VASP', selectedMsg.originatorVaspName],
                            ['LEI', selectedMsg.originatorVaspLei],
                            ['Wallet', shortAddr(selectedMsg.originatorWalletAddress)],
                            ['Name', selectedMsg.originatorName],
                            ...(selectedMsg.originatorPhysicalAddress ? [['Address', selectedMsg.originatorPhysicalAddress]] : []),
                            ...(selectedMsg.originatorNationalId ? [['National ID', selectedMsg.originatorNationalId]] : []),
                            ...(selectedMsg.originatorDateOfBirth ? [['DOB', selectedMsg.originatorDateOfBirth]] : []),
                          ].map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-2 text-[11px]">
                              <span className="text-slate-500">{k}</span>
                              <span className="font-mono text-slate-700 text-right">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Beneficiary block */}
                      <div className="pt-1">
                        <p className="text-slate-500 mb-1 text-[11px] font-semibold">Beneficiary</p>
                        <div className="rounded-md border border-emerald-100 bg-emerald-50/40 p-2 space-y-1">
                          {[
                            ['VASP', selectedMsg.beneficiaryVaspName],
                            ...(selectedMsg.beneficiaryVaspLei ? [['LEI', selectedMsg.beneficiaryVaspLei]] : []),
                            ['Wallet', shortAddr(selectedMsg.beneficiaryWalletAddress)],
                            ['Name', selectedMsg.beneficiaryName],
                          ].map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-2 text-[11px]">
                              <span className="text-slate-500">{k}</span>
                              <span className="font-mono text-slate-700 text-right">{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status flags */}
                      {selectedMsg.preCheckStatus && (
                        <div className="pt-2 flex flex-wrap gap-1.5">
                          <Badge variant="outline" className={`text-[9px] ${selectedMsg.preCheckStatus === 'passed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                            pre-check: {selectedMsg.preCheckStatus}
                          </Badge>
                          {selectedMsg.sanctionsScreeningStatus && (
                            <Badge variant="outline" className={`text-[9px] ${selectedMsg.sanctionsScreeningStatus === 'clear' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                              sanctions: {selectedMsg.sanctionsScreeningStatus}
                            </Badge>
                          )}
                          {selectedMsg.beneficiaryConfirmationStatus && (
                            <Badge variant="outline" className="text-[9px] border-slate-200 bg-slate-50 text-slate-700">
                              confirm: {selectedMsg.beneficiaryConfirmationStatus}
                            </Badge>
                          )}
                          {selectedMsg.sunrisePeriodApplicable && (
                            <Badge variant="outline" className="text-[9px] border-amber-300 bg-amber-100 text-amber-700">
                              sunrise: {selectedMsg.sunrisePeriodStrategy}
                            </Badge>
                          )}
                        </div>
                      )}

                      {selectedMsg.sanctionsHitDetail && (
                        <p className="pt-2 text-[11px] text-rose-700 italic">
                          <ShieldAlert className="inline h-3 w-3 mr-1" />
                          {selectedMsg.sanctionsHitDetail}
                        </p>
                      )}
                      {selectedMsg.cancellationDetail && (
                        <p className="pt-2 text-[11px] text-amber-700 italic">
                          <AlertTriangle className="inline h-3 w-3 mr-1" />
                          {selectedMsg.cancellationDetail}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <BooleanActionCard rec={selectedMsg.aiRecommendation} />
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB 3: DeFi Compliance ──────────────────────────────── */}
        <TabsContent value="defi" className="space-y-4 mt-4">
          {/* Three-pillar framework banner */}
          <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50/40 to-orange-50/40">
            <CardContent className="py-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {[
                  { pillar: 'front_end_regulation', label: 'Front-End Regulation', responsible: 'Front-end operator (VASP)',     challenge: 'KYC, sanctions, Travel Rule, TM at the interface layer' },
                  { pillar: 'treasury_sanctions',   label: 'Treasury Sanctions',   responsible: 'DAO / multi-sig signers',       challenge: 'OFAC SDN listing, blocked assets, governance token liability' },
                  { pillar: 'oracle_oversight',     label: 'Oracle Oversight',     responsible: 'Oracle provider + protocol',   challenge: 'Price manipulation, circuit breakers, fallback oracles, SLA' },
                ].map(p => {
                  const meta = pillarMeta[p.pillar]
                  const Icon = meta.icon
                  return (
                    <div key={p.pillar} className="rounded-md border border-slate-200 bg-white p-2">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3 text-amber-500" />
                        <span className="font-semibold text-slate-700 text-[11px]">{p.label}</span>
                      </div>
                      <div className="mt-1 space-y-0.5 text-[10px] text-slate-500">
                        <div>Responsible: <span className="font-mono text-slate-600">{p.responsible}</span></div>
                        <div>{p.challenge}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* DeFi pillar registry */}
            <Card className="lg:col-span-3 border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Network className="h-3.5 w-3.5" />
                  DeFi Compliance Records — sorted by pillar then risk severity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[640px]">
                  {[...data.defiPillars]
                    .sort((a, b) => {
                      if (a.pillarIndex !== b.pillarIndex) return a.pillarIndex - b.pillarIndex
                      const sevRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
                      return (sevRank[a.riskSeverity] ?? 4) - (sevRank[b.riskSeverity] ?? 4)
                    })
                    .map(p => {
                      const meta = pillarMeta[p.pillar]
                      const Icon = meta.icon
                      const isSelected = selectedPillar?.id === p.id
                      const isSanctioned = p.sanctionedListStatus === 'sanctioned'
                      return (
                        <button key={p.id} onClick={() => setSelectedPillar(p)}
                          className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-amber-50/40' : ''}`}>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200">
                            <Icon className={`h-4 w-4 ${isSanctioned ? 'text-rose-500' : 'text-amber-500'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[9px] ${meta.tint}`}>
                                {meta.label}
                              </Badge>
                              <Badge variant="outline" className={`text-[9px] ${severityTint[p.riskSeverity]}`}>
                                {p.riskSeverity}
                              </Badge>
                              {isSanctioned && (
                                <Badge variant="outline" className="text-[9px] border-rose-300 bg-rose-100 text-rose-700">
                                  <Lock className="mr-0.5 h-2.5 w-2.5" />
                                  SANCTIONED
                                </Badge>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs font-semibold text-slate-700">{p.protocolName}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {p.protocolType} · responsible: <span className="font-mono">{p.responsibleParty}</span>
                            </p>
                            <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
                              {p.treasuryValueUsd !== undefined && (
                                <span>treasury {fmtUsd(p.treasuryValueUsd)}</span>
                              )}
                              {p.oracleProvider && (
                                <span>oracle: <span className="font-mono">{p.oracleProvider}</span></span>
                              )}
                              {p.kycImplemented !== undefined && (
                                <span className={p.kycImplemented ? 'text-emerald-600 font-mono' : 'text-rose-600 font-mono'}>
                                  KYC: {p.kycImplemented ? 'yes' : 'no'}
                                </span>
                              )}
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
              {selectedPillar && (
                <>
                  <Card className="border-slate-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Network className="h-4 w-4 text-amber-600" />
                        {selectedPillar.protocolName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      {[
                        ['Protocol Name', selectedPillar.protocolName],
                        ['Protocol Type', selectedPillar.protocolType],
                        ['Pillar', pillarMeta[selectedPillar.pillar].label],
                        ['Responsible Party', selectedPillar.responsibleParty],
                        ['Risk Severity', selectedPillar.riskSeverity],
                        ...(selectedPillar.daoLegalPersonality !== undefined ? [['DAO Legal Personality', selectedPillar.daoLegalPersonality ? 'YES' : 'NO']] : []),
                        ...(selectedPillar.daoLegalForm ? [['DAO Legal Form', selectedPillar.daoLegalForm]] : []),
                        ...(selectedPillar.treasuryValueUsd !== undefined ? [['Treasury Value', fmtUsd(selectedPillar.treasuryValueUsd)]] : []),
                        ...(selectedPillar.sanctionedListStatus ? [['Sanctions List Status', selectedPillar.sanctionedListStatus]] : []),
                        ...(selectedPillar.sanctionedAt ? [['Sanctioned At', selectedPillar.sanctionedAt]] : []),
                        ...(selectedPillar.sanctioningAuthority ? [['Sanctioning Authority', selectedPillar.sanctioningAuthority]] : []),
                        ...(selectedPillar.sanctionsProgram ? [['Sanctions Program', selectedPillar.sanctionsProgram]] : []),
                        ...(selectedPillar.oracleProvider ? [['Primary Oracle', selectedPillar.oracleProvider]] : []),
                        ...(selectedPillar.oracleBackupProvider ? [['Backup Oracle', selectedPillar.oracleBackupProvider]] : []),
                        ...(selectedPillar.circuitBreakerThresholdPct !== undefined ? [['Circuit Breaker Threshold', `${selectedPillar.circuitBreakerThresholdPct}% divergence`]] : []),
                        ...(selectedPillar.twapWindowSeconds !== undefined ? [['TWAP Window', `${selectedPillar.twapWindowSeconds / 60} minutes`]] : []),
                        ...(selectedPillar.historicalAccuracyPct !== undefined ? [['Historical Accuracy', `${selectedPillar.historicalAccuracyPct}%`]] : []),
                        ...(selectedPillar.slaInPlace !== undefined ? [['SLA in Place', selectedPillar.slaInPlace ? 'YES' : 'NO']] : []),
                        ...(selectedPillar.slaUptimePct !== undefined ? [['SLA Uptime', `${selectedPillar.slaUptimePct}%`]] : []),
                        ...(selectedPillar.slaAccuracyBps !== undefined ? [['SLA Accuracy', `${selectedPillar.slaAccuracyBps} bps`]] : []),
                        ...(selectedPillar.userDisclosureProvided !== undefined ? [['User Disclosure', selectedPillar.userDisclosureProvided ? 'YES' : 'NO']] : []),
                        ...(selectedPillar.lastOracleIncidentAt ? [['Last Oracle Incident', relTime(selectedPillar.lastOracleIncidentAt)]] : []),
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                          <span className="text-slate-500">{k}</span>
                          <span className="font-mono text-right text-slate-800 text-[11px]">{v}</span>
                        </div>
                      ))}

                      {/* Compliance flags for front-end / treasury / oracle */}
                      {selectedPillar.pillar === 'front_end_regulation' && (
                        <div className="pt-2 grid grid-cols-2 gap-1.5">
                          {[
                            ['KYC', selectedPillar.kycImplemented],
                            ['Sanctions', selectedPillar.sanctionsScreeningImplemented],
                            ['Travel Rule', selectedPillar.travelRuleImplemented],
                            ['TM', selectedPillar.transactionMonitoringImplemented],
                          ].map(([k, v]) => (
                            <Badge key={k as string} variant="outline" className={`text-[9px] justify-center ${v ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                              {k}: {v ? 'YES' : 'NO'}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {selectedPillar.pillar === 'treasury_sanctions' && (
                        <div className="pt-2 grid grid-cols-2 gap-1.5">
                          {[
                            ['Inflow Screen', selectedPillar.sanctionsScreeningTreasuryInflows],
                            ['Outflow Screen', selectedPillar.sanctionsScreeningTreasuryOutflows],
                            ['Policy Doc', selectedPillar.daoSanctionsPolicyDocumented],
                          ].map(([k, v]) => (
                            <Badge key={k as string} variant="outline" className={`text-[9px] justify-center ${v ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                              {k}: {v ? 'YES' : 'NO'}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {selectedPillar.treasuryAssetBreakdown && (
                        <div className="pt-2">
                          <p className="text-slate-500 mb-1 text-[11px]">Treasury Asset Breakdown:</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(selectedPillar.treasuryAssetBreakdown).map(([asset, pct]) => (
                              <Badge key={asset} variant="outline" className="text-[9px] font-mono text-amber-700 bg-amber-50 border-amber-200">
                                {asset}: {pct}%
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="pt-2 text-[11px] text-slate-500">
                        <FileText className="inline h-3 w-3 mr-1" />
                        Regulatory: <span className="font-mono">{selectedPillar.regulatoryReference}</span>
                      </p>
                      {selectedPillar.lastOracleIncidentDetail && (
                        <p className="pt-1 text-[11px] text-amber-700 italic">
                          <AlertTriangle className="inline h-3 w-3 mr-1" />
                          {selectedPillar.lastOracleIncidentDetail}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <BooleanActionCard rec={selectedPillar.aiRecommendation} />
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
