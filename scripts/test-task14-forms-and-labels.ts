/**
 * Task 14 — End-to-end smoke test
 *
 * Validates BOTH themes delivered in Task 14:
 *
 *  A. Modern Regulatory Forms & Templates
 *     - 2 new form plugins (edd-form-framework, sar-next-gen-template)
 *       exist in catalog + DB, with body_text payloads
 *     - Each plugin has >=5 chunks indexed (not 1-2 from old JSON-stringified defaults)
 *     - EDD query retrieves edd-form-framework chunks
 *     - SAR query retrieves sar-next-gen-template chunks
 *     - ReportingEvolutionView data file has 7 eras (2010-2030)
 *
 *  B. Advanced Compliance Labels & Classifications
 *     - 3 new label plugins (label-ai-ml-risk-tier, label-tm-alert-taxonomy,
 *       label-data-sensitivity) exist in catalog + DB
 *     - Each has >=5 chunks indexed from body_text (not HTML)
 *     - AI/ML Model Risk data file has 4 tiers + 14 models
 *     - TM Alert Taxonomy data file has exactly 20 categories
 *     - Data Sensitivity data file has 5 tiers + 14 assets
 *
 * Note: Talks directly to DB and retrieve() to avoid Turbopack memory pressure.
 *
 * Usage:  bun run scripts/test-task14-forms-and-labels.ts
 */
import { promises as fs } from 'fs'
import path from 'path'
import { db } from '../src/lib/db'
import { retrieve } from '../src/lib/ai/vector-store'
import { PLUGIN_CATALOG } from '../src/lib/plugins/catalog'

let pass = 0
let fail = 0

function ok(label: string, cond: boolean, detail?: string) {
  if (cond) {
    pass++
    console.log('  PASS  ' + label + (detail ? '  (' + detail + ')' : ''))
  } else {
    fail++
    console.log('  FAIL  ' + label + (detail ? '  — ' + detail : ''))
  }
}

