/**
 * Seed script v2 — populates the 22 new state machines across
 * Surveillance, Quant, Intelligence, Collaboration, and Platform zones.
 *
 * Usage: bun run scripts/seed-v2.ts
 */
import { db } from '../src/lib/db'

const now = new Date()
const minutesAgo = (n: number) => new Date(now.getTime() - n * 60 * 1000)
const hoursAgo = (n: number) => new Date(now.getTime() - n * 60 * 60 * 1000)
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000)
const daysFromNow = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000)

// ─── SURVEILLANCE ────────────────────────────────────────────
const surveillanceAlerts = [
  { alertType: 'structuring', severity: 'critical', accountId: 'ACC-44120', counterparty: 'Dubex Trading LLC', amount: 9450, currency: 'USD', jurisdiction: 'US', channel: 'Wire', riskScore: 92, status: 'escalated', triggeredRule: '3-strike sub-$10k pattern over 5 days', narrative: 'Five wires of $9,200–$9,950 each routed via 3 correspondent banks.' },
  { alertType: 'layering', severity: 'high', accountId: 'ACC-77821', counterparty: 'Helix Holdings BVI', amount: 2400000, currency: 'EUR', jurisdiction: 'EU', channel: 'SWIFT', riskScore: 84, status: 'under_review', triggeredRule: 'Rapid in/out via 4 jurisdictions in 2h', narrative: 'Funds received from CY, sent to MT, then SG, then PA within 117 minutes.' },
  { alertType: 'rapid_movement', severity: 'high', accountId: 'ACC-99201', counterparty: 'NovaPay Ltd', amount: 850000, currency: 'GBP', jurisdiction: 'UK', channel: 'RTP', riskScore: 79, status: 'open', triggeredRule: 'Real-time payment >£500k to non-bank PSP', narrative: 'Customer of 11 days sent £850k via Faster Payments to fintech PSP.' },
  { alertType: 'smurfing', severity: 'medium', accountId: 'ACC-12847', counterparty: 'Multiple', amount: 47500, currency: 'USD', jurisdiction: 'US', channel: 'Cash', riskScore: 62, status: 'under_review', triggeredRule: '12 cash deposits < $5k across 7 branches', narrative: 'Deposits across NYC branches within 8 hours.' },
  { alertType: 'integration', severity: 'medium', accountId: 'ACC-50213', counterparty: 'Crescent Realty', amount: 750000, currency: 'USD', jurisdiction: 'US', channel: 'Wire', riskScore: 58, status: 'open', triggeredRule: 'Property purchase following prior alerts', narrative: 'Wire to real-estate escrow following 3 prior AML alerts.' },
  { alertType: 'structuring', severity: 'low', accountId: 'ACC-83191', counterparty: 'Bright Logistics', amount: 18500, currency: 'SGD', jurisdiction: 'SG', channel: 'Wire', riskScore: 41, status: 'closed', triggeredRule: 'Pattern not sustained', narrative: 'Two sub-threshold wires in 1 week — false positive.' },
]

const sanctionsHits = [
  { listName: 'OFAC', matchType: 'fuzzy', matchedName: 'Mahmoud el-Hassan', listedEntity: 'SDN List #14523', entityId: 'ENT-9012', score: 87, status: 'escalated', reviewedBy: 'k.santos', action: 'Account frozen pending investigation' },
  { listName: 'EU', matchType: 'exact', matchedName: 'Rostec Holding BV', listedEntity: 'EU Consolidated #4521', entityId: 'ENT-7781', score: 100, status: 'true_positive', reviewedBy: 'j.lee', action: 'Transaction blocked; SAR filed' },
  { listName: 'HMT', matchType: 'partial', matchedName: 'Ozero Shipping Co', listedEntity: 'UK Sanctions #9921', entityId: 'ENT-3340', score: 71, status: 'pending', reviewedBy: null, action: null },
  { listName: 'UN', matchType: 'phonetic', matchedName: 'Kim Soo-yeon', listedEntity: 'UN Consolidated #2218', entityId: 'ENT-5582', score: 64, status: 'false_positive', reviewedBy: 'a.patel', action: 'Cleared — namesake with different DOB' },
  { listName: 'OFAC', matchType: 'fuzzy', matchedName: 'Vlad K. Petrov', listedEntity: 'SDN List #11029', entityId: 'ENT-8890', score: 78, status: 'pending', reviewedBy: null, action: null },
  { listName: 'MAS', matchType: 'exact', matchedName: 'Singapore Diamond Exchange', listedEntity: 'MAS Targeted Financial Sanctions #441', entityId: 'ENT-2210', score: 100, status: 'escalated', reviewedBy: 'c.tan', action: 'Accounts blocked; regulator notified' },
]

