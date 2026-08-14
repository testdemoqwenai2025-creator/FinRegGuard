/**
 * Seed script for AI Regulatory Compliance Automator.
 * Populates Regulations, Policies, AuditLogs, RiskItems, Metrics, ChatMessages
 * with realistic mock data spanning banks / insurers / pharma / hospitals across
 * US / EU / UK / APAC jurisdictions.
 *
 * Usage:  bun run scripts/seed.ts
 */
import { db } from '../src/lib/db'

const now = new Date()
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000)
const daysFromNow = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000)

const regulations = [
  {
    title: 'MiFID II Investment Product Governance Amendments',
    jurisdiction: 'EU',
    regulator: 'ESMA',
    category: 'MiFID II',
    status: 'effective',
    effectiveDate: daysAgo(45),
    summary: 'Enhanced product governance obligations for manufacturers and distributors of investment products, including target market assessment reviews every 24 months and mandatory sustainability disclosures aligned with SFDR.',
    impactLevel: 'high',
    affectedUnits: 'Wealth Management, Retail Banking, Compliance',
  },
  {
    title: 'SEC Rule 15c2-11 Amendments - Fixed Income Pricing',
    jurisdiction: 'US',
    regulator: 'SEC',
    category: 'Market Integrity',
    status: 'pending',
    effectiveDate: daysFromNow(38),
    summary: 'Updated quoting requirements for OTC fixed-income securities. Firms must establish, maintain, and enforce written policies and procedures reasonably designed to achieve compliance with new transparency obligations.',
    impactLevel: 'critical',
    affectedUnits: 'Capital Markets, Trading, Operations',
  },
  {
    title: 'FCA Consumer Duty - Outcome Monitoring Refresh',
    jurisdiction: 'UK',
    regulator: 'FCA',
    category: 'Conduct',
    status: 'monitoring',
    effectiveDate: daysFromNow(90),
    summary: 'Annual review of Consumer Duty implementation. Firms must demonstrate that monitoring data is being used to identify and close gaps in fair-value, consumer-understanding, and avoidance-of-harm outcomes.',
    impactLevel: 'high',
    affectedUnits: 'Retail Banking, Wealth Management, Compliance',
  },
  {
    title: 'MAS Notice SFA04-N02 - AML/CFT Sanctions Screening',
    jurisdiction: 'SG',
    regulator: 'MAS',
    category: 'AML/CFT',
    status: 'effective',
    effectiveDate: daysAgo(12),
    summary: 'Revised expectations for real-time sanctions screening, including automated name-matching algorithm validation, false-positive tuning, and quarterly attestation by the Chief Compliance Officer.',
    impactLevel: 'high',
    affectedUnits: 'Compliance, Operations, Technology',
  },
  {
    title: 'EU AI Act - High-Risk System Classification Guidance',
    jurisdiction: 'EU',
    regulator: 'European Commission',
    category: 'AI Governance',
    status: 'pending',
    effectiveDate: daysFromNow(120),
    summary: 'Technical guidance on classifying AI systems used in credit scoring, insurance underwriting, and recruitment as high-risk. Triggers conformity assessment, risk management system, and post-market monitoring obligations.',
    impactLevel: 'critical',
    affectedUnits: 'Risk, Compliance, Technology, HR',
  },
  {
    title: 'HIPAA Security Rule - Encryption Refresh (HHS NPRM)',
    jurisdiction: 'US',
    regulator: 'HHS-OCR',
    category: 'Data Privacy',
    status: 'monitoring',
    effectiveDate: daysFromNow(180),
    summary: 'Proposed update to the HIPAA Security Rule requiring encryption of ePHI at rest and in transit using NIST-approved algorithms, plus mandatory multi-factor authentication for all workforce access.',
    impactLevel: 'high',
    affectedUnits: 'Hospital Ops, IT Security, Compliance',
  },
  {
    title: 'PMDA Clinical Trial Data Integrity Standard v3',
    jurisdiction: 'JP',
    regulator: 'PMDA',
    category: 'Clinical Trials',
    status: 'effective',
    effectiveDate: daysAgo(60),
    summary: 'Updated expectations for computerized system validation in clinical trials, including audit trail review frequency, e-signature integrity controls, and ALCOA+ data integrity principles applied to sponsor and CRO environments.',
    impactLevel: 'high',
    affectedUnits: 'Pharma R&D, Quality, Clinical Operations',
  },
  {
    title: 'APRA CPS 234 - Information Security Capability Update',
    jurisdiction: 'AU',
    regulator: 'APRA',
    category: 'Cybersecurity',
    status: 'effective',
    effectiveDate: daysAgo(20),
    summary: 'Boards must annually attest that information security capability is commensurate with the size and extent of threats. New control testing frequency and incident notification timeline (72 hours) requirements.',
    impactLevel: 'critical',
    affectedUnits: 'IT Security, Risk, Board Secretariat',
  },
  {
    title: 'GDPR Article 30 RoPA - AI Processing Addendum',
    jurisdiction: 'EU',
    regulator: 'EDPB',
    category: 'Data Privacy',
    status: 'monitoring',
    effectiveDate: daysFromNow(60),
    summary: 'Updated guidance that records of processing activities must capture AI/ML processing purposes, training data sources, automated decision logic, and retention schedules for model outputs.',
    impactLevel: 'medium',
    affectedUnits: 'Data Privacy, Compliance, Technology',
  },
  {
    title: 'OSFI B-13 - Technology and Cyber Risk Management',
    jurisdiction: 'CA',
    regulator: 'OSFI',
    category: 'Cybersecurity',
    status: 'effective',
    effectiveDate: daysAgo(8),
    summary: 'Expanded technology risk taxonomy covering third-party ecosystems, AI/ML model risk, and cloud concentration risk. Mandatory self-assessment reporting on an annual cadence with executive attestation.',
    impactLevel: 'high',
    affectedUnits: 'IT Security, Risk, Compliance',
  },
  {
    title: 'Basel III Final Reforms - Credit Risk Standardised Approach',
    jurisdiction: 'EU',
    regulator: 'EBA',
    category: 'Basel III',
    status: 'pending',
    effectiveDate: daysFromNow(75),
    summary: 'Implementation of revised standardised approach for credit risk weighted assets, including reduced reliance on external ratings, updated due-diligence requirements, and new slotting criteria for specialised lending.',
    impactLevel: 'critical',
    affectedUnits: 'Risk, Capital Management, Finance',
  },
  {
    title: 'EMA GMP Annex 1 - Sterile Products Manufacturing',
    jurisdiction: 'EU',
    regulator: 'EMA',
    category: 'GMP',
    status: 'effective',
    effectiveDate: daysAgo(120),
    summary: 'Revised Annex 1 significantly increases expectations for contamination control strategy, cleanroom qualification, and single-use systems validation. Pharmaceutical manufacturers must demonstrate a holistic CCS approach.',
    impactLevel: 'high',
    affectedUnits: 'Pharma R&D, Quality, Manufacturing',
  },
]

