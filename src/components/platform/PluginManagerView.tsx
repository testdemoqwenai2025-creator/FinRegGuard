'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Puzzle,
  Star,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Tag,
  Sparkles,
  History,
  Globe,
  ShieldCheck,
} from 'lucide-react'
import { dataUrl, IS_STATIC_BUILD } from '@/lib/data'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'
import { DriftBell } from '@/components/platform/DriftBell'
import { cn } from '@/lib/utils'

// ─── Types (mirror of RegistryPlugin from src/lib/plugins/registry.ts) ───
type PluginCategory = 'form' | 'label' | 'feature' | 'document'
type PluginSourceType = 'web' | 'template' | 'api' | 'github' | 'rss'

interface RegistryPlugin {
  id: string
  slug: string
  name: string
  description: string
  category: PluginCategory
  jurisdiction: string
  regulator?: string
  version: string
  sourceUrl: string
  sourceType: PluginSourceType
  schemaJson?: Record<string, unknown>
  defaultFieldsJson?: Record<string, unknown>
  tags: string[]
  enabled: boolean
  isDefault: boolean
  lastRefreshedAt: string | null
  enabledAt: string | null
  hasTemplate: boolean
  templateFetchStatus?: number
  templateFetchedAt?: string | null
}

interface RegistryStats {
  total: number
  enabled: number
  defaultCount: number
  withTemplates: number
  byCategory: Record<string, { total: number; enabled: number }>
  byJurisdiction: Record<string, { total: number; enabled: number }>
}

interface PluginDetail extends RegistryPlugin {
  template?: {
    rawContent: string
    contentType: string | null
    contentHash: string
    fetchStatus: number
    fetchError: string | null
    fetchedAt: string
    parsedFieldsJson?: string | null
  } | null
  history?: Array<{
    id: string
    action: string
    actor: string
    notes: string | null
    createdAt: string
  }>
}

const CATEGORY_META: Record<
  PluginCategory,
  { label: string; icon: typeof FileText; tint: string; accent: string }
> = {
  form: {
    label: 'Forms',
    icon: FileText,
    tint: 'text-blue-700 bg-blue-50 border-blue-200',
    accent: 'from-blue-500 to-cyan-600',
  },
  label: {
    label: 'Labels',
    icon: Tag,
    tint: 'text-violet-700 bg-violet-50 border-violet-200',
    accent: 'from-violet-500 to-purple-600',
  },
  feature: {
    label: 'Features',
    icon: Sparkles,
    tint: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    accent: 'from-emerald-500 to-teal-600',
  },
  document: {
    label: 'Documents',
    icon: FileText,
    tint: 'text-amber-700 bg-amber-50 border-amber-200',
    accent: 'from-amber-500 to-orange-600',
  },
}

const JURISDICTION_COLORS: Record<string, string> = {
  US: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
  EU: 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300',
  UK: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
  SG: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  HK: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  JP: 'bg-pink-100 text-pink-800 dark:bg-pink-950/50 dark:text-pink-300',
  CA: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
  AU: 'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300',
  GLOBAL: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
}