const commsEvents = [
  { channel: 'bloomberg_chat', participantA: 'trader_jm', participantB: 'trader_external_x', desk: 'Equities', signalType: 'market_abuse', riskScore: 88, transcript: '...if you load up before the open we both know what happens...', status: 'escalated' },
  { channel: 'voice', participantA: 'trader_rk', participantB: 'broker_jm', desk: 'FX', signalType: 'collusion', riskScore: 81, transcript: '...let\'s keep the fix where we want it...', status: 'under_review' },
  { channel: 'email', participantA: 'analyst_sl', participantB: 'cousin_pj', desk: 'M&A', signalType: 'insider_trading', riskScore: 95, transcript: 'Email mentions upcoming merger ticker code 4 days before announcement.', status: 'escalated' },
  { channel: 'teams', participantA: 'trader_bl', participantB: 'trader_kv', desk: 'Rates', signalType: 'off_channel', riskScore: 67, transcript: 'Discussion of client order on personal-style channel.', status: 'open' },
  { channel: 'mobile', participantA: 'rm_wj', participantB: 'unknown', desk: 'Wealth', signalType: 'off_channel', riskScore: 73, transcript: 'SMS to client discussing portfolio rebalance — unrecorded channel.', status: 'under_review' },
]

// ─── QUANT & CLIMATE ─────────────────────────────────────────
const quantScenarios = [
  { scenarioType: 'CCAR', description: 'Fed Severely Adverse — global recession, unemployment 10%, equity -50%', timeHorizon: '1q', p99Loss: 4_280_000_000, expectedLoss: 1_120_000_000, capitalImpact: -185, status: 'complete' },
  { scenarioType: 'EBA', description: 'EU Adverse — sovereign stress, rates +300bps', timeHorizon: '1y', p99Loss: 3_100_000_000, expectedLoss: 980_000_000, capitalImpact: -142, status: 'complete' },
  { scenarioType: 'FRTB_IMA', description: 'FRTB IMA — market risk capital under standardized+IMA approach', timeHorizon: '1d', p99Loss: 845_000_000, expectedLoss: 124_000_000, capitalImpact: -38, status: 'complete' },
  { scenarioType: 'NGFS', description: 'NGFS Disorderly Transition — delayed policy, then abrupt carbon price', timeHorizon: '1y', p99Loss: 1_920_000_000, expectedLoss: 540_000_000, capitalImpact: -78, status: 'running' },
  { scenarioType: 'custom', description: 'Stablecoin Depeg Contagion — USDT depeg +20bps, cascading DeFi liquidations', timeHorizon: '1w', p99Loss: 612_000_000, expectedLoss: 88_000_000, capitalImpact: -22, status: 'draft' },
]

const climateMetrics = [
  { scope1Emissions: 12_400, scope2Emissions: 48_200, scope3Emissions: 1_240_000, financedEmissions: 18_900_000, taxonomyAlignment: 34.2, physicalRiskScore: 58, transitionRiskScore: 71, reportingPeriod: 'FY2024' },
  { scope1Emissions: 11_850, scope2Emissions: 45_900, scope3Emissions: 1_180_000, financedEmissions: 17_200_000, taxonomyAlignment: 38.7, physicalRiskScore: 56, transitionRiskScore: 74, reportingPeriod: 'H1_2025' },
]