const policies = [
  {
    title: 'Enterprise AML/CFT Compliance Policy',
    category: 'AML',
    ownerUnit: 'Compliance',
    version: '4.2.0',
    status: 'published',
    reviewDate: daysFromNow(45),
    content: 'This policy establishes the framework for Anti-Money Laundering and Counter-Financing of Terrorism compliance across all business units. Covers customer due diligence, enhanced due diligence for high-risk customers, ongoing monitoring, suspicious activity reporting, and sanctions screening obligations under US BSA, EU 6AMLD, UK MLR 2017, and FATF recommendations.',
    aiSuggestion: 'Update Section 4.3 (Sanctions Screening) to incorporate real-time algorithm validation requirements introduced by MAS Notice SFA04-N02. Add explicit quarterly CCO attestation language. Strengthen false-positive tuning SLA from 5 business days to 2 business days to align with peer benchmark.',
  },
  {
    title: 'Consumer Duty Outcomes Monitoring Policy',
    category: 'Conduct',
    ownerUnit: 'Compliance',
    version: '2.1.0',
    status: 'review',
    reviewDate: daysFromNow(15),
    content: 'Establishes the framework for monitoring the four Consumer Duty outcomes: products and services, price and value, consumer understanding, and consumer support. Defines monitoring data sources, governance committees, escalation pathways, and remediation triggers for retail customers in the UK market.',
    aiSuggestion: 'Add Section 6.4 introducing forward-looking fair-value testing using predictive churn and complaint data. Augment the consumer-understanding dashboard with a qualitative sentiment analysis feed from contact-centre transcripts. Align review cadence with FCA annual review window.',
  },
  {
    title: 'AI/ML Model Risk Management Framework',
    category: 'AI Governance',
    ownerUnit: 'Risk',
    version: '1.3.0',
    status: 'draft',
    reviewDate: daysFromNow(30),
    content: 'Defines the lifecycle governance for AI/ML models including development, validation, deployment, monitoring, and retirement. Covers model inventory, risk tiering, explainability requirements, and bias testing. Applies to credit scoring, fraud detection, and underwriting models across all jurisdictions.',
    aiSuggestion: 'Add Chapter 7 on EU AI Act conformity assessment workflow for high-risk systems. Introduce mandatory post-market monitoring report template. Expand validation requirements to include adversarial robustness testing and drift detection thresholds aligned with model tier.',
  },
  {
    title: 'HIPAA Security Rule Implementation Policy',
    category: 'Data Privacy',
    ownerUnit: 'IT Security',
    version: '3.0.1',
    status: 'published',
    reviewDate: daysFromNow(120),
    content: 'Implements the HIPAA Security Rule administrative, physical, and technical safeguards for electronic protected health information (ePHI). Covers access controls, audit controls, integrity controls, transmission security, and workforce training obligations for hospital operations.',
    aiSuggestion: 'Pre-empt HHS NPRM by mandating NIST-approved encryption (AES-256 at rest, TLS 1.3 in transit) for all ePHI systems. Require multi-factor authentication for all workforce access including clinical workstations. Add subsection 5.7 defining migration path for legacy systems lacking native encryption.',
  },
  {
    title: 'Clinical Trial Data Integrity Standard',
    category: 'Clinical Trials',
    ownerUnit: 'Quality',
    version: '2.0.0',
    status: 'published',
    reviewDate: daysFromNow(60),
    content: 'Establishes data integrity expectations for clinical trials conducted or sponsored by the organisation. Covers computerised system validation, audit trail review, electronic signature controls, and ALCOA+ principles applied across sponsor sites, CROs, and investigator sites.',
    aiSuggestion: 'Align audit trail review frequency with PMDA Standard v3 expectations (weekly for critical data, monthly for non-critical). Add validation protocol template for AI-assisted data review tools. Clarify ownership boundary for CRO-managed systems in Section 8.',
  },
  {
    title: 'Information Security Capability Policy (CPS 234)',
    category: 'Cybersecurity',
    ownerUnit: 'IT Security',
    version: '1.4.0',
    status: 'approved',
    reviewDate: daysFromNow(90),
    content: 'Implements APRA CPS 234 requirements for information security capability, including board attestation, control testing frequency, incident notification within 72 hours, and alignment of security capability with the size and extent of threats facing the organisation.',
    aiSuggestion: 'Update Section 4.2 to formalise the annual board attestation pack contents. Add control testing schedule (quarterly for critical controls, semi-annual for important). Define the 72-hour notification workflow including escalation to APRA, internal legal, and external affairs.',
  },
]

