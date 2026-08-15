/**
 * Task 14 — Sync the 5 new plugins (2 forms + 3 labels) to DB and
 * index their body_text chunks into the vector store.
 *
 * Usage:  bun run scripts/sync-task14-plugins.ts
 */
import { db } from '../src/lib/db'
import { syncCatalogToDb } from '../src/lib/plugins/registry'
import { refreshAndReindex } from '../src/lib/plugins/rag-bridge'

const NEW_SLUGS = [
  'edd-form-framework',
  'sar-next-gen-template',
  'label-ai-ml-risk-tier',
  'label-tm-alert-taxonomy',
  'label-data-sensitivity',
]

async function main() {
  console.log('Task 14 — Sync 5 new plugins + index body_text chunks')
  console.log('=====================================================\n')

  console.log('1. Syncing catalog to DB...')
  await syncCatalogToDb()
  console.log('   OK\n')

  console.log('2. Refreshing + re-indexing the 5 new plugins:')
  for (const slug of NEW_SLUGS) {
    const plugin = await db.plugin.findUnique({
      where: { slug },
      select: { id: true, name: true, jurisdiction: true, category: true, regulator: true }
    })
    if (!plugin) {
      console.log('   FAIL: ' + slug + ' not found in DB after sync')
      continue
    }
    const result = await refreshAndReindex(plugin.id, 'task-14-plugin-sync')
    const reg = plugin.regulator ?? 'INTERNAL'
    console.log('   ' + slug.padEnd(28) + ' | ' + plugin.jurisdiction.padEnd(6) + '/' + plugin.category.padEnd(8) + ' | ' + reg.padEnd(8) + ' | indexed=' + result.chunksIndexed + ' hash=' + result.newHash.slice(0, 10) + '...')
    if (result.error && !result.error.includes('fell back to synthesized')) {
      console.log('     note: ' + result.error)
    }
  }
  console.log()

  console.log('3. Verifying chunk distribution:')
  for (const slug of NEW_SLUGS) {
    const count = await db.knowledgeChunk.count({
      where: { sourceType: 'plugin', sourceId: slug }
    })
    console.log('   ' + slug.padEnd(28) + ' | ' + count + ' chunks')
  }

  const total = await db.knowledgeChunk.count({ where: { sourceType: 'plugin' } })
  console.log('\n4. Total plugin chunks in vector store: ' + total)

  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