export function PluginManagerView() {
  const [plugins, setPlugins] = useState<RegistryPlugin[]>([])
  const [stats, setStats] = useState<RegistryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<PluginCategory | 'all'>('all')
  const [jurisdiction, setJurisdiction] = useState<string>('all')

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [detail, setDetail] = useState<PluginDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [actionInFlight, setActionInFlight] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null)

  // ─── Initial load ───
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(dataUrl('plugins'))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { plugins: RegistryPlugin[]; stats: RegistryStats }
      setPlugins(data.plugins ?? [])
      setStats(data.stats ?? null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // ─── Helpers ───
  const showToast = useCallback((msg: string, kind: 'ok' | 'err' = 'ok') => {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const apiBase = IS_STATIC_BUILD ? '' : '' // POSTs always go to /api/plugins (dev only)

  // ─── Actions ───
  const handleToggle = useCallback(
    async (plugin: RegistryPlugin, next: boolean) => {
      // Optimistic update
      setPlugins((prev) =>
        prev.map((p) =>
          p.id === plugin.id
            ? { ...p, enabled: next, enabledAt: next ? new Date().toISOString() : null }
            : p,
        ),
      )

      if (IS_STATIC_BUILD) {
        showToast(
          next
            ? `Enabled "${plugin.name}" (preview only — backend toggling requires dev mode)`
            : `Disabled "${plugin.name}" (preview only)`,
          'ok',
        )
        return
      }

      setActionInFlight(plugin.id)
      try {
        const res = await fetch(`${apiBase}/api/plugins/${plugin.id}/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: next, actor: 'user' }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (next && data.template) {
          showToast(
            data.template.ok
              ? `Enabled "${plugin.name}" — template auto-filled (${data.template.result?.contentLength ?? 0} bytes from source)`
              : `Enabled "${plugin.name}" — template fetch failed: ${data.template.result?.error}`,
            data.template.ok ? 'ok' : 'err',
          )
        } else {
          showToast(`${next ? 'Enabled' : 'Disabled'} "${plugin.name}"`, 'ok')
        }
        // Reload to pick up template status changes
        load()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        showToast(`Toggle failed: ${msg}`, 'err')
        // Rollback
        setPlugins((prev) =>
          prev.map((p) => (p.id === plugin.id ? { ...p, enabled: !next } : p)),
        )
      } finally {
        setActionInFlight(null)
      }
    },
    [apiBase, load, showToast],
  )

  const handleDefault = useCallback(
    async (plugin: RegistryPlugin, next: boolean) => {
      setPlugins((prev) =>
        prev.map((p) => {
          if (p.id === plugin.id) return { ...p, isDefault: next }
          // Clear isDefault on siblings (same category+jurisdiction)
          if (
            next &&
            p.category === plugin.category &&
            p.jurisdiction === plugin.jurisdiction
          ) {
            return { ...p, isDefault: false }
          }
          return p
        }),
      )

      if (IS_STATIC_BUILD) {
        showToast(
          next ? `"${plugin.name}" set as default (preview only)` : `Default cleared (preview only)`,
          'ok',
        )
        return
      }

      setActionInFlight(`${plugin.id}-default`)
      try {
        const res = await fetch(`${apiBase}/api/plugins/${plugin.id}/default`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isDefault: next, actor: 'user' }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        showToast(
          next ? `"${plugin.name}" is now the default for ${plugin.category}/${plugin.jurisdiction}` : `Default cleared`,
          'ok',
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        showToast(`Set-default failed: ${msg}`, 'err')
        // Rollback by reloading
        load()
      } finally {
        setActionInFlight(null)
      }
    },
    [apiBase, load, showToast],
  )

  const handleRefresh = useCallback(
    async (plugin: RegistryPlugin) => {
      if (IS_STATIC_BUILD) {
        showToast(`Refresh not available in preview mode (requires dev backend)`, 'err')
        return
      }
      setActionInFlight(`${plugin.id}-refresh`)
      try {
        const res = await fetch(`${apiBase}/api/plugins/${plugin.id}/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor: 'user' }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const r = data.result
        showToast(
          r?.ok
            ? `Refreshed "${plugin.name}" — ${r.contentLength} bytes · hash ${r.contentHash?.slice(0, 10) ?? ''}…`
            : `Refresh failed: ${r?.error}`,
          r?.ok ? 'ok' : 'err',
        )
        load()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        showToast(`Refresh failed: ${msg}`, 'err')
      } finally {
        setActionInFlight(null)
      }
    },
    [apiBase, load, showToast],
  )

  const handleOpenDetail = useCallback(async (plugin: RegistryPlugin) => {
    setSelectedSlug(plugin.slug)
    setDetailLoading(true)
    setDetail(null)
    try {
      if (IS_STATIC_BUILD) {
        // In static mode, just use the in-memory plugin as the detail source
        setDetail({ ...plugin, template: null, history: [] })
      } else {
        const res = await fetch(`${apiBase}/api/plugins/${plugin.id}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setDetail(data.plugin as PluginDetail)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      showToast(`Failed to load detail: ${msg}`, 'err')
    } finally {
      setDetailLoading(false)
    }
  }, [apiBase, showToast])

  // ─── Derived: filtered plugin list ───
  const filtered = useMemo(() => {
    return plugins.filter((p) => {
      if (category !== 'all' && p.category !== category) return false
      if (jurisdiction !== 'all' && p.jurisdiction !== jurisdiction) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const haystack = `${p.name} ${p.description} ${p.tags.join(' ')} ${p.regulator ?? ''} ${p.slug}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [plugins, category, jurisdiction, search])

  // ─── Render ───
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <PageHeader
          zone="Platform & Governance"
          title="Plugin Manager"
          subtitle="DeepSeek-style registry of regulatory forms, labels, features, and document templates — load from web, toggle on/off, auto-fill from authoritative sources."
          icon={Puzzle}
          accent="from-slate-700 to-gray-800"
        />
        <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
          <p className="font-semibold">Failed to load plugin registry</p>
          <p className="mt-1 opacity-80">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={load}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <PageHeader
            zone="Platform & Governance"
            title="Plugin Manager"
            subtitle="DeepSeek-style registry of regulatory forms, labels, features, and document templates — load from web, toggle on/off, auto-fill from authoritative sources."
            icon={Puzzle}
            accent="from-slate-700 to-gray-800"
          />
        </div>
        <DriftBell />
      </div>

      {IS_STATIC_BUILD && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          <strong>Preview mode:</strong> Plugin toggles are simulated client-side. Run the dev backend to enable real template auto-fill from regulator websites.
        </div>
      )}

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Total Plugins"
          value={stats?.total ?? 0}
          sub="across 4 categories"
          icon={Puzzle}
          tint="text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300"
        />
        <KpiTile
          label="Enabled"
          value={stats?.enabled ?? 0}
          sub={`${Math.round(((stats?.enabled ?? 0) / Math.max(stats?.total ?? 1, 1)) * 100)}% of registry`}
          icon={CheckCircle2}
          tint="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300"
        />
        <KpiTile
          label="Defaults"
          value={stats?.defaultCount ?? 0}
          sub="one per category/jurisdiction"
          icon={Star}
          tint="text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300"
        />
        <KpiTile
          label="Templates Cached"
          value={stats?.withTemplates ?? 0}
          sub="auto-filled from source"
          icon={ShieldCheck}
          tint="text-violet-700 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300"
        />
      </div>

      {/* Filter bar */}
      <Card className="border-border bg-background">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Tabs value={category} onValueChange={(v) => setCategory(v as PluginCategory | 'all')}>
              <TabsList>
                <TabsTrigger value="all">All ({stats?.total ?? 0})</TabsTrigger>
                <TabsTrigger value="form">
                  Forms ({stats?.byCategory?.form?.total ?? 0})
                </TabsTrigger>
                <TabsTrigger value="label">
                  Labels ({stats?.byCategory?.label?.total ?? 0})
                </TabsTrigger>
                <TabsTrigger value="feature">
                  Features ({stats?.byCategory?.feature?.total ?? 0})
                </TabsTrigger>
                <TabsTrigger value="document">
                  Docs ({stats?.byCategory?.document?.total ?? 0})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search plugins…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <Select value={jurisdiction} onValueChange={setJurisdiction}>
                <SelectTrigger className="w-32 h-9">
                  <Globe className="mr-1 h-3.5 w-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jurisdictions</SelectItem>
                  {Object.keys(stats?.byJurisdiction ?? {}).sort().map((j) => (
                    <SelectItem key={j} value={j}>
                      {j} ({stats?.byJurisdiction?.[j]?.total ?? 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plugin cards grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            No plugins match the current filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <PluginCard
              key={p.id}
              plugin={p}
              onToggle={handleToggle}
              onDefault={handleDefault}
              onRefresh={handleRefresh}
              onOpenDetail={handleOpenDetail}
              inFlight={
                actionInFlight === p.id ||
                actionInFlight === `${p.id}-default` ||
                actionInFlight === `${p.id}-refresh`
              }
            />
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog
        open={!!selectedSlug}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSlug(null)
            setDetail(null)
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {detail && (
                <>
                  {(() => {
                    const meta = CATEGORY_META[detail.category]
                    const Icon = meta.icon
                    return (
                      <span className={cn('flex h-7 w-7 items-center justify-center rounded-md', meta.tint)}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    )
                  })()}
                  {detail.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {detail?.slug} · v{detail?.version} · {detail?.regulator ?? 'No regulator'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {detailLoading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading…</div>
            ) : detail ? (
              <div className="space-y-4 p-1">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Description
                  </p>
                  <p className="text-sm text-foreground">{detail.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="font-semibold uppercase tracking-wider text-muted-foreground mb-1">Source URL</p>
                    <a
                      href={detail.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline break-all"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">{detail.sourceUrl}</span>
                    </a>
                  </div>
                  <div>
                    <p className="font-semibold uppercase tracking-wider text-muted-foreground mb-1">Source Type</p>
                    <Badge variant="outline" className="text-[10px]">{detail.sourceType}</Badge>
                  </div>
                </div>

                {detail.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {detail.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {detail.schemaJson && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Schema</p>
                    <pre className="rounded-md border border-border bg-muted p-3 text-[11px] overflow-x-auto max-h-40 dark:bg-muted/40">
                      {JSON.stringify(detail.schemaJson, null, 2)}
                    </pre>
                  </div>
                )}

                {detail.defaultFieldsJson && Object.keys(detail.defaultFieldsJson).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Default Fields (auto-fill values)
                    </p>
                    <pre className="rounded-md border border-border bg-muted p-3 text-[11px] overflow-x-auto max-h-40 dark:bg-muted/40">
                      {JSON.stringify(detail.defaultFieldsJson, null, 2)}
                    </pre>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Template Cache
                  </p>
                  {detail.template ? (
                    <div className="rounded-md border border-border bg-muted/40 p-3 space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        {detail.template.fetchStatus === 200 ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                        )}
                        <span className="font-mono">{detail.template.fetchStatus}</span>
                        <span className="text-muted-foreground">{detail.template.contentType}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{detail.template.rawContent.length} bytes</span>
                      </div>
                      {detail.template.fetchError && (
                        <p className="text-rose-600 dark:text-rose-400">{detail.template.fetchError}</p>
                      )}
                      <p className="text-muted-foreground">
                        Fetched: {new Date(detail.template.fetchedAt).toLocaleString()}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground break-all">
                        SHA-256: {detail.template.contentHash}
                      </p>
                      {detail.template.rawContent && (
                        <pre className="mt-2 max-h-32 overflow-auto rounded bg-background p-2 text-[10px] border border-border">
                          {detail.template.rawContent.slice(0, 2048)}
                          {detail.template.rawContent.length > 2048 ? '\n…[truncated]' : ''}
                        </pre>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No cached template. Click "Refresh" to fetch from source.
                    </p>
                  )}
                </div>

                {detail.history && detail.history.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                      <History className="h-3 w-3" /> Toggle History (last {detail.history.length})
                    </p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {detail.history.map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-[11px]"
                        >
                          <Badge
                            variant="outline"
                            className="text-[9px] py-0 px-1.5"
                          >
                            {h.action}
                          </Badge>
                          <span className="text-muted-foreground">{h.actor}</span>
                          <span className="text-muted-foreground ml-auto">
                            {new Date(h.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-sm text-muted-foreground">No data.</div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-4 right-4 z-50 rounded-lg border px-4 py-2.5 text-sm shadow-lg max-w-sm',
            toast.kind === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/80 dark:text-emerald-100'
              : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/80 dark:text-rose-100',
          )}
          role="status"
          aria-live="polite"
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ─── Plugin Card ───
function PluginCard({
  plugin,
  onToggle,
  onDefault,
  onRefresh,
  onOpenDetail,
  inFlight,
}: {
  plugin: RegistryPlugin
  onToggle: (p: RegistryPlugin, next: boolean) => void
  onDefault: (p: RegistryPlugin, next: boolean) => void
  onRefresh: (p: RegistryPlugin) => void
  onOpenDetail: (p: RegistryPlugin) => void
  inFlight: boolean
}) {
  const meta = CATEGORY_META[plugin.category]
  const Icon = meta.icon
  const jurisdictionTint = JURISDICTION_COLORS[plugin.jurisdiction] ?? JURISDICTION_COLORS.GLOBAL

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all hover:shadow-md',
        plugin.enabled
          ? 'border-emerald-300 bg-gradient-to-br from-emerald-50/40 to-background dark:border-emerald-900/50 dark:from-emerald-950/20'
          : 'border-border bg-background',
      )}
    >
      {/* Default ribbon */}
      {plugin.isDefault && (
        <div className="absolute right-0 top-0 bg-gradient-to-l from-amber-400 to-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-950">
          Default
        </div>
      )}

      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start gap-2.5">
          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', meta.tint)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm leading-tight">{plugin.name}</CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                  jurisdictionTint,
                )}
              >
                {plugin.jurisdiction}
              </span>
              {plugin.regulator && (
                <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {plugin.regulator}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">v{plugin.version}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3 pt-1">
        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
          {plugin.description}
        </p>

        {/* Source link */}
        <a
          href={plugin.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3 w-3" />
          <span className="truncate max-w-[180px]">{plugin.sourceType} source</span>
        </a>

        {/* Template status badge */}
        <div className="mt-2 flex items-center gap-2 text-[10px]">
          {plugin.hasTemplate ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-muted-foreground">
                Template cached
                {plugin.templateFetchStatus && plugin.templateFetchStatus !== 200 && (
                  <span className="ml-1 text-rose-600 dark:text-rose-400">({plugin.templateFetchStatus})</span>
                )}
              </span>
              {plugin.templateFetchedAt && (
                <span className="text-muted-foreground/60">
                  · {new Date(plugin.templateFetchedAt).toLocaleDateString()}
                </span>
              )}
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 text-muted-foreground/60" />
              <span className="text-muted-foreground/80">No template yet</span>
            </>
          )}
        </div>

        {/* Action bar */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
          <div className="flex items-center gap-1.5">
            <Switch
              checked={plugin.enabled}
              onCheckedChange={(next) => onToggle(plugin, next)}
              disabled={inFlight}
              aria-label={`Toggle ${plugin.name}`}
            />
            <span className={cn('text-[10px] font-semibold uppercase tracking-wider', plugin.enabled ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground')}>
              {plugin.enabled ? 'On' : 'Off'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onDefault(plugin, !plugin.isDefault)}
              disabled={inFlight}
              title={plugin.isDefault ? 'Unset as default' : 'Set as default for category/jurisdiction'}
              aria-label="Toggle default"
            >
              <Star
                className={cn(
                  'h-3.5 w-3.5',
                  plugin.isDefault
                    ? 'fill-amber-400 text-amber-500'
                    : 'text-muted-foreground hover:text-amber-500',
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onRefresh(plugin)}
              disabled={inFlight}
              title="Refresh template from source"
              aria-label="Refresh template"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 text-muted-foreground hover:text-foreground', inFlight && 'animate-spin')} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px]"
              onClick={() => onOpenDetail(plugin)}
              title="View details"
            >
              Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