const auditLogs = [
  { actor: 'sarah.chen@regco.io', action: 'policy.update', targetType: 'policy', targetId: 'pol-aml-001', description: 'AML policy updated from v4.1.2 to v4.2.0 — incorporated MAS sanctions screening guidance', severity: 'info' },
  { actor: 'system', action: 'regulation.detected', targetType: 'regulation', targetId: 'reg-004', description: 'New regulation detected: MAS Notice SFA04-N02 — auto-tagged as high impact', severity: 'info' },
  { actor: 'marcus.lee@regco.io', action: 'risk.escalate', targetType: 'risk', targetId: 'risk-007', description: 'Risk item escalated to CRITICAL — Basel III credit risk gap exceeds tolerance', severity: 'critical' },
  { actor: 'priya.patel@regco.io', action: 'policy.review', targetType: 'policy', targetId: 'pol-cd-002', description: 'Consumer Duty policy submitted for review by Risk Committee', severity: 'info' },
  { actor: 'system', action: 'ai.suggestion.generate', targetType: 'policy', targetId: 'pol-ai-003', description: 'AI generated auto-update suggestion for AI/ML Model Risk Framework — 4 chapters flagged', severity: 'info' },
  { actor: 'james.okafor@regco.io', action: 'audit.export', targetType: 'report', targetId: 'aud-2025-q3', description: 'Q3 audit trail exported (4,318 entries) and signed by Head of Internal Audit', severity: 'info' },
  { actor: 'sarah.chen@regco.io', action: 'regulation.review', targetType: 'regulation', targetId: 'reg-002', description: 'SEC Rule 15c2-11 marked for impact assessment — Capital Markets team assigned', severity: 'warning' },
  { actor: 'system', action: 'policy.overdue', targetType: 'policy', targetId: 'pol-hipaa-004', description: 'HIPAA policy review is 5 days overdue — escalation to CCO', severity: 'warning' },
  { actor: 'marcus.lee@regco.io', action: 'risk.assess', targetType: 'risk', targetId: 'risk-012', description: 'Quarterly risk reassessment completed for Pharma R&D unit — 3 items re-scored', severity: 'info' },
  { actor: 'priya.patel@regco.io', action: 'chat.session', targetType: 'report', targetId: 'chat-1284', description: 'AI Assistant consulted on MiFID II product governance — 8 messages exchanged', severity: 'info' },
  { actor: 'system', action: 'regulation.effective', targetType: 'regulation', targetId: 'reg-008', description: 'APRA CPS 234 became effective — compliance attestation workflow triggered', severity: 'warning' },
  { actor: 'james.okafor@regco.io', action: 'user.access', targetType: 'user', targetId: 'usr-9921', description: 'New user granted Compliance Officer role — access to all policy modules', severity: 'info' },
  { actor: 'sarah.chen@regco.io', action: 'policy.publish', targetType: 'policy', targetId: 'pol-aml-001', description: 'AML Policy v4.2.0 published to the intranet — training notifications queued', severity: 'info' },
  { actor: 'system', action: 'risk.threshold', targetType: 'risk', targetId: 'risk-019', description: 'Hospital Ops AML risk exceeded residual threshold — mitigation plan requested', severity: 'critical' },
  { actor: 'marcus.lee@regco.io', action: 'audit.review', targetType: 'report', targetId: 'aud-2025-q3', description: 'Audit trail integrity check passed — 0 hash mismatches across 4,318 entries', severity: 'info' },
]

