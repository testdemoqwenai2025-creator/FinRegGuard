/**
 * Plugin Registry — syncs the catalog (in-memory source-of-truth) with the
 * database (runtime state: enabled, isDefault, cached template).
 *
 * Pattern: every call to `getRegistry()` ensures the DB is in sync with the
 * catalog. New catalog entries are inserted (with their `enabledByDefault`
 * flag preserved); entries removed from the catalog are pruned from the DB.
 */

import { db } from '@/lib/db'
import { PLUGIN_CATALOG, type PluginCatalogEntry } from './catalog'

export interface RegistryPlugin extends PluginCatalogEntry {
  id: string
  enabled: boolean
  isDefault: boolean
  lastRefreshedAt: Date | null
  enabledAt: Date | null
  hasTemplate: boolean
  templateFetchStatus?: number
  templateFetchedAt?: Date | null
}

let syncPromise: Promise<void> | null = null

/**
 * Ensures the DB has a row for every catalog entry.
 * Idempotent — safe to call on every request.
 * Sets `enabled = enabledByDefault` only on first insert (not on every call).
 */
export async function syncCatalogToDb(): Promise<void> {
  if (!syncPromise) {
    syncPromise = doSync().finally(() => { syncPromise = null })
  }
  return syncPromise
}

async function doSync(): Promise<void> {
  const catalogSlugs = new Set(PLUGIN_CATALOG.map((p) => p.slug))

  // Upsert each catalog entry (only set enabled/isDefault on first insert via onCreate)
  for (const entry of PLUGIN_CATALOG) {
    await db.plugin.upsert({
      where: { slug: entry.slug },
      create: {
        slug: entry.slug,
        name: entry.name,
        description: entry.description,
        category: entry.category,
        jurisdiction: entry.jurisdiction,
        regulator: entry.regulator ?? null,
        version: entry.version,
        sourceUrl: entry.sourceUrl,
        sourceType: entry.sourceType,
        schemaJson: entry.schemaJson ? JSON.stringify(entry.schemaJson) : null,
        defaultFieldsJson: entry.defaultFieldsJson ? JSON.stringify(entry.defaultFieldsJson) : null,
        tagsJson: JSON.stringify(entry.tags),
        enabled: entry.enabledByDefault ?? false,
        isDefault: entry.defaultForCategory ?? false,
      },
      update: {
        // Refresh catalog-side metadata without touching enabled/isDefault state.
        name: entry.name,
        description: entry.description,
        version: entry.version,
        sourceUrl: entry.sourceUrl,
        sourceType: entry.sourceType,
        schemaJson: entry.schemaJson ? JSON.stringify(entry.schemaJson) : db.plugin.schemaJson,
        defaultFieldsJson: entry.defaultFieldsJson ? JSON.stringify(entry.defaultFieldsJson) : db.plugin.defaultFieldsJson,
        tagsJson: JSON.stringify(entry.tags),
      },
    })
  }

  // Prune DB rows whose slug is no longer in the catalog
  const dbPlugins = await db.plugin.findMany({ select: { id: true, slug: true } })
  const stale = dbPlugins.filter((p) => !catalogSlugs.has(p.slug))
  if (stale.length > 0) {
    await db.plugin.deleteMany({ where: { id: { in: stale.map((p) => p.id) } } })
  }
}

/**
 * Returns the full registry: catalog metadata + DB state (enabled, isDefault,
 * template fetch status). Callers should `await syncCatalogToDb()` first.
 */
export async function getRegistry(): Promise<RegistryPlugin[]> {
  await syncCatalogToDb()
  const rows = await db.plugin.findMany({
    include: { template: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  // Build a slug→catalog map for constant-time lookups
  const bySlug = new Map(PLUGIN_CATALOG.map((p) => [p.slug, p] as const))

  return rows
    .map((row): RegistryPlugin | null => {
      const cat = bySlug.get(row.slug)
      if (!cat) return null  // should not happen post-sync
      return {
        ...cat,
        id: row.id,
        enabled: row.enabled,
        isDefault: row.isDefault,
        lastRefreshedAt: row.lastRefreshedAt,
        enabledAt: row.enabledAt,
        hasTemplate: !!row.template,
        templateFetchStatus: row.template?.fetchStatus,
        templateFetchedAt: row.template?.fetchedAt ?? null,
      }
    })
    .filter((p): p is RegistryPlugin => p !== null)
}

export interface RegistryStats {
  total: number
  enabled: number
  defaultCount: number
  withTemplates: number
  byCategory: Record<string, { total: number; enabled: number }>
  byJurisdiction: Record<string, { total: number; enabled: number }>
}

export async function getRegistryStats(registry: RegistryPlugin[]): Promise<RegistryStats> {
  const stats: RegistryStats = {
    total: registry.length,
    enabled: registry.filter((p) => p.enabled).length,
    defaultCount: registry.filter((p) => p.isDefault).length,
    withTemplates: registry.filter((p) => p.hasTemplate).length,
    byCategory: {},
    byJurisdiction: {},
  }
  for (const p of registry) {
    stats.byCategory[p.category] ??= { total: 0, enabled: 0 }
    stats.byCategory[p.category].total++
    if (p.enabled) stats.byCategory[p.category].enabled++
    stats.byJurisdiction[p.jurisdiction] ??= { total: 0, enabled: 0 }
    stats.byJurisdiction[p.jurisdiction].total++
    if (p.enabled) stats.byJurisdiction[p.jurisdiction].enabled++
  }
  return stats
}

/**
 * Toggle a plugin on/off. When enabling for the first time, also kick off
 * a template auto-fill (the caller does this — see /api/plugins/[id]/refresh).
 */
export async function setEnabled(
  pluginId: string,
  enabled: boolean,
  actor = 'system',
): Promise<void> {
  await db.plugin.update({
    where: { id: pluginId },
    data: {
      enabled,
      enabledAt: enabled ? new Date() : null,
    },
  })
  await db.pluginToggleHistory.create({
    data: {
      pluginId,
      action: enabled ? 'enabled' : 'disabled',
      actor,
    },
  })
}

/**
 * Mark (or unmark) a plugin as the default for its category.
 * When setting as default, all other plugins with the same category+jurisdiction
 * have their `isDefault` flag cleared (one default per category/jurisdiction).
 */
export async function setDefault(
  pluginId: string,
  isDefault: boolean,
  actor = 'system',
): Promise<void> {
  const target = await db.plugin.findUnique({ where: { id: pluginId } })
  if (!target) throw new Error('Plugin not found')

  if (isDefault) {
    // Clear isDefault on siblings (same category + jurisdiction)
    await db.plugin.updateMany({
      where: {
        category: target.category,
        jurisdiction: target.jurisdiction,
        id: { not: pluginId },
      },
      data: { isDefault: false },
    })
  }

  await db.plugin.update({ where: { id: pluginId }, data: { isDefault } })
  await db.pluginToggleHistory.create({
    data: { pluginId, action: isDefault ? 'set_default' : 'unset_default', actor },
  })
}
