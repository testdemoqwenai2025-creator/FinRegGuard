/**
 * Task 13 — EU Corpus Diversification
 *
 * Syncs the catalog (so the 3 new EU plugins — eba-stress-test-2026,
 * crr-article-107, eba-pillar-3-rwa — are upserted into the Plugin table),
 * then calls refreshAndReindex for each one so the templates are
 * synthesized from defaultFieldsJson.body_text and the resulting chunks
 * are indexed into KnowledgeChunk.
 *
 * After this script runs, the EU plugin corpus will have ~3 plugins
 * with ~8-15 chunks each (instead of 1 plugin with 235 chunks), so
 * retrieval for EBA regulator cases no longer collapses onto gdpr-ropa.
 *
 * Usage:  bun run scripts/sync-eu-plugins.ts
 */
import { db } from '../src/lib/db'
import { syncCatalogToDb } from '../src/lib/plugins/registry'
import { refreshAndReindex } from '../src/lib/plugins/rag-bridge'

const NEW_EU_SLUGS = ['eba-stress-test-2026', 'crr-article-107', 'eba-pillar-3-rwa']

async function main() {
  console.log('Task 13 — EU Corpus Diversification')
  console.log('=====================================\n')

  // 1. Sync catalog -> DB (inserts the 3 new EU plugins with enabledByDefault=true)
  console.log('1. Syncing catalog to DB...')
  await syncCatalogToDb()
  console.log('   OK\n')

  // 2. For each new plugin, call refreshAndReindex to synthesize the
  //    template (body_text emitted as raw paragraphs) + index chunks
  console.log('2. Refreshing + re-indexing the 3 new EU plugins:')
  for (const slug of NEW_EU_SLUGS) {
    const plugin = await db.plugin.findUnique({
      where: { slug },
      select: { id: true, name: true, jurisdiction: true, category: true }
    })
    if (!plugin) {
      console.log(`   FAIL: ${slug} not found in DB after sync`)
      continue
    }
    const result = await refreshAndReindex(plugin.id, 'task-13-eu-diversify')
    console.log(`   ${slug.padEnd(28)} | ${plugin.jurisdiction}/${plugin.category} | indexed=${result.chunksIndexed} deleted=${result.chunksDeleted} hash=${result.newHash.slice(0, 10)}…`)
    if (result.error) console.log(`     note: ${result.error}`)
  }
  console.log()

  // 3. Verify the new chunk distribution
  console.log('3. Verifying EU plugin chunk distribution:')
  const euChunks = await db.knowledgeChunk.findMany({
    where: { sourceType: 'plugin', jurisdiction: 'EU' },
    select: { sourceId: true, content: true }
  })
  const bySlug = new Map<string, number>()
  for (const c of euChunks) {
    bySlug.set(c.sourceId, (bySlug.get(c.sourceId) ?? 0) + 1)
  }
  const sorted = Array.from(bySlug.entries()).sort((a, b) => b[1] - a[1])
  for (const [slug, count] of sorted) {
    console.log(`   ${slug.padEnd(28)} | ${count} chunks`)
  }
  console.log(`   Total EU plugin chunks: ${euChunks.length}\n`)

  // 4. Total plugin chunks across all jurisdictions
  const total = await db.knowledgeChunk.count({ where: { sourceType: 'plugin' } })
  console.log(`4. Total plugin chunks in vector store: ${total}`)

  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