const riskItems = [
  { businessUnit: 'Retail Banking', regulationArea: 'AML/CFT', likelihood: 3, impact: 5, inherentRisk: 15, residualRisk: 8, trend: 'improving', owner: 'Sarah Chen', mitigationPlan: 'Tuning sanctions screening engine, reducing false positives by 35% in Q3; quarterly CCO attestation in place.' },
  { businessUnit: 'Retail Banking', regulationArea: 'Consumer Duty', likelihood: 4, impact: 4, inherentRisk: 16, residualRisk: 10, trend: 'stable', owner: 'Priya Patel', mitigationPlan: 'Forward-looking fair-value testing introduced; quarterly outcomes committee established.' },
  { businessUnit: 'Wealth Management', regulationArea: 'MiFID II', likelihood: 3, impact: 4, inherentRisk: 12, residualRisk: 6, trend: 'improving', owner: 'Marcus Lee', mitigationPlan: 'Target market assessment workflow automated; 24-month review cycle enforced via policy engine.' },
  { businessUnit: 'Capital Markets', regulationArea: 'Market Integrity', likelihood: 5, impact: 5, inherentRisk: 25, residualRisk: 18, trend: 'worsening', owner: 'James Okafor', mitigationPlan: 'SEC Rule 15c2-11 impact assessment in progress; policy and procedure refresh required before effective date.' },
  { businessUnit: 'Insurance', regulationArea: 'AI Governance', likelihood: 4, impact: 4, inherentRisk: 16, residualRisk: 11, trend: 'worsening', owner: 'Sarah Chen', mitigationPlan: 'Underwriting models to be re-classified as high-risk under EU AI Act; conformity assessment scoping underway.' },
  { businessUnit: 'Pharma R&D', regulationArea: 'Clinical Trials', likelihood: 3, impact: 5, inherentRisk: 15, residualRisk: 7, trend: 'improving', owner: 'Priya Patel', mitigationPlan: 'PMDA v3 alignment complete; weekly audit trail reviews live; CRO ownership matrix published.' },
  { businessUnit: 'Pharma R&D', regulationArea: 'GMP', likelihood: 2, impact: 5, inherentRisk: 10, residualRisk: 5, trend: 'stable', owner: 'James Okafor', mitigationPlan: 'Annex 1 contamination control strategy deployed across 3 manufacturing sites; ongoing qualification program.' },
  { businessUnit: 'Hospital Ops', regulationArea: 'Data Privacy', likelihood: 4, impact: 5, inherentRisk: 20, residualRisk: 14, trend: 'worsening', owner: 'Marcus Lee', mitigationPlan: 'HIPAA encryption refresh in flight; MFA rollout to clinical workstations delayed by integration issues.' },
  { businessUnit: 'Hospital Ops', regulationArea: 'AML/CFT', likelihood: 2, impact: 3, inherentRisk: 6, residualRisk: 4, trend: 'stable', owner: 'Sarah Chen', mitigationPlan: 'Patient billing AML checks automated; cash transactions above threshold flagged for review.' },
  { businessUnit: 'Technology', regulationArea: 'Cybersecurity', likelihood: 5, impact: 5, inherentRisk: 25, residualRisk: 12, trend: 'improving', owner: 'James Okafor', mitigationPlan: 'CPS 234 board attestation pack finalised; quarterly control testing active; 72-hour incident workflow live.' },
  { businessUnit: 'Risk', regulationArea: 'Basel III', likelihood: 4, impact: 5, inherentRisk: 20, residualRisk: 14, trend: 'worsening', owner: 'Marcus Lee', mitigationPlan: 'Standardised approach implementation gap analysis flagged to Group Risk Committee; remediation plan due in 60 days.' },
  { businessUnit: 'Operations', regulationArea: 'AML/CFT', likelihood: 3, impact: 4, inherentRisk: 12, residualRisk: 7, trend: 'improving', owner: 'Priya Patel', mitigationPlan: 'Screening false-positive tuning program delivering sustained reductions; SLA tightened to 2 days.' },
]

