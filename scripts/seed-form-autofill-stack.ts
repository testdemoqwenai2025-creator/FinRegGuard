/**
 * Phase 1 / Commit 1 — Seed Script
 * =================================
 *
 * Seeds the 3 foundation tables for the form auto-fill stack:
 *
 *   1. Connector         — 5 live data feeds (LEI, Companies House, EDGAR, OFAC, OpenCorporates)
 *   2. FormTemplate      — 1 EDD form schema (12 fields)
 *   3. FieldOntology     — 12 field-to-connector mappings
 *
 * After running this script, the auto-fill orchestrator can resolve
 * any EDD field (e.g., "legal_name") to its source connector (e.g., "lei")
 * via the FieldOntology table, then call the connector implementation
 * via getConnector(slug) in src/lib/connectors/registry.ts.
 *
 * Usage:  bun run scripts/seed-form-autofill-stack.ts
 */

import { db } from '../src/lib/db'

// ─────────────────────────────────────────────────────────────
// 1. CONNECTOR REGISTRY
// ─────────────────────────────────────────────────────────────

const CONNECTORS = [
  {
    slug: 'lei',
    name: 'GLEIF LEI Registry',
    kind: 'registry',
    endpoint: 'https://api.gleif.org/api/v1/legal-entities',
    authScheme: 'none',
    authConfigJson: '{}',
    rateLimitPerMin: 60,
    description: 'Global LEI registry — ~2.5M entities. Free, no auth. The closest thing to a universal corporate registry. Every regulated financial counterparty is required to have an LEI under MiFID II / EMIR / Dodd-Frank.',
  },
  {
    slug: 'companies_house',
    name: 'UK Companies House',
    kind: 'corporate_registry',
    endpoint: 'https://api.company-information.service.gov.uk',
    authScheme: 'basic',
    authConfigJson: '{"api_key_env":"COMPANIES_HOUSE_API_KEY"}',
    rateLimitPerMin: 10,
    description: 'UK corporate registry. Free tier: 600 req/month. Includes PSC (persons with significant control) register for beneficial ownership data. Auth: API key as basic username.',
  },
  {
    slug: 'edgar',
    name: 'SEC EDGAR (US filings registry)',
    kind: 'filings_index',
    endpoint: 'https://efts.sec.gov/LATEST/search-index',
    authScheme: 'none',
    authConfigJson: '{}',
    rateLimitPerMin: 600,
    description: 'SEC EDGAR — 10TB of regulatory filings (10-K, 10-Q, 8-K, Form ADV, Form PF). Free, no auth (descriptive User-Agent required). CIK is the permanent entity ID. Does NOT maintain beneficial-ownership register directly — use Form ADV Schedule D for investment advisers.',
  },
  {
    slug: 'ofac',
    name: 'OFAC SDN Sanctions List (US Treasury)',
    kind: 'sanctions_list',
    endpoint: 'https://www.treasury.gov/ofac/downloads/sdn.xml',
    authScheme: 'none',
    authConfigJson: '{}',
    rateLimitPerMin: 5,
    description: 'US Treasury OFAC Specially Designated Nationals list — ~12,000 sanctioned individuals & entities. Free, no auth, daily-refreshed XML. 12 MB uncompressed. Cached in-memory for 6 hours after first fetch.',
  },
  {
    slug: 'opencorporates',
    name: 'OpenCorporates (global registry aggregator)',
    kind: 'corporate_registry',
    endpoint: 'https://api.opencorporates.com/v0.4/companies/search',
    authScheme: 'api_key_query',
    authConfigJson: '{"api_token_env":"OPENCORPORATES_API_TOKEN"}',
    rateLimitPerMin: 5,
    description: 'OpenCorporates — 200+ jurisdictions aggregated. Free tier: 50 req/month. Used as a fallback when the local registry (Companies House, SEC) returns no data for an entity. Auth: API token as query param.',
  },
]

// ─────────────────────────────────────────────────────────────
// 2. FORM TEMPLATE — EDD (Enhanced Due Diligence)
// ─────────────────────────────────────────────────────────────

