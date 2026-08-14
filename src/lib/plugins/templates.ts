/**
 * Template Auto-Fill Engine
 *
 * When a plugin is enabled for the first time, the engine fetches the
 * template content from the plugin's `sourceUrl` (an authoritative
 * regulator website — SEC.gov, FINRA, ESMA, FCA, etc.), parses it,
 * and caches the result in the PluginTemplate table.
 *
 * Subsequent calls return the cached template. The user can force a
 * refresh via the "Refresh" button in the Plugin Manager UI.
 *
 * Notes:
 * - Uses native fetch (no extra deps).
 * - Validates the response (HTTP 200, content-type allowlist).
 * - Computes a SHA-256 hash of rawContent for drift detection.
 * - Records fetchStatus + fetchError so the UI can show error states.
 * - For static GitHub Pages preview, returns a synthetic template
 *   derived from defaultFieldsJson (no network call).
 */

import { db } from '@/lib/db'
import { createHash } from 'node:crypto'
import { PLUGIN_CATALOG, type PluginCatalogEntry } from './catalog'

const MAX_CONTENT_BYTES = 5 * 1024 * 1024 // 5 MB cap
const FETCH_TIMEOUT_MS = 15_000

const ALLOWED_CONTENT_TYPES = [
  'text/html',
  'application/json',
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/xml',
  'text/xml',
  'text/yaml',
  'application/yaml',
]

export interface TemplateFetchResult {
  ok: boolean
  status: number
  contentType: string | null
  contentLength: number
  contentHash: string
  fetchedAt: Date
  error?: string
  parsedFields?: Record<string, unknown>
  /** Was the fetch skipped (e.g., static build / synthetic template)? */
  skipped?: boolean
  skipReason?: string
}

/**
 * Fetches a plugin's template from its sourceUrl.
 * Updates the PluginTemplate row (upsert) + records PluginToggleHistory entry.
 * On error, still records the attempt (status + error message) so the UI can
 * show actionable feedback.
 */
