'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, TrendingUp, Activity, Cpu, ArrowRight } from 'lucide-react'
import { BooleanActionCard, type AIRec } from '@/components/shared/BooleanAction'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'
import { dataUrl } from '@/lib/data'

type Era = {
  id: string
  era: string
  name: string
  format: string
  description: string
  regulatorsAdopted: string[]
  regulatorsCount: number
  adoptionRate: number
  submissionLatencyDays: number
  xbrlTaxonomyVersion: string | null
  machineReadable: boolean
  automationLevel: string
  keyStandards: string[]
  evidenceRetention: string
  aiRecommendation: AIRec
}

type EvData = {
  eras: Era[]
  total: number
  summary: {
    eras: number
    currentEra: string
    avgAdoptionRate: number
    currentLatencyMinutes: number
    machineReadableEras: number
    streamingAdopters: number
    trajectory: string
  }
}

const formatTint: Record<string, string> = {
  'paper-pdf': 'text-stone-700 bg-stone-100 border-stone-200',
  'structured-pdf': 'text-amber-700 bg-amber-50 border-amber-200',
  'xbrl': 'text-blue-700 bg-blue-50 border-blue-200',
  'api': 'text-violet-700 bg-violet-50 border-violet-200',
  'streaming': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'continuous-assurance': 'text-cyan-700 bg-cyan-50 border-cyan-200',
  'autonomous': 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200',
}

const formatIcon: Record<string, typeof FileText> = {
  'paper-pdf': FileText,
  'structured-pdf': FileText,
  'xbrl': FileText,
  'api': Cpu,
  'streaming': Activity,
  'continuous-assurance': Activity,
  'autonomous': Cpu,
}

function fmtLatency(days: number): string {
  if (days === 0) return 'real-time'
  if (days < 1) return `${Math.round(days * 24 * 60)} min`
  if (days < 7) return `${Math.round(days)} day(s)`
  return `${Math.round(days)} days`
}

export function ReportingEvolutionView() {
  const [data, setData] = useState<EvData | null>(null)
  const [selected, setSelected] = useState<Era | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(dataUrl('reporting-evolution'))
      .then(r => r.json())
      .then(d => {
        setData(d)
        // Default to the current era (2024-2026 streaming)
        const current = d.eras?.find((e: Era) => e.era === '2024-2026') ?? d.eras?.[0]
        setSelected(current ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) return <div className="p-6"><div className="h-96 animate-pulse rounded-xl bg-slate-100" /></div>

  const s = data.summary

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Intelligence & Automation"
        title="Machine-Readable Reporting Evolution"
        subtitle="From paper/PDF (2010) to real-time streaming (2024-2030). Tracking regulator adoption of XBRL taxonomies, API-based submission, streaming architectures, and the path to continuous assurance and autonomous compliance."
        icon={TrendingUp}
        accent="from-blue-500 to-indigo-600"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile label="Eras Tracked" value={s.eras} sub="2010 to 2030+" icon={TrendingUp} tint="text-blue-700 bg-blue-50" />
        <KpiTile label="Avg Adoption" value={`${s.avgAdoptionRate}%`} sub="across all eras" icon={Activity} tint="text-emerald-700 bg-emerald-50" />
        <KpiTile label="Streaming Latency" value={`${s.currentLatencyMinutes} min`} sub="current era target" icon={Cpu} tint="text-violet-700 bg-violet-50" />
        <KpiTile label="Machine-Readable" value={`${s.machineReadableEras}/${s.eras}`} sub="eras with structured data" icon={FileText} tint="text-amber-700 bg-amber-50" />
      </div>

      {/* Trajectory banner */}
      <Card className="border-blue-200/60 bg-gradient-to-br from-blue-50/40 to-indigo-50/40">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Trajectory:</span>
            {data.eras.map((e, i) => {
              const Icon = formatIcon[e.format] ?? FileText
              const isCurrent = e.era === s.currentEra
              return (
                <div key={e.id} className="flex items-center gap-2">
                  <button
                    onClick={() => setSelected(e)}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      isCurrent
                        ? 'border-blue-400 bg-blue-100 text-blue-800'
                        : selected?.id === e.id
                          ? 'border-slate-400 bg-slate-100 text-slate-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {e.era}
                  </button>
                  {i < data.eras.length - 1 && <ArrowRight className="h-3 w-3 text-slate-400" />}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Era registry */}
        <Card className="lg:col-span-3 border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Reporting Eras — adoption progression
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[640px]">
              {data.eras.map(e => {
                const Icon = formatIcon[e.format] ?? FileText
                const isSelected = selected?.id === e.id
                const isCurrent = e.era === s.currentEra
                return (
                  <button key={e.id} onClick={() => setSelected(e)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 p-3 text-left hover:bg-slate-50 ${isSelected ? 'bg-blue-50/40' : ''}`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white border border-slate-200">
                      <Icon className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500">{e.era}</span>
                        <Badge variant="outline" className={`text-[9px] ${formatTint[e.format] ?? 'text-slate-600'}`}>
                          {e.format}
                        </Badge>
                        {isCurrent && (
                          <Badge variant="outline" className="text-[9px] border-blue-300 bg-blue-50 text-blue-700">
                            CURRENT
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-slate-700">{e.name}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {e.regulatorsCount} regulators · {e.adoptionRate}% adoption · {fmtLatency(e.submissionLatencyDays)} latency
                      </p>
                      {/* Adoption bar */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full ${e.adoptionRate > 60 ? 'bg-emerald-500' : e.adoptionRate > 30 ? 'bg-amber-400' : 'bg-rose-400'}`}
                            style={{ width: `${Math.max(2, e.adoptionRate)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{e.adoptionRate}%</span>
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
                    <FileText className="h-4 w-4 text-blue-600" />
                    {selected.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {[
                    ['Era', selected.era],
                    ['Format', selected.format],
                    ['Automation Level', selected.automationLevel],
                    ['Machine-Readable', selected.machineReadable ? 'yes' : 'no'],
                    ['Submission Latency', fmtLatency(selected.submissionLatencyDays)],
                    ['Adoption Rate', `${selected.adoptionRate}%`],
                    ['Regulators Adopted', `${selected.regulatorsCount}`],
                    ['XBRL Taxonomy', selected.xbrlTaxonomyVersion ?? 'n/a'],
                    ['Evidence Retention', selected.evidenceRetention],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-slate-50 pb-1.5">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono text-right text-slate-800">{v}</span>
                    </div>
                  ))}
                  <div className="pt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Adopted by</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.regulatorsAdopted.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">No adopters yet (future era)</span>
                      ) : (
                        selected.regulatorsAdopted.map(r => (
                          <Badge key={r} variant="outline" className="text-[9px] text-slate-600">{r}</Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Key Standards</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.keyStandards.map(std => (
                        <Badge key={std} variant="outline" className="text-[9px] font-mono text-slate-600">{std}</Badge>
                      ))}
                    </div>
                  </div>
                  <p className="pt-2 text-slate-600">{selected.description}</p>
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
