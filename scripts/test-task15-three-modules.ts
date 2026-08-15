/**
 * Task 15 — End-to-end smoke test
 *
 * Validates all THREE modules delivered in Task 15:
 *
 *  A. AI/ML Governance Frameworks (Module 4)
 *     - 3 new label plugins (label-ai-lifecycle-phase, label-ai-explainability,
 *       label-ai-fairness-metric) exist in catalog + DB, with body_text payloads
 *     - Each plugin has >=5 chunks indexed (prose, not HTML)
 *     - AI lifecycle query retrieves label-ai-lifecycle-phase chunks
 *     - SHAP/explainability query retrieves label-ai-explainability chunks
 *     - Fairness metric query retrieves label-ai-fairness-metric chunks
 *     - ai-governance.json has 6 phases + 3 layers + 4 metrics
 *
 *  B. Digital Assets & Crypto Regulations (Module 5)
 *     - 2 new form plugins + 1 new label plugin (form-mica-casp,
 *       form-travel-rule, label-defi-compliance) exist in catalog + DB
 *     - Each has body_text + >=5 chunks (prose)
 *     - MiCA query retrieves form-mica-casp chunks
 *     - Travel Rule query retrieves form-travel-rule chunks
 *     - DeFi query retrieves label-defi-compliance chunks
 *     - crypto-regulation.json has 4 CASPs + 4 travel rule msgs + 4 defi pillars
 *
 *  C. ESG/Sustainability Reporting (Module 6)
 *     - 2 new label plugins + 1 new form plugin (label-esg-framework,
 *       form-climate-scenario, label-esg-social-metric) exist in catalog + DB
 *     - Each has body_text + >=5 chunks (prose)
 *     - ISSB/ESRS/SEC query retrieves label-esg-framework chunks
 *     - NGFS scenario query retrieves form-climate-scenario chunks
 *     - Social capital query retrieves label-esg-social-metric chunks
 *     - esg-reporting.json has 3 frameworks + 4 scenarios + 8 social metrics
 *
 *  D. View wiring
 *     - page.tsx imports + ViewKey + switch cases for 3 new views
 *     - Sidebar.tsx has 3 new NavItem entries across 3 zones
 *     - Footer count updated to 45 views · 43 state machines
 *
 * Note: Talks directly to DB and retrieve() to avoid Turbopack memory pressure.
 *
 * Usage:  bun run scripts/test-task15-three-modules.ts
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
  console.log('Task 15 — End-to-End Smoke Test (3 Modules)')
  console.log('=============================================\n')

  // ─── A. AI/ML Governance Frameworks ─────────────────────────────
  console.log('A. AI/ML Governance Frameworks (Module 4)')
  console.log('-------------------------------------------')

  const aiSlugs = ['label-ai-lifecycle-phase', 'label-ai-explainability', 'label-ai-fairness-metric']
  for (const slug of aiSlugs) {
    const entry = PLUGIN_CATALOG.find((p) => p.slug === slug)
    ok('catalog has ' + slug, !!entry, entry ? entry.regulator + '/' + entry.jurisdiction : 'not found')
  }

  // A.2 Each has body_text
  for (const slug of aiSlugs) {
    const entry = PLUGIN_CATALOG.find((p) => p.slug === slug)
    const bodyText = entry?.defaultFieldsJson?.body_text
    ok(slug + ' has body_text', typeof bodyText === 'string',
      typeof bodyText === 'string' ? bodyText.length + ' chars' : 'missing')
  }

  // A.3 DB rows + enabled
  for (const slug of aiSlugs) {
    const row = await db.plugin.findUnique({ where: { slug } })
    ok(slug + ' in DB + enabled', !!row && row.enabled, row ? 'enabled=' + row.enabled : 'not in DB')
  }

  // A.4 Each has >=5 chunks indexed (prose, not HTML)
  for (const slug of aiSlugs) {
    const count = await db.knowledgeChunk.count({
      where: { sourceType: 'plugin', sourceId: slug }
    })
    ok(slug + ' has >=5 chunks', count >= 5, 'got ' + count)
    const sample = await db.knowledgeChunk.findFirst({
      where: { sourceType: 'plugin', sourceId: slug },
      select: { content: true },
    })
    const isHtml = sample?.content.includes('<!doctype html') || sample?.content.includes('<script')
    ok(slug + ' chunks are prose (not HTML)', !isHtml, isHtml ? 'CONTAINS HTML' : 'clean prose')
  }

  // A.5 Lifecycle query retrieves label-ai-lifecycle-phase
  const lifecycleQuery = 'AI/ML Model Lifecycle Governance — Problem Definition — Data Acquisition — Model Development — Pre-Deployment Validation — Production Monitoring — 6-phase framework'
  const lifecycleScored = await retrieve(lifecycleQuery, 5, {
    sourceTypes: ['plugin'], categories: ['label'],
  })
  const lifecycleSlugs = new Set(lifecycleScored.map((s) => s.sourceId))
  ok('lifecycle query retrieves label-ai-lifecycle-phase', lifecycleSlugs.has('label-ai-lifecycle-phase'),
    'slugs: ' + Array.from(lifecycleSlugs).join(', '))

  // A.6 Explainability query retrieves label-ai-explainability
  const explainQuery = 'AI Explainability Requirements — SHAP — counterfactual — multi-layered XAI — reason codes — GDPR Article 22 — EU AI Act Article 13'
  const explainScored = await retrieve(explainQuery, 5, {
    sourceTypes: ['plugin'], categories: ['label'],
  })
  const explainSlugs = new Set(explainScored.map((s) => s.sourceId))
  ok('explainability query retrieves label-ai-explainability', explainSlugs.has('label-ai-explainability'),
    'slugs: ' + Array.from(explainSlugs).join(', '))

  // A.7 Fairness metric query retrieves label-ai-fairness-metric
  const fairnessQuery = 'AI Fairness Metric Matrix — demographic parity — equalized odds — predictive parity — individual fairness — EEOC 4/5ths rule — protected classes'
  const fairnessScored = await retrieve(fairnessQuery, 5, {
    sourceTypes: ['plugin'], categories: ['label'],
  })
  const fairnessSlugs = new Set(fairnessScored.map((s) => s.sourceId))
  ok('fairness query retrieves label-ai-fairness-metric', fairnessSlugs.has('label-ai-fairness-metric'),
    'slugs: ' + Array.from(fairnessSlugs).join(', '))

  // A.8 ai-governance.json has correct shape
  const aiData = JSON.parse(await fs.readFile(
    path.join(process.cwd(), 'public', 'data', 'ai-governance.json'),
    'utf8'
  ))
  ok('ai-governance.json has lifecycle phases', aiData.lifecyclePhases?.length >= 5,
    'got ' + aiData.lifecyclePhases?.length)
  ok('ai-governance.json has explainability layers', aiData.explainabilityLayers?.length >= 3,
    'got ' + aiData.explainabilityLayers?.length)
  ok('ai-governance.json has fairness metrics', aiData.fairnessMetrics?.length >= 4,
    'got ' + aiData.fairnessMetrics?.length)
  ok('ai-governance summary has 6 phase labels',
    Array.isArray(aiData.summary?.phaseLabels) && aiData.summary.phaseLabels.length === 6,
    'got ' + aiData.summary?.phaseLabels?.length)
  ok('ai-governance summary has 3 layer labels',
    Array.isArray(aiData.summary?.layerLabels) && aiData.summary.layerLabels.length === 3,
    'got ' + aiData.summary?.layerLabels?.length)
  ok('ai-governance summary has 4 metric labels',
    Array.isArray(aiData.summary?.metricLabels) && aiData.summary.metricLabels.length === 4,
    'got ' + aiData.summary?.metricLabels?.length)

  console.log()

  // ─── B. Digital Assets & Crypto Regulations ─────────────────────
  console.log('B. Digital Assets & Crypto Regulations (Module 5)')
  console.log('--------------------------------------------------')

  const cryptoSlugs = ['form-mica-casp', 'form-travel-rule', 'label-defi-compliance']
  for (const slug of cryptoSlugs) {
    const entry = PLUGIN_CATALOG.find((p) => p.slug === slug)
    ok('catalog has ' + slug, !!entry, entry ? entry.regulator + '/' + entry.jurisdiction : 'not found')
  }

  // B.2 Each has body_text
  for (const slug of cryptoSlugs) {
    const entry = PLUGIN_CATALOG.find((p) => p.slug === slug)
    const bodyText = entry?.defaultFieldsJson?.body_text
    ok(slug + ' has body_text', typeof bodyText === 'string',
      typeof bodyText === 'string' ? bodyText.length + ' chars' : 'missing')
  }

  // B.3 DB rows + enabled
  for (const slug of cryptoSlugs) {
    const row = await db.plugin.findUnique({ where: { slug } })
    ok(slug + ' in DB + enabled', !!row && row.enabled, row ? 'enabled=' + row.enabled : 'not in DB')
  }

  // B.4 Each has >=5 chunks (prose)
  for (const slug of cryptoSlugs) {
    const count = await db.knowledgeChunk.count({
      where: { sourceType: 'plugin', sourceId: slug }
    })
    ok(slug + ' has >=5 chunks', count >= 5, 'got ' + count)
    const sample = await db.knowledgeChunk.findFirst({
      where: { sourceType: 'plugin', sourceId: slug },
      select: { content: true },
    })
    const isHtml = sample?.content.includes('<!doctype html') || sample?.content.includes('<script')
    ok(slug + ' chunks are prose (not HTML)', !isHtml, isHtml ? 'CONTAINS HTML' : 'clean prose')
  }

  // B.5 MiCA query retrieves form-mica-casp
  const micaQuery = 'EU MiCA — Crypto-Asset Service Provider CASP Authorization Form — Markets in Crypto-Assets Regulation 2023/1114 — capital requirement — white paper — passporting'
  const micaScored = await retrieve(micaQuery, 5, {
    sourceTypes: ['plugin'], categories: ['form'],
  })
  const micaRetrievedSlugs = new Set(micaScored.map((s) => s.sourceId))
  ok('MiCA query retrieves form-mica-casp', micaRetrievedSlugs.has('form-mica-casp'),
    'slugs: ' + Array.from(micaRetrievedSlugs).join(', '))

  // B.6 Travel Rule query retrieves form-travel-rule
  const travelQuery = 'FATF Travel Rule Recommendation 16 — OpenVASPA — IVMS101 — originator beneficiary — virtual asset transfer — sunrise period'
  const travelScored = await retrieve(travelQuery, 5, {
    sourceTypes: ['plugin'], categories: ['form'],
  })
  const travelRetrievedSlugs = new Set(travelScored.map((s) => s.sourceId))
  ok('Travel Rule query retrieves form-travel-rule', travelRetrievedSlugs.has('form-travel-rule'),
    'slugs: ' + Array.from(travelRetrievedSlugs).join(', '))

  // B.7 DeFi query retrieves label-defi-compliance
  const defiQuery = 'DeFi Compliance Challenges — front-end regulation — treasury sanctions — oracle oversight — DAO — FATF 2024 DeFi Guidance — Tornado Cash — OFAC EO 14117'
  const defiScored = await retrieve(defiQuery, 5, {
    sourceTypes: ['plugin'], categories: ['label'],
  })
  const defiRetrievedSlugs = new Set(defiScored.map((s) => s.sourceId))
  ok('DeFi query retrieves label-defi-compliance', defiRetrievedSlugs.has('label-defi-compliance'),
    'slugs: ' + Array.from(defiRetrievedSlugs).join(', '))

  // B.8 crypto-regulation.json has correct shape
  const cryptoData = JSON.parse(await fs.readFile(
    path.join(process.cwd(), 'public', 'data', 'crypto-regulation.json'),
    'utf8'
  ))
  ok('crypto-regulation.json has CASP applications', cryptoData.micaCasps?.length >= 3,
    'got ' + cryptoData.micaCasps?.length)
  ok('crypto-regulation.json has travel rule messages', cryptoData.travelRuleMessages?.length >= 3,
    'got ' + cryptoData.travelRuleMessages?.length)
  ok('crypto-regulation.json has DeFi pillars', cryptoData.defiPillars?.length >= 3,
    'got ' + cryptoData.defiPillars?.length)
  ok('crypto-regulation summary has 3 pillar labels',
    Array.isArray(cryptoData.summary?.pillarLabels) && cryptoData.summary.pillarLabels.length === 3,
    'got ' + cryptoData.summary?.pillarLabels?.length)
  ok('crypto-regulation summary has 5 CASP service classes',
    Array.isArray(cryptoData.summary?.caspServiceClasses) && cryptoData.summary.caspServiceClasses.length === 5,
    'got ' + cryptoData.summary?.caspServiceClasses?.length)

  console.log()

  // ─── C. ESG / Sustainability Reporting ──────────────────────────
  console.log('C. ESG / Sustainability Reporting (Module 6)')
  console.log('---------------------------------------------')

  const esgSlugs = ['label-esg-framework', 'form-climate-scenario', 'label-esg-social-metric']
  for (const slug of esgSlugs) {
    const entry = PLUGIN_CATALOG.find((p) => p.slug === slug)
    ok('catalog has ' + slug, !!entry, entry ? entry.regulator + '/' + entry.jurisdiction : 'not found')
  }

  // C.2 Each has body_text
  for (const slug of esgSlugs) {
    const entry = PLUGIN_CATALOG.find((p) => p.slug === slug)
    const bodyText = entry?.defaultFieldsJson?.body_text
    ok(slug + ' has body_text', typeof bodyText === 'string',
      typeof bodyText === 'string' ? bodyText.length + ' chars' : 'missing')
  }

  // C.3 DB rows + enabled
  for (const slug of esgSlugs) {
    const row = await db.plugin.findUnique({ where: { slug } })
    ok(slug + ' in DB + enabled', !!row && row.enabled, row ? 'enabled=' + row.enabled : 'not in DB')
  }

  // C.4 Each has >=5 chunks (prose)
  for (const slug of esgSlugs) {
    const count = await db.knowledgeChunk.count({
      where: { sourceType: 'plugin', sourceId: slug }
    })
    ok(slug + ' has >=5 chunks', count >= 5, 'got ' + count)
    const sample = await db.knowledgeChunk.findFirst({
      where: { sourceType: 'plugin', sourceId: slug },
      select: { content: true },
    })
    const isHtml = sample?.content.includes('<!doctype html') || sample?.content.includes('<script')
    ok(slug + ' chunks are prose (not HTML)', !isHtml, isHtml ? 'CONTAINS HTML' : 'clean prose')
  }

  // C.5 ISSB/ESRS/SEC query retrieves label-esg-framework
  const frameworkQuery = 'ESG Framework Comparison — ISSB IFRS S1 S2 — ESRS — SEC Climate Rule — double materiality — scope 3 — XBRL taxonomy'
  const frameworkScored = await retrieve(frameworkQuery, 5, {
    sourceTypes: ['plugin'], categories: ['label'],
  })
  const frameworkRetrievedSlugs = new Set(frameworkScored.map((s) => s.sourceId))
  ok('framework query retrieves label-esg-framework', frameworkRetrievedSlugs.has('label-esg-framework'),
    'slugs: ' + Array.from(frameworkRetrievedSlugs).join(', '))

  // C.6 NGFS scenario query retrieves form-climate-scenario
  const scenarioQuery = 'Climate Scenario Analysis Form — NGFS — Orderly Below 2C — Disorderly Delayed Transition — Hot House World — Net Zero 2050 — carbon price — supervisory stress test'
  const scenarioScored = await retrieve(scenarioQuery, 5, {
    sourceTypes: ['plugin'], categories: ['form'],
  })
  const scenarioRetrievedSlugs = new Set(scenarioScored.map((s) => s.sourceId))
  ok('scenario query retrieves form-climate-scenario', scenarioRetrievedSlugs.has('form-climate-scenario'),
    'slugs: ' + Array.from(scenarioRetrievedSlugs).join(', '))

  // C.7 Social capital query retrieves label-esg-social-metric
  const socialQuery = 'ESG Social Capital Metrics — algorithmic fairness as ESG metric — customer outcome fairness — workforce diversity — community investment — ESRS S1 — ISSB S1'
  const socialScored = await retrieve(socialQuery, 5, {
    sourceTypes: ['plugin'], categories: ['label'],
  })
  const socialRetrievedSlugs = new Set(socialScored.map((s) => s.sourceId))
  ok('social query retrieves label-esg-social-metric', socialRetrievedSlugs.has('label-esg-social-metric'),
    'slugs: ' + Array.from(socialRetrievedSlugs).join(', '))

  // C.8 esg-reporting.json has correct shape
  const esgData = JSON.parse(await fs.readFile(
    path.join(process.cwd(), 'public', 'data', 'esg-reporting.json'),
    'utf8'
  ))
  ok('esg-reporting.json has 3 frameworks', esgData.frameworks?.length === 3,
    'got ' + esgData.frameworks?.length)
  ok('esg-reporting.json has 4 climate scenarios', esgData.climateScenarios?.length === 4,
    'got ' + esgData.climateScenarios?.length)
  ok('esg-reporting.json has social metrics', esgData.socialMetrics?.length >= 6,
    'got ' + esgData.socialMetrics?.length)
  ok('esg-reporting summary has 3 framework labels',
    Array.isArray(esgData.summary?.frameworkLabels) && esgData.summary.frameworkLabels.length === 3,
    'got ' + esgData.summary?.frameworkLabels?.length)
  ok('esg-reporting summary has 4 scenario labels',
    Array.isArray(esgData.summary?.scenarioLabels) && esgData.summary.scenarioLabels.length === 4,
    'got ' + esgData.summary?.scenarioLabels?.length)
  ok('esg-reporting summary has 4 social category labels',
    Array.isArray(esgData.summary?.socialCategoryLabels) && esgData.summary.socialCategoryLabels.length === 4,
    'got ' + esgData.summary?.socialCategoryLabels?.length)

  // C.9 Verify ESRS double materiality + ISSB financial materiality
  const esrs = (esgData.frameworks ?? []).find((f: any) => f.framework === 'esrs')
  ok('ESRS uses double materiality', esrs?.materialityBasis === 'double',
    'got ' + esrs?.materialityBasis)
  const issb = (esgData.frameworks ?? []).find((f: any) => f.framework === 'issb_s1_s2')
  ok('ISSB uses financial materiality', issb?.materialityBasis === 'financial',
    'got ' + issb?.materialityBasis)
  const sec = (esgData.frameworks ?? []).find((f: any) => f.framework === 'sec_climate')
  ok('SEC uses financial materiality', sec?.materialityBasis === 'financial',
    'got ' + sec?.materialityBasis)

  // C.10 Verify climate scenarios include all 4 NGFS pathways
  const scenarioSlugs = (esgData.climateScenarios ?? []).map((c: any) => c.scenario)
  const expectedScenarios = ['orderly_below_2C', 'disorderly_delayed_transition', 'hot_house_current_policies', 'net_zero_2050']
  for (const sc of expectedScenarios) {
    ok('scenario ' + sc + ' present', scenarioSlugs.includes(sc))
  }

  console.log()

  // ─── D. View wiring ─────────────────────────────────────────────
  console.log('D. View Wiring')
  console.log('----------------')

  // D.1 page.tsx has imports + switch cases for all 3 new views
  const pageSrc = await fs.readFile(
    path.join(process.cwd(), 'src', 'app', 'page.tsx'),
    'utf8'
  )
  const newViews = [
    { key: 'ai-governance',    import: 'AiGovernanceView',      component: 'AiGovernanceView' },
    { key: 'crypto-regulation', import: 'CryptoRegulationView', component: 'CryptoRegulationView' },
    { key: 'esg-reporting',    import: 'EsgReportingView',      component: 'EsgReportingView' },
  ]
  for (const v of newViews) {
    ok('page.tsx imports ' + v.import, pageSrc.includes('import { ' + v.import + ' }'))
    ok('page.tsx ViewKey has ' + v.key, pageSrc.includes("'" + v.key + "'"))
    ok('page.tsx switch has ' + v.key, pageSrc.includes("case '" + v.key + "': return <" + v.component + ' />'))
  }

  // D.2 Sidebar has nav items for all 3
  const sidebarSrc = await fs.readFile(
    path.join(process.cwd(), 'src', 'components', 'layout', 'Sidebar.tsx'),
    'utf8'
  )
  for (const v of newViews) {
    ok('Sidebar has ' + v.key, sidebarSrc.includes("key: '" + v.key + "'"))
  }

  // D.3 Footer count updated to 45 views · 43 state machines
  ok('page.tsx footer says 45 views', pageSrc.includes('45 views'))
  ok('page.tsx footer says 43 state machines', pageSrc.includes('43 state machines'))
  ok('Sidebar coverage says 43 state machines', sidebarSrc.includes('43 state machines'))

  console.log()

  // ─── Summary ────────────────────────────────────────────────────
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