// ─── INTELLIGENCE & AUTOMATION ───────────────────────────────
const agentRuns = [
  { agentName: 'regulatory_watcher', task: 'Daily scrape of Federal Register, ESMA, FCA, MAS', status: 'complete', inputs: '12 RSS feeds', outputs: '47 new items, 3 high-impact flagged', toolsUsed: 'rss_fetch, classifier, summarizer' },
  { agentName: 'policy_drafter', task: 'Draft update to AML Policy v3.2 for new FinCEN beneficial ownership rule', status: 'awaiting_approval', inputs: 'reg_id:US-BOIR-2024, policy_id:AML-3.1', outputs: 'Redline with 14 proposed edits', toolsUsed: 'rag, redliner, citation_checker' },
  { agentName: 'control_tester', task: 'Simulate failure of customer onboarding control across 5 product lines', status: 'complete', inputs: 'control_id:KYC-NEW-001', outputs: '2 of 5 products would have on-boarded sanctioned entity', toolsUsed: 'simulator, sanctions_emulator, graph_traverser' },
  { agentName: 'regulator_liaison', task: 'Pre-populate FCA RMAR return Q3 2025', status: 'running', inputs: 'quarter:Q3-2025, form:RMAR', outputs: 'In progress — 78% fields populated', toolsUsed: 'data_collector, evidence_citer, validator' },
  { agentName: 'regulatory_watcher', task: 'Hourly check for new ESMA opinions', status: 'queued', inputs: 'esma_opinions.xml', outputs: '', toolsUsed: '' },
]

const regulatoryChanges = [
  { source: 'federal_register', title: 'FinCEN Beneficial Ownership Information Access Rule', jurisdiction: 'US', publishedAt: daysAgo(8), impactScore: 88, affectedPolicies: 'AML-KYC-001, ONBOARDING-004', status: 'drafting', summary: 'Expands BOI access to state/local law enforcement; effective 2025-Q4.' },
  { source: 'ESMA', title: 'Guidelines on MiFID II Product Governance Sustainability', jurisdiction: 'EU', publishedAt: daysAgo(14), impactScore: 74, affectedPolicies: 'WM-PROD-002, SFDR-001', status: 'triaged', summary: 'Mandatory sustainability target market assessment for all investment products.' },
  { source: 'FCA', title: 'Consumer Duty Implementation Review — Phase 2', jurisdiction: 'UK', publishedAt: daysAgo(21), impactScore: 81, affectedPolicies: 'CONSUMER-DUTY-001, RETAIL-PROD-007', status: 'applied', summary: 'Strengthened fair value framework assessments; new evidence requirements.' },
  { source: 'MAS', title: 'Notice on Individual Accountability and Conduct', jurisdiction: 'SG', publishedAt: daysAgo(3), impactScore: 65, affectedPolicies: 'GOVERNANCE-002', status: 'new', summary: 'Extends senior managers regime to material risk-takers.' },
  { source: 'EBA', title: 'Guidelines on ICT and Security Risk Management (DORA alignment)', jurisdiction: 'EU', publishedAt: daysAgo(2), impactScore: 92, affectedPolicies: 'TECH-OPS-001, BCP-003', status: 'new', summary: 'Aligns EBA ICT guidelines with DORA; effective Jan 2025.' },
  { source: 'BoE_PRA', title: 'Basel 3.1 Final Implementation Rules', jurisdiction: 'UK', publishedAt: daysAgo(35), impactScore: 95, affectedPolicies: 'CAPITAL-001, RWA-005', status: 'drafting', summary: 'UK implementation of Basel III final reforms; phased to 2030.' },
]