async function main() {
  console.log('Task 14 — End-to-End Smoke Test')
  console.log('================================\n')

  // ─── A. Modern Regulatory Forms & Templates ────────────────────
  console.log('A. Modern Regulatory Forms & Templates')
  console.log('----------------------------------------')

  const formSlugs = ['edd-form-framework', 'sar-next-gen-template']
  for (const slug of formSlugs) {
    const entry = PLUGIN_CATALOG.find((p) => p.slug === slug)
    ok('catalog has ' + slug, !!entry, entry ? entry.regulator + '/' + entry.jurisdiction : 'not found')
  }

  // A.2 Both have body_text in defaultFieldsJson
  for (const slug of formSlugs) {
    const entry = PLUGIN_CATALOG.find((p) => p.slug === slug)
    const bodyText = entry?.defaultFieldsJson?.body_text
    ok(slug + ' has body_text', typeof bodyText === 'string',
      typeof bodyText === 'string' ? bodyText.length + ' chars' : 'missing')
  }

  // A.3 DB rows exist + enabled
  for (const slug of formSlugs) {
    const row = await db.plugin.findUnique({ where: { slug } })
    ok(slug + ' in DB + enabled', !!row && row.enabled, row ? 'enabled=' + row.enabled : 'not in DB')
  }

  // A.4 Each plugin has >=5 chunks indexed (not 1-2 from JSON-stringified defaults)
  for (const slug of formSlugs) {
    const count = await db.knowledgeChunk.count({
      where: { sourceType: 'plugin', sourceId: slug }
    })
    ok(slug + ' has >=5 chunks', count >= 5, 'got ' + count)
  }

  // A.5 Chunks contain body_text (not HTML from live fetch)
  for (const slug of formSlugs) {
    const sample = await db.knowledgeChunk.findFirst({
      where: { sourceType: 'plugin', sourceId: slug },
      select: { content: true },
    })
    const isHtml = sample?.content.includes('<!doctype html') || sample?.content.includes('<script')
    ok(slug + ' chunks are body_text (not HTML)', !isHtml,
      isHtml ? 'CONTAINS HTML — body_text short-circuit not applied' : 'clean prose')
  }

  // A.6 EDD query retrieves edd-form-framework chunks (not gdpr-ropa)
  const eddQuery = 'EDD Form Framework — Enhanced Due Diligence — biometric matching — beneficial ownership 25% — source of funds blockchain verification — FinCEN'
  const eddScored = await retrieve(eddQuery, 5, {
    sourceTypes: ['plugin'],
    jurisdictions: ['US'],
    categories: ['form'],
  })
  const eddSlugs = new Set(eddScored.map((s) => s.sourceId))
  ok('EDD query retrieves edd-form-framework', eddSlugs.has('edd-form-framework'),
    'slugs: ' + Array.from(eddSlugs).join(', '))

  // A.7 SAR query retrieves sar-next-gen-template
  const sarQuery = 'SAR Next-Generation Template — FinCEN BSA E-Filing — FATF typology — machine-readable — MLRO certification'
  const sarScored = await retrieve(sarQuery, 5, {
    sourceTypes: ['plugin'],
    jurisdictions: ['US'],
    categories: ['form'],
  })
  const sarSlugs = new Set(sarScored.map((s) => s.sourceId))
  ok('SAR query retrieves sar-next-gen-template', sarSlugs.has('sar-next-gen-template'),
    'slugs: ' + Array.from(sarSlugs).join(', '))

  // A.8 ReportingEvolutionView data file has 7 eras
  const evData = JSON.parse(await fs.readFile(
    path.join(process.cwd(), 'public', 'data', 'reporting-evolution.json'),
    'utf8'
  ))
  ok('reporting-evolution.json has 7 eras', evData.eras?.length === 7, 'got ' + evData.eras?.length)
  ok('reporting-evolution has summary.currentEra', evData.summary?.currentEra === '2024-2026',
    'got ' + evData.summary?.currentEra)
  ok('reporting-evolution has trajectory string', typeof evData.summary?.trajectory === 'string',
    evData.summary?.trajectory?.slice(0, 60))

  console.log()

  // ─── B. Advanced Compliance Labels & Classifications ───────────
  console.log('B. Advanced Compliance Labels & Classifications')
  console.log('------------------------------------------------')

  const labelSlugs = ['label-ai-ml-risk-tier', 'label-tm-alert-taxonomy', 'label-data-sensitivity']
  for (const slug of labelSlugs) {
    const entry = PLUGIN_CATALOG.find((p) => p.slug === slug)
    ok('catalog has ' + slug, !!entry, entry ? entry.regulator + '/' + entry.jurisdiction : 'not found')
  }

  // B.2 Each has body_text
  for (const slug of labelSlugs) {
    const entry = PLUGIN_CATALOG.find((p) => p.slug === slug)
    const bodyText = entry?.defaultFieldsJson?.body_text
    ok(slug + ' has body_text', typeof bodyText === 'string',
      typeof bodyText === 'string' ? bodyText.length + ' chars' : 'missing')
  }

  // B.3 DB rows + enabled
  for (const slug of labelSlugs) {
    const row = await db.plugin.findUnique({ where: { slug } })
    ok(slug + ' in DB + enabled', !!row && row.enabled, row ? 'enabled=' + row.enabled : 'not in DB')
  }

  // B.4 Each has >=5 chunks indexed (label-data-sensitivity specifically:
  // previously had 232 junk HTML chunks; should now have ~17 from body_text)
  for (const slug of labelSlugs) {
    const count = await db.knowledgeChunk.count({
      where: { sourceType: 'plugin', sourceId: slug }
    })
    ok(slug + ' has >=5 chunks', count >= 5 && count < 100, 'got ' + count)
  }

  // B.5 label-tm-alert-taxonomy schema lists 20 categories
  const tmEntry = PLUGIN_CATALOG.find((p) => p.slug === 'label-tm-alert-taxonomy')
  const tmCategories = tmEntry?.defaultFieldsJson?.categories as string[] | undefined
  ok('label-tm-alert-taxonomy lists 20 categories', Array.isArray(tmCategories) && tmCategories.length === 20,
    'got ' + (tmCategories?.length ?? 'undefined'))

  // B.6 label-ai-ml-risk-tier schema lists 4 tiers (critical/high/medium/low)
  const aimEntry = PLUGIN_CATALOG.find((p) => p.slug === 'label-ai-ml-risk-tier')
  const aimTiers = aimEntry?.defaultFieldsJson?.tiers as any[] | undefined
  ok('label-ai-ml-risk-tier lists 4 tiers', Array.isArray(aimTiers) && aimTiers.length === 4,
    'got ' + (aimTiers?.length ?? 'undefined'))
  if (Array.isArray(aimTiers)) {
    const tierNames = aimTiers.map((t) => t.tier).sort()
    ok('tiers are critical/high/medium/low',
      JSON.stringify(tierNames) === JSON.stringify(['critical', 'high', 'low', 'medium']),
      'got ' + JSON.stringify(tierNames))
  }

  // B.7 label-data-sensitivity schema lists 5 tiers (restricted/confidential/internal/public/deprecated)
  const dsEntry = PLUGIN_CATALOG.find((p) => p.slug === 'label-data-sensitivity')
  const dsTiers = dsEntry?.defaultFieldsJson?.tiers as any[] | undefined
  ok('label-data-sensitivity lists 5 tiers', Array.isArray(dsTiers) && dsTiers.length === 5,
    'got ' + (dsTiers?.length ?? 'undefined'))

  // B.8 AiModelRiskView data file has 14 models + 4 tiers
  const aimData = JSON.parse(await fs.readFile(
    path.join(process.cwd(), 'public', 'data', 'ai-model-risk.json'),
    'utf8'
  ))
  ok('ai-model-risk.json has 14 models', aimData.models?.length === 14, 'got ' + aimData.models?.length)
  ok('ai-model-risk summary has critical/high/medium/low counts',
    typeof aimData.summary?.critical === 'number' &&
    typeof aimData.summary?.high === 'number' &&
    typeof aimData.summary?.medium === 'number' &&
    typeof aimData.summary?.low === 'number',
    'crit=' + aimData.summary?.critical + ' high=' + aimData.summary?.high +
    ' med=' + aimData.summary?.medium + ' low=' + aimData.summary?.low)

  // B.9 TmAlertTaxonomyView data file has exactly 20 categories
  const tmData = JSON.parse(await fs.readFile(
    path.join(process.cwd(), 'public', 'data', 'tm-alert-taxonomy.json'),
    'utf8'
  ))
  ok('tm-alert-taxonomy.json has 20 categories', tmData.categories?.length === 20,
    'got ' + tmData.categories?.length)
  // Verify expected category slugs are present
  const expectedCategories = ['structuring', 'layering', 'cyber_crime', 'ransomware', 'sanctions_evasion', 'defi_exploit', 'mixer_exposure']
  const presentCategories = new Set(tmData.categories?.map((c: any) => c.category) ?? [])
  for (const cat of expectedCategories) {
    ok('category ' + cat + ' present', presentCategories.has(cat))
  }

  // B.10 DataSensitivityView data file has 5 tiers + 14 assets
  const dsData = JSON.parse(await fs.readFile(
    path.join(process.cwd(), 'public', 'data', 'data-sensitivity.json'),
    'utf8'
  ))
  ok('data-sensitivity.json has 5 tiers', dsData.tiers?.length === 5, 'got ' + dsData.tiers?.length)
  ok('data-sensitivity.json has 14 assets', dsData.assets?.length === 14, 'got ' + dsData.assets?.length)
  // Verify tier ordering
  const tierOrder = (dsData.tiers ?? []).map((t: any) => t.tier)
  ok('tier order is restricted->deprecated',
    JSON.stringify(tierOrder) === JSON.stringify(['restricted', 'confidential', 'internal', 'public', 'deprecated']),
    'got ' + JSON.stringify(tierOrder))

  // B.11 Verify GDPR + PIPL article refs on restricted tier
  const restrictedTier = (dsData.tiers ?? []).find((t: any) => t.tier === 'restricted')
  ok('restricted tier has GDPR Art.9 + Art.32',
    restrictedTier?.gdprArticleRefs?.includes('Art.9') && restrictedTier?.gdprArticleRefs?.includes('Art.32'),
    'got ' + JSON.stringify(restrictedTier?.gdprArticleRefs))
  ok('restricted tier has PIPL Art.28',
    restrictedTier?.piplArticleRefs?.includes('Art.28'),
    'got ' + JSON.stringify(restrictedTier?.piplArticleRefs))

  console.log()

  // ─── C. View wiring ────────────────────────────────────────────
  console.log('C. View Wiring')
  console.log('---------------')

  // C.1 page.tsx has imports + switch cases for all 4 new views
  const pageSrc = await fs.readFile(
    path.join(process.cwd(), 'src', 'app', 'page.tsx'),
    'utf8'
  )
  const newViews = [
    { key: 'reporting-evolution', import: 'ReportingEvolutionView', component: 'ReportingEvolutionView' },
    { key: 'ai-model-risk', import: 'AiModelRiskView', component: 'AiModelRiskView' },
    { key: 'tm-alert-taxonomy', import: 'TmAlertTaxonomyView', component: 'TmAlertTaxonomyView' },
    { key: 'data-sensitivity', import: 'DataSensitivityView', component: 'DataSensitivityView' },
  ]
  for (const v of newViews) {
    ok('page.tsx imports ' + v.import, pageSrc.includes('import { ' + v.import + ' }'))
    ok('page.tsx ViewKey has ' + v.key, pageSrc.includes("'" + v.key + "'"))
    ok('page.tsx switch has ' + v.key, pageSrc.includes("case '" + v.key + "': return <" + v.component + ' />'))
  }

  // C.2 Sidebar has nav items for all 4
  const sidebarSrc = await fs.readFile(
    path.join(process.cwd(), 'src', 'components', 'layout', 'Sidebar.tsx'),
    'utf8'
  )
  for (const v of newViews) {
    ok('Sidebar has ' + v.key, sidebarSrc.includes("key: '" + v.key + "'"))
  }

  // C.3 Footer count updated to 42 views
  ok('page.tsx footer says 42 views', pageSrc.includes('42 views'))
  ok('page.tsx footer says 40 state machines', pageSrc.includes('40 state machines'))
  ok('Sidebar coverage says 40 state machines', sidebarSrc.includes('40 state machines'))

  console.log()

  // ─── D. RAG retrieval smoke ────────────────────────────────────
  console.log('D. RAG Retrieval Smoke')
  console.log('----------------------')

  // D.1 Retrieve from label-tm-alert-taxonomy on a TM query
  const tmQuery = 'Transaction Monitoring Alert Taxonomy — structuring — layering — cyber crime — ransomware — sanctions evasion — DeFi exploits — FATF typology'
  const tmScored = await retrieve(tmQuery, 5, {
    sourceTypes: ['plugin'],
    categories: ['label'],
  })
  const tmRetrievedSlugs = new Set(tmScored.map((s) => s.sourceId))
  ok('TM query retrieves label-tm-alert-taxonomy', tmRetrievedSlugs.has('label-tm-alert-taxonomy'),
    'slugs: ' + Array.from(tmRetrievedSlugs).join(', '))

  // D.2 Retrieve from label-data-sensitivity on a GDPR query
  const dsQuery = 'Data Sensitivity Classification — Restricted Confidential Internal Public Deprecated — GDPR Article 9 — PIPL Article 28 — encryption — cross-border transfer'
  const dsScored = await retrieve(dsQuery, 5, {
    sourceTypes: ['plugin'],
    categories: ['label'],
  })
  const dsRetrievedSlugs = new Set(dsScored.map((s) => s.sourceId))
  ok('GDPR query retrieves label-data-sensitivity', dsRetrievedSlugs.has('label-data-sensitivity'),
    'slugs: ' + Array.from(dsRetrievedSlugs).join(', '))

  console.log()

  // ─── Summary ───────────────────────────────────────────────────
  console.log('==========================')
  console.log('PASS: ' + pass + '  FAIL: ' + fail)
  console.log('==========================')

  await db.$disconnect()
  if (fail > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
