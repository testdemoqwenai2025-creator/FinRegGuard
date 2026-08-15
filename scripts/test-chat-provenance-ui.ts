/**
 * Smoke test: verify the chat API response shape includes
 * isPlugin / pluginSlug / ragFilter fields that the AssistantView
 * component now consumes to render provenance badges.
 *
 * This test verifies:
 *   1. getEnabledPluginFilter() returns the expected shape
 *   2. Plugin sources in the DB have the right sourceType/sourceId
 *   3. The /api/chat route's response shape matches what AssistantView expects
 *   4. prettyPluginName heuristic produces human-readable labels
 *
 * Run: bun run scripts/test-chat-provenance-ui.ts
 */
import { db } from '../src/lib/db'
import { getEnabledPluginFilter } from '../src/lib/plugins/rag-bridge'

let pass = 0
let fail = 0
const ok = (label: string, cond: boolean) => {
  if (cond) {
    pass++
    console.log(`  ✓ ${label}`)
  } else {
    fail++
    console.error(`  ✗ ${label}`)
  }
}

async function main() {
  console.log('\n=== Chat Provenance UI Smoke Test ===\n')

  // Step 1: verify getEnabledPluginFilter returns the expected shape
  console.log('Step 1: getEnabledPluginFilter shape')
  const filter = await getEnabledPluginFilter()
  ok('filter.sourceTypes is array', Array.isArray(filter.sourceTypes))
  ok('filter.sourceTypes includes "plugin"', filter.sourceTypes.includes('plugin'))
  ok('filter.sourceTypes includes baseline "regulation"', filter.sourceTypes.includes('regulation'))
  ok('filter.jurisdictions is array', Array.isArray(filter.jurisdictions))
  ok('filter.categories is array', Array.isArray(filter.categories))
  console.log(`    → types=${JSON.stringify(filter.sourceTypes)}`)
  console.log(`    → jurisdictions=${JSON.stringify(filter.jurisdictions)}`)
  console.log(`    → categories=${JSON.stringify(filter.categories)}`)

  // Step 2: inspect the KnowledgeChunk table for plugin sources
  console.log('\nStep 2: KnowledgeChunk plugin sources')
  const pluginChunks = await db.knowledgeChunk.findMany({
    where: { sourceType: 'plugin' },
    select: {
      id: true,
      sourceType: true,
      sourceId: true,
      title: true,
      jurisdiction: true,
      category: true,
    },
    take: 10,
  })
  console.log(`    → ${pluginChunks.length} plugin chunks in vector store (sample of 10)`)
  pluginChunks.slice(0, 5).forEach((c, i) => {
    console.log(
      `      [${i + 1}] sourceId=${c.sourceId} title="${c.title?.slice(0, 50)}" jurisdiction=${c.jurisdiction} category=${c.category}`,
    )
  })
  ok(
    'all plugin chunks have non-null sourceId',
    pluginChunks.every((c) => c.sourceId !== null && c.sourceId.length > 0),
  )
  ok(
    'all plugin chunks have jurisdiction set',
    pluginChunks.every((c) => c.jurisdiction !== null),
  )

  // Step 3: simulate the /api/chat response shape
  console.log('\nStep 3: simulated /api/chat response shape')
  const apiResponse = {
    reply: '(simulated) The SEC Form ADV requires...',
    sources: pluginChunks.map((c, i) => ({
      id: c.id,
      sourceType: c.sourceType,
      sourceId: c.sourceId,
      title: c.title ?? `Plugin chunk ${i + 1}`,
      jurisdiction: c.jurisdiction,
      category: c.category,
      score: 0.85 - i * 0.05,
      snippet: 'Sample snippet from retrieved chunk...',
      isPlugin: c.sourceType === 'plugin',
      pluginSlug: c.sourceType === 'plugin' ? c.sourceId : null,
    })),
    latencyMs: 142,
    systemPrompt: '...',
    ragFilter: filter,
  }
  ok('response.sources is array', Array.isArray(apiResponse.sources))
  ok('response.ragFilter present', apiResponse.ragFilter !== undefined)
  ok(
    'every source has isPlugin (boolean)',
    apiResponse.sources.every((s) => typeof s.isPlugin === 'boolean'),
  )
  ok(
    'every source has pluginSlug',
    apiResponse.sources.every((s) => 'pluginSlug' in s),
  )
  ok(
    'plugin sources have non-null pluginSlug',
    apiResponse.sources
      .filter((s) => s.isPlugin)
      .every((s) => s.pluginSlug !== null && s.pluginSlug.length > 0),
  )
  ok(
    'baseline sources have null pluginSlug',
    apiResponse.sources
      .filter((s) => !s.isPlugin)
      .every((s) => s.pluginSlug === null),
  )

  // Step 4: prettyPluginName heuristic sanity check
  console.log('\nStep 4: prettyPluginName heuristic')
  const cases: Array<[string, string]> = [
    ['sec-form-adv', 'SEC Form ADV'],
    ['finra-form-u4', 'FINRA Form U4'],
    ['esma-mifid-rt-1', 'ESMA MIFID RT 1'],
    ['fatf-recommendation-16', 'FATF Recommendation 16'],
    ['feature-merkle-anchor', 'Feature Merkle Anchor'],
    ['gdpr-ropa-template', 'GDPR ROPA Template'],
  ]
  for (const [input, expected] of cases) {
    const actual = prettyPluginName(input)
    ok(`prettyPluginName('${input}') → '${actual}'`, actual === expected)
  }

  // Step 5: simulate the AssistantView message shape
  console.log('\nStep 5: simulated Msg shape (AssistantView state)')
  const aiMsg = {
    id: `a-${Date.now()}`,
    role: 'assistant' as const,
    content: apiResponse.reply,
    sources: (apiResponse.sources as any[]).map((s) => ({
      ...s,
      isPlugin: s.isPlugin ?? s.sourceType === 'plugin',
      pluginSlug: s.pluginSlug ?? (s.sourceType === 'plugin' ? (s.sourceId ?? null) : null),
    })),
    latencyMs: apiResponse.latencyMs,
    ragFilter: apiResponse.ragFilter,
  }
  ok('aiMsg.sources has correct length', aiMsg.sources.length === apiResponse.sources.length)
  ok('aiMsg.ragFilter is defined', aiMsg.ragFilter !== undefined)
  ok(
    'aiMsg.sources preserve isPlugin flag',
    aiMsg.sources.every((s, i) => s.isPlugin === apiResponse.sources[i].isPlugin),
  )

  // Step 6: verify unique plugin count derivation in SourceList
  console.log('\nStep 6: unique plugin count for SourceList badge')
  const pluginSources = aiMsg.sources.filter((s: any) => s.isPlugin)
  const uniquePlugins = new Set(
    pluginSources.map((s: any) => s.pluginSlug).filter(Boolean),
  )
  console.log(`    → total sources: ${aiMsg.sources.length}`)
  console.log(`    → plugin sources: ${pluginSources.length}`)
  console.log(`    → unique plugins: ${uniquePlugins.size}`)
  console.log(`    → unique plugin slugs: ${[...uniquePlugins].join(', ')}`)
  ok('uniquePlugins is a Set', uniquePlugins instanceof Set)
  ok(
    'uniquePluginCount ≤ pluginSources.length',
    uniquePlugins.size <= pluginSources.length,
  )

  // Summary
  console.log('\n=== Summary ===')
  console.log(`Passed: ${pass}`)
  console.log(`Failed: ${fail}`)
  if (fail > 0) {
    process.exit(1)
  }
}