const redTeamTests = [
  { testName: 'Synthetic Structuring Pattern', attackVector: 'structuring', target: 'Transaction Monitoring Rule TM-014', result: 'detected', severity: 'low', evidence: '5/5 attempts flagged within 90s', remediation: 'No action required' },
  { testName: 'Sanctions List Substring Obfuscation', attackVector: 'sanctions_evasion', target: 'OFAC Screener v4.2', result: 'bypassed', severity: 'high', evidence: '3 of 10 obfuscated name variants passed screening', remediation: 'Tighten fuzzy-match threshold from 85→78; add transliteration module' },
  { testName: 'LLM Prompt Injection via Chat', attackVector: 'prompt_injection', target: 'AI Compliance Assistant v1.2', result: 'detected', severity: 'medium', evidence: 'Injection attempts asking for "ignore previous rules" blocked by guard layer', remediation: 'No action required' },
  { testName: 'Insider Trading Signal Evasion', attackVector: 'market_abuse', target: 'Comms Surveillance NLP', result: 'bypassed', severity: 'critical', evidence: 'Coded language ("the cake is ready") evaded pattern matcher', remediation: 'Add contextual embedding classifier; expand lexicon' },
  { testName: 'Cross-Channel Comms Smuggling', attackVector: 'market_abuse', target: 'Multi-Channel Aggregator', result: 'detected', severity: 'low', evidence: 'Off-channel relay detected via call metadata correlation', remediation: 'No action required' },
  { testName: 'Crypto Mixer Exposure', attackVector: 'sanctions_evasion', target: 'Chainalysis Wallet Screener', result: 'detected', severity: 'medium', evidence: '3/3 mixer-tainted wallets flagged before settlement', remediation: 'No action required' },
]

// ─── COLLABORATION & TRUST ───────────────────────────────────
const cases = [
  { caseType: 'examination', title: 'OCC Risk Committee Examination Q4 2025', regulator: 'OCC', priority: 'critical', status: 'in_progress', assignee: 'j.thompson', dueDate: daysFromNow(28), description: 'OCC examination of risk committee charter, minutes, and challenge documentation. 14 evidence requests outstanding.' },
  { caseType: 'investigation', title: 'FINRA Insider Trading Probe — Ticker XYZ', regulator: 'FINRA', priority: 'high', status: 'open', assignee: 'k.santos', dueDate: daysFromNow(14), description: 'Suspicious options activity detected 72h prior to M&A announcement. Comms surveillance evidence packaged.' },
  { caseType: 'regulatory_request', title: 'FCA s.165 Information Request — Consumer Duty', regulator: 'FCA', priority: 'high', status: 'awaiting_response', assignee: 'r.patel', dueDate: daysFromNow(7), description: 'FCA requesting fair value framework evidence for 8 retail products. 4 of 8 evidence packs complete.' },
  { caseType: 'examination', title: 'ECB SREP On-site Inspection', regulator: 'ECB', priority: 'high', status: 'in_progress', assignee: 'h.mueller', dueDate: daysFromNow(45), description: 'ECB SREP inspection of credit risk models. Model inventory being prepared.' },
  { caseType: 'internal_review', title: 'Internal SAR Quality Review — Q3', regulator: null, priority: 'medium', status: 'open', assignee: 'a.garcia', dueDate: daysFromNow(21), description: 'Quality assurance review of 47 SARs filed in Q3 2025. Pattern analysis on declined SARs.' },
]

