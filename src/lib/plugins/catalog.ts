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
  // ─── EU corpus diversification (Task 13) ───────────────────────────
  // Three EBA/CRR plugins that balance the EU vector store so retrieval
  // for EBA regulator cases no longer returns only gdpr-ropa chunks.
  // Each plugin carries a multi-paragraph body_text in defaultFieldsJson
  // so the synthesizer emits raw paragraphs that the chunker splits into
  // 8-15 retrieval chunks per plugin.
  {
    slug: 'eba-stress-test-2026',
    name: 'EBA Stress Test 2026 Methodology',
    description: 'EU-wide stress test methodology published by the EBA — adverse scenario parameters, capital floor, and reporting templates (TR1-TR9) for the 2026 biennial exercise.',
    category: 'form',
    jurisdiction: 'EU',
    regulator: 'EBA',
    version: '2026.1',
    sourceUrl: 'https://www.eba.europa.eu/regulation-and-policy/stress-testing/eu-wide-stress-testing',
    sourceType: 'web',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'exercise_year', type: 'number', required: true },
        { name: 'cet1_floor_pct', type: 'number', required: true },
        { name: 'time_horizon_years', type: 'number' },
        { name: 'sample_size_banks', type: 'number' },
        { name: 'submission_deadline', type: 'string' },
        { name: 'reporting_templates', type: 'array' },
      ],
    },
    defaultFieldsJson: {
      exercise_year: 2026,
      cet1_floor_pct: 5.5,
      time_horizon_years: 3,
      sample_size_banks: 70,
      submission_deadline: '2026-04-30',
      reporting_templates: ['TR1_Capital_Positions', 'TR2_RWA_Floor', 'TR3_Credit_Risk', 'TR4_Market_Risk', 'TR5_Ops_Risk', 'TR6_IRB', 'TR7_Securitisation', 'TR8_Forced_Sale', 'TR9_Summary'],
      body_text: 'EBA EU-Wide Stress Test 2026 Methodology\n\nThe European Banking Authority conducts a biennial EU-wide stress test on a sample of the largest banks across the European Union. The 2026 exercise covers approximately 70 banks representing over 70 percent of the EU banking sector by total assets. The objective is to assess the resilience of the EU banking system to an adverse macroeconomic scenario and to inform the Supervisory Review and Evaluation Process (SRE) conducted by the Single Supervisory Mechanism.\n\nThe 2026 adverse scenario is designed by the European Systemic Risk Board (ESRB) and comprises a severe global recession with GDP contracting by 3.5 percent cumulatively over the three-year horizon, unemployment rising by 8 percentage points, equity prices falling by 30 percent, and residential real estate prices declining by 25 percent. The scenario also includes a sovereign-stress leg with a 200 basis point increase in long-term interest rates and a widening of sovereign spreads for high-debt member states.\n\nThe Common Equity Tier 1 (CET1) capital floor applied in the 2026 exercise is set at 5.5 percent of risk-weighted assets. This floor is binding on a fully-loaded basis, meaning that banks must hold CET1 capital equal to or above 5.5 percent of RWA under the adverse scenario throughout the three-year projection horizon. Banks that breach the floor are expected to submit a capital replenishment plan to their supervisor within four weeks of the results publication.\n\nThe stress test employs a constrained bottom-up approach. Banks project their capital trajectories under the adverse scenario using their internal models subject to constraints and benchmarks imposed by the EBA. The EBA and national competent authorities challenge the projections through a series of quality assurance reviews before publishing the results. The quality assurance process typically takes between 10 and 12 weeks.\n\nReporting templates TR1 through TR9 must be submitted in XBRL format via the EBA Reporting Framework. Template TR1 captures the capital positions and RWAs at each year-end of the projection. Template TR2 documents the impact of the RWA floor. Templates TR3 through TR5 capture credit, market, and operational risk projections. Templates TR6 and TR7 cover IRB and securitisation detail. Template TR8 captures forced-sale gains and losses on sovereign bond portfolios. Template TR9 provides the summary results that the EBA publishes.\n\nThe submission deadline for the 2026 exercise is 30 April 2026. The EBA will publish the aggregated results in late October 2026 alongside bank-level results for each institution in the sample. The results will feed into the SREP cycle for 2027, informing Pillar 2 capital add-ons where the stress test reveals capital weakness.',
    },
    tags: ['EBA', 'stress-test', 'capital', 'CET1', 'EU', 'banking'],
    enabledByDefault: true,
  },
  {
    slug: 'crr-article-107',
    name: 'CRR Article 107 — Capital Conservation Buffer',
    description: 'Article 107 of the EU Capital Requirements Regulation (Regulation 575/2013) establishing the capital conservation buffer above the Pillar 1 minimum and the Maximum Distributable Amount (MDA) restriction mechanism.',
    category: 'document',
    jurisdiction: 'EU',
    regulator: 'EBA',
    version: '575/2013',
    sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02013R0575-20240101',
    sourceType: 'web',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'buffer_pct', type: 'number', required: true },
        { name: 'capital_quality', type: 'enum', values: ['CET1'] },
        { name: 'mda_quartiles', type: 'number' },
        { name: 'restricted_distributions', type: 'array' },
      ],
    },
    defaultFieldsJson: {
      buffer_pct: 2.5,
      capital_quality: 'CET1',
      mda_quartiles: 4,
      restricted_distributions: ['dividends', 'share_buybacks', 'variable_remuneration', 'AT1_coupon_payments'],
      body_text: 'CRR Article 107 — Capital Conservation Buffer\n\nArticle 107 of Regulation (EU) No 575/2013 (the Capital Requirements Regulation, or CRR) requires institutions to maintain a capital conservation buffer of Common Equity Tier 1 (CET1) capital equal to 2.5 percent of their total risk-weighted assets, on top of the Pillar 1 minimum own funds requirements. The buffer is composed solely of CET1 capital; Additional Tier 1 and Tier 2 instruments do not qualify.\n\nThe purpose of the buffer is to ensure that institutions build up an additional layer of CET1 capital during normal periods that can be drawn down during periods of stress. Unlike the countercyclical buffer, the capital conservation buffer is a fixed percentage and is not varied over time. It is designed to be permeable: institutions are permitted to use the buffer to absorb losses during a stress, but they face restrictions on their ability to make distributions while the buffer is depleted.\n\nWhen an institution\'s CET1 capital falls within the combined buffer range (the sum of the capital conservation buffer, the countercyclical buffer, and the systemic risk buffer), it must restrict distributions to shareholders, employees, and holders of Additional Tier 1 instruments. The restriction mechanism is based on the Maximum Distributable Amount (MDA), which is the maximum amount that may be distributed in respect of a given financial year.\n\nThe MDA is calculated by dividing the institution\'s CET1 capital buffer shortfall into quartiles. The distribution restriction varies linearly with the quartile in which the institution\'s CET1 ratio falls. The first quartile (closest to the Pillar 1 minimum) imposes the most severe restriction, with a maximum distribution equal to zero percent of profits. The second quartile allows distributions up to 20 percent of profits. The third quartile allows distributions up to 40 percent. The fourth quartile (closest to the buffer top) allows distributions up to 60 percent. Profits are computed after tax and after deducting any discretionary distributions.\n\nRestricted distributions include dividends on common shares, share buybacks, variable remuneration to material risk-takers, and coupon payments on Additional Tier 1 instruments. Payments on legacy Tier 1 instruments that are eligible for grandfathering are also restricted. The restriction applies prospectively from the date the institution falls below the buffer threshold.\n\nInstitutions are required to notify their competent authority within five working days of identifying that their CET1 capital has fallen within the combined buffer range. The notification must include a capital conservation plan that describes the measures the institution intends to take to restore its CET1 capital, the expected timeframe for restoration, and an assessment of whether the institution will be able to continue to meet its Pillar 1 requirements during the restoration period.\n\nThe European Banking Authority has published Guidelines (EBA/GL/2014/09) on the calculation of the MDA, including worked examples for institutions with negative profits, institutions with intra-year capital distributions, and institutions subject to a systemic risk buffer that varies by exposure. The Guidelines also clarify the interaction between the MDA restriction and the remuneration provisions in the Capital Requirements Directive (CRD) Article 92, particularly with respect to the deferral and pro-cyclicality of variable remuneration.',
    },
    tags: ['CRR', 'EBA', 'capital', 'CET1', 'MDA', 'EU', 'banking'],
    enabledByDefault: true,
  },
  {
    slug: 'eba-pillar-3-rwa',
    name: 'EBA Pillar 3 RWA Disclosure Template',
    description: 'EBA implementing technical standards on Pillar 3 disclosure — risk-weighted assets breakdown templates KM1, OV1, and CC1 per CRR Articles 431-435, applicable to large institutions on a semi-annual basis.',
    category: 'form',
    jurisdiction: 'EU',
    regulator: 'EBA',
    version: '2024/856',
    sourceUrl: 'https://www.eba.europa.eu/regulation-and-policy/supervisory-reporting/pillar-3-disclosures',
    sourceType: 'web',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'reporting_frequency', type: 'enum', values: ['annual', 'semi-annual', 'quarterly'] },
        { name: 'applicable_institutions', type: 'string' },
        { name: 'templates', type: 'array' },
        { name: 'publication_deadline_days', type: 'number' },
      ],
    },
    defaultFieldsJson: {
      reporting_frequency: 'semi-annual',
      applicable_institutions: 'large_institutions_total_assets_gt_30bn',
      templates: ['KM1_Key_Metrics', 'OV1_RWA_Overview', 'CC1_Capital_Composition', 'CC2_Capital_Changes'],
      publication_deadline_days: 30,
      body_text: 'EBA Pillar 3 Disclosure — Risk-Weighted Assets Templates\n\nThe EBA Implementing Technical Standards (ITS) on Pillar 3 disclosure, most recently consolidated under Regulation (EU) 2024/856, specify the templates and associated instructions that institutions must use to disclose their risk-weighted assets (RWA) and capital positions to the market. The disclosure requirements derive from Articles 431 through 435 of the Capital Requirements Regulation (CRR).\n\nLarge institutions, defined as those with total assets exceeding 30 billion euro, are required to publish Pillar 3 disclosures on a semi-annual basis. Smaller institutions may publish annually. The publication must occur within 30 calendar days of the reference date for the semi-annual template and within 60 calendar days for the annual templates. The disclosures must be made available on the institution\'s website in a machine-readable format (XBRL or CSV) and submitted to the EBA via the European Centralised Infrastructure for data collection (EuCIL).\n\nTemplate KM1 — Key Metrics presents a one-page summary of the institution\'s capital, RWA, leverage ratio, and liquidity ratios. It includes the CET1 capital ratio, the Tier 1 capital ratio, the total capital ratio, the leverage ratio, the liquidity coverage ratio (LCR), and the net stable funding ratio (NSFR). Each metric is presented for both the current and the previous reporting period, with a column for the change in percentage points.\n\nTemplate OV1 — Overview of RWA provides a breakdown of total RWA by risk type. The rows distinguish between credit risk RWA (further broken down into the standardised approach and the IRB approach), counterparty credit risk RWA, market risk RWA (standardised and internal models approaches), operational risk RWA, and RWA arising from the settlement risk. For credit risk under the IRB approach, the template further distinguishes between the IRB fallback position and the advanced IRB approach.\n\nTemplate CC1 — Composition of Regulatory Capital presents the reconciliation between the institution\'s accounting balance sheet equity and its regulatory CET1, Additional Tier 1, and Tier 2 capital. The template lists all regulatory adjustments (deductions and filters) applied to arrive at regulatory capital, including the deduction of intangible assets, deferred tax assets that rely on future profitability, and significant investments in unconsolidated financial sector entities.\n\nTemplate CC2 — Main Changes in Regulatory Capital During the Period explains the movements in regulatory capital during the reporting period. The template breaks down changes into (i) capital raised or redeemed, (ii) profit or loss net of distributable items, (iii) regulatory adjustments, (iv) foreign exchange translation effects, and (v) other changes. This allows users of the financial statements to understand the drivers of capital changes other than organic profit generation.\n\nInstitutions are also required to publish a qualitative annex describing the methodologies used to compute the disclosed RWA, the key assumptions underlying the IRB models, and any deviations from the EBA\'s published templates. The qualitative annex must be updated at least annually and is typically published alongside the H1 results.\n\nThe EBA conducts periodic benchmarking exercises to assess the consistency of RWA outcomes across institutions. The results of these exercises are published in the EBA\'s annual Report on the Monitoring of Additional Metrics for Capital Adequacy. Where the EBA identifies material inconsistencies between institutions, it may issue supervisory guidance or, in the case of model issues, refer the matter to the Single Supervisory Mechanism for follow-up under the Supervisory Review and Evaluation Process.',
    },
    tags: ['EBA', 'Pillar 3', 'disclosure', 'RWA', 'EU', 'transparency'],
    enabledByDefault: true,
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
  // ─── Task 14: Modern Regulatory Forms & Templates ──────────────
  // Two next-generation form plugins that go beyond the existing
  // paper-form catalog entries. Both carry rich body_text so the
  // RAG retriever can surface them for case-management and
  // examinations work. The schemas describe the machine-readable
  // fields; the body_text describes the regulatory framework.
  {
    slug: 'edd-form-framework',
    name: 'EDD Form Framework — Enhanced Due Diligence',
    description: 'Dynamic KYC + biometric matching, beneficial ownership cascading to 25% thresholds, source-of-funds blockchain verification. Triggered for high-risk customers per FinCEN CDD Rule 31 CFR 1010.230.',
    category: 'form',
    jurisdiction: 'US',
    regulator: 'FinCEN',
    version: '2026.1',
    sourceUrl: 'https://www.fincen.gov/resources/statutes-regulations/31-cfr-chapter-x-subchapter-b-part-1010',
    sourceType: 'web',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'customer_id', type: 'string', required: true },
        { name: 'customer_type', type: 'enum', values: ['individual', 'legal_entity', 'trust', 'PEP'] },
        { name: 'risk_rating', type: 'enum', values: ['medium', 'high', 'prohibited'] },
        { name: 'biometric_template_hash', type: 'string' },
        { name: 'biometric_match_score', type: 'number' },
        { name: 'beneficial_owners', type: 'array', threshold_pct: 25 },
        { name: 'source_of_funds_evidence', type: 'array' },
        { name: 'source_of_wealth_evidence', type: 'array' },
        { name: 'blockchain_address_verified', type: 'boolean' },
        { name: 'onchain_cluster_ids', type: 'array' },
        { name: 'reviewer_id', type: 'string', required: true },
        { name: 'approval_expires_at', type: 'string' },
      ],
    },
    defaultFieldsJson: {
      risk_rating: 'high',
      beneficial_ownership_threshold_pct: 25,
      biometric_match_min_score: 85,
      onboarding_evidence_retention_years: 7,
      body_text: 'EDD Form Framework — Enhanced Due Diligence\n\nThe Enhanced Due Diligence (EDD) Form Framework implements the FinCEN Customer Due Diligence Rule codified at 31 CFR 1010.230, which requires covered financial institutions to identify and verify the beneficial owners of legal entity customers at the 25 percent ownership threshold. The Framework extends baseline CDD with three additional layers: dynamic KYC with biometric matching, beneficial ownership cascading, and source-of-funds blockchain verification.\n\nLayer 1 — Dynamic KYC with biometric matching. The customer onboarding journey captures identity documents (passport, driver license, government-issued ID) and runs them through a three-stage pipeline: (i) document liveness detection using passive facial challenge, (ii) biometric face-match against the document photo with a minimum match score of 85 out of 100, and (iii) watchlist screening against OFAC SDN, EU CFSP, UK HMT, UN consolidated, and country-specific PEP lists. The biometric template is stored as a SHA-256 hash of the embedded feature vector, never as raw biometric data, satisfying GDPR Article 9 special category data minimisation. Failed biometric matches trigger a manual review queue; the Framework mandates that the human reviewer document the override reason and obtain second-line approval before proceeding.\n\nLayer 2 — Beneficial ownership cascading to 25 percent thresholds. For legal entity customers, the Framework requires identification of every individual who directly or indirectly owns 25 percent or more of the equity interests, plus any individual who exercises significant managerial control (the so-called control prong). The cascading logic traverses the ownership graph up to four levels deep, decomposing intermediate holding companies and aggregating ownership stakes through joint ownership, voting trusts, and nominee arrangements. Where no individual reaches the 25 percent threshold at the top level, the Framework falls back to the control prong and requires the chief executive officer, chief financial officer, or equivalent officer to be identified. The ownership graph is captured as a JSON document with one node per entity, edges weighted by ownership percentage, and a verification status flag on each node indicating whether the stake has been independently verified against a registry (Companies House, OpenCorporates, GLEIF, or jurisdictional equivalent).\n\nLayer 3 — Source of funds blockchain verification. For customers whose declared source of funds involves cryptocurrency, the Framework requires on-chain cluster analysis to confirm the provenance of the wealth. The customer declares one or more wallet addresses; the Framework submits them to a blockchain analytics provider (Chainalysis, TRM Labs, Elliptic, or equivalent) and retrieves the cluster exposure breakdown. The Framework rejects the source-of-funds declaration if more than 5 percent of the wallet exposure traces to mixer services (Tornado Cash, Blender.io), sanctioned entities, darknet markets, or fraud-attributed clusters. Stablecoin declarations on USDC or USDT require additional attestation that the customer controls the off-ramp bank account used to acquire the stablecoins. On-chain evidence is captured with a blockchain transaction hash, a snapshot of the cluster report, and a 90-day freshness window — older reports must be refreshed before the EDD approval is renewed.\n\nEDD approvals are valid for 12 months for high-risk customers and 6 months for prohibited-risk customers (the latter requiring senior compliance officer sign-off). The Framework generates an automated refresh reminder 30 days before expiry, escalating to the MLRO if the refresh is overdue by more than 7 days. All EDD artifacts (biometric match scores, ownership graphs, blockchain cluster reports, reviewer sign-offs) are retained for 7 years per 31 CFR 1010.430 recordkeeping requirements.\n\nThe Framework is designed to interoperate with the SAR Next-Generation Template: any EDD case that surfaces a suspicious source-of-funds pattern automatically generates a pre-populated SAR draft with the relevant evidence chain attached, ready for the MLRO to review and file.',
    },
    tags: ['EDD', 'KYC', 'biometric', 'beneficial-ownership', 'blockchain', 'FinCEN', 'AML', 'CDD'],
    enabledByDefault: true,
  },
  {
    slug: 'sar-next-gen-template',
    name: 'SAR Next-Generation Template — FinCEN BSA E-Filing',
    description: 'Structured-data SAR template aligned with FinCEN BSA E-Filing XML schema, FATF typology classification (RE-2023 series), and machine-readable elements for regulator-to-regulator information sharing.',
    category: 'form',
    jurisdiction: 'US',
    regulator: 'FinCEN',
    version: '2026.1',
    sourceUrl: 'https://bsaefiling.fincen.treas.gov/Enforcement/SharedFormShared.aspx',
    sourceType: 'web',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'filing_institution', type: 'string', required: true },
        { name: 'filing_institution_ein', type: 'string', required: true },
        { name: 'subject_count', type: 'number' },
        { name: 'subjects', type: 'array', items: { type: 'object', fields: ['name', 'dob', 'id_type', 'id_number', 'address'] } },
        { name: 'activity_date_range_start', type: 'string', required: true },
        { name: 'activity_date_range_end', type: 'string', required: true },
        { name: 'aggregate_amount', type: 'number', required: true },
        { name: 'currency', type: 'string', default: 'USD' },
        { name: 'fatf_typology_codes', type: 'array' },
        { name: 'structuring_pattern', type: 'enum', values: ['smurfing', 'micro-structuring', 'rapid-movement', 'funnel-account', 'none'] },
        { name: 'suspicious_activity_narrative', type: 'string', required: true, max_length: 17000 },
        { name: 'evidence_attachment_ids', type: 'array' },
        { name: 'cross_border_jurisdictions', type: 'array' },
        { name: 'virtual_asset_involved', type: 'boolean' },
        { name: 'virtual_asset_type', type: 'string' },
        { name: 'mlro_certification', type: 'boolean', required: true },
        { name: 'filing_deadline_days', type: 'number', default: 30 },
      ],
    },
    defaultFieldsJson: {
      currency: 'USD',
      filing_deadline_days: 30,
      aggregate_amount_threshold_usd: 5000,
      continuing_activity_review_days: 90,
      body_text: 'SAR Next-Generation Template — FinCEN BSA E-Filing\n\nThe Suspicious Activity Report (SAR) Next-Generation Template modernises the legacy FinCEN Form 111 (formerly SAR-DI) by replacing the free-text narrative with a structured-data submission aligned with the FinCEN BSA E-Filing XML schema. The template incorporates the FATF Typology Classification (RE-2023 series) so that suspicious activity is categorised in a machine-readable way at the point of filing, enabling regulator-to-regulator information sharing and cross-institution pattern detection.\n\nStructured data fields. The template requires the filing institution to populate a fixed schema of approximately 60 fields, organised into six sections: (1) Filing Institution Information (EIN, primary federal regulator, RFC number), (2) Subject Information (one block per subject, with name, DOB, identification type and number, address, and any known phone or email), (3) Suspicious Activity Information (date range, aggregate amount, currency, structuring pattern classification, suspicious activity type codes from the FinCEN SAR Activity Type taxonomy), (4) Narrative (a single text block up to 17,000 characters, structured into Introduction, Body, and Conclusion), (5) Evidence Attachments (references to supporting documents uploaded separately to the BSA E-Filing system), and (6) Cross-Border Information (lists of jurisdictions involved, correspondent banks, and any virtual asset types).\n\nFATF typology classification. Each SAR must be tagged with one or more typology codes drawn from the FATF RE-2023 series, which covers 35 typologies across seven categories: (a) placement and layering (structuring, blending, funnel accounts), (b) trade-based money laundering (over/under-invoicing, phantom shipments, multiple invoicing), (c) terrorist financing (front companies, charitable organisations, hawala), (d) proliferation financing (dual-use goods procurement, third-country intermediaries, designated-entity exposure), (e) cyber-enabled crime (ransomware, business email compromise, account takeover), (f) virtual asset typologies (mixer exposure, peer-to-peer transfers, privacy coin usage, DeFi protocol exploitation), and (g) corruption (PEP funds, state-owned enterprise embezzlement, bribery of foreign officials). The template enforces a primary typology (required) and up to four secondary typologies (optional) per filing. The typology codes are mapped to the FinCEN SAR Activity Type codes via a crosswalk table maintained by FinCEN and updated annually.\n\nMachine-readable elements. The template replaces the legacy narrative-only format with a hybrid: structured fields for the regulator-facing machine-readable layer, plus a narrative block for the human-readable context. The structured fields enable FinCEN to run automated pattern detection across institutions, identifying coordinated activity that would be invisible to any single filer. The narrative block retains the storytelling function, with the regulator providing guidance on the recommended structure: Introduction (who/what/when), Body (how the activity was detected, what made it suspicious, the financial impact), and Conclusion (actions taken, recommendations, ongoing monitoring plan). The narrative must reference the typology codes used so the regulator can cross-reference the machine-readable analysis with the human-readable explanation.\n\nFiling deadlines. The template enforces the 30-day filing deadline from initial detection of suspicious activity (running from the date the SAR decision is made, not the date of the activity itself). For continuing activity, the template generates an automatic reminder every 90 days, requiring the institution to either file a continuing-activity SAR or document why the activity is no longer suspicious. The filing deadline is extended to 60 days when no subject has been identified at the time of detection. The template prohibits filing after the deadline without an explanatory footnote approved by the MLRO.\n\nCross-border information sharing. The template includes a structured cross-border section that lists every jurisdiction touched by the suspicious activity, the role each jurisdiction played (origin, transit, destination), and any correspondent bank relationships involved. This section feeds into the Egmont Group secure information-sharing network, allowing foreign financial intelligence units to query the FinCEN database for related SARs. The template supports the FinCEN 314(b) information-sharing exemption, which permits U.S. financial institutions to share SAR-related information with each other for suspicious activity detection, subject to the safeguarding requirements of 31 CFR 1010.430(f).\n\nVirtual asset handling. The template includes a dedicated virtual asset section that captures the asset type (BTC, ETH, USDT, USDC, privacy coins), wallet addresses involved, transaction hashes, and the cluster attribution from a blockchain analytics provider. SARs involving virtual assets must include a chain-of-custody attestation confirming that the wallet-to-customer mapping has been independently verified.\n\nMLRO certification. Every SAR filed through the template requires an MLRO certification block — a signed attestation that the MLRO has reviewed the supporting evidence, agrees that the activity is suspicious, and authorises the filing. The certification is captured as a digital signature with a timestamp and the MLRO’s FinCEN-registered identifier.',
    },
    tags: ['SAR', 'FinCEN', 'BSA', 'FATF', 'typology', 'machine-readable', 'AML', 'XML'],
    enabledByDefault: true,
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
  // ─── Task 14: Advanced Compliance Labels & Classifications ────
  // Three new label plugins that extend the existing 6-label taxonomy.
  // Each carries a body_text so the RAG retriever can surface the
  // governance framework behind the label, not just the enum values.
  {
    slug: 'label-ai-ml-risk-tier',
    name: 'AI/ML Model Risk Tiers',
    description: 'Four-tier classification (Critical / High / Medium / Low) for AI/ML models with governance requirements, human-override mandates, and audit frequencies. Aligned with EU AI Act risk categories + Fed SR 11-7.',
    category: 'label',
    jurisdiction: 'GLOBAL',
    regulator: 'INTERNAL',
    version: '2026.1',
    sourceUrl: 'https://www.federalreserve.gov/supervisionreg/srletters/sr1107.htm',
    sourceType: 'web',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'tier', type: 'enum', values: ['critical', 'high', 'medium', 'low'], required: true },
        { name: 'model_use_case', type: 'string' },
        { name: 'human_override_required', type: 'boolean' },
        { name: 'audit_frequency_months', type: 'number' },
        { name: 'approval_authority', type: 'enum', values: ['board', 'ceo', 'cRO', 'senior_compliance', 'team_lead'] },
        { name: 'retraining_cadence_months', type: 'number' },
        { name: 'bias_testing_required', type: 'boolean' },
        { name: 'explainability_method', type: 'string' },
      ],
    },
    defaultFieldsJson: {
      tiers: [
        { tier: 'critical', governance: 'Board + Model Risk Committee', human_override: true, audit_months: 6, retraining_months: 6, approval_authority: 'board' },
        { tier: 'high',     governance: 'CEO + CRO sign-off',           human_override: true, audit_months: 12, retraining_months: 12, approval_authority: 'ceo' },
        { tier: 'medium',   governance: 'Senior Compliance Officer',    human_override: false, audit_months: 18, retraining_months: 18, approval_authority: 'cRO' },
        { tier: 'low',      governance: 'Team Lead attestation',        human_override: false, audit_months: 24, retraining_months: 24, approval_authority: 'team_lead' },
      ],
      body_text: 'AI/ML Model Risk Tiers — Governance Framework\n\nThe AI/ML Model Risk Tier label classifies every deployed model into one of four tiers (Critical, High, Medium, Low), each carrying specific governance requirements, human-override mandates, audit frequencies, and approval authorities. The framework is aligned with the EU AI Act risk categories (Article 6 high-risk classification, Article 50 transparency obligations) and the U.S. Federal Reserve SR 11-7 Guidance on Model Risk Management, supplemented by the OCC Bulletin 2011-12 and the PRA SS1/23 supervisory statement on model risk management.\n\nTier 1 — Critical models. These are models whose incorrect output could result in material financial loss, regulatory breach, or harm to consumers on a scale that would threaten the institution\'s viability. Examples include automated credit decisioning for retail mortgages, real-time AML transaction monitoring with auto-block capability, and autonomous trading algorithms executing customer orders. Critical models require Board-level approval before deployment and an annual Model Risk Committee review. A human override is mandatory for every adverse decision: the model may recommend decline, but a human underwriter, MLRO, or compliance officer must affirmatively approve the decision before it takes effect. The override reasoning is captured in an audit trail with a 7-year retention. Audit frequency is every 6 months, conducted by an independent second-line model validation team. Bias testing is mandatory quarterly using the EEOC 4/5ths rule plus demographic parity, equal opportunity, and predictive parity metrics across protected classes.\n\nTier 2 — High models. These are models whose incorrect output could cause significant financial loss or regulatory breach at the business-unit level, but not threaten the institution as a whole. Examples include insurance underwriting models, robo-advisory portfolio allocation, and sanctions screening name-match ranking. High-tier models require CEO and CRO sign-off before deployment, with annual review by the Model Risk Committee. Human override is mandatory for adverse decisions affecting individual customers (decline of service, account closure, sanctions-blocked transaction). Audit frequency is every 12 months. Bias testing is mandatory semi-annually, with the same metric set as Tier 1.\n\nTier 3 — Medium models. These are models whose incorrect output has limited financial or regulatory impact, typically confined to a single product line or operational function. Examples include customer churn prediction models, marketing segmentation models, and fraud-scoring models used for queue prioritisation but not for auto-decline. Medium-tier models require Senior Compliance Officer approval before deployment, with review every 18 months. Human override is not mandated at the decision level, but the model output must be reviewable on request by a human within 48 hours. Audit frequency is every 18 months. Bias testing is recommended annually.\n\nTier 4 — Low models. These are models with no direct consumer or regulatory impact, typically used for internal operational efficiency. Examples include meeting-room scheduling optimisation, internal document classification, and knowledge-base article recommendation. Low-tier models require Team Lead attestation before deployment, with review every 24 months. No human override or bias testing requirements. Audit frequency is every 24 months, conducted by the first line of defence.\n\nCross-tier requirements. All four tiers must register the model in the central Model Inventory within 5 business days of deployment, capturing the model use case, data sources, training methodology, performance metrics, and assigned tier. Any change in tier (up or down) requires the new approval authority to sign off. Models that drift outside their validated performance envelope must be quarantined within 24 hours pending re-validation. Explainability methods (SHAP, LIME, or counterfactual) are required for Tier 1 and Tier 2 models; for Tier 3 and Tier 4, feature importance suffices.\n\nThe label integrates with the Fairness Testing view (Task 12) so that bias test results are visible alongside the tier classification, and with the XCC (Explainable Compliance Card) view so that every model-driven decision carries a compliance card recording the model tier, the override decision (if any), and the auditor sign-off.',
    },
    tags: ['AI', 'ML', 'model-risk', 'governance', 'SR-11-7', 'EU-AI-Act', 'tier'],
    enabledByDefault: true,
    defaultForCategory: false,
  },
  {
    slug: 'label-tm-alert-taxonomy',
    name: 'Transaction Monitoring Alert Taxonomy',
    description: '20 primary alert categories for transaction monitoring: structuring, layering, integration, cyber crime, sanctions evasion, DeFi exploits, trade-based ML, and 13 more. FATF RE-2023 aligned.',
    category: 'label',
    jurisdiction: 'GLOBAL',
    regulator: 'FATF',
    version: '2026.1',
    sourceUrl: 'https://www.fatf-gafi.org/en/publications/Financialsectormonitoringandoutreach.html',
    sourceType: 'web',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'category_code', type: 'string', required: true },
        { name: 'category_name', type: 'string', required: true },
        { name: 'fatf_typology_ref', type: 'string' },
        { name: 'risk_severity', type: 'enum', values: ['low', 'medium', 'high', 'critical'] },
        { name: 'auto_escalate', type: 'boolean' },
        { name: 'detection_method', type: 'enum', values: ['rule', 'ml-model', 'hybrid', 'manual'] },
      ],
    },
    defaultFieldsJson: {
      total_categories: 20,
      categories: [
        'structuring', 'layering', 'integration', 'smurfing', 'rapid_movement',
        'funnel_account', 'trade_based_ml', 'cyber_crime', 'ransomware', 'bec',
        'sanctions_evasion', 'pep_corruption', 'terrorist_financing', 'proliferation_financing',
        'defi_exploit', 'mixer_exposure', 'privacy_coin', 'nft_laundering',
        'cross_border_funnel', 'crypto_fiat_ramp'
      ],
      body_text: 'Transaction Monitoring Alert Taxonomy — 20 Primary Categories\n\nThe Transaction Monitoring Alert Taxonomy classifies every alert generated by the transaction monitoring (TM) system into one of 20 primary categories, each mapped to a FATF RE-2023 typology reference, a risk severity level, and a recommended detection method. The taxonomy replaces the legacy 8-category label-event-type enum with a richer set designed to capture the modern typology landscape, particularly the explosion in cyber and virtual-asset-related crime since 2020.\n\nPlacement and layering (categories 1-7). Structuring (TM-001): transactions broken into amounts just below the $10,000 CTR threshold, the foundational placement typology. Layering (TM-002): multi-hop transfers through correspondent banks designed to obscure the audit trail. Integration (TM-003): funds re-entering the legitimate economy through property purchases, luxury goods, or business investment. Smurfing (TM-004): multiple low-value cash deposits conducted by networks of individuals across branches. Rapid movement (TM-005): funds transferred in and out of an account within 24 hours, often via real-time payment rails. Funnel account (TM-006): one account receiving deposits from many geographically dispersed individuals and remitting to a single beneficiary. Trade-based money laundering (TM-007): over- or under-invoicing of goods, phantom shipments, or multiple invoicing against a single underlying trade.\n\nCyber-enabled crime (categories 8-10). Cyber crime (TM-008): generic cyber-enabled fraud including account takeover, synthetic identity, and card-not-present fraud. Ransomware (TM-009): payments to ransomware-affiliated wallets, often characterised by exact-amount payments to known ransomware-as-a-service infrastructure. Business email compromise (TM-010): fraudulent payment instructions impersonating executives or suppliers, typically resulting in wire transfers to mule accounts.\n\nSanctions and geopolitical (categories 11-13). Sanctions evasion (TM-011): transactions involving sanctioned entities, indirect routing through enablers, or use of front companies to obscure ultimate beneficial ownership. PEP corruption (TM-012): funds linked to politically exposed persons from high-corruption-risk jurisdictions, often involving state-owned enterprise embezzlement. Terrorist financing (TM-013): small-value transfers to known or suspected terrorist financiers, often via hawala or money service businesses; typology includes front companies and charitable organisations used as funding conduits.\n\nProliferation (category 14). Proliferation financing (TM-014): procurement of dual-use goods for weapons of mass destruction programmes, often involving third-country intermediaries, designated-entity exposure, or unusual payments to high-tech manufacturers in sensitive jurisdictions.\n\nVirtual asset typologies (categories 15-20). DeFi exploit (TM-015): funds derived from exploits of decentralised finance protocols, including flash loan attacks, oracle manipulation, and bridge exploits. Mixer exposure (TM-016): on-chain exposure to mixer services (Tornado Cash, Blender.io, ChipMixer) used to obscure the trail of tainted cryptocurrency. Privacy coin (TM-017): use of Monero, Zcash, or other privacy-preserving cryptocurrencies designed to defeat chain analysis. NFT laundering (TM-018): use of non-fungible token marketplaces for wash trading and self-dealing to legitimise illicit cryptocurrency. Cross-border funnel (TM-019): coordinated movement of funds across multiple jurisdictions via cryptocurrency exchanges with weak KYC, often paired with traditional correspondent banking. Crypto-fiat ramp (TM-020): suspicious activity at the cryptocurrency-to-fiat interface, including structured cash withdrawals from cryptocurrency ATMs, high-volume peer-to-peer trading, or unexplained transfers between personal bank accounts and cryptocurrency exchanges.\n\nDetection methods. Each category is annotated with a recommended detection method: rule-based (deterministic thresholds, e.g. CTR threshold for structuring), ML-model-based (anomaly detection, e.g. isolation forest for layering), hybrid (rule-triggered plus ML-scored, e.g. sanctions screening with fuzzy match scoring), or manual (analyst-driven, e.g. proliferation financing where rules struggle to keep up with rapidly evolving procurement patterns).\n\nAuto-escalation. Categories marked auto-escalate=true (sanctions evasion, terrorist financing, proliferation financing, ransomware, mixer exposure) immediately route to the L2 investigations team on detection, bypassing the L1 triage queue. All other categories follow the standard L1 → L2 escalation path.\n\nThe taxonomy is designed to interoperate with the SAR Next-Generation Template: every SAR filing references the primary TM category (and up to three secondary categories) that triggered the suspicious activity detection, enabling the regulator to cross-reference typology prevalence across institutions.',
    },
    tags: ['TM', 'transaction-monitoring', 'taxonomy', 'FATF', 'AML', 'alerts', '20-categories'],
    enabledByDefault: true,
    defaultForCategory: false,
  },
  {
    slug: 'label-data-sensitivity',
    name: 'Data Sensitivity Classification',
    description: 'Five-tier classification (Restricted → Confidential → Internal → Public → Deprecated) mapping to GDPR Articles 5, 9, 32 controls and PIPL Article 28 cross-border transfer requirements.',
    category: 'label',
    jurisdiction: 'GLOBAL',
    regulator: 'ESMA',
    version: '2026.1',
    sourceUrl: 'https://gdpr-info.eu/art-32-gdpr/',
    sourceType: 'web',
    schemaJson: {
      type: 'object',
      fields: [
        { name: 'classification', type: 'enum', values: ['restricted', 'confidential', 'internal', 'public', 'deprecated'], required: true },
        { name: 'gdpr_article_refs', type: 'array' },
        { name: 'pipl_article_refs', type: 'array' },
        { name: 'encryption_at_rest_required', type: 'boolean' },
        { name: 'encryption_in_transit_required', type: 'boolean' },
        { name: 'access_control_model', type: 'enum', values: ['rbac', 'abac', 'pbac'] },
        { name: 'retention_period_years', type: 'number' },
        { name: 'cross_border_transfer_allowed', type: 'boolean' },
        { name: 'cross_border_mechanism', type: 'enum', values: ['scc', 'bcr', 'adequacy', 'pipil_piip', 'none'] },
      ],
    },
    defaultFieldsJson: {
      tiers: [
        { tier: 'restricted',   gdpr_refs: ['Art.9', 'Art.32'], pipl_refs: ['Art.28'], encryption_at_rest: true,  encryption_in_transit: true,  access_model: 'abac', retention_years: 7,  cross_border: false, mechanism: 'none' },
        { tier: 'confidential', gdpr_refs: ['Art.5', 'Art.32'], pipl_refs: ['Art.13'], encryption_at_rest: true,  encryption_in_transit: true,  access_model: 'rbac', retention_years: 7,  cross_border: true,  mechanism: 'scc' },
        { tier: 'internal',     gdpr_refs: ['Art.5'],            pipl_refs: ['Art.13'], encryption_at_rest: true,  encryption_in_transit: true,  access_model: 'rbac', retention_years: 5,  cross_border: true,  mechanism: 'scc' },
        { tier: 'public',       gdpr_refs: [],                   pipl_refs: [],         encryption_at_rest: false, encryption_in_transit: false, access_model: 'rbac', retention_years: 3,  cross_border: true,  mechanism: 'adequacy' },
        { tier: 'deprecated',   gdpr_refs: ['Art.5(1)(e)'],      pipl_refs: ['Art.47'], encryption_at_rest: true,  encryption_in_transit: false, access_model: 'pbac', retention_years: 0,  cross_border: false, mechanism: 'none' },
      ],
      body_text: 'Data Sensitivity Classification — Five-Tier Framework\n\nThe Data Sensitivity Classification label assigns every data asset in the institution to one of five tiers: Restricted, Confidential, Internal, Public, or Deprecated. Each tier carries specific GDPR and PIPL article references, encryption requirements, access control models, retention periods, and cross-border transfer mechanisms. The framework operationalises the GDPR Article 5 data minimisation principle and the GDPR Article 32 security of processing obligation, supplemented by the China PIPL (Personal Information Protection Law) Article 28 sensitive personal information requirements and Article 38 cross-border transfer rules.\n\nTier 1 — Restricted. The highest sensitivity tier, applied to special category personal data under GDPR Article 9 (racial or ethnic origin, political opinions, religious beliefs, trade union membership, genetic data, biometric data for unique identification, health data, sex life or sexual orientation) and to PIPL Article 28 sensitive personal information (biometrics, religious belief, specific identity, medical health, financial account, whereabouts, and personal information of minors under 14). Restricted data requires AES-256 encryption at rest, TLS 1.3 in transit, attribute-based access control (ABAC) with policy enforcement at the row and column level, and a 7-year retention cap (longer retention requires explicit lawful basis under GDPR Article 9(2)). Cross-border transfer is prohibited by default; the only permitted mechanisms are Binding Corporate Rules (BCRs) approved by a lead supervisory authority, and even then, only with a documented Transfer Impact Assessment per Schrems II. Restricted data is subject to mandatory breach notification within 72 hours under GDPR Article 33.\n\nTier 2 — Confidential. Applied to personal data that is not special-category but warrants elevated protection: customer financial records, account numbers, transaction histories, employment records, and supplier contracts. Confidential data requires AES-256 encryption at rest and in transit, role-based access control (RBAC) with quarterly access recertification, and a 7-year retention period aligned with anti-money-laundering recordkeeping requirements. Cross-border transfer is permitted under Standard Contractual Clauses (SCCs) — the 2021 modernised version — provided a Transfer Impact Assessment documents the supplementary measures required for the destination jurisdiction.\n\nTier 3 — Internal. Applied to internal operational data that is not customer-facing but supports business operations: internal policies, training materials, non-public risk assessments, and internal audit reports. Internal-tier data requires AES-128 encryption at rest and in transit, RBAC with annual recertification, and a 5-year retention period. Cross-border transfer is permitted under SCCs without a separate Transfer Impact Assessment, provided the destination jurisdiction has not been designated as inadequate by the European Commission.\n\nTier 4 — Public. Applied to data that has been explicitly approved for public release: published annual reports, regulatory disclosures, marketing materials, and published press releases. Public-tier data does not require encryption, has a 3-year retention period, and may be transferred cross-border without restriction. However, the classification only applies to data that has gone through a formal declassification review confirming that no personal data, trade secrets, or confidential information is included.\n\nTier 5 — Deprecated. Applied to data that has reached the end of its retention period or whose lawful basis for processing has lapsed. Deprecated data must be securely deleted within 90 days of classification, with a certificate of destruction issued by the data custodian. Encryption at rest is maintained during the 90-day window; encryption in transit is not required because the data should not be accessed. Access is governed by policy-based access control (PBAC) — only the Data Protection Officer and the records management team may access deprecated data, and only to verify destruction. Cross-border transfer is prohibited. The deprecated tier operationalises the GDPR Article 5(1)(e) storage limitation principle and the PIPL Article 47 right to deletion.\n\nThe classification integrates with the Localization Matrix view (Task 12) so that data classified as Restricted or Confidential is automatically mapped to the residency requirements of the relevant jurisdiction (GDPR, PIPL, LGPD, CCPA-CPRA, PIPEDA, POPIA, APPI, PDPA-SG). It also feeds the Cross-Border Data Flows module: any cross-border transfer involving Confidential data triggers a TIA (Transfer Impact Assessment) record, and any transfer involving Restricted data is blocked at the policy enforcement layer.',
    },
    tags: ['data-sensitivity', 'GDPR', 'PIPL', 'classification', 'privacy', 'encryption', 'cross-border'],
    enabledByDefault: true,
    defaultForCategory: false,
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
