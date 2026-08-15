#!/usr/bin/env bun
/**
 * Generates the static snapshot of the plugin registry for GitHub Pages
 * preview mode. Mirrors the shape returned by `GET /api/plugins` so the
 * PluginManagerView can fetch from `dataUrl('plugins')` in both dev and
 * static modes without branching.
 *
 * Output: public/data/plugins.json
 */

import { PLUGIN_CATALOG, catalogStats } from '../src/lib/plugins/catalog'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const now = new Date().toISOString()

const plugins = PLUGIN_CATALOG.map((p, idx) => ({
  id: `static-${idx + 1}`,
  ...p,
  enabled: p.enabledByDefault ?? false,
  isDefault: p.defaultForCategory ?? false,
  lastRefreshedAt: null,
  enabledAt: p.enabledByDefault ? now : null,
  hasTemplate: false,
  templateFetchStatus: undefined,
  templateFetchedAt: null,
}))

const stats = catalogStats()

const snapshot = {
  plugins,
  stats,
  total: plugins.length,
  generatedAt: now,
  source: 'static-catalog-snapshot',
}

const outPath = resolve(process.cwd(), 'public/data/plugins.json')
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(snapshot, null, 2))

console.log(`✓ Wrote ${outPath}`)
console.log(`  ${plugins.length} plugins · ${stats.enabledByDefault} enabled by default · ${stats.defaultForCategory} defaults`)
console.log(`  by category:`, stats.byCategory)