// Generate 6 months of monthly compliance metric snapshots
const metrics: Array<{
  snapshotDate: Date
  overallScore: number
  openFindings: number
  overdueTasks: number
  policiesCurrent: number
  trainingComplete: number
}> = []
for (let i = 5; i >= 0; i--) {
  const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
  metrics.push({
    snapshotDate: d,
    overallScore: 78 + i * 2 + (i % 2 === 0 ? 1 : 0),
    openFindings: 42 - i * 3,
    overdueTasks: 18 - i * 2,
    policiesCurrent: 86 + i,
    trainingComplete: 82 + i * 2,
  })
}

const chatMessages = [
  { role: 'assistant', content: 'Hello — I am your AI Compliance Assistant. I can help you interpret regulatory changes, draft policy updates, and assess the impact of new rules on your business units. How can I help today?', context: 'session-init' },
  { role: 'user', content: 'What is the impact of MAS Notice SFA04-N02 on our Singapore retail banking operations?', context: 'regulation:MAS-SFA04' },
  { role: 'assistant', content: 'MAS Notice SFA04-N02 introduces three material changes for Singapore retail banking: (1) real-time sanctions screening with validated name-matching algorithms, (2) documented false-positive tuning with reduced SLA, and (3) quarterly CCO attestation. The AML Policy v4.2.0 already incorporates items 1 and 3. False-positive tuning SLA needs tightening from 5 to 2 business days in Section 4.3 of the AML policy. Affected business units: Compliance, Operations, Technology. Estimated remediation effort: 14 person-days.', context: 'regulation:MAS-SFA04' },
  { role: 'user', content: 'Show me which policies are overdue for review.', context: 'policy:overdue' },
  { role: 'assistant', content: 'Two policies are overdue or approaching review: (1) HIPAA Security Rule Implementation Policy — overdue by 5 days, owned by IT Security; (2) Consumer Duty Outcomes Monitoring Policy — review due in 15 days, owned by Compliance. Recommend prioritising the HIPAA policy given the pending HHS NPRM on encryption, which will materially expand its scope.', context: 'policy:overdue' },
]

async function main() {
  console.log('Clearing existing data...')
  await db.chatMessage.deleteMany()
  await db.complianceMetric.deleteMany()
  await db.riskItem.deleteMany()
  await db.auditLog.deleteMany()
  await db.policy.deleteMany()
  await db.regulation.deleteMany()

  console.log(`Seeding ${regulations.length} regulations...`)
  for (const r of regulations) {
    await db.regulation.create({ data: r })
  }

  console.log(`Seeding ${policies.length} policies...`)
  for (const p of policies) {
    await db.policy.create({ data: p })
  }

  console.log(`Seeding ${auditLogs.length} audit logs...`)
  for (const a of auditLogs) {
    await db.auditLog.create({ data: { ...a, timestamp: daysAgo(Math.floor(Math.random() * 30)) } })
  }

  console.log(`Seeding ${riskItems.length} risk items...`)
  for (const r of riskItems) {
    await db.riskItem.create({ data: r })
  }

  console.log(`Seeding ${metrics.length} compliance metric snapshots...`)
  for (const m of metrics) {
    await db.complianceMetric.create({ data: m })
  }

  console.log(`Seeding ${chatMessages.length} chat messages...`)
  for (const c of chatMessages) {
    await db.chatMessage.create({ data: { ...c, createdAt: daysAgo(Math.floor(Math.random() * 7)) } })
  }

  console.log('Seed complete.')
  const counts = {
    regulations: await db.regulation.count(),
    policies: await db.policy.count(),
    auditLogs: await db.auditLog.count(),
    riskItems: await db.riskItem.count(),
    metrics: await db.complianceMetric.count(),
    chatMessages: await db.chatMessage.count(),
  }
  console.table(counts)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