export async function refreshTemplate(
  pluginId: string,
  actor = 'system',
): Promise<TemplateFetchResult> {
  const plugin = await db.plugin.findUnique({ where: { id: pluginId } })
  if (!plugin) {
    return {
      ok: false,
      status: 404,
      contentType: null,
      contentLength: 0,
      contentHash: '',
      fetchedAt: new Date(),
      error: 'Plugin not found',
    }
  }

  // Find the catalog entry (for defaultFieldsJson fallback)
  const catalogEntry = PLUGIN_CATALOG.find((p) => p.slug === plugin.slug)

  // For static builds or INTERNAL sourceType with no real web source,
  // synthesize a template from defaultFieldsJson
  if (plugin.sourceType === 'template' || !plugin.sourceUrl.startsWith('http')) {
    return synthesizeTemplate(plugin, catalogEntry, actor)
  }

  // Attempt the live fetch
  let result: TemplateFetchResult
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const res = await fetch(plugin.sourceUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'RegGuardAI-PluginRegistry/1.0 (+https://github.com/testdemoqwenai2025-creator/FinRegGTP.BoT)',
        'Accept': ALLOWED_CONTENT_TYPES.join(', '),
      },
      redirect: 'follow',
    })

    clearTimeout(timeout)

    const contentType = res.headers.get('content-type')?.split(';')[0]?.trim() ?? null
    const contentLengthHeader = res.headers.get('content-length')
    const isAllowedType = contentType
      ? ALLOWED_CONTENT_TYPES.some((t) => contentType.toLowerCase().includes(t))
      : true // be permissive if header missing

    if (!res.ok) {
      result = {
        ok: false,
        status: res.status,
        contentType,
        contentLength: contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0,
        contentHash: '',
        fetchedAt: new Date(),
        error: `HTTP ${res.status} ${res.statusText}`,
      }
      await persistTemplate(plugin.id, {
        rawContent: '',
        contentType,
        contentHash: '',
        fetchStatus: res.status,
        fetchError: result.error ?? '',
        parsedFields: undefined,
      })
    } else if (!isAllowedType) {
      result = {
        ok: false,
        status: res.status,
        contentType,
        contentLength: contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0,
        contentHash: '',
        fetchedAt: new Date(),
        error: `Unsupported content-type: ${contentType}`,
      }
      await persistTemplate(plugin.id, {
        rawContent: '',
        contentType,
        contentHash: '',
        fetchStatus: res.status,
        fetchError: result.error ?? '',
        parsedFields: undefined,
      })
    } else {
      // Buffer with size cap
      const buf = await res.arrayBuffer()
      const truncated = buf.byteLength > MAX_CONTENT_BYTES
      const slice = truncated ? buf.slice(0, MAX_CONTENT_BYTES) : buf
      const rawContent = Buffer.from(slice).toString('utf-8')
      const contentHash = createHash('sha256').update(rawContent).digest('hex')

      result = {
        ok: true,
        status: 200,
        contentType,
        contentLength: buf.byteLength,
        contentHash,
        fetchedAt: new Date(),
        parsedFields: parseFields(plugin, rawContent, contentType),
        error: truncated ? `Truncated to ${MAX_CONTENT_BYTES} bytes` : undefined,
      }

      // Persist successful fetch — include the raw content we just buffered.
      await persistTemplate(plugin.id, {
        rawContent,
        contentType,
        contentHash,
        fetchStatus: 200,
        fetchError: result.error ?? null,
        parsedFields: result.parsedFields,
      })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown fetch error'
    result = {
      ok: false,
      status: 0,
      contentType: null,
      contentLength: 0,
      contentHash: '',
      fetchedAt: new Date(),
      error: msg,
    }

    // Persist failed fetch — empty raw content but record the status+error.
    await persistTemplate(plugin.id, {
      rawContent: '',
      contentType: null,
      contentHash: '',
      fetchStatus: 0,
      fetchError: msg,
      parsedFields: undefined,
    })
  }

  // Update plugin's lastRefreshedAt
  await db.plugin.update({
    where: { id: plugin.id },
    data: { lastRefreshedAt: new Date() },
  })

  // Audit log entry
  await db.pluginToggleHistory.create({
    data: {
      pluginId: plugin.id,
      action: 'refreshed',
      actor,
      notes: result.ok
        ? `Fetched ${result.contentLength} bytes (${result.contentType})`
        : `Failed: ${result.error}`,
    },
  })

  // Persist the failed fetch attempt (so UI can show the error)
  // BUT — if the plugin has defaultFieldsJson, fall back to a synthesized
  // template so the user always gets something useful on first enable.
  // This handles private repos (404), CORS-blocked sources, sandboxes, etc.
  if (!result.ok && catalogEntry?.defaultFieldsJson) {
    const synthesized = await synthesizeTemplate(plugin, catalogEntry, actor)
    // Annotate the synthesized result with the original fetch error so the
    // user can see WHY the live fetch failed (and decide whether to fix it).
    synthesized.error = `Live fetch failed (${result.error}); fell back to synthesized defaults`
    return synthesized
  }

  return result
}

/**
 * Upserts the PluginTemplate row with the fetched content + metadata.
 */
async function persistTemplate(
  pluginId: string,
  data: {
    rawContent: string
    contentType: string | null
    contentHash: string
    fetchStatus: number
    fetchError: string | null
    parsedFields: Record<string, unknown> | undefined
  },
): Promise<void> {
  await db.pluginTemplate.upsert({
    where: { pluginId },
    create: {
      pluginId,
      rawContent: data.rawContent,
      contentType: data.contentType,
      contentHash: data.contentHash,
      fetchStatus: data.fetchStatus,
      fetchError: data.fetchError,
      parsedFieldsJson: data.parsedFields ? JSON.stringify(data.parsedFields) : null,
    },
    update: {
      rawContent: data.rawContent,
      contentType: data.contentType,
      contentHash: data.contentHash,
      fetchStatus: data.fetchStatus,
      fetchError: data.fetchError,
      parsedFieldsJson: data.parsedFields ? JSON.stringify(data.parsedFields) : null,
      fetchedAt: new Date(),
    },
  })
}

