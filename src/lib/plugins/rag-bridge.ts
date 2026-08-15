/**
 * Plugin RAG Bridge — connects the Plugin Registry to the Vector Store.
 *
 * Responsibilities:
 *   1. On plugin enable: fetch/refresh template, then index chunks
 *   2. On plugin disable: de-index chunks (template cached for re-enable)
 *   3. On plugin refresh: detect hash drift, re-index if changed
 *   4. Provide a "getEnabledPluginFilter()" helper for the /api/chat route
 *      so the Copilot only retrieves from currently-enabled plugins.
 */

import { db } from '@/lib/db'
import { indexPlugin, deleteChunksBySource } from '@/lib/ai/vector-store'
import { refreshTemplate } from './templates'

export type PluginRagFilter = {
  sourceTypes: string[]
  jurisdictions: string[]
  categories: string[]
}

/**
 * Returns the RAG filter for currently-enabled plugins.
 * Always includes the baseline source types (regulation, policy, risk, audit)
 * so the Copilot can still answer from the existing internal corpus even if
 * no plugins are enabled.
 *
 * Plugin source types are added on top: 'plugin' is always included in the
 * sourceTypes list (the vector store only returns plugin chunks if they exist
 * AND the filter allows 'plugin' as a source type).
 *
 * The jurisdictions/categories from enabled plugins are also added — this
 * means: if the user enables only EU plugins, the Copilot will still search
 * regulation/policy/risk chunks but only for EU jurisdictions.
 *
 * Callers can override the baseline (e.g., restrict to plugins-only) by
 * passing { pluginsOnly: true }.
 */
export async function getEnabledPluginFilter(opts?: {
  pluginsOnly?: boolean
}): Promise<PluginRagFilter> {
  const enabledPlugins = await db.plugin.findMany({
    where: { enabled: true },
    select: { jurisdiction: true, category: true },
  })

  const jurisdictions = new Set<string>()
  const categories = new Set<string>()

  for (const p of enabledPlugins) {
    jurisdictions.add(p.jurisdiction)
    categories.add(p.category)
  }

  const sourceTypes = opts?.pluginsOnly
    ? ['plugin']
    : ['regulation', 'policy', 'risk', 'audit', 'plugin']

  return {
    sourceTypes,
    jurisdictions: Array.from(jurisdictions),
    categories: Array.from(categories),
  }
}

/**
 * Index a plugin's template into the vector store.
 * Called after a plugin is enabled or its template is refreshed.
 *
 * If the plugin has no cached template, this is a no-op.
 */
export async function indexPluginChunks(pluginId: string): Promise<{
  indexed: number
  skipped: number
  chunks: number
}> {
  const plugin = await db.plugin.findUnique({
    where: { id: pluginId },
    include: { template: true },
  })
  if (!plugin) {
    return { indexed: 0, skipped: 0, chunks: 0 }
  }
  return indexPlugin({
    id: plugin.id,
    slug: plugin.slug,
    name: plugin.name,
    jurisdiction: plugin.jurisdiction,
    category: plugin.category,
    regulator: plugin.regulator,
    version: plugin.version,
    template: plugin.template
      ? {
          rawContent: plugin.template.rawContent,
          contentHash: plugin.template.contentHash,
          contentType: plugin.template.contentType,
          parsedFieldsJson: plugin.template.parsedFieldsJson,
        }
      : null,
  })
}

/**
 * Remove a plugin's chunks from the vector store.
 * Called when a plugin is disabled or uninstalled.
 * The cached template is preserved (so re-enabling is fast).
 */
export async function deindexPluginChunks(pluginSlug: string): Promise<{
  deleted: number
}> {
  return deleteChunksBySource('plugin', pluginSlug)
}

/**
 * Refresh a plugin's template AND re-index if the content hash changed.
 *
 * Flow:
 *   1. Fetch the latest template from sourceUrl (or synthesize from defaults)
 *   2. Compare the new content hash to the cached hash
 *   3. If different: delete old chunks + index new chunks
 *   4. If same: skip re-indexing (no drift detected)
 *   5. Record the action in PluginToggleHistory
 *
 * Returns a report with drift detection status.
 */