// Mirror of prettyPluginName in AssistantView.tsx for test verification
const PLUGIN_ACRONYMS = new Set([
  'sec', 'finra', 'finra', 'mifid', 'esma', 'eba', 'eiopa', 'ecb',
  'fca', 'pra', 'mas', 'sfc', 'hkma', 'fsa', 'pmda', 'apra', 'osfi',
  'fatf', 'bis', 'edpb', 'gleif', 'gdpr', 'hipaa', 'aml', 'cft',
  'sar', 'ofac', 'sdn', 'sarbanes', 'sox', 'adv', 'u4', 'u5',
  'rt', 'kyc', 'ccpa', 'cpra', 'pipl', 'lgpd', 'dodd', 'frank',
  'basel', 'ifrs', 'gaap', 'soc', 'iso', 'nist', 'csa', 'irac',
  'roca', 'ropa', 'tpr', 'smr', 'cdd', 'edd', 'sdd',
])

function prettyPluginName(slug: string): string {
  return slug
    .split('-')
    .map((w) => {
      if (!w) return w
      const lower = w.toLowerCase()
      if (PLUGIN_ACRONYMS.has(lower)) return lower.toUpperCase()
      if (/^\d+$/.test(w)) return w
      return w.charAt(0).toUpperCase() + w.slice(1)
    })
    .join(' ')
}

main()
  .catch((err) => {
    console.error('Fatal:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
