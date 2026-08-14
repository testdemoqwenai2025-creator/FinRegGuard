/**
 * Plugin Catalog — the registry seed.
 *
 * Each entry is a "plugin" in the DeepSeek sense: a unit of regulatory
 * content (form, label, feature, or document template) that can be
 * enabled/disabled, marked as default, and auto-filled with content
 * fetched from the sourceUrl (an authoritative regulator website).
 *
 * The catalog is the SOURCE OF TRUTH for what plugins exist.
 * State (enabled / isDefault / cached template) lives in the DB.
 */

export type PluginCategory = 'form' | 'label' | 'feature' | 'document'
export type PluginSourceType = 'web' | 'template' | 'api' | 'github' | 'rss'

export interface PluginCatalogEntry {
  slug: string
  name: string
  description: string
  category: PluginCategory
  jurisdiction: string
  regulator?: string
  version: string
  sourceUrl: string
  sourceType: PluginSourceType
  schemaJson?: Record<string, unknown>
  defaultFieldsJson?: Record<string, unknown>
  tags: string[]
  /** If true, the plugin ships pre-enabled (acts as default) */
  enabledByDefault?: boolean
  /** If true, the plugin is the default for its category/jurisdiction pair */
  defaultForCategory?: boolean
}

export const PLUGIN_CATALOG: PluginCatalogEntry[] = [
  // ─────────────────────────────────────────────────────────────
  // FORMS (10) — regulatory filing templates from authoritative sources
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'sec-form-adv',
    name: 'SEC Form ADV',
    description: 'Uniform Application for Investment Adviser Registration. Required by the SEC for RIAs managing $100M+ AUM. Filed via IARD.',
    category: 'form',
    jurisdiction: 'US',
    regulator: 'SEC',
    version: '2024.03',
    sourceUrl: 'https://www.sec.gov/about/forms/formadv-part1.pdf',
    sourceType: 'web',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'firm_name', type: 'string', required: true },
        { name: 'crd_number', type: 'string', required: true },
        { name: 'sec_file_number', type: 'string' },
        { name: 'firm_type', type: 'enum', values: ['LLC', 'LP', 'Corp', 'Other'] },
        { name: 'aum', type: 'number' },
        { name: 'employees', type: 'number' },
        { name: 'custody', type: 'boolean' },
        { name: 'discretionary', type: 'boolean' },
      ],
    },
    defaultFieldsJson: {
      firm_type: 'LLC',
      custody: false,
      discretionary: true,
    },
    tags: ['SEC', 'RIA', 'registration', 'IARD', 'investment-adviser'],
    enabledByDefault: true,
    defaultForCategory: true,
  },
  {
    slug: 'finra-form-u4',
    name: 'FINRA Form U4',
    description: 'Uniform Application for Securities Industry Registration. Required for registered representatives of broker-dealers.',
    category: 'form',
    jurisdiction: 'US',
    regulator: 'FINRA',
    version: '2024.02',
    sourceUrl: 'https://www.finra.org/sites/default/files/Form_U4.pdf',
    sourceType: 'web',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'full_name', type: 'string', required: true },
        { name: 'crd_number', type: 'string' },
        { name: 'residence_address', type: 'string', required: true },
        { name: 'employers_last_5_years', type: 'array' },
        { name: 'disclosures', type: 'array' },
        { name: 'jurisdictions', type: 'array' },
      ],
    },
    defaultFieldsJson: {
      jurisdictions: ['NY'],
    },
    tags: ['FINRA', 'broker-dealer', 'registration', 'CRD'],
    enabledByDefault: true,
  },
  {
    slug: 'mifid-ii-annex-i',
    name: 'MiFID II Annex I — Suitability',
    description: 'EU MiFID II Annex I suitability report template. Required for investment firms providing portfolio management or investment advice.',
    category: 'form',
    jurisdiction: 'EU',
    regulator: 'ESMA',
    version: '2017/565',
    sourceUrl: 'https://www.esma.europa.eu/sites/default/files/library/2017-1291_qa_mifid_ii_product_governance.pdf',
    sourceType: 'web',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'client_name', type: 'string', required: true },
        { name: 'client_type', type: 'enum', values: ['retail', 'professional', 'eligible-counterparty'] },
        { name: 'recommended_instruments', type: 'array' },
        { name: 'risk_tolerance', type: 'enum', values: ['low', 'medium', 'high'] },
        { name: 'investment_horizon', type: 'string' },
        { name: 'loss_tolerance', type: 'number' },
      ],
    },
    defaultFieldsJson: {
      client_type: 'retail',
      risk_tolerance: 'medium',
    },
    tags: ['MiFID', 'ESMA', 'suitability', 'EU', 'advice'],
    enabledByDefault: true,
    defaultForCategory: true,
  },
  {
    slug: 'gdpr-ropa',
    name: 'GDPR Article 30 — RoPA',
    description: 'Record of Processing Activities template per GDPR Article 30. Mandatory for all data controllers and processors in the EU.',
    category: 'form',
    jurisdiction: 'EU',
    regulator: 'ESMA',
    version: '2016/679',
    sourceUrl: 'https://gdpr-info.eu/art-30-gdpr/',
    sourceType: 'web',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'controller_name', type: 'string', required: true },
        { name: 'dpo_contact', type: 'string', required: true },
        { name: 'processing_purposes', type: 'array', required: true },
        { name: 'data_subjects', type: 'array' },
        { name: 'recipients', type: 'array' },
        { name: 'transfers_third_countries', type: 'array' },
        { name: 'retention_period', type: 'string' },
      ],
    },
    defaultFieldsJson: {
      retention_period: 'P7Y',
    },
    tags: ['GDPR', 'privacy', 'RoPA', 'EU', 'data-protection'],
    enabledByDefault: true,
  },
  {
    slug: 'fatca-form-8966',
    name: 'FATCA Form 8966',
    description: 'FATCA Report of Specified Foreign Financial Assets. Filed by US persons with specified foreign assets above thresholds.',
    category: 'form',
    jurisdiction: 'US',
    regulator: 'IRS',
    version: '2024.01',
    sourceUrl: 'https://www.irs.gov/forms-pubs/about-form-8966',
    sourceType: 'web',
    tags: ['FATCA', 'IRS', 'foreign-assets', 'tax'],
    enabledByDefault: false,
  },
  {
    slug: 'emir-t1-report',
    name: 'EMIR T+1 Trade Report',
    description: 'European Market Infrastructure Regulation trade reporting template. Filed with ESMA-registered TRs within T+1 of execution.',
    category: 'form',
    jurisdiction: 'EU',
    regulator: 'ESMA',
    version: 'EMIR REFIT 2024',
    sourceUrl: 'https://www.esma.europa.eu/regulation/post-trading/emir',
    sourceType: 'web',
    tags: ['EMIR', 'derivatives', 'reporting', 'T+1', 'EU'],
    enabledByDefault: false,
  },
  {
    slug: 'sfdr-rts',
    name: 'SFDR RTS — PAI Annex',
    description: 'Sustainable Finance Disclosure Regulation Regulatory Technical Standards — Principal Adverse Impacts annex template.',
    category: 'form',
    jurisdiction: 'EU',
    regulator: 'ESMA',
    version: '2023/363',
    sourceUrl: 'https://www.esma.europa.eu/sites/default/files/library/jc_2023_19_sfdr_drts_pa_statement.pdf',
    sourceType: 'web',
    tags: ['SFDR', 'ESG', 'sustainability', 'PAI', 'EU'],
    enabledByDefault: false,
  },
  {
    slug: 'basel-pillar-3',
    name: 'Basel III Pillar 3 Disclosure',
    description: 'Bank for International Settlements Pillar 3 disclosure template — market discipline through regulatory disclosure.',
    category: 'form',
    jurisdiction: 'GLOBAL',
    regulator: 'BIS',
    version: '2017',
    sourceUrl: 'https://www.bis.org/bcbs/publ/d400.pdf',
    sourceType: 'web',
    tags: ['Basel', 'BIS', 'disclosure', 'capital', 'banking'],
    enabledByDefault: false,
  },
  {
    slug: 'sec-form-pf',
    name: 'SEC Form PF',
    description: 'Private Fund Report. Required by SEC for investment advisers managing private funds above $150M AUM.',
    category: 'form',
    jurisdiction: 'US',
    regulator: 'SEC',
    version: '2024.03',
    sourceUrl: 'https://www.sec.gov/about/forms/formpf.pdf',
    sourceType: 'web',
    tags: ['SEC', 'private-fund', 'hedge-fund', 'private-equity'],
    enabledByDefault: false,
  },
  {
    slug: 'fca-smr-coh',
    name: 'FCA SMR — Certificate of Honesty',
    description: 'Senior Managers Regime certificate template for FCA-regulated UK firms. Required for SMF approval.',
    category: 'form',
    jurisdiction: 'UK',
    regulator: 'FCA',
    version: '2023',
    sourceUrl: 'https://www.fca.org.uk/firms/senior-managers-certification-regime',
    sourceType: 'web',
    tags: ['FCA', 'SMR', 'UK', 'governance', 'senior-managers'],
    enabledByDefault: false,
  },

  // ─────────────────────────────────────────────────────────────
  // LABELS (6) — taxonomy tags applied across the platform
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'label-risk-tier',
    name: 'Risk Tier Labels',
    description: 'Four-tier risk classification (Low / Medium / High / Critical) used across Risk Matrix, Sanctions, and Case Management.',
    category: 'label',
    jurisdiction: 'GLOBAL',
    regulator: 'INTERNAL',
    version: '2.0',
    sourceUrl: 'https://raw.githubusercontent.com/testdemoqwenai2025-creator/FinRegGTP.BoT/main/public/data/risk.json',
    sourceType: 'github',
    schemaJson: {
      type: 'enum',
      values: ['low', 'medium', 'high', 'critical'],
      colors: { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#dc2626' },
    },
    defaultFieldsJson: {
      default: 'medium',
      thresholds: { low: [0, 25], medium: [26, 50], high: [51, 75], critical: [76, 100] },
    },
    tags: ['risk', 'classification', 'taxonomy'],
    enabledByDefault: true,
    defaultForCategory: true,
  },
  {
    slug: 'label-event-type',
    name: 'Event Type Labels',
    description: 'AML/CTF event taxonomy: wire_transfer, structuring, layering, integration, suspicious_pattern, high_risk_jurisdiction.',
    category: 'label',
    jurisdiction: 'GLOBAL',
    regulator: 'FATF',
    version: '2023',
    sourceUrl: 'https://www.fatf-gafi.org/en/publications/Fatfrecommendations/Documents/International-Standards-Round-Table.html',
    sourceType: 'web',
    schemaJson: {
      type: 'enum',
      values: ['wire_transfer', 'structuring', 'layering', 'integration', 'suspicious_pattern', 'high_risk_jurisdiction', 'trade_based_ml', 'crypto_ml'],
    },
    tags: ['AML', 'CTF', 'event', 'taxonomy', 'FATF'],
    enabledByDefault: true,
  },
  {
    slug: 'label-counterparty-class',
    name: 'Counterparty Classification',
    description: 'Counterparty type tags: individual, corporate, sovereign, PEP, sanctioned, regulated_fi, unregulated_fi.',
    category: 'label',
    jurisdiction: 'GLOBAL',
    regulator: 'INTERNAL',
    version: '1.2',
    sourceUrl: 'https://raw.githubusercontent.com/testdemoqwenai2025-creator/FinRegGTP.BoT/main/public/data/network.json',
    sourceType: 'github',
    schemaJson: {
      type: 'enum',
      values: ['individual', 'corporate', 'sovereign', 'PEP', 'sanctioned', 'regulated_fi', 'unregulated_fi'],
    },
    tags: ['KYC', 'counterparty', 'classification'],
    enabledByDefault: true,
  },
  {
    slug: 'label-jurisdiction',
    name: 'Jurisdiction Tags',
    description: 'ISO 3166-1 alpha-2 jurisdiction tags with risk overlay (FATF grey/black list, EU high-risk third countries).',
    category: 'label',
    jurisdiction: 'GLOBAL',
    regulator: 'FATF',
    version: '2024-Q2',
    sourceUrl: 'https://www.fatf-gafi.org/en/topics/high-risk-and-other-monitored-jurisdictions.html',
    sourceType: 'web',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'code', type: 'string', pattern: '^[A-Z]{2}$' },
        { name: 'risk_level', type: 'enum', values: ['low', 'medium', 'high', 'blacklisted'] },
      ],
    },
    tags: ['jurisdiction', 'ISO-3166', 'FATF', 'geography'],
    enabledByDefault: true,
  },
  {
    slug: 'label-aml-category',
    name: 'AML Category Labels',
    description: 'Bank Secrecy Act transaction category labels: CTR, SAR, CDD, EDD, beneficial_owner, source_of_funds.',
    category: 'label',
    jurisdiction: 'US',
    regulator: 'FinCEN',
    version: '2024',
    sourceUrl: 'https://www.fincen.gov/resources/statutes-regulations',
    sourceType: 'web',
    schemaJson: {
      type: 'enum',
      values: ['CTR', 'SAR', 'CDD', 'EDD', 'beneficial_owner', 'source_of_funds', 'structuring', 'smurfing'],
    },
    tags: ['AML', 'BSA', 'FinCEN', 'taxonomy'],
    enabledByDefault: false,
  },
  {
    slug: 'label-esg-classification',
    name: 'ESG Classification',
    description: 'EU Taxonomy-aligned ESG labels: dark_green, light_green, transition, brown. Used by SFDR and Climate/ESG views.',
    category: 'label',
    jurisdiction: 'EU',
    regulator: 'ESMA',
    version: '2023',
    sourceUrl: 'https://finance.ec.europa.eu/sustainable-finance/tools/sustainable-finance-disclosure-regulation_en',
    sourceType: 'web',
    schemaJson: {
      type: 'enum',
      values: ['dark_green', 'light_green', 'transition', 'brown'],
    },
    tags: ['ESG', 'taxonomy', 'SFDR', 'EU', 'climate'],
    enabledByDefault: false,
  },

  // ─────────────────────────────────────────────────────────────
  // FEATURES (6) — feature flags for platform capabilities
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'feature-sanctions-live',
    name: 'Live Sanctions Screening',
    description: 'Real-time OFAC SDN, EU CFSP, UK HMT, UN consolidated sanctions list screening via OpenSanctions API.',
    category: 'feature',
    jurisdiction: 'GLOBAL',
    regulator: 'OFAC',
    version: '2.2',
    sourceUrl: 'https://raw.githubusercontent.com/testdemoqwenai2025-creator/FinRegGTP.BoT/main/scripts/fetch-free-tier-data.py',
    sourceType: 'github',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'refresh_interval_minutes', type: 'number', default: 60 },
        { name: 'match_threshold', type: 'number', default: 0.85 },
        { name: 'sources', type: 'array', default: ['OFAC', 'EU_CFSP', 'UK_HMT', 'UN'] },
      ],
    },
    defaultFieldsJson: {
      refresh_interval_minutes: 60,
      match_threshold: 0.85,
      sources: ['OFAC', 'EU_CFSP', 'UK_HMT', 'UN'],
    },
    tags: ['sanctions', 'OFAC', 'real-time', 'screening'],
    enabledByDefault: true,
    defaultForCategory: true,
  },
  {
    slug: 'feature-esg-scoring',
    name: 'ESG Climate Scoring',
    description: 'PCAF-aligned financed emissions scoring + NGFS scenario overlays. Powers the Climate & ESG view.',
    category: 'feature',
    jurisdiction: 'EU',
    regulator: 'ESMA',
    version: '2.1',
    sourceUrl: 'https://carbonaccountingfinancials.com/files/downloads/PCAF-Global-GHG-Standard.pdf',
    sourceType: 'web',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'methodology', type: 'enum', values: ['PCAF', 'SBTi', 'TCFD'] },
        { name: 'ngfs_scenario', type: 'enum', values: ['net_zero_2050', 'below_2C', 'delayed_transition', 'current_policies'] },
        { name: 'scope', type: 'array', default: ['scope_1', 'scope_2', 'scope_3'] },
      ],
    },
    defaultFieldsJson: {
      methodology: 'PCAF',
      ngfs_scenario: 'net_zero_2050',
      scope: ['scope_1', 'scope_2', 'scope_3'],
    },
    tags: ['ESG', 'PCAF', 'NGFS', 'climate', 'carbon'],
    enabledByDefault: false,
  },
  {
    slug: 'feature-merkle-anchor',
    name: 'Merkle Anchor Verification',
    description: 'RFC 6962 Merkle tree anchoring of audit log entries. Optional live Polygon Amoy broadcast via env var.',
    category: 'feature',
    jurisdiction: 'GLOBAL',
    regulator: 'INTERNAL',
    version: '2.2',
    sourceUrl: 'https://raw.githubusercontent.com/testdemoqwenai2025-creator/FinRegGTP.BoT/main/scripts/build-chain-anchors.py',
    sourceType: 'github',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'broadcast_mode', type: 'enum', values: ['simulated', 'live_polygon_amoy', 'merkle_proof_only'] },
        { name: 'chain_id', type: 'number', default: 80002 },
        { name: 'batch_size', type: 'number', default: 1024 },
      ],
    },
    defaultFieldsJson: {
      broadcast_mode: 'simulated',
      chain_id: 80002,
      batch_size: 1024,
    },
    tags: ['blockchain', 'Merkle', 'audit', 'Polygon', 'evidence'],
    enabledByDefault: true,
  },
  {
    slug: 'feature-red-team',
    name: 'Adversarial Red Team Engine',
    description: 'Generates synthetic adversarial scenarios to stress-test surveillance, sanctions, and risk controls.',
    category: 'feature',
    jurisdiction: 'GLOBAL',
    regulator: 'INTERNAL',
    version: '1.5',
    sourceUrl: 'https://raw.githubusercontent.com/testdemoqwenai2025-creator/FinRegGTP.BoT/main/public/data/redteam.json',
    sourceType: 'github',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'scenario_count', type: 'number', default: 50 },
        { name: 'attack_vectors', type: 'array', default: ['structuring', 'smurfing', 'layering', 'shell_company', 'trade_based'] },
        { name: 'severity_floor', type: 'string', default: 'medium' },
      ],
    },
    defaultFieldsJson: {
      scenario_count: 50,
      attack_vectors: ['structuring', 'smurfing', 'layering', 'shell_company', 'trade_based'],
      severity_floor: 'medium',
    },
    tags: ['red-team', 'adversarial', 'testing', 'controls'],
    enabledByDefault: false,
  },
  {
    slug: 'feature-network-enrichment',
    name: 'Network Graph Enrichment',
    description: 'GLEIF LEI API enrichment of network nodes. Cross-references against OFAC + EU CFSP for entity resolution.',
    category: 'feature',
    jurisdiction: 'GLOBAL',
    regulator: 'GLEIF',
    version: '2.2',
    sourceUrl: 'https://www.gleif.org/en/lei/api',
    sourceType: 'api',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'api_base', type: 'string', default: 'https://api.gleif.org/api/v1/leirecords' },
        { name: 'rate_limit_per_sec', type: 'number', default: 5 },
        { name: 'match_threshold', type: 'number', default: 0.92 },
      ],
    },
    defaultFieldsJson: {
      api_base: 'https://api.gleif.org/api/v1/leirecords',
      rate_limit_per_sec: 5,
      match_threshold: 0.92,
    },
    tags: ['GLEIF', 'LEI', 'entity-resolution', 'graph'],
    enabledByDefault: true,
  },
  {
    slug: 'feature-counterfactual',
    name: 'Counterfactual Engine',
    description: 'Monte Carlo + sensitivity analysis engine. Computes baseline vs counterfactual risk score deltas for policy decisions.',
    category: 'feature',
    jurisdiction: 'GLOBAL',
    regulator: 'INTERNAL',
    version: '1.8',
    sourceUrl: 'https://raw.githubusercontent.com/testdemoqwenai2025-creator/FinRegGTP.BoT/main/public/data/counterfactual.json',
    sourceType: 'github',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'iterations', type: 'number', default: 10000 },
        { name: 'confidence_level', type: 'number', default: 0.95 },
        { name: 'parallel_workers', type: 'number', default: 4 },
      ],
    },
    defaultFieldsJson: {
      iterations: 10000,
      confidence_level: 0.95,
      parallel_workers: 4,
    },
    tags: ['monte-carlo', 'simulation', 'counterfactual', 'risk'],
    enabledByDefault: false,
  },

  // ─────────────────────────────────────────────────────────────
  // DOCUMENTS (6) — policy / procedure / report templates
  // ─────────────────────────────────────────────────────────────
  {
    slug: 'doc-aml-policy',
    name: 'AML Policy Template',
    description: 'BSA/AML compliance program policy template aligned with FinCEN + FATF Recommendation 10. Covers CDD, EDD, SAR filing, training.',
    category: 'document',
    jurisdiction: 'US',
    regulator: 'FinCEN',
    version: '2024.04',
    sourceUrl: 'https://www.fincen.gov/sites/default/files/shared/aml_program_final_rule.pdf',
    sourceType: 'web',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'policy_owner', type: 'string' },
        { name: 'approval_date', type: 'date' },
        { name: 'review_cycle_months', type: 'number', default: 12 },
        { name: 'sections', type: 'array', default: ['scope', 'definitions', 'cdd', 'edd', 'sar', 'training', 'recordkeeping'] },
      ],
    },
    defaultFieldsJson: {
      review_cycle_months: 12,
      sections: ['scope', 'definitions', 'cdd', 'edd', 'sar', 'training', 'recordkeeping'],
    },
    tags: ['AML', 'BSA', 'policy', 'FinCEN', 'template'],
    enabledByDefault: true,
    defaultForCategory: true,
  },
  {
    slug: 'doc-sar-template',
    name: 'SAR Filing Template',
    description: 'Suspicious Activity Report narrative template. Aligns with FinCEN SAR Form 111. Includes 5-part narrative structure.',
    category: 'form',
    jurisdiction: 'US',
    regulator: 'FinCEN',
    version: '2024',
    sourceUrl: 'https://www.fincen.gov/resources/reporters/sar-filing-instructions',
    sourceType: 'web',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'filing_institution', type: 'string', required: true },
        { name: 'subject_name', type: 'string', required: true },
        { name: 'suspicious_amount', type: 'number' },
        { name: 'suspicious_period_start', type: 'date' },
        { name: 'suspicious_period_end', type: 'date' },
        { name: 'narrative_intro', type: 'text' },
        { name: 'narrative_body', type: 'text' },
        { name: 'narrative_conclusion', type: 'text' },
      ],
    },
    defaultFieldsJson: {
      narrative_intro: '[Describe the institution, the subject(s), and the account(s) involved.]',
      narrative_body: '[Describe the suspicious activity chronologically, including dates, amounts, and patterns.]',
      narrative_conclusion: '[Summarize why the activity is suspicious and any actions taken.]',
    },
    tags: ['SAR', 'FinCEN', 'suspicious-activity', 'narrative'],
    enabledByDefault: true,
  },
  {
    slug: 'doc-compliance-manual',
    name: 'Compliance Manual Skeleton',
    description: 'End-to-end compliance manual skeleton covering all 6 regulatory zones (Core, Surveillance, Quant, Intelligence, Collaboration, Platform).',
    category: 'document',
    jurisdiction: 'GLOBAL',
    regulator: 'INTERNAL',
    version: '2.3',
    sourceUrl: 'https://raw.githubusercontent.com/testdemoqwenai2025-creator/FinRegGTP.BoT/main/README.md',
    sourceType: 'github',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'firm_name', type: 'string', required: true },
        { name: 'effective_date', type: 'date', required: true },
        { name: 'version', type: 'string', default: '2.3' },
        { name: 'zones', type: 'array', default: ['core', 'surveillance', 'quant', 'intelligence', 'collaboration', 'platform'] },
      ],
    },
    defaultFieldsJson: {
      version: '2.3',
      zones: ['core', 'surveillance', 'quant', 'intelligence', 'collaboration', 'platform'],
    },
    tags: ['manual', 'governance', 'policy'],
    enabledByDefault: true,
  },
  {
    slug: 'doc-training-log',
    name: 'Training Log Template',
    description: 'Annual AML/ethics training completion log. Captures employee, course, date, score, and refresh due date.',
    category: 'document',
    jurisdiction: 'GLOBAL',
    regulator: 'INTERNAL',
    version: '1.0',
    sourceUrl: 'https://raw.githubusercontent.com/testdemoqwenai2025-creator/FinRegGTP.BoT/main/public/data/audit.json',
    sourceType: 'github',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'employee_id', type: 'string', required: true },
        { name: 'employee_name', type: 'string', required: true },
        { name: 'course_name', type: 'string', required: true },
        { name: 'completion_date', type: 'date' },
        { name: 'score', type: 'number' },
        { name: 'refresh_due', type: 'date' },
      ],
    },
    defaultFieldsJson: {
      refresh_due_offset_months: 12,
    },
    tags: ['training', 'HR', 'compliance', 'log'],
    enabledByDefault: false,
  },
  {
    slug: 'doc-vendor-risk',
    name: 'Vendor Risk Assessment',
    description: 'Third-party vendor risk assessment template. Covers data handling, subprocessors, security controls, exit strategy.',
    category: 'document',
    jurisdiction: 'GLOBAL',
    regulator: 'INTERNAL',
    version: '1.5',
    sourceUrl: 'https://raw.githubusercontent.com/testdemoqwenai2025-creator/FinRegGTP.BoT/main/public/data/risk.json',
    sourceType: 'github',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'vendor_name', type: 'string', required: true },
        { name: 'service_provided', type: 'string', required: true },
        { name: 'data_classification', type: 'enum', values: ['public', 'internal', 'confidential', 'restricted'] },
        { name: 'subprocessors', type: 'array' },
        { name: 'security_certifications', type: 'array' },
        { name: 'risk_rating', type: 'enum', values: ['low', 'medium', 'high', 'critical'] },
      ],
    },
    defaultFieldsJson: {
      data_classification: 'confidential',
      risk_rating: 'medium',
    },
    tags: ['vendor', 'third-party', 'risk', 'assessment'],
    enabledByDefault: false,
  },
  {
    slug: 'doc-dpia',
    name: 'DPIA Template (GDPR Art. 35)',
    description: 'Data Protection Impact Assessment template per GDPR Article 35. Required for high-risk processing operations.',
    category: 'document',
    jurisdiction: 'EU',
    regulator: 'ESMA',
    version: '2023',
    sourceUrl: 'https://gdpr-info.eu/art-35-gdpr/',
    sourceType: 'web',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'project_name', type: 'string', required: true },
        { name: 'dpo', type: 'string', required: true },
        { name: 'processing_description', type: 'text' },
        { name: 'necessity_assessment', type: 'text' },
        { name: 'risks_to_subjects', type: 'array' },
        { name: 'mitigations', type: 'array' },
      ],
    },
    defaultFieldsJson: {
      risks_to_subjects: [],
      mitigations: [],
    },
    tags: ['DPIA', 'GDPR', 'privacy', 'EU', 'data-protection'],
    enabledByDefault: false,
  },
]