const EDD_FORM_TEMPLATE = {
  slug: 'edd-form-framework',
  name: 'Enhanced Due Diligence (EDD) Form',
  formType: 'EDD',
  regulator: 'FinCEN',
  jurisdiction: 'GLOBAL',
  version: '1.0.0',
  description: 'EDD form framework with 3 layers: (1) dynamic KYC with biometric matching, (2) beneficial ownership cascading to 25% thresholds, (3) source-of-funds blockchain verification. Auto-fills from LEI / Companies House / SEC EDGAR / OFAC / OpenCorporates connectors. Low-confidence fields are routed to the KYC review queue.',
  fieldSchemaJson: JSON.stringify({
    fields: [
      { name: 'legal_name', type: 'string', required: true, autofill_field: 'legal_name', description: 'Legal entity name as registered with the primary corporate registry' },
      { name: 'jurisdiction', type: 'country_code_iso3166', required: true, autofill_field: 'jurisdiction', description: 'ISO 3166-1 alpha-2 country code of incorporation' },
      { name: 'incorporation_date', type: 'date', required: true, autofill_field: 'incorporation_date', description: 'Date of incorporation (ISO 8601)' },
      { name: 'company_status', type: 'string', required: true, autofill_field: 'company_status', description: 'Active / dissolved / liquidation / etc.' },
      { name: 'company_type', type: 'string', required: false, autofill_field: 'company_type', description: 'ltd / plc / llp / etc.' },
      { name: 'registered_address', type: 'json_object', required: true, autofill_field: 'registered_address', description: 'Full registered office address' },
      { name: 'cik', type: 'string', required: false, autofill_field: 'cik', description: 'SEC Central Index Key (US entities only)' },
      { name: 'sic_code', type: 'string', required: false, autofill_field: 'sic_code', description: 'Standard Industrial Classification code (US entities only)' },
      { name: 'beneficial_owners', type: 'json_array', required: true, autofill_field: 'beneficial_owners', description: 'Array of PSC records — name, role, appointed_on, nationality, threshold_pct. Cascading to 25% threshold per FinCEN CDD Rule.' },
      { name: 'sanctions_screening_result', type: 'json_object', required: true, autofill_field: 'sanctions_screening_result', description: 'OFAC SDN screen result — hit bool, match list, list hash, checked_at' },
      { name: 'sanctions_match_count', type: 'integer', required: true, autofill_field: 'sanctions_match_count', description: 'Number of OFAC SDN matches (0 = clean)' },
      { name: 'source_of_funds_evidence', type: 'json_object', required: true, autofill_field: null, description: 'Chainalysis / TRM / Elliptic cluster analysis — mixer exposure %, cluster IDs, 90-day freshness window. NOT auto-filled by Phase 1 connectors (requires chainalysis connector — Phase 2).' },
      { name: 'onchain_cluster_ids', type: 'json_array', required: false, autofill_field: null, description: 'Blockchain cluster IDs associated with the entity. NOT auto-filled by Phase 1 connectors.' },
    ],
  }),
}

// ─────────────────────────────────────────────────────────────
// 3. FIELD ONTOLOGY — maps each EDD field to its source connector
// ─────────────────────────────────────────────────────────────

