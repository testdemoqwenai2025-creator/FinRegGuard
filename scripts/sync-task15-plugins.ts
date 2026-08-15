/**
 * Task 15 — Sync the 9 new plugins (3 modules x 3 plugins each) to DB and
 * index their body_text chunks into the vector store.
 *
 * Module 4 — AI/ML Governance Frameworks (3 labels):
 *   - label-ai-lifecycle-phase
 *   - label-ai-explainability
 *   - label-ai-fairness-metric
 *
 * Module 5 — Digital Assets & Crypto Regulations (2 forms + 1 label):
 *   - form-mica-casp
 *   - form-travel-rule
 *   - label-defi-compliance
 *
 * Module 6 — ESG/Sustainability Reporting (2 labels + 1 form):
 *   - label-esg-framework
 *   - form-climate-scenario
 *   - label-esg-social-metric
 *
 * Usage:  bun run scripts/sync-task15-plugins.ts
 */
import { db } from '../src/lib/db'
import { syncCatalogToDb } from '../src/lib/plugins/registry'
import { refreshAndReindex } from '../src/lib/plugins/rag-bridge'

const NEW_SLUGS = [
  // Module 4 — AI/ML Governance
  'label-ai-lifecycle-phase',
  'label-ai-explainability',
  'label-ai-fairness-metric',
  // Module 5 — Crypto
  'form-mica-casp',
  'form-travel-rule',
  'label-defi-compliance',
  // Module 6 — ESG
  'label-esg-framework',
  'form-climate-scenario',
  'label-esg-social-metric',
]

async function main() {
  console.log('Task 15 — Sync 9 new plugins + index body_text chunks')
  console.log('=====================================================\n')

  console.log('1. Syncing catalog to DB...')
  await syncCatalogToDb()
  console.log('   OK\n')

  console.log('2. Refreshing + re-indexing the 9 new plugins:')
  for (const slug of NEW_SLUGS) {
    const plugin = await db.plugin.findUnique({
      where: { slug },
      select: { id: true, name: true, jurisdiction: true, category: true, regulator: true }
    })
    if (!plugin) {
      console.log('   FAIL: ' + slug + ' not found in DB after sync')
      continue
    }
    const result = await refreshAndReindex(plugin.id, 'task-15-plugin-sync')
    const reg = plugin.regulator ?? 'INTERNAL'
    console.log('   ' + slug.padEnd(28) + ' | ' + plugin.jurisdiction.padEnd(6) + '/' + plugin.category.padEnd(8) + ' | ' + reg.padEnd(8) + ' | indexed=' + result.chunksIndexed + ' hash=' + result.newHash.slice(0, 10) + '...')
    if (result.error && !result.error.includes('fell back to synthesized')) {
      console.log('     note: ' + result.error)
    }
  }
  console.log()

  console.log('3. Verifying chunk distribution:')
  let totalNew = 0
  for (const slug of NEW_SLUGS) {
    const count = await db.knowledgeChunk.count({
      where: { sourceType: 'plugin', sourceId: slug }
    })
    totalNew += count
    console.log('   ' + slug.padEnd(28) + ' | ' + count + ' chunks')
  }
  console.log('   ' + 'TOTAL NEW'.padEnd(28) + ' | ' + totalNew + ' chunks')

  const total = await db.knowledgeChunk.count({ where: { sourceType: 'plugin' } })
  console.log('\n4. Total plugin chunks in vector store: ' + total)

  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