export async function refreshAndReindex(
  pluginId: string,
  actor = 'system',
): Promise<{
  templateOk: boolean
  driftDetected: boolean
  previousHash: string | null
  newHash: string
  chunksIndexed: number
  chunksDeleted: number
  error?: string
}> {
  // Read the current cached hash (if any) BEFORE refreshing
  const before = await db.pluginTemplate.findUnique({
    where: { pluginId },
    select: { contentHash: true },
  })
  const previousHash = before?.contentHash ?? null

  // Refresh the template (fetches from source, updates DB)
  const refreshResult = await refreshTemplate(pluginId, actor)

  // Determine drift
  const newHash = refreshResult.contentHash
  const driftDetected =
    refreshResult.ok && previousHash !== null && previousHash !== newHash

  // If refresh failed AND there's no previous template, nothing to index
  if (!refreshResult.ok && !previousHash) {
    return {
      templateOk: false,
      driftDetected: false,
      previousHash,
      newHash,
      chunksIndexed: 0,
      chunksDeleted: 0,
      error: refreshResult.error,
    }
  }

  // Always delete + re-index on first successful fetch (previousHash null)
  // OR when drift is detected. Skip if hash unchanged (no drift).
  if (previousHash === newHash && previousHash !== null) {
    // No drift — skip re-indexing
    return {
      templateOk: refreshResult.ok,
      driftDetected: false,
      previousHash,
      newHash,
      chunksIndexed: 0,
      chunksDeleted: 0,
    }
  }

  // Drift detected (or first fetch) — delete old + index new
  const plugin = await db.plugin.findUnique({
    where: { id: pluginId },
    select: { slug: true },
  })

  let chunksDeleted = 0
  if (plugin) {
    const del = await deindexPluginChunks(plugin.slug)
    chunksDeleted = del.deleted
  }

  // Only index if the refresh succeeded (or fallback synthesized a template)
  let chunksIndexed = 0
  if (refreshResult.ok || refreshResult.skipped) {
    const idx = await indexPluginChunks(pluginId)
    chunksIndexed = idx.indexed
  }

  // Record drift action in history
  if (driftDetected) {
    const note = `Drift detected: hash changed from ${previousHash?.slice(0, 10)}… to ${newHash.slice(0, 10)}…; re-indexed ${chunksIndexed} chunks (deleted ${chunksDeleted} stale)`
    await db.pluginToggleHistory.create({
      data: {
        pluginId,
        action: 'drift_reindex',
        actor,
        notes: note,
      },
    })
  }

  return {
    templateOk: refreshResult.ok,
    driftDetected,
    previousHash,
    newHash,
    chunksIndexed,
    chunksDeleted,
    error: refreshResult.error,
  }
}

/**
 * Scan ALL enabled plugins for template drift.
 * For each enabled plugin:
 *   1. Fetch the latest template from sourceUrl
 *   2. Compare content hash to cached hash
 *   3. If different, re-index the chunks
 *
 * Returns a summary report. Designed to be called by:
 *   - The "Scan All" button in the Plugin Manager UI
 *   - A cron job (scripts/scan-plugin-drift.ts)
 */
export async function scanAllForDrift(actor = 'system'): Promise<{
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
}> {
  const enabledPlugins = await db.plugin.findMany({
    where: { enabled: true },
    select: { id: true, slug: true, name: true },
  })

  const details: Array<{
    pluginId: string
    slug: string
    name: string
    driftDetected: boolean
    chunksIndexed: number
    error?: string
  }> = []

  let drifted = 0
  let reindexed = 0
  let failed = 0

  for (const plugin of enabledPlugins) {
    try {
      const result = await refreshAndReindex(plugin.id, actor)
      details.push({
        pluginId: plugin.id,
        slug: plugin.slug,
        name: plugin.name,
        driftDetected: result.driftDetected,
        chunksIndexed: result.chunksIndexed,
        error: result.error,
      })
      if (result.driftDetected) drifted++
      if (result.chunksIndexed > 0) reindexed++
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      details.push({
        pluginId: plugin.id,
        slug: plugin.slug,
        name: plugin.name,
        driftDetected: false,
        chunksIndexed: 0,
        error: msg,
      })
      failed++
    }
  }

  return {
    scanned: enabledPlugins.length,
    drifted,
    reindexed,
    failed,
    details,
  }
}
