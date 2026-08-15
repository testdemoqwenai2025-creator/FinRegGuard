/**
 * Plugin Marketplace — install/uninstall plugins from web URLs.
 *
 * Supports two manifest formats:
 *
 * 1. RegGuard Plugin Manifest (preferred):
 *    {
 *      "manifestVersion": "1.0",
 *      "slug": "acme-form-xyz",
 *      "name": "ACME Form XYZ",
 *      "description": "...",
 *      "category": "form",
 *      "jurisdiction": "US",
 *      "regulator": "SEC",
 *      "version": "1.0.0",
 *      "sourceUrl": "https://...",
 *      "sourceType": "web",
 *      "schemaJson": {...},
 *      "defaultFieldsJson": {...},
 *      "tags": ["..."]
 *    }
 *
 * 2. Auto-discovery (raw URL to a regulator document):
 *    User just pastes a URL (e.g., https://www.sec.gov/about/forms/formadv-part1.pdf).
 *    We infer category="form", jurisdiction from URL/TLD, regulator from domain,
 *    and use the URL itself as both sourceUrl and (after fetch) the template.
 *
 * Created plugins are marked `userAdded: true` so they can be filtered
 * separately from the curated catalog.
 */

import { db } from '@/lib/db'
import { createHash } from 'node:crypto'

export type MarketplaceInstallResult = {
  ok: boolean
  pluginId?: string
  slug: string
  name: string
  action: 'created' | 'updated' | 'noop'
  templateFetched: boolean
  contentLength?: number
  error?: string
}

const REGULATOR_BY_DOMAIN: Record<string, string> = {
  'sec.gov': 'SEC',
  'finra.org': 'FINRA',
  'fincen.gov': 'FinCEN',
  'irs.gov': 'IRS',
  'esma.europa.eu': 'ESMA',
  'eba.europa.eu': 'EBA',
  'eiopa.europa.eu': 'EIOPA',
  'ecb.europa.eu': 'ECB',
  'fca.org.uk': 'FCA',
  'pra.org.uk': 'PRA',
  'mas.gov.sg': 'MAS',
  'sfc.hk': 'SFC',
  'hkma.gov.hk': 'HKMA',
  'fsa.go.jp': 'FSA',
  'pmda.go.jp': 'PMDA',
  'apra.gov.au': 'APRA',
  'osfi-bsif.gc.ca': 'OSFI',
  'fatf-gafi.org': 'FATF',
  'bis.org': 'BIS',
  'gdpr-info.eu': 'EDPB',
  'gleif.org': 'GLEIF',
}

const JURISDICTION_BY_TLD: Record<string, string> = {
  '.gov': 'US',
  '.eu': 'EU',
  '.europa.eu': 'EU',
  '.gov.uk': 'UK',
  '.org.uk': 'UK',
  '.gov.sg': 'SG',
  '.gov.hk': 'HK',
  '.go.jp': 'JP',
  '.gov.au': 'AU',
  '.gc.ca': 'CA',
}

