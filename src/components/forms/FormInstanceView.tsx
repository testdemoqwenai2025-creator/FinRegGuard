'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  PageHeader, KpiTile,
} from '@/components/shared/PageHeader'
import {
  FileCheck2, Play, RefreshCw, ChevronRight, Clock, ShieldCheck, AlertTriangle,
  Database, Zap, CheckCircle2, XCircle, Eye, Activity, Link2, Sparkles, Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { dataUrl, IS_STATIC_BUILD } from '@/lib/data'

// ─────────────────────────────────────────────────────────────
// Types (mirror Prisma models)
// ─────────────────────────────────────────────────────────────

type FormInstanceListItem = {
  id: string
  entityId: string
  entityName: string
  entityType: string
  status: string
  overallConfidence: number
  autoFilledFieldCount: number
  reviewQueueCount: number
  createdAt: string
  template: {
    slug: string
    name: string
    formType: string
    regulator: string
    jurisdiction: string
  }
  _count: {
    fieldValues: number
    reviewQueueItems: number
  }
}

type FormFieldValueDetail = {
  id: string
  fieldPath: string
  valueJson: string
  confidence: number
  confidenceBand: string
  autoFilled: boolean
  ontologyFieldName: string | null
  sourceConnector: { slug: string; name: string } | null
  provenance: {
    connectorSlug: string
    fetchedAt: string
    rawPayloadHash: string | null
    parserSlug: string
    parserVersion: string
    payloadSnippet: string | null
    payloadJsonPath: string | null
    confidenceAtCapture: number
  } | null
  reviewQueueItem: {
    id: string
    status: string
    reason: string
    assignedTeam: string
    reviewerId: string | null
    reviewerDecision: string | null
    reviewerNotes: string | null
  } | null
}

type FormInstanceDetail = {
  id: string
  entityId: string
  entityName: string
  entityType: string
  status: string
  overallConfidence: number
  autoFilledFieldCount: number
  reviewQueueCount: number
  createdAt: string
  updatedAt: string
  template: {
    id: string
    slug: string
    name: string
    formType: string
    regulator: string
    jurisdiction: string
    version: string
    description: string
    fieldSchemaJson: string
  }
  fieldValues: FormFieldValueDetail[]
  reviewQueueItems: Array<{
    id: string
    status: string
    reason: string
    assignedTeam: string
    createdAt: string
  }>
}

type ReviewQueueItem = {
  id: string
  status: string
  reason: string
  assignedTeam: string
  createdAt: string
  fieldValue: {
    id: string
    fieldPath: string
    valueJson: string
    confidence: number
    confidenceBand: string
    instance: {
      id: string
      entityId: string
      entityName: string
      template: { slug: string; name: string }
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft:         'bg-slate-100 text-slate-700 ring-slate-200',
  auto_filling:  'bg-blue-50 text-blue-700 ring-blue-200',
  in_review:     'bg-amber-50 text-amber-700 ring-amber-200',
  submitted:     'bg-emerald-50 text-emerald-700 ring-emerald-200',
  withdrawn:     'bg-slate-100 text-slate-500 ring-slate-200',
  rejected:      'bg-rose-50 text-rose-700 ring-rose-200',
}

const BAND_COLORS: Record<string, string> = {
  high:   'bg-emerald-100 text-emerald-800 ring-emerald-200',
  medium: 'bg-amber-100 text-amber-800 ring-amber-200',
  low:    'bg-rose-100 text-rose-800 ring-rose-200',
}

const REASON_LABELS: Record<string, string> = {
  low_confidence: 'Low Confidence',
  no_data:        'No Data',
  conflict:       'Source Conflict',
  sanctions_hit:  'Sanctions Hit',
  manual_flag:    'Manual Review',
}

const TEAM_LABELS: Record<string, string> = {
  KYC:        'KYC Team',
  MLRO:       'MLRO / Financial Crimes',
  Licensing:  'Licensing Team',
  Sanctions:  'Sanctions Team',
  DPO:        'Data Protection Officer',
}

const TEMPLATE_OPTIONS = [
  { slug: 'edd-form-framework', name: 'EDD (Enhanced Due Diligence)', default: true },
]

const QUICK_LOOKUPS = [
  { label: 'Binance Holdings', entityId: 'LEI:529900T8BM49AURQ' },
  { label: 'Apple Inc.', entityId: 'LEI:HWUPKR0MPOU8FGXBT394' },
  { label: 'Apple (UK)', entityId: 'CRN:03977902' },
  { label: 'Apple (SEC CIK)', entityId: 'CIK:0000320193' },
]

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export function FormInstanceView() {
  const [instances, setInstances] = useState<FormInstanceListItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<FormInstanceDetail | null>(null)
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [loadingReview, setLoadingReview] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Autofill trigger form state
  const [formSlug, setFormSlug] = useState('edd-form-framework')
  const [entityId, setEntityId] = useState('')
  const [autofilling, setAutofilling] = useState(false)
  const [autofillResult, setAutofillResult] = useState<any>(null)

  const fetchInstances = useCallback(async () => {
    setLoadingList(true)
    setError(null)
    try {
      if (IS_STATIC_BUILD) {
        // Static GitHub Pages build — read from /data/forms/instances.json
        const r = await fetch(dataUrl('forms/instances'))
        const arr = await r.json()
        setInstances(Array.isArray(arr) ? arr : [])
      } else {
        const r = await fetch('/api/forms/instances?limit=50')
        const data = await r.json()
        setInstances(data.instances || [])
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoadingList(false)
    }
  }, [])

  const fetchDetail = useCallback(async (id: string) => {
    setLoadingDetail(true)
    try {
      if (IS_STATIC_BUILD) {
        // Static build — find the requested instance in the bundled JSON.
        const r = await fetch(dataUrl('forms/instances'))
        const arr = await r.json()
        const found = Array.isArray(arr) ? arr.find((i: any) => i.id === id) : null
        setDetail(found || null)
      } else {
        const r = await fetch(`/api/forms/instances/${id}`)
        const data = await r.json()
        setDetail(data.instance)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  const fetchReviewQueue = useCallback(async () => {
    setLoadingReview(true)
    try {
      if (IS_STATIC_BUILD) {
        const r = await fetch(dataUrl('forms/review-queue'))
        const arr = await r.json()
        setReviewQueue(Array.isArray(arr) ? arr : [])
      } else {
        const r = await fetch('/api/forms/review-queue?limit=50')
        const data = await r.json()
        setReviewQueue(data.items || [])
      }
    } catch (e) {
      // Non-fatal
      console.error('Review queue fetch failed:', e)
    } finally {
      setLoadingReview(false)
    }
  }, [])

  useEffect(() => {
    fetchInstances()
    fetchReviewQueue()
  }, [fetchInstances, fetchReviewQueue])

  useEffect(() => {
    if (selectedId) fetchDetail(selectedId)
    else setDetail(null)
  }, [selectedId, fetchDetail])

  const triggerAutofill = useCallback(async () => {
    if (!entityId.trim() || !formSlug) return
    if (IS_STATIC_BUILD) {
      setError('Auto-fill is disabled on the static GitHub Pages preview — the orchestrator needs the live dev server (which has the Prisma DB + 5 connectors wired up). To try it: run `bun run dev` locally and open http://localhost:3000, or ask Alex for a live demo.')
      return
    }
    setAutofilling(true)
    setAutofillResult(null)
    setError(null)
    try {
      const r = await fetch(`/api/forms/${formSlug}/autofill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: entityId.trim(), createdBy: 'ui' }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || 'Auto-fill failed')
      } else {
        setAutofillResult(data.result)
        // Refresh instances list + select the new one
        await fetchInstances()
        if (data.result?.instanceId) {
          setSelectedId(data.result.instanceId)
        }
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setAutofilling(false)
    }
  }, [entityId, formSlug, fetchInstances])

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        zone="Core Compliance · L5-L7"
        title="Form Auto-Fill Orchestrator"
        subtitle="Recruitment-ATS-style auto-fill for compliance forms. Enter an entity ID — watch LEI / Companies House / EDGAR / OFAC / OpenCorporates populate the form in real time, with per-field provenance and a review queue for low-confidence values."
        icon={FileCheck2}
        accent="from-emerald-500 to-teal-600"
      />

      {/* KPI tiles */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Form Instances"
          value={instances.length}
          sub="Across all templates"
          icon={FileCheck2}
          tint="text-emerald-700 bg-emerald-50"
        />
        <KpiTile
          label="Pending Reviews"
          value={reviewQueue.filter((r) => r.status === 'pending').length}
          sub="Awaiting reviewer sign-off"
          icon={AlertTriangle}
          tint="text-amber-700 bg-amber-50"
        />
        <KpiTile
          label="Live Connectors"
          value={5}
          sub="LEI · CH · EDGAR · OFAC · OpenCorporates"
          icon={Database}
          tint="text-blue-700 bg-blue-50"
        />
        <KpiTile
          label="Avg Confidence"
          value={
            instances.length === 0
              ? '—'
              : `${Math.round((instances.reduce((s, i) => s + i.overallConfidence, 0) / instances.length) * 100)}%`
          }
          sub="Across all auto-filled fields"
          icon={ShieldCheck}
          tint="text-violet-700 bg-violet-50"
        />
      </div>

      {/* Autofill trigger */}
      <Card className="mt-6 border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-teal-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-emerald-600" />
            Trigger Auto-Fill
          </CardTitle>
          <CardDescription>
            Enter an entity identifier — LEI, CRN, CIK, or free-text name. The orchestrator
            resolves the right connectors, calls them in parallel, and writes FormInstance +
            FormFieldValue + FormFieldProvenance + ReviewQueueItem rows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="form-slug" className="text-xs">Form Template</Label>
              <Select value={formSlug} onValueChange={setFormSlug}>
                <SelectTrigger id="form-slug">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_OPTIONS.map((t) => (
                    <SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="entity-id" className="text-xs">Entity ID</Label>
              <Input
                id="entity-id"
                placeholder="LEI:529900T8BM49AURQ  ·  CRN:03977902  ·  CIK:0000320193  ·  Binance Holdings"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') triggerAutofill() }}
                className="font-mono text-sm"
              />
            </div>
            <Button
              onClick={triggerAutofill}
              disabled={autofilling || !entityId.trim()}
              className="gap-1.5"
            >
              {autofilling ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Auto-filling...</>
              ) : (
                <><Play className="h-4 w-4" /> Run Auto-Fill</>
              )}
            </Button>
          </div>

          {/* Quick lookup chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-[11px] text-slate-500">Quick lookups:</span>
            {QUICK_LOOKUPS.map((q) => (
              <button
                key={q.entityId}
                onClick={() => setEntityId(q.entityId)}
                className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[11px] text-emerald-700 hover:bg-emerald-50"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Live autofill result */}
          {autofillResult && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-900">
                  Auto-fill completed in {autofillResult.durationMs}ms
                </span>
                <Badge variant="outline" className={cn(
                  'ml-auto',
                  autofillResult.status === 'success' && 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                  autofillResult.status === 'partial' && 'bg-amber-50 text-amber-700 ring-amber-200',
                  autofillResult.status === 'failure' && 'bg-rose-50 text-rose-700 ring-rose-200',
                )}>
                  {autofillResult.status.toUpperCase()}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Auto-filled" value={`${autofillResult.autoFilledFields}/${autofillResult.totalFields}`} />
                <Stat label="Review Queue" value={autofillResult.reviewQueueItems} />
                <Stat label="Overall Conf." value={`${Math.round(autofillResult.overallConfidence * 100)}%`} />
                <Stat label="Entity Name" value={autofillResult.entityName} />
              </div>
              {/* Connector run summary */}
              {autofillResult.connectorRuns?.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Connector Runs
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {autofillResult.connectorRuns.map((cr: any) => (
                      <TooltipProvider key={cr.connectorSlug}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className={cn(
                                'gap-1',
                                cr.success ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                                'bg-rose-50 text-rose-700 ring-rose-200',
                              )}
                            >
                              {cr.success ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                              {cr.connectorSlug}
                              <span className="font-mono text-[10px] opacity-70">{cr.latencyMs}ms</span>
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-md">
                            <div className="space-y-0.5 text-xs">
                              <div><strong>{cr.connectorName}</strong></div>
                              <div>Status: {cr.status} · HTTP {cr.httpStatus}</div>
                              <div>Records: {cr.recordsPulled} · Fields: {cr.fieldsReturned}</div>
                              {cr.errorMessage && <div className="text-rose-600">Error: {cr.errorMessage}</div>}
                              <div className="font-mono text-[10px] text-slate-400">{cr.endpointCalled}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <XCircle className="mr-1 inline h-4 w-4" /> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Instances | Review Queue */}
      <Tabs defaultValue="instances" className="mt-6">
        <TabsList>
          <TabsTrigger value="instances" className="gap-1.5">
            <FileCheck2 className="h-3.5 w-3.5" />
            Form Instances ({instances.length})
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Review Queue ({reviewQueue.length})
          </TabsTrigger>
        </TabsList>

        {/* ─── Instances tab ─── */}
        <TabsContent value="instances" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
            {/* Instance list */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Instances</CardTitle>
                  <Button variant="ghost" size="sm" onClick={fetchInstances} disabled={loadingList}>
                    <RefreshCw className={cn('h-3.5 w-3.5', loadingList && 'animate-spin')} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingList ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                  </div>
                ) : instances.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    No form instances yet. Run auto-fill above to create one.
                  </div>
                ) : (
                  <div className="max-h-[600px] space-y-1 overflow-y-auto p-2">
                    {instances.map((inst) => (
                      <button
                        key={inst.id}
                        onClick={() => setSelectedId(inst.id)}
                        className={cn(
                          'w-full rounded-lg border p-3 text-left transition-all',
                          selectedId === inst.id
                            ? 'border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-200'
                            : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50',
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {inst.entityName || inst.entityId}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                              {inst.template.formType} · {inst.template.regulator}
                            </p>
                          </div>
                          <Badge variant="outline" className={cn('shrink-0', STATUS_COLORS[inst.status] || '')}>
                            {inst.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-0.5">
                            <ShieldCheck className="h-3 w-3" />
                            {Math.round(inst.overallConfidence * 100)}%
                          </span>
                          <span className="flex items-center gap-0.5">
                            <CheckCircle2 className="h-3 w-3" />
                            {inst.autoFilledFieldCount} fields
                          </span>
                          {inst.reviewQueueCount > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-700">
                              <AlertTriangle className="h-3 w-3" />
                              {inst.reviewQueueCount} review
                            </span>
                          )}
                          <span className="ml-auto font-mono text-[10px]">
                            {new Date(inst.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instance detail */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  {detail ? 'Field Values & Provenance' : 'Select an instance'}
                </CardTitle>
                <CardDescription>
                  {detail ? (
                    <>
                      <span className="font-mono text-xs">{detail.entityId}</span>
                      {' · '}
                      <span>{detail.template.name} v{detail.template.version}</span>
                    </>
                  ) : (
                    'Click an instance on the left to view its field values, provenance, and review queue items.'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDetail ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
                    ))}
                  </div>
                ) : !detail ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    <FileCheck2 className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    No instance selected
                  </div>
                ) : (
                  <FieldValueList detail={detail} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Review queue tab ─── */}
        <TabsContent value="review" className="mt-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Review Queue — Low-Confidence Fields</CardTitle>
                <Button variant="ghost" size="sm" onClick={fetchReviewQueue} disabled={loadingReview}>
                  <RefreshCw className={cn('h-3.5 w-3.5', loadingReview && 'animate-spin')} />
                </Button>
              </div>
              <CardDescription>
                Fields routed here have confidence below the FieldOntology threshold, or are
                sanctions hits, or have no data from any connector. Reviewer should approve,
                edit, or reject each item.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingReview ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
                  ))}
                </div>
              ) : reviewQueue.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
                  Review queue is empty
                </div>
              ) : (
                <div className="space-y-2">
                  {reviewQueue.map((item) => (
                    <ReviewQueueRow key={item.id} item={item} onSelectInstance={(id) => { setSelectedId(id) }} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Architecture footer */}
      <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 text-emerald-600" />
          <div className="text-xs text-slate-600">
            <strong className="text-slate-900">7-Layer Stack (Phase 1 Commit 2 — L5/L6/L7 live):</strong>{' '}
            L1 Connector Registry (5 connectors) → L2 Parsers (canonical JSON) → L3 Field Ontology (12 fields) →
            L4 Form Template (EDD, 13 fields) → <strong className="text-emerald-700">L5 Orchestrator (this view)</strong>{' '}
            → <strong className="text-emerald-700">L6 Provenance (FormFieldProvenance rows — click any field to inspect)</strong>{' '}
            → <strong className="text-emerald-700">L7 Review Queue (low-confidence fields auto-routed)</strong>.
            Every field value traces back to a ConnectorRun row with raw payload hash, parser version, and timestamp —
            the artifact a regulator examiner wants to see.
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-slate-50 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900 truncate">{value}</div>
    </div>
  )
}

function FieldValueList({ detail }: { detail: FormInstanceDetail }) {
  const [provenanceFor, setProvenanceFor] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      {/* Field-by-field table */}
      {detail.fieldValues.map((fv) => {
        const isOpen = provenanceFor === fv.id
        const value = safeParseJson(fv.valueJson)
        const valueStr = formatValue(value)
        return (
          <div
            key={fv.id}
            className={cn(
              'rounded-lg border p-3 transition-all',
              fv.reviewQueueItem
                ? 'border-amber-200 bg-amber-50/30'
                : fv.autoFilled
                                  ? 'border-slate-200 bg-white'
                                  : 'border-slate-100 bg-slate-50/50',
            )}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium text-slate-700">{fv.fieldPath}</span>
                  {fv.autoFilled ? (
                    <Badge variant="outline" className={cn('h-4 px-1 text-[10px]', BAND_COLORS[fv.confidenceBand] || '')}>
                      {fv.confidenceBand} · {Math.round(fv.confidence * 100)}%
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="h-4 px-1 text-[10px] bg-slate-100 text-slate-600 ring-slate-200">
                      manual
                    </Badge>
                  )}
                  {fv.reviewQueueItem && (
                    <Badge variant="outline" className="h-4 px-1 text-[10px] bg-amber-100 text-amber-800 ring-amber-200">
                      <AlertTriangle className="mr-0.5 h-2.5 w-2.5" />
                      {REASON_LABELS[fv.reviewQueueItem.reason] || fv.reviewQueueItem.reason}
                    </Badge>
                  )}
                  {fv.sourceConnector && (
                    <Badge variant="outline" className="h-4 px-1 text-[10px] bg-blue-50 text-blue-700 ring-blue-200">
                      <Link2 className="mr-0.5 h-2.5 w-2.5" />
                      {fv.sourceConnector.slug}
                    </Badge>
                  )}
                </div>
                <div className="mt-1 text-sm text-slate-900">
                  {valueStr ? (
                    <span className="font-mono">{valueStr}</span>
                  ) : (
                    <span className="italic text-slate-400">no value</span>
                  )}
                </div>
              </div>
              {fv.provenance && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setProvenanceFor(isOpen ? null : fv.id)}
                  className="h-6 px-2 text-[11px]"
                >
                  <Eye className="mr-1 h-3 w-3" />
                  {isOpen ? 'Hide' : 'Provenance'}
                  <ChevronRight className={cn('ml-0.5 h-3 w-3 transition-transform', isOpen && 'rotate-90')} />
                </Button>
              )}
            </div>

            {/* Provenance drawer */}
            {isOpen && fv.provenance && (
              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50/80 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <ProvenanceField label="Connector" value={fv.provenance.connectorSlug} />
                  <ProvenanceField label="Parser" value={`${fv.provenance.parserSlug} v${fv.provenance.parserVersion}`} />
                  <ProvenanceField label="Fetched At" value={new Date(fv.provenance.fetchedAt).toLocaleString()} />
                  <ProvenanceField
                    label="Confidence at Capture"
                    value={`${Math.round(fv.provenance.confidenceAtCapture * 100)}%`}
                  />
                  <ProvenanceField
                    label="Raw Payload Hash"
                    value={fv.provenance.rawPayloadHash || '—'}
                    mono
                  />
                  <ProvenanceField
                    label="JSON Path"
                    value={fv.provenance.payloadJsonPath || '—'}
                    mono
                  />
                </div>
                {fv.provenance.payloadSnippet && (
                  <div className="mt-2">
                    <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">
                      Raw Payload Snippet (first 500 chars)
                    </p>
                    <pre className="max-h-32 overflow-auto rounded bg-slate-900 p-2 text-[10px] text-slate-100">
                      {fv.provenance.payloadSnippet}
                    </pre>
                  </div>
                )}
                {fv.reviewQueueItem && (
                  <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs">
                    <strong>Review Queue Item:</strong>{' '}
                    Status: {fv.reviewQueueItem.status} ·{' '}
                    Team: {TEAM_LABELS[fv.reviewQueueItem.assignedTeam] || fv.reviewQueueItem.assignedTeam}
                    {fv.reviewQueueItem.reviewerId && ` · Reviewer: ${fv.reviewQueueItem.reviewerId}`}
                    {fv.reviewQueueItem.reviewerDecision && ` · Decision: ${fv.reviewQueueItem.reviewerDecision}`}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Review queue summary */}
      {detail.reviewQueueItems.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/40 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-900">
              {detail.reviewQueueItems.length} review queue item{detail.reviewQueueItems.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="mt-1 text-xs text-amber-700">
            Reviewer action required before form can be submitted. Each item is routed to the
            appropriate team based on form type ({detail.template.formType} →{' '}
            {TEAM_LABELS[
              detail.reviewQueueItems[0]?.assignedTeam
            ] || detail.reviewQueueItems[0]?.assignedTeam}).
          </p>
        </div>
      )}
    </div>
  )
}

function ProvenanceField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn('text-xs text-slate-800 break-all', mono && 'font-mono')}>{value}</p>
    </div>
  )
}

function ReviewQueueRow({
  item,
  onSelectInstance,
}: {
  item: ReviewQueueItem
  onSelectInstance: (id: string) => void
}) {
  const value = safeParseJson(item.fieldValue.valueJson)
  return (
    <button
      onClick={() => onSelectInstance(item.fieldValue.instance.id)}
      className="w-full rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-left transition-all hover:border-amber-300 hover:bg-amber-50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-medium text-slate-700">
              {item.fieldValue.instance.template.name}
            </span>
            <Badge variant="outline" className="h-4 px-1 text-[10px] bg-amber-100 text-amber-800 ring-amber-200">
              {REASON_LABELS[item.reason] || item.reason}
            </Badge>
            <Badge variant="outline" className="h-4 px-1 text-[10px] bg-slate-100 text-slate-700 ring-slate-200">
              {TEAM_LABELS[item.assignedTeam] || item.assignedTeam}
            </Badge>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-slate-900">
            {item.fieldValue.instance.entityName}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            Field: <span className="font-mono">{item.fieldValue.fieldPath}</span> · Confidence:{' '}
            {Math.round(item.fieldValue.confidence * 100)}%
          </p>
          {formatValue(value) && (
            <p className="mt-0.5 truncate text-[11px] text-slate-400">
              Current value: <span className="font-mono">{formatValue(value)}</span>
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <Badge variant="outline" className="h-4 px-1 text-[10px] bg-slate-100 text-slate-600 ring-slate-200">
            {item.status}
          </Badge>
          <p className="mt-1 text-[10px] text-slate-400">
            {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function safeParseJson(s: string): unknown {
  try { return JSON.parse(s) } catch { return s }
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v.length > 80 ? v.slice(0, 80) + '…' : v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]'
    // For arrays of objects, show count + first item
    if (typeof v[0] === 'object' && v[0] !== null) {
      return `[${v.length} item${v.length === 1 ? '' : 's'}] — ${JSON.stringify(v[0]).slice(0, 60)}…`
    }
    return JSON.stringify(v).slice(0, 100)
  }
  if (typeof v === 'object') {
    const json = JSON.stringify(v)
    return json.length > 100 ? json.slice(0, 100) + '…' : json
  }
  return String(v)
}