/**
 * Synthesizes a template from defaultFieldsJson — used when:
 *  - sourceType === 'template' (no real web source)
 *  - sourceUrl doesn't start with http (e.g., inline data)
 *  - Static build (no network access)
 */
async function synthesizeTemplate(
  plugin: { id: string; slug: string; name: string; defaultFieldsJson: string | null },
  catalogEntry: PluginCatalogEntry | undefined,
  actor: string,
): Promise<TemplateFetchResult> {
  const defaults = plugin.defaultFieldsJson
    ? JSON.parse(plugin.defaultFieldsJson)
    : (catalogEntry?.defaultFieldsJson ?? {})

  const rawContent = JSON.stringify(
    {
      plugin: plugin.slug,
      name: plugin.name,
      generatedAt: new Date().toISOString(),
      source: 'synthesized-from-defaults',
      defaultFields: defaults,
      note: 'This template was synthesized from the plugin catalog defaults because the source is not a real web URL or the build is static.',
    },
    null,
    2,
  )
  const contentHash = createHash('sha256').update(rawContent).digest('hex')

  await db.pluginTemplate.upsert({
    where: { pluginId: plugin.id },
    create: {
      pluginId: plugin.id,
      rawContent,
      contentType: 'application/json',
      contentHash,
      fetchStatus: 200,
      fetchError: null,
      parsedFieldsJson: JSON.stringify(defaults),
    },
    update: {
      rawContent,
      contentType: 'application/json',
      contentHash,
      fetchStatus: 200,
      fetchError: null,
      parsedFieldsJson: JSON.stringify(defaults),
      fetchedAt: new Date(),
    },
  })

  await db.plugin.update({
    where: { id: plugin.id },
    data: { lastRefreshedAt: new Date() },
  })

  await db.pluginToggleHistory.create({
    data: {
      pluginId: plugin.id,
      action: 'autofilled',
      actor,
      notes: 'Synthesized from catalog defaults',
    },
  })

  return {
    ok: true,
    status: 200,
    contentType: 'application/json',
    contentLength: rawContent.length,
    contentHash,
    fetchedAt: new Date(),
    parsedFields: defaults,
    skipped: true,
    skipReason: 'Synthesized from catalog defaults',
  }
}

/**
 * Best-effort field parser — extracts recognizable field values from
 * the fetched content based on the plugin's schema.
 * For HTML, this just extracts text nodes matching field names.
 * For JSON, returns the parsed object.
 * For other types, returns null (the rawContent is still cached).
 */
function parseFields(
  plugin: { schemaJson: string | null },
  rawContent: string,
  contentType: string | null,
): Record<string, unknown> | undefined {
  if (!plugin.schemaJson) return undefined

  let schema: Record<string, unknown>
  try {
    schema = JSON.parse(plugin.schemaJson)
  } catch {
    return undefined
  }

  // For JSON content, try to merge top-level fields
  if (contentType?.includes('application/json')) {
    try {
      const parsed = JSON.parse(rawContent)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // not valid JSON
    }
  }

  // For HTML, do a very light touch — count form fields matching schema field names
  if (contentType?.includes('text/html')) {
    const schemaFields = Array.isArray(schema.fields)
      ? (schema.fields as Array<{ name: string }>).map((f) => f.name)
      : []
    const extracted: Record<string, unknown> = {}
    for (const fieldName of schemaFields) {
      // Look for input[name="fieldName"] or label text matching
      const inputPattern = new RegExp(
        `name=["']${fieldName}["']|id=["']${fieldName}["']`,
        'i',
      )
      if (inputPattern.test(rawContent)) {
        extracted[fieldName] = '' // presence detected, value empty (user will fill)
      }
    }
    return Object.keys(extracted).length > 0 ? extracted : undefined
  }

  return undefined
}