const FIELD_ONTOLOGIES = [
  {
    fieldName: 'legal_name',
    canonicalType: 'string',
    description: 'Legal entity name as registered with the primary corporate registry',
    sourceOfTruthByJurisdiction: JSON.stringify({
      UK: 'companies_house',
      US: 'edgar',
      EU: 'lei',
      _default: 'lei',
    }),
    parserSlug: 'lei_search_json',
    fallbackChainJson: JSON.stringify(['lei', 'opencorporates', 'edgar']),
    confidenceThreshold: 'high',
    primaryConnectorSlug: 'lei',
  },
  {
    fieldName: 'jurisdiction',
    canonicalType: 'country_code_iso3166',
    description: 'ISO 3166-1 alpha-2 country code of incorporation',
    sourceOfTruthByJurisdiction: JSON.stringify({
      UK: 'companies_house',
      US: 'edgar',
      _default: 'lei',
    }),
    parserSlug: 'lei_search_json',
    fallbackChainJson: JSON.stringify(['lei', 'companies_house', 'edgar']),
    confidenceThreshold: 'high',
    primaryConnectorSlug: 'lei',
  },
  {
    fieldName: 'incorporation_date',
    canonicalType: 'date',
    description: 'Date of incorporation (ISO 8601)',
    sourceOfTruthByJurisdiction: JSON.stringify({
      UK: 'companies_house',
      US: 'edgar',
      _default: 'lei',
    }),
    parserSlug: 'lei_search_json',
    fallbackChainJson: JSON.stringify(['companies_house', 'lei', 'opencorporates']),
    confidenceThreshold: 'high',
    primaryConnectorSlug: 'lei',
  },
  {
    fieldName: 'company_status',
    canonicalType: 'string',
    description: 'Active / dissolved / liquidation / etc.',
    sourceOfTruthByJurisdiction: JSON.stringify({
      UK: 'companies_house',
      US: 'edgar',
      _default: 'opencorporates',
    }),
    parserSlug: 'companies_house_company_json',
    fallbackChainJson: JSON.stringify(['companies_house', 'opencorporates', 'edgar']),
    confidenceThreshold: 'medium',
    primaryConnectorSlug: 'companies_house',
  },
  {
    fieldName: 'company_type',
    canonicalType: 'string',
    description: 'ltd / plc / llp / etc.',
    sourceOfTruthByJurisdiction: JSON.stringify({
      UK: 'companies_house',
      US: 'edgar',
      _default: 'opencorporates',
    }),
    parserSlug: 'companies_house_company_json',
    fallbackChainJson: JSON.stringify(['companies_house', 'opencorporates']),
    confidenceThreshold: 'medium',
    primaryConnectorSlug: 'companies_house',
  },
  {
    fieldName: 'registered_address',
    canonicalType: 'json_object',
    description: 'Full registered office address',
    sourceOfTruthByJurisdiction: JSON.stringify({
      UK: 'companies_house',
      US: 'edgar',
      _default: 'lei',
    }),
    parserSlug: 'companies_house_company_json',
    fallbackChainJson: JSON.stringify(['companies_house', 'lei', 'opencorporates']),
    confidenceThreshold: 'high',
    primaryConnectorSlug: 'companies_house',
  },
  {
    fieldName: 'cik',
    canonicalType: 'string',
    description: 'SEC Central Index Key (US entities only)',
    sourceOfTruthByJurisdiction: JSON.stringify({
      US: 'edgar',
      _default: 'edgar',
    }),
    parserSlug: 'edgar_submissions_json',
    fallbackChainJson: JSON.stringify(['edgar']),
    confidenceThreshold: 'high',
    primaryConnectorSlug: 'edgar',
  },
  {
    fieldName: 'sic_code',
    canonicalType: 'string',
    description: 'Standard Industrial Classification code (US entities only)',
    sourceOfTruthByJurisdiction: JSON.stringify({
      US: 'edgar',
      _default: 'edgar',
    }),
    parserSlug: 'edgar_submissions_json',
    fallbackChainJson: JSON.stringify(['edgar']),
    confidenceThreshold: 'high',
    primaryConnectorSlug: 'edgar',
  },
  {
    fieldName: 'beneficial_owners',
    canonicalType: 'json_array',
    description: 'Array of PSC records — name, role, appointed_on, nationality, threshold_pct. Cascading to 25% threshold per FinCEN CDD Rule.',
    sourceOfTruthByJurisdiction: JSON.stringify({
      UK: 'companies_house',
      EU: 'lei',
      _default: 'opencorporates',
    }),
    parserSlug: 'companies_house_officers_json',
    fallbackChainJson: JSON.stringify(['companies_house', 'opencorporates']),
    confidenceThreshold: 'high',
    primaryConnectorSlug: 'companies_house',
  },
  {
    fieldName: 'sanctions_screening_result',
    canonicalType: 'json_object',
    description: 'OFAC SDN screen result — hit bool, match list, list hash, checked_at',
    sourceOfTruthByJurisdiction: JSON.stringify({
      _default: 'ofac',
    }),
    parserSlug: 'ofac_sd_xml',
    fallbackChainJson: JSON.stringify(['ofac']),
    confidenceThreshold: 'high',
    primaryConnectorSlug: 'ofac',
  },
  {
    fieldName: 'sanctions_match_count',
    canonicalType: 'integer',
    description: 'Number of OFAC SDN matches (0 = clean)',
    sourceOfTruthByJurisdiction: JSON.stringify({
      _default: 'ofac',
    }),
    parserSlug: 'ofac_sd_xml',
    fallbackChainJson: JSON.stringify(['ofac']),
    confidenceThreshold: 'high',
    primaryConnectorSlug: 'ofac',
  },
  {
    fieldName: 'parent_lei',
    canonicalType: 'string',
    description: 'LEI of the direct parent entity (if any) — for group structure analysis',
    sourceOfTruthByJurisdiction: JSON.stringify({
      _default: 'lei',
    }),
    parserSlug: 'lei_search_json',
    fallbackChainJson: JSON.stringify(['lei']),
    confidenceThreshold: 'high',
    primaryConnectorSlug: 'lei',
  },
]