// Convenience aggregations
export const PLUGIN_CATEGORIES: PluginCategory[] = ['form', 'label', 'feature', 'document']
export const PLUGIN_JURISDICTIONS = Array.from(
  new Set(PLUGIN_CATALOG.map((p) => p.jurisdiction)),
).sort()
export const PLUGIN_REGULATORS = Array.from(
  new Set(PLUGIN_CATALOG.map((p) => p.regulator).filter(Boolean) as string[]),
).sort()

/** Stats helper for the catalog (without DB state). */
export function catalogStats() {
  return {
    total: PLUGIN_CATALOG.length,
    byCategory: PLUGIN_CATEGORIES.reduce(
      (acc, c) => ({ ...acc, [c]: PLUGIN_CATALOG.filter((p) => p.category === c).length }),
      {} as Record<PluginCategory, number>,
    ),
    byJurisdiction: PLUGIN_JURISDICTIONS.reduce(
      (acc, j) => ({ ...acc, [j]: PLUGIN_CATALOG.filter((p) => p.jurisdiction === j).length }),
      {} as Record<string, number>,
    ),
    enabledByDefault: PLUGIN_CATALOG.filter((p) => p.enabledByDefault).length,
    defaultForCategory: PLUGIN_CATALOG.filter((p) => p.defaultForCategory).length,
  }
}