const CATEGORY_BY_PATH: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /\/form[s]?\//i, category: 'form' },
  { pattern: /\/forms?\d/i, category: 'form' },
  { pattern: /\/template[s]?\//i, category: 'document' },
  { pattern: /\/guidance?\//i, category: 'document' },
  { pattern: /\/policy|policies/i, category: 'document' },
  { pattern: /\/handbook\//i, category: 'document' },
  { pattern: /\/rule[s]?\//i, category: 'document' },
  { pattern: /\/sanctions?/i, category: 'feature' },
  { pattern: /\/screening?/i, category: 'feature' },
]

const FETCH_TIMEOUT_MS = 15_000
const MAX_MANIFEST_BYTES = 256 * 1024
const MAX_TEMPLATE_BYTES = 5 * 1024 * 1024

export type ManifestInput = {
  manifestVersion?: string
  slug?: string
  name: string
  description: string
  category?: string
  jurisdiction?: string
  regulator?: string
  version?: string
  sourceUrl?: string
  sourceType?: string
  schemaJson?: Record<string, unknown>
  defaultFieldsJson?: Record<string, unknown>
  tags?: string[]
}

/**
 * Install a plugin from a URL.
 *
 * Two modes based on what's at the URL:
 *
 * (A) RegGuard manifest — if the URL returns JSON with a `manifestVersion`
 *     field and a `name` field, treat it as a full plugin manifest.
 *
 * (B) Auto-discovery — if the URL returns HTML/PDF/etc., create a plugin
 *     with inferred metadata (jurisdiction from TLD, regulator from domain,
 *     category from URL path) and use the fetched content as the template.
 *
 * Body: { url: string, actor?: string, autoEnable?: boolean }
 */
export async function installPluginFromUrl(
  url: string,
  opts: { actor?: string; autoEnable?: boolean } = {},
): Promise<MarketplaceInstallResult> {
  const actor = opts.actor ?? 'user'
  const autoEnable = opts.autoEnable ?? true

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return {
      ok: false,
      slug: '',
      name: url,
      action: 'noop',
      templateFetched: false,
      error: 'URL must start with http:// or https://',
    }
  }

  // Step 1: fetch the URL
  let contentType: string | null = null
  let rawContent: string
  let httpStatus = 0
  let fetchError: string | undefined

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'RegGuardAI-PluginMarketplace/1.0 (+https://github.com/testdemoqwenai2025-creator/FinRegGTP.BoT)',
      },
      redirect: 'follow',
    })
    clearTimeout(timeout)
    httpStatus = res.status
    contentType = res.headers.get('content-type')?.split(';')[0]?.trim() ?? null
    if (!res.ok) {
      return {
        ok: false,
        slug: '',
        name: url,
        action: 'noop',
        templateFetched: false,
        error: `HTTP ${res.status} ${res.statusText}`,
      }
    }
    const buf = await res.arrayBuffer()
    const slice = buf.byteLength > MAX_TEMPLATE_BYTES ? buf.slice(0, MAX_TEMPLATE_BYTES) : buf
    rawContent = Buffer.from(slice).toString('utf-8')
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'fetch failed'
    return {
      ok: false,
      slug: '',
      name: url,
      action: 'noop',
      templateFetched: false,
      error: msg,
    }
  }

  // Step 2: try to parse as manifest (JSON with manifestVersion or name field)
  let manifest: ManifestInput | null = null
  if (contentType?.includes('application/json') || contentType?.includes('text/json')) {
    try {
      const parsed = JSON.parse(rawContent)
      if (parsed && typeof parsed === 'object' && typeof parsed.name === 'string') {
        manifest = parsed as ManifestInput
      }
    } catch {
      // not valid JSON — fall through to auto-discovery
    }
  }

  // Step 3: build the plugin data
  let pluginData: {
    slug: string
    name: string
    description: string
    category: string
    jurisdiction: string
    regulator: string | null
    version: string
    sourceUrl: string
    sourceType: string
    schemaJson: string | null
    defaultFieldsJson: string | null
    tagsJson: string
    enabled: boolean
    isDefault: boolean
  }

  if (manifest) {
    // Mode A: full manifest
    const slug = manifest.slug || slugify(manifest.name)
    pluginData = {
      slug,
      name: manifest.name,
      description: manifest.description || 'No description provided.',
      category: manifest.category || 'document',
      jurisdiction: manifest.jurisdiction || inferJurisdiction(url),
      regulator: manifest.regulator || inferRegulator(url),
      version: manifest.version || '1.0.0',
      sourceUrl: manifest.sourceUrl || url,
      sourceType: manifest.sourceType || 'web',
      schemaJson: manifest.schemaJson ? JSON.stringify(manifest.schemaJson) : null,
      defaultFieldsJson: manifest.defaultFieldsJson ? JSON.stringify(manifest.defaultFieldsJson) : null,
      tagsJson: JSON.stringify([...(manifest.tags ?? []), 'user-added', 'marketplace']),
      enabled: autoEnable,
      isDefault: false,
    }
  } else {
    // Mode B: auto-discovery
    const inferred = inferMetadataFromUrl(url)
    pluginData = {
      slug: inferred.slug,
      name: inferred.name,
      description: `Auto-discovered plugin from ${url}. Fetched as ${contentType ?? 'unknown'} content.`,
      category: inferred.category,
      jurisdiction: inferred.jurisdiction,
      regulator: inferred.regulator,
      version: '1.0.0',
      sourceUrl: url,
      sourceType: 'web',
      schemaJson: null,
      defaultFieldsJson: null,
      tagsJson: JSON.stringify(['user-added', 'marketplace', 'auto-discovered']),
      enabled: autoEnable,
      isDefault: false,
    }
  }

  // Step 4: upsert plugin
  const existing = await db.plugin.findUnique({ where: { slug: pluginData.slug } })
  let pluginId: string
  let action: 'created' | 'updated' | 'noop'

  if (existing) {
    pluginId = existing.id
    action = 'updated'
    await db.plugin.update({
      where: { id: existing.id },
      data: {
        name: pluginData.name,
        description: pluginData.description,
        version: pluginData.version,
        sourceUrl: pluginData.sourceUrl,
        sourceType: pluginData.sourceType,
        schemaJson: pluginData.schemaJson,
        defaultFieldsJson: pluginData.defaultFieldsJson,
        tagsJson: pluginData.tagsJson,
      },
    })
  } else {
    const created = await db.plugin.create({ data: pluginData })
    pluginId = created.id
    action = 'created'
  }

  // Step 5: cache the fetched content as the plugin template
  const contentHash = createHash('sha256').update(rawContent).digest('hex')
  await db.pluginTemplate.upsert({
    where: { pluginId },
    create: {
      pluginId,
      rawContent,
      contentType,
      contentHash,
      fetchStatus: httpStatus || 200,
      fetchError: fetchError ?? null,
      parsedFieldsJson: null,
    },
    update: {
      rawContent,
      contentType,
      contentHash,
      fetchStatus: httpStatus || 200,
      fetchError: fetchError ?? null,
      fetchedAt: new Date(),
    },
  })

  await db.plugin.update({
    where: { id: pluginId },
    data: { lastRefreshedAt: new Date() },
  })

  // Step 6: record in audit history
  await db.pluginToggleHistory.create({
    data: {
      pluginId,
      action: action === 'created' ? 'marketplace_install' : 'marketplace_update',
      actor,
      notes: `Installed from ${url} (${rawContent.length} bytes, ${contentType})`,
    },
  })

  if (autoEnable && action === 'created') {
    await db.pluginToggleHistory.create({
      data: {
        pluginId,
        action: 'enabled',
        actor,
        notes: 'Auto-enabled on marketplace install',
      },
    })
  }

  return {
    ok: true,
    pluginId,
    slug: pluginData.slug,
    name: pluginData.name,
    action,
    templateFetched: true,
    contentLength: rawContent.length,
  }
}