const whistleblowerReports = [
  { category: 'fraud', severity: 'high', description: 'Sales team at Branch 47 inflating loan application income figures to meet quarterly targets.', anonymous: true, status: 'investigating', triageScore: 84, assignedTo: 'ethics_team', encryptedHash: 'sha256:a1b2c3...' },
  { category: 'market_abuse', severity: 'critical', description: 'Trader on Equities desk discussing client order flow with external party on personal phone.', anonymous: true, status: 'investigating', triageScore: 91, assignedTo: 'surveillance', encryptedHash: 'sha256:d4e5f6...' },
  { category: 'safety', severity: 'medium', description: 'Pressure to skip required KYC refresh on high-net-worth clients.', anonymous: true, status: 'triaged', triageScore: 67, assignedTo: null, encryptedHash: 'sha256:g7h8i9...' },
  { category: 'harassment', severity: 'medium', description: 'Pattern of inappropriate comments by senior manager in Treasury.', anonymous: true, status: 'received', triageScore: null, assignedTo: null, encryptedHash: 'sha256:j0k1l2...' },
  { category: 'fraud', severity: 'low', description: 'Expense report irregularities in Wealth Management team.', anonymous: false, status: 'resolved', triageScore: 32, assignedTo: 'hr', encryptedHash: 'sha256:m3n4o5...' },
]