// ─────────────────────────────────────────────────────────────
// Seed runner
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log('Phase 1 / Commit 1 — Seed Form Auto-Fill Stack')
  console.log('================================================\n')

  // 1. Connectors
  console.log('1. Seeding Connector registry...')
  for (const c of CONNECTORS) {
    await db.connector.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        kind: c.kind,
        endpoint: c.endpoint,
        authScheme: c.authScheme,
        authConfigJson: c.authConfigJson,
        rateLimitPerMin: c.rateLimitPerMin,
        description: c.description,
      },
      create: c,
    })
    console.log(`   ${c.slug.padEnd(20)} | ${c.authScheme.padEnd(18)} | ${String(c.rateLimitPerMin).padStart(3)}/min | ${c.name}`)
  }
  console.log()

  // 2. FormTemplate
  console.log('2. Seeding FormTemplate (EDD form)...')
  await db.formTemplate.upsert({
    where: { slug: EDD_FORM_TEMPLATE.slug },
    update: {
      name: EDD_FORM_TEMPLATE.name,
      fieldSchemaJson: EDD_FORM_TEMPLATE.fieldSchemaJson,
      formType: EDD_FORM_TEMPLATE.formType,
      regulator: EDD_FORM_TEMPLATE.regulator,
      jurisdiction: EDD_FORM_TEMPLATE.jurisdiction,
      version: EDD_FORM_TEMPLATE.version,
      description: EDD_FORM_TEMPLATE.description,
    },
    create: EDD_FORM_TEMPLATE,
  })

  const fieldSchema = JSON.parse(EDD_FORM_TEMPLATE.fieldSchemaJson)
  console.log(`   ${EDD_FORM_TEMPLATE.slug} v${EDD_FORM_TEMPLATE.version} | ${fieldSchema.fields.length} fields | ${EDD_FORM_TEMPLATE.regulator}/${EDD_FORM_TEMPLATE.jurisdiction}`)
  console.log()

  // 3. FieldOntology
  console.log('3. Seeding FieldOntology...')
  for (const fo of FIELD_ONTOLOGIES) {
    // Look up the primary connector by slug to get its ID
    const connector = await db.connector.findUnique({
      where: { slug: fo.primaryConnectorSlug },
      select: { id: true },
    })
    if (!connector) {
      console.log(`   FAIL: connector slug "${fo.primaryConnectorSlug}" not found for field "${fo.fieldName}"`)
      continue
    }
    await db.fieldOntology.upsert({
      where: { fieldName: fo.fieldName },
      update: {
        canonicalType: fo.canonicalType,
        description: fo.description,
        sourceOfTruthByJurisdiction: fo.sourceOfTruthByJurisdiction,
        parserSlug: fo.parserSlug,
        fallbackChainJson: fo.fallbackChainJson,
        confidenceThreshold: fo.confidenceThreshold,
        primaryConnectorId: connector.id,
      },
      create: {
        fieldName: fo.fieldName,
        canonicalType: fo.canonicalType,
        description: fo.description,
        sourceOfTruthByJurisdiction: fo.sourceOfTruthByJurisdiction,
        parserSlug: fo.parserSlug,
        fallbackChainJson: fo.fallbackChainJson,
        confidenceThreshold: fo.confidenceThreshold,
        primaryConnectorId: connector.id,
      },
    })
    console.log(`   ${fo.fieldName.padEnd(32)} | ${fo.primaryConnectorSlug.padEnd(20)} | ${fo.parserSlug}`)
  }
  console.log()

  // 4. Summary
  console.log('4. Summary:')
  const connectorCount = await db.connector.count()
  const formTemplateCount = await db.formTemplate.count()
  const fieldOntologyCount = await db.fieldOntology.count()
  console.log(`   Connectors:      ${connectorCount}`)
  console.log(`   FormTemplates:   ${formTemplateCount}`)
  console.log(`   FieldOntologies: ${fieldOntologyCount}`)
  console.log()

  console.log('Done. Next: build the auto-fill orchestrator (POST /api/forms/[slug]/autofill).')
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
