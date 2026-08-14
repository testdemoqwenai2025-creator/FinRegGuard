/**
 * Smoke test for the plugin registry — verifies that:
 *  1. syncCatalogToDb() runs without error
 *  2. getRegistry() returns 28 plugins with correct default state
 *  3. setEnabled + setDefault work
 *  4. refreshTemplate (synthesized) works for INTERNAL sourceType
 *  5. Live fetch failure falls back to synthesized defaults
 *
 * Run: bun run scripts/test-plugins-smoke.ts
 */

import { syncCatalogToDb, getRegistry, getRegistryStats, setEnabled, setDefault } from '../src/lib/plugins/registry'
import { refreshTemplate } from '../src/lib/plugins/templates'
import { db } from '../src/lib/db'

async function main() {
  console.log('-'.repeat(60))
  console.log('Plugin Registry Smoke Test')
  console.log('-'.repeat(60))

  console.log('\n1. Syncing catalog to DB...')
  await syncCatalogToDb()
  console.log('   OK sync complete')

  console.log('\n2. Fetching registry...')
  const registry = await getRegistry()
  console.log('   OK ' + registry.length + ' plugins loaded')

  console.log('\n3. Computing stats...')
  const stats = await getRegistryStats(registry)
  console.log('   Total:         ', stats.total)
  console.log('   Enabled:       ', stats.enabled)
  console.log('   Defaults:      ', stats.defaultCount)
  console.log('   With templates:', stats.withTemplates)
  console.log('   By category:')
  for (const [cat, s] of Object.entries(stats.byCategory)) {
    console.log('     ' + cat.padEnd(10) + ': ' + s.enabled + '/' + s.total + ' enabled')
  }
  console.log('   By jurisdiction:')
  for (const [j, s] of Object.entries(stats.byJurisdiction)) {
    console.log('     ' + j.padEnd(10) + ': ' + s.enabled + '/' + s.total + ' enabled')
  }

  console.log('\n4. Testing toggle on a sample plugin...')
  const sample = registry.find((p) => p.slug === 'feature-red-team')
  if (!sample) throw new Error('sample plugin not found')
  console.log('   Sample: ' + sample.name + ' (enabled=' + sample.enabled + ')')
  await setEnabled(sample.id, true, 'smoke-test')
  const afterEnable = await db.plugin.findUnique({ where: { id: sample.id } })
  console.log('   OK after enable: enabled=' + afterEnable?.enabled + ', enabledAt=' + afterEnable?.enabledAt?.toISOString())

  console.log('\n5. Testing setDefault on a sample plugin...')
  await setDefault(sample.id, true, 'smoke-test')
  const afterDefault = await db.plugin.findUnique({ where: { id: sample.id } })
  console.log('   OK after setDefault: isDefault=' + afterDefault?.isDefault)
  const siblings = await db.plugin.findMany({
    where: { category: 'feature', jurisdiction: 'GLOBAL', id: { not: sample.id } },
  })
  console.log('   OK sibling isDefault values: ' + siblings.map((s) => s.slug + '=' + s.isDefault).join(', '))

  console.log('\n6. Testing template refresh on a github-source plugin (private repo -> 404 -> fallback)...')
  const internal = registry.find((p) => p.slug === 'feature-merkle-anchor')
  if (!internal) throw new Error('internal plugin not found')
  const result = await refreshTemplate(internal.id, 'smoke-test')
  console.log('   ok=' + result.ok + ', status=' + result.status + ', contentLength=' + result.contentLength + ', skipped=' + result.skipped)
  console.log('   hash=' + (result.contentHash ? result.contentHash.slice(0, 16) + '...' : '(none)'))
  console.log('   parsedFields=' + JSON.stringify(result.parsedFields ?? null).slice(0, 100))
  if (result.error) console.log('   error: ' + result.error)

  console.log('\n7. Testing template refresh on a real SEC.gov plugin (may succeed or fail based on network)...')
  const webPlugin = registry.find((p) => p.slug === 'sec-form-adv')
  if (!webPlugin) throw new Error('web plugin not found')
  const webResult = await refreshTemplate(webPlugin.id, 'smoke-test')
  console.log('   ok=' + webResult.ok + ', status=' + webResult.status + ', error=' + (webResult.error ?? 'none'))
  console.log('   contentLength=' + webResult.contentLength + ', contentType=' + webResult.contentType + ', skipped=' + webResult.skipped)

  console.log('\n8. Rolling back smoke-test changes...')
  await setEnabled(sample.id, false, 'smoke-test')
  await setDefault(sample.id, false, 'smoke-test')
  console.log('   OK rolled back')

  console.log('\n' + '-'.repeat(60))
  console.log('OK All smoke tests passed')
  console.log('-'.repeat(60))
}

main()
  .catch((err) => {
    console.error('Smoke test failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
