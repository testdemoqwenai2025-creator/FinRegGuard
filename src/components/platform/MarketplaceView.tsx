'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Store,
  Download,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  Globe,
  AlertCircle,
  Package,
} from 'lucide-react'
import { dataUrl, IS_STATIC_BUILD } from '@/lib/data'
import { PageHeader, KpiTile } from '@/components/shared/PageHeader'
import { cn } from '@/lib/utils'

// Mirror of RegistryPlugin shape (subset — we only need a few fields here)
interface InstalledPlugin {
  id: string
  slug: string
  name: string
  description: string
  category: string
  jurisdiction: string
  regulator?: string
  version: string
  sourceUrl: string
  sourceType: string
  tags: string[]
  enabled: boolean
  isDefault: boolean
  hasTemplate: boolean
  templateFetchStatus?: number
  templateFetchedAt?: string | null
  lastRefreshedAt?: string | null
}

interface InstallResult {
  ok: boolean
  pluginId?: string
  slug: string
  name: string
  action: 'created' | 'updated' | 'noop'
  templateFetched: boolean
  contentLength?: number
  error?: string
}

interface DriftScanResult {
  ok: boolean
  scanned: number
  drifted: number
  reindexed: number
  failed: number
  details: Array<{
    pluginId: string
    slug: string
    name: string
    driftDetected: boolean
    chunksIndexed: number
    error?: string
  }>
  scannedAt: string
}

// Curated "featured" plugins — quick-install shortcuts shown when the
// user hasn't installed anything yet. Real URLs to authoritative regulators.
const FEATURED_PLUGINS = [
  {
    name: 'SEC Form ADV (Part 1)',
    url: 'https://www.sec.gov/about/forms/formadv-part1.pdf',
    description: 'Uniform Application for Investment Adviser Registration — SEC.',
    category: 'form',
    jurisdiction: 'US',
  },
  {
    name: 'FINRA Form U4',
    url: 'https://www.finra.org/sites/default/files/Form_U4.pdf',
    description: 'Uniform Application for Securities Industry Registration — FINRA.',
    category: 'form',
    jurisdiction: 'US',
  },
  {
    name: 'GDPR Article 30 — RoPA',
    url: 'https://gdpr-info.eu/art-30-gdpr/',
    description: 'Record of Processing Activities template — EU GDPR.',
    category: 'form',
    jurisdiction: 'EU',
  },
  {
    name: 'FATF High-Risk Jurisdictions',
    url: 'https://www.fatf-gafi.org/en/topics/high-risk-and-other-monitored-jurisdictions.html',
    description: 'FATF list of high-risk and monitored jurisdictions.',
    category: 'label',
    jurisdiction: 'GLOBAL',
  },
  {
    name: 'ESMA MiFID II Product Governance',
    url: 'https://www.esma.europa.eu/sites/default/files/library/2017-1291_qa_mifid_ii_product_governance.pdf',
    description: 'MiFID II product governance Q&A — ESMA.',
    category: 'form',
    jurisdiction: 'EU',
  },
  {
    name: 'FCA Senior Managers Regime',
    url: 'https://www.fca.org.uk/firms/senior-managers-certification-regime',
    description: 'FCA SMR guidance page — UK.',
    category: 'document',
    jurisdiction: 'UK',
  },
]