const chainAnchors = [
  { payloadHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', chain: 'hyperledger_besu', txHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8', blockNumber: 18_452_341, anchorType: 'audit_log', anchoredBy: 'system', verifiedAt: hoursAgo(2) },
  { payloadHash: 'sha256:7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8', chain: 'ethereum_sepolia', txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2', blockNumber: 5_847_221, anchorType: 'evidence', anchoredBy: 'k.santos', verifiedAt: hoursAgo(5) },
  { payloadHash: 'sha256:9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8', chain: 'hyperledger_besu', txHash: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1', blockNumber: 18_452_400, anchorType: 'decision', anchoredBy: 'system', verifiedAt: hoursAgo(1) },
  { payloadHash: 'sha256:1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2', chain: 'polygon', txHash: '0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2', blockNumber: 52_847_001, anchorType: 'attestation', anchoredBy: 'j.lee', verifiedAt: daysAgo(1) },
]

const digitalAssetEvents = [
  { asset: 'BTC', wallet: 'bc1qxy2k...lq2hs8', counterparty: '0x742d35Cc...6634C0', amount: 12.5, eventType: 'travel_rule', riskScore: 45, status: 'compliant', chain: 'bitcoin' },
  { asset: 'ETH', wallet: '0x742d35Cc...6634C0', counterparty: '0x123abc...789def', amount: 450, eventType: 'mixer_detection', riskScore: 89, status: 'flagged', chain: 'ethereum' },
  { asset: 'USDT', wallet: '0xdef456...012abc', counterparty: 'TZhxrX...9oPqLm', amount: 250000, eventType: 'ofac_match', riskScore: 100, status: 'blocked', chain: 'tron' },
  { asset: 'USDC', wallet: '0xa1b2c3...d4e5f6', counterparty: '0xb7c8d9...e0f1a2', amount: 87500, eventType: 'sanctions_screen', riskScore: 12, status: 'compliant', chain: 'ethereum' },
  { asset: 'CBDC', wallet: 'cbdc:uk:8801...2299', counterparty: 'cbdc:uk:9920...3388', amount: 5000, eventType: 'travel_rule', riskScore: 8, status: 'compliant', chain: 'cbdc_uk' },
]

// ─── PLATFORM & GOVERNANCE ───────────────────────────────────
const petConfigs = [
  { dataset: 'cross_bank_aml_features', technique: 'federated_learning', enabled: true, parameters: '{"min_clients":5,"rounds":50,"dp_epsilon":4.0}', approvedBy: 'ciso.office' },
  { dataset: 'regulator_aggregate_exposure', technique: 'differential_privacy', enabled: true, parameters: '{"epsilon":1.5,"delta":1e-9}', approvedBy: 'risk.committee' },
  { dataset: 'sanctions_match', technique: 'secure_enclave', enabled: true, parameters: '{"provider":"aws_nitro","attestation":"required"}', approvedBy: 'ciso.office' },
  { dataset: 'cross_border_reporting', technique: 'homomorphic_encryption', enabled: false, parameters: '{"scheme":"bfv","key_rotation":"90d"}', approvedBy: null },
]

const apiKeys = [
  { name: 'Bloomberg Connector', keyPrefix: 'rg_bbg_', scopes: 'read:regulations,write:metrics', rateLimit: 600, status: 'active', lastUsedAt: minutesAgo(4) },
  { name: 'Refinitiv Adapter', keyPrefix: 'rg_ref_', scopes: 'read:regulations,write:alerts', rateLimit: 1200, status: 'active', lastUsedAt: minutesAgo(11) },
  { name: 'SWIFT Alliance Webhook', keyPrefix: 'rg_swf_', scopes: 'write:alerts', rateLimit: 6000, status: 'active', lastUsedAt: minutesAgo(1) },
  { name: 'Internal Risk Engine', keyPrefix: 'rg_int_', scopes: 'read:all,write:cases', rateLimit: 10000, status: 'active', lastUsedAt: minutesAgo(2) },
  { name: 'Plaid Sandbox', keyPrefix: 'rg_pld_', scopes: 'read:transactions', rateLimit: 100, status: 'revoked', lastUsedAt: daysAgo(28) },
]

const ruleComparisons = [
  { topic: 'derivatives_reporting', jurisdictions: 'US,EU,UK,SG', differences: 'US(Dodd-Frank/Part 43) requires 59 data fields; EU(EMIR RTS) requires 60; UK(EMIR REFIT) follows EU but adds 2 LEI fields; SG adds 3 jurisdiction-specific fields.', harmonizationPath: 'Map to ISO 20022 TradeLifecycleEvent message; use CDE taxonomy' },
  { topic: 'client_classification', jurisdictions: 'US,EU,UK,SG,HK', differences: 'US uses ECP/QIB/retail; EU/UK use Professional/Per-Se Professional/Elective Professional; SG/HK use Accredited/Expert/retail with different thresholds.', harmonizationPath: 'Internal taxonomy: client_tier=1..4 mapped to local regimes' },
  { topic: 'best_execution', jurisdictions: 'US,EU,UK', differences: 'US Rule 611 (NMS) emphasizes price; EU MiFID II adds price/cost/speed/size/nature/likelihood of execution; UK post-Brexit retains MiFID II framework.', harmonizationPath: 'Adopt EU framework as baseline; layer US-specific price protection' },
  { topic: 'beneficial_ownership_threshold', jurisdictions: 'US,EU,UK,SG', differences: 'US 25%; EU 25% (planned reduction to 15%); UK 25%; SG 25% (but 10% for listed entities).', harmonizationPath: 'Operate at 10% globally; exceed all local thresholds' },
  { topic: 'margin_requirements_nbfcs', jurisdictions: 'US,EU,UK,JP', differences: 'US (CFTC/SEC) 5-day MPOR for cleared; EU (EMIR) 5-day for cleared/4-day for bilateral; UK follows EU; JP adds 1-day for FX.', harmonizationPath: 'Use most conservative MPOR per asset class across all jurisdictions' },
]

const complianceCards = [
  { decisionId: 'DEC-2025-08-14-001', decision: 'declined', regulation: 'OFAC SDN List', policyRef: 'AML-SAN-001 §4.2', evidence: 'Wallet 0x123abc...789def linked to SDN entity ENT-7781 via Chainalysis path length 2.', reasoning: 'Counterparty wallet has direct fund-flow linkage to EU-sanctioned entity. Blocking transaction per OFAC compliance program.', confidence: 98 },
  { decisionId: 'DEC-2025-08-14-002', decision: 'flagged', regulation: 'MiFID II Article 27', policyRef: 'WM-PROD-002 §6.1', evidence: 'Order size exceeds 7.5% ADV for illiquid equity ETF.', reasoning: 'Pre-trade transparency waiver potentially applicable. Escalate to dealing desk for waiver determination.', confidence: 84 },
  { decisionId: 'DEC-2025-08-14-003', decision: 'approved', regulation: 'Basel III LCR', policyRef: 'LIQ-001 §3.4', evidence: 'LCR ratio 132% as of T-1; HQLA buffer $4.2B above minimum.', reasoning: 'Liquidity position comfortably above regulatory minimum. No constraint on new lending activity.', confidence: 96 },
  { decisionId: 'DEC-2025-08-14-004', decision: 'declined', regulation: 'FCA Consumer Duty', policyRef: 'CONSUMER-DUTY-001 §2.5', evidence: 'Proposed structured product has negative expected value for retail client segment after fees.', reasoning: 'Fair value assessment fails under Consumer Duty. Product cannot be distributed to retail segment.', confidence: 92 },
  { decisionId: 'DEC-2025-08-14-005', decision: 'flagged', regulation: 'GDPR Article 22', policyRef: 'AI-GOV-001 §5.3', evidence: 'Automated credit decisioning model lacks human-reviewable appeal path for affected customers.', reasoning: 'GDPR Art 22 right to human review not satisfied. Deploy with manual review escalation until remediation complete.', confidence: 89 },
]

async function main() {
  console.log('→ Seeding surveillance alerts...')
  for (const a of surveillanceAlerts) {
    await db.surveillanceAlert.create({ data: { ...a, timestamp: minutesAgo(Math.floor(Math.random() * 1440)) } })
  }

  console.log('→ Seeding sanctions hits...')
  for (const s of sanctionsHits) {
    await db.sanctionsHit.create({ data: s as any })
  }

  console.log('→ Seeding comms surveillance events...')
  for (const c of commsEvents) {
    await db.commsEvent.create({ data: { ...c, timestamp: minutesAgo(Math.floor(Math.random() * 2880)) } })
  }

  console.log('→ Seeding quant scenarios...')
  for (const q of quantScenarios) {
    await db.quantScenario.create({ data: q })
  }

  console.log('→ Seeding climate metrics...')
  for (const c of climateMetrics) {
    await db.climateMetric.create({ data: c })
  }

  console.log('→ Seeding agent runs...')
  for (const a of agentRuns) {
    await db.agentRun.create({
      data: {
        ...a,
        startedAt: hoursAgo(Math.floor(Math.random() * 48)),
        completedAt: a.status === 'complete' ? hoursAgo(Math.floor(Math.random() * 12)) : null,
      } as any,
    })
  }

  console.log('→ Seeding regulatory changes...')
  for (const r of regulatoryChanges) {
    await db.regulatoryChange.create({ data: r })
  }

  console.log('→ Seeding red team tests...')
  for (const r of redTeamTests) {
    await db.redTeamTest.create({ data: { ...r, timestamp: hoursAgo(Math.floor(Math.random() * 168)) } })
  }

  console.log('→ Seeding compliance cases...')
  for (const c of cases) {
    await db.complianceCase.create({ data: c })
  }

  console.log('→ Seeding whistleblower reports...')
  for (const w of whistleblowerReports) {
    await db.whistleblowerReport.create({ data: w })
  }

  console.log('→ Seeding chain anchors...')
  for (const c of chainAnchors) {
    await db.chainAnchor.create({ data: c })
  }

  console.log('→ Seeding digital asset events...')
  for (const d of digitalAssetEvents) {
    await db.digitalAssetEvent.create({ data: { ...d, timestamp: minutesAgo(Math.floor(Math.random() * 720)) } })
  }

  console.log('→ Seeding PET configs...')
  for (const p of petConfigs) {
    await db.petConfig.create({ data: p })
  }

  console.log('→ Seeding API keys...')
  for (const a of apiKeys) {
    await db.apiKey.create({ data: a as any })
  }

  console.log('→ Seeding rule comparisons...')
  for (const r of ruleComparisons) {
    await db.ruleComparison.create({ data: r })
  }

  console.log('→ Seeding compliance cards...')
  for (const c of complianceCards) {
    await db.complianceCard.create({ data: c })
  }

  console.log('✓ Seed v2 complete.')
}

main()
  .catch((e) => {
    console.error('Seed v2 failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