/**
 * Uninstall a user-added plugin. Refuses to uninstall catalog plugins
 * (those are managed by the codebase).
 */
export async function uninstallPlugin(
  pluginId: string,
  actor = 'user',
): Promise<{ ok: boolean; error?: string }> {
  const plugin = await db.plugin.findUnique({
    where: { id: pluginId },
    select: { id: true, slug: true, tagsJson: true, enabled: true },
  })
  if (!plugin) {
    return { ok: false, error: 'Plugin not found' }
  }

  // Check tags — only user-added plugins can be uninstalled
  const tags: string[] = JSON.parse(plugin.tagsJson)
  if (!tags.includes('user-added')) {
    return {
      ok: false,
      error: 'Catalog plugins cannot be uninstalled. Disable them instead.',
    }
  }

  // De-index chunks if enabled
  if (plugin.enabled) {
    const { deleteChunksBySource } = await import('@/lib/ai/vector-store')
    await deleteChunksBySource('plugin', plugin.slug)
  }

  // Delete template + history + plugin row (cascade)
  await db.plugin.delete({ where: { id: pluginId } })

  await db.pluginToggleHistory.create({
    data: {
      pluginId: 'deleted',
      action: 'marketplace_uninstall',
      actor,
      notes: `Uninstalled plugin ${plugin.slug}`,
    },
  }).catch(() => {
    // pluginId FK won't accept 'deleted' — that's fine, the row is gone anyway
  })

  return { ok: true }
}

// ─── Helpers ───

function slugify(name: string): string {
  return (
    'marketplace-' +
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
  )
}

function inferRegulator(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase()
    for (const [domain, reg] of Object.entries(REGULATOR_BY_DOMAIN)) {
      if (host.includes(domain)) return reg
    }
  } catch {
    // ignore
  }
  return null
}

function inferJurisdiction(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase()
    for (const [tld, jur] of Object.entries(JURISDICTION_BY_TLD)) {
      if (host.endsWith(tld)) return jur
    }
  } catch {
    // ignore
  }
  return 'GLOBAL'
}

function inferMetadataFromUrl(url: string): {
  slug: string
  name: string
  category: string
  jurisdiction: string
  regulator: string | null
} {
  const u = new URL(url)
  const pathSegments = u.pathname.split('/').filter(Boolean)
  const lastSegment = pathSegments[pathSegments.length - 1] || u.hostname

  // Build a human-readable name from the last path segment
  const name = lastSegment
    .replace(/\.[^/.]+$/, '') // strip extension
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  // Infer category from URL path
  let category = 'document'
  for (const { pattern, cat } of CATEGORY_BY_PATH) {
    if (pattern.test(u.pathname)) {
      category = cat
      break
    }
  }

  return {
    slug: slugify(name) || slugify(u.hostname),
    name: name || u.hostname,
    category,
    jurisdiction: inferJurisdiction(url),
    regulator: inferRegulator(url),
  }
}