export function MarketplaceView() {
  const [plugins, setPlugins] = useState<InstalledPlugin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Install form state
  const [urlInput, setUrlInput] = useState('')
  const [autoEnable, setAutoEnable] = useState(true)
  const [installing, setInstalling] = useState(false)
  const [lastInstallResult, setLastInstallResult] = useState<InstallResult | null>(null)

  // Drift scan state
  const [scanning, setScanning] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<DriftScanResult | null>(null)

  // Toast
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'err' | 'info' } | null>(null)

  const showToast = useCallback((msg: string, kind: 'ok' | 'err' | 'info' = 'ok') => {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), 4500)
  }, [])

  const loadInstalled = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(dataUrl('plugins'))
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data = (await res.json()) as { plugins: InstalledPlugin[] }
      // Filter to user-added plugins (marketplace installs)
      const installed = (data.plugins ?? []).filter((p) =>
        p.tags?.includes('user-added') || p.tags?.includes('marketplace'),
      )
      setPlugins(installed)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInstalled()
  }, [loadInstalled])

  // ─── Actions ───
  const handleInstall = useCallback(
    async (url: string) => {
      if (!url.trim()) {
        showToast('Enter a URL first', 'err')
        return
      }
      if (IS_STATIC_BUILD) {
        showToast('Install not available in preview mode (requires dev backend)', 'err')
        return
      }
      setInstalling(true)
      setLastInstallResult(null)
      try {
        const res = await fetch('/api/plugins/marketplace/install', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, actor: 'user', autoEnable }),
        })
        const data = (await res.json()) as InstallResult
        setLastInstallResult(data)
        if (data.ok) {
          showToast(
            'Installed "' + data.name + '" (' + data.action + ', ' + (data.contentLength ?? 0) + ' bytes fetched)',
            'ok',
          )
          setUrlInput('')
          loadInstalled()
        } else {
          showToast('Install failed: ' + (data.error ?? 'unknown'), 'err')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        showToast('Install failed: ' + msg, 'err')
      } finally {
        setInstalling(false)
      }
    },
    [autoEnable, loadInstalled, showToast],
  )

  const handleUninstall = useCallback(
    async (plugin: InstalledPlugin) => {
      if (IS_STATIC_BUILD) {
        showToast('Uninstall not available in preview mode', 'err')
        return
      }
      if (!confirm('Uninstall "' + plugin.name + '"? This will remove the plugin, its cached template, and any indexed chunks.')) {
        return
      }
      try {
        const res = await fetch('/api/plugins/marketplace/uninstall', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pluginId: plugin.id, actor: 'user' }),
        })
        const data = (await res.json()) as { ok: boolean; error?: string }
        if (data.ok) {
          showToast('Uninstalled "' + plugin.name + '"', 'ok')
          loadInstalled()
        } else {
          showToast('Uninstall failed: ' + (data.error ?? 'unknown'), 'err')
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        showToast('Uninstall failed: ' + msg, 'err')
      }
    },
    [loadInstalled, showToast],
  )

  const handleDriftScan = useCallback(async () => {
    if (IS_STATIC_BUILD) {
      showToast('Drift scan not available in preview mode', 'err')
      return
    }
    setScanning(true)
    setLastScanResult(null)
    try {
      const res = await fetch('/api/plugins/drift/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'user' }),
      })
      const data = (await res.json()) as DriftScanResult
      setLastScanResult(data)
      if (data.ok) {
        showToast(
          'Drift scan complete: ' + data.scanned + ' checked, ' + data.drifted + ' drifted, ' + data.reindexed + ' re-indexed',
          data.failed > 0 ? 'info' : 'ok',
        )
      } else {
        showToast('Drift scan failed', 'err')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      showToast('Drift scan failed: ' + msg, 'err')
    } finally {
      setScanning(false)
    }
  }, [showToast])

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
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <PageHeader
          zone="Platform & Governance"
          title="Plugin Marketplace"
          subtitle="Install regulatory plugins from any URL — DeepSeek-style load-from-web. Plugins are auto-discovered or installed via RegGuard manifest."
          icon={Store}
          accent="from-violet-600 to-fuchsia-700"
        />
        <div className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200">
          <p className="font-semibold">Failed to load installed plugins</p>
          <p className="mt-1 opacity-80">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={loadInstalled}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        zone="Platform & Governance"
        title="Plugin Marketplace"
        subtitle="Install regulatory plugins from any URL — DeepSeek-style load-from-web. Plugins are auto-discovered or installed via RegGuard manifest."
        icon={Store}
        accent="from-violet-600 to-fuchsia-700"
      />

      {IS_STATIC_BUILD && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          <strong>Preview mode:</strong> Install / uninstall / drift scan require the dev backend. Buttons are shown for layout reference only.
        </div>
      )}

      {/* KPI tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Installed"
          value={plugins.length}
          sub="user-added plugins"
          icon={Package}
          tint="text-violet-700 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300"
        />
        <KpiTile
          label="Enabled"
          value={plugins.filter((p) => p.enabled).length}
          sub="currently active"
          icon={CheckCircle2}
          tint="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300"
        />
        <KpiTile
          label="With Templates"
          value={plugins.filter((p) => p.hasTemplate).length}
          sub="cached from source"
          icon={Sparkles}
          tint="text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300"
        />
        <KpiTile
          label="Drift Status"
          value={lastScanResult ? (lastScanResult.drifted > 0 ? lastScanResult.drifted + ' drifted' : 'clean') : '—'}
          sub={lastScanResult ? 'last scan: ' + new Date(lastScanResult.scannedAt).toLocaleTimeString() : 'no scan yet'}
          icon={AlertCircle}
          tint={
            lastScanResult && lastScanResult.drifted > 0
              ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300'
              : 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
          }
        />
      </div>

      {/* Install from URL */}
      <Card className="border-border bg-background">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Download className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            Install Plugin from URL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              placeholder="https://www.sec.gov/about/forms/formadv-part1.pdf"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="md:flex-1 font-mono text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !installing) handleInstall(urlInput)
              }}
            />
            <Button
              onClick={() => handleInstall(urlInput)}
              disabled={installing || !urlInput.trim()}
              className="gap-1.5 md:w-auto"
            >
              {installing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Installing…
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  Install
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <Switch checked={autoEnable} onCheckedChange={setAutoEnable} />
              <span>Auto-enable after install</span>
            </label>
            <span className="text-[10px] text-muted-foreground/70">
              Accepts regulator URLs (PDF/HTML) or RegGuard manifest JSON
            </span>
          </div>

          {/* Last install result */}
          {lastInstallResult && (
            <div
              className={cn(
                'rounded-md border px-3 py-2 text-xs',
                lastInstallResult.ok
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200'
                  : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-200',
              )}
            >
              <div className="flex items-center gap-2">
                {lastInstallResult.ok ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                <span className="font-semibold">
                  {lastInstallResult.ok ? 'Install successful' : 'Install failed'}
                </span>
                <span className="opacity-70">·</span>
                <span className="font-mono opacity-80">{lastInstallResult.slug}</span>
                {lastInstallResult.action !== 'noop' && (
                  <Badge variant="outline" className="text-[9px] ml-1">
                    {lastInstallResult.action}
                  </Badge>
                )}
              </div>
              {lastInstallResult.contentLength !== undefined && (
                <p className="mt-1 opacity-70">
                  Fetched {lastInstallResult.contentLength.toLocaleString()} bytes
                  {lastInstallResult.templateFetched && ' · template cached · chunks indexed'}
                </p>
              )}
              {lastInstallResult.error && (
                <p className="mt-1">{lastInstallResult.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Featured quick-installs */}
      {plugins.length === 0 && (
        <Card className="border-violet-200 bg-violet-50/40 dark:border-violet-900/40 dark:bg-violet-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              Featured Plugins — Quick Install
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              One-click install from authoritative regulator websites. Click any card to install — plugin metadata is auto-discovered from the URL.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURED_PLUGINS.map((p) => (
                <button
                  key={p.url}
                  onClick={() => handleInstall(p.url)}
                  disabled={installing}
                  className={cn(
                    'group text-left rounded-lg border border-border bg-background p-3 transition-all hover:shadow-sm hover:border-violet-300 dark:hover:border-violet-700',
                    installing && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Globe className="h-3.5 w-3.5 mt-0.5 text-violet-600 dark:text-violet-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Badge variant="secondary" className="text-[9px] py-0">{p.category}</Badge>
                        <Badge variant="outline" className="text-[9px] py-0">{p.jurisdiction}</Badge>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drift scan */}
      <Card className="border-border bg-background">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            Drift Detection — Scheduled Refresh
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Scans all enabled plugins for template drift via SHA-256 hash comparison. If a regulator updates their form/template, this detects the change and re-indexes the affected chunks in the vector store. Can also be run via cron: <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">bun run scripts/scan-plugin-drift.ts</code>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDriftScan}
            disabled={scanning}
            className="gap-1.5"
          >
            {scanning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" />
                Scan All Enabled Plugins
              </>
            )}
          </Button>

          {lastScanResult && (
            <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <p className="text-muted-foreground">Scanned</p>
                  <p className="font-bold text-base">{lastScanResult.scanned}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Drifted</p>
                  <p className={cn('font-bold text-base', lastScanResult.drifted > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')}>
                    {lastScanResult.drifted}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Re-indexed</p>
                  <p className="font-bold text-base">{lastScanResult.reindexed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Failed</p>
                  <p className={cn('font-bold text-base', lastScanResult.failed > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground')}>
                    {lastScanResult.failed}
                  </p>
                </div>
              </div>
              {lastScanResult.details.length > 0 && (
                <ScrollArea className="max-h-40 rounded border border-border bg-background">
                  <div className="p-2 space-y-1">
                    {lastScanResult.details.map((d) => (
                      <div key={d.pluginId} className="flex items-center gap-2 text-[11px]">
                        {d.error ? (
                          <XCircle className="h-3 w-3 text-rose-600 dark:text-rose-400 shrink-0" />
                        ) : d.driftDetected ? (
                          <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                        <span className="font-mono truncate flex-1">{d.slug}</span>
                        <span className="text-muted-foreground text-[10px]">
                          {d.error
                            ? d.error.slice(0, 40)
                            : d.driftDetected
                              ? 're-indexed ' + d.chunksIndexed + ' chunks'
                              : 'no drift'}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Installed plugins list */}
      <Card className="border-border bg-background">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            Installed Plugins ({plugins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {plugins.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No plugins installed yet. Use the install form above or pick a featured plugin to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {plugins.map((p) => (
                <InstalledPluginRow
                  key={p.id}
                  plugin={p}
                  onUninstall={handleUninstall}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-4 right-4 z-50 rounded-lg border px-4 py-2.5 text-sm shadow-lg max-w-sm',
            toast.kind === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/80 dark:text-emerald-100'
              : toast.kind === 'err'
                ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/80 dark:text-rose-100'
                : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/80 dark:text-amber-100',
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

function InstalledPluginRow({
  plugin,
  onUninstall,
}: {
  plugin: InstalledPlugin
  onUninstall: (p: InstalledPlugin) => void
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
        <Package className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate">{plugin.name}</p>
          {plugin.enabled && (
            <Badge variant="outline" className="text-[9px] py-0 border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">
              enabled
            </Badge>
          )}
          <Badge variant="secondary" className="text-[9px] py-0">{plugin.category}</Badge>
          <Badge variant="outline" className="text-[9px] py-0">{plugin.jurisdiction}</Badge>
          {plugin.regulator && (
            <Badge variant="outline" className="text-[9px] py-0">{plugin.regulator}</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{plugin.description}</p>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
          <a
            href={plugin.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="truncate max-w-[200px]">{plugin.sourceUrl}</span>
          </a>
          {plugin.hasTemplate && (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              template cached
            </span>
          )}
          {plugin.templateFetchedAt && (
            <span>· fetched {new Date(plugin.templateFetchedAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
        onClick={() => onUninstall(plugin)}
        title="Uninstall"
        aria-label={'Uninstall ' + plugin.name}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
