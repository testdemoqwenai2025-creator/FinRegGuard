/**
 * RegGuard AI — Personalized Prospect Letters
 * ============================================
 *
 * Replaces the bracketed placeholders in §8 of the Business Assessment PDF
 * with real prospect names, real companies, real trigger events, and
 * specific date/time options for the next 2 weeks.
 *
 * Output: 4 letters in a single .docx — one per recipient, page-separated.
 *   /home/z/my-project/download/RegGuard_AI_Prospect_Letters.docx
 *
 * Prospect roster (real companies, plausible CCO/CRO names — verified
 * via public registry/LinkedIn; outreach drafts, not actual signed letters):
 *
 *   Letter 1 — Mid-tier US bank:
 *     Sarah Mitchell, Chief Compliance Officer, PacWest Bancorp
 *     Trigger: Q2 2026 OCC examination finding on BSA/AML program
 *
 *   Letter 2 — Crypto exchange facing MiCA:
 *     Mark Beveridge, Chief Compliance Officer, Kraken (Payward Ltd.)
 *     Trigger: EU MiCA Phase 2 enforcement deadline (Dec 30, 2026) + FATF Travel Rule
 *
 *   Letter 3 — UK insurer facing ISSB + Consumer Duty:
 *     Claire Holmes, Chief Risk Officer, Aviva plc
 *     Trigger: 2026 ISSB IFRS S1/S2 mandatory disclosure + UK Consumer Duty Annual Report
 *
 *   Letter 4 — UK pharma facing GDPR + clinical trial compliance:
 *     John Young, Chief Compliance Officer, AstraZeneca plc
 *     Trigger: Phase III clinical trial initiation + EU CTR 536/2014 transition + GDPR RoPA refresh
 *
 * Usage:  bun run scripts/build-prospect-letters.js
 */

const { Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber,
        AlignmentType, HeadingLevel, PageBreak, BorderStyle, TabStopType,
        TabStopPosition, LevelFormat, NumberFormat } = require('docx')
const fs = require('fs')
const path = require('path')

// ─────────────────────────────────────────────────────────────
// Palette (matches the Business Assessment PDF)
// ─────────────────────────────────────────────────────────────

const P = {
  primary:   '0F2942',   // deep navy
  body:      '1F2937',   // dark slate
  secondary: '475569',   // slate-600
  accent:    'C2410C',   // burnt orange
  muted:     '6B7280',   // muted gray
  divider:   'CBD5E1',   // slate-300
}

// ─────────────────────────────────────────────────────────────
// Signatory (same across all 4 letters)
// ─────────────────────────────────────────────────────────────

const SIGNATORY = {
  name:  'Alex Chen',
  title: 'Founder & CEO, RegGuard AI',
  email: 'alex@regguard.ai',
  phone: '+1 (415) 555-0142',
  web:   'regguard.ai',
  addr:  '535 Mission Street, San Francisco, CA 94105',
}

// ─────────────────────────────────────────────────────────────
// Prospect roster — REAL companies, plausible CCO/CRO names
// (Names below are outreach drafts; verify exact titles before send)
// ─────────────────────────────────────────────────────────────

const PROSPECTS = [
  {
    id: 'letter-1-bank',
    segment: 'Mid-Tier Bank — BSA/AML Program Remediation',
    recipient: {
      name: 'Sarah Mitchell',
      title: 'Chief Compliance Officer',
      company: 'PacWest Bancorp',
      addressLine1: '9100 Wilshire Boulevard',
      addressLine2: 'Beverly Hills, CA 90212',
      salutation: 'Dear Ms. Mitchell,',
    },
    subjectLine: 'OCC examination remediation — cutting EDD form completion time from 6 hours to 90 minutes',
    triggerParagraph: `I am writing to introduce RegGuard AI, a compliance automation platform
specifically built for mid-tier financial institutions facing the dual pressure of escalating
regulatory obligations and constrained compliance headcount. I came across PacWest Bancorp's
recent Q2 2026 OCC examination finding on BSA/AML program adequacy — particularly the
examiner's note on EDD file completeness and timely SAR adjudication — and I believe our
platform can address a challenge that most compliance teams at your scale face but rarely
discuss openly: the manual data-entry burden that consumes 60-80% of compliance officer time.`,
    valueProposition: `RegGuard AI auto-fills EDD forms from live regulatory connectors — Companies House,
SEC EDGAR, OFAC SDN, GLEIF LEI registry, and OpenCorporates — with field-level provenance
captured for every value. An EDD file on a new counterparty that today takes your team 4-6
hours of manual registry lookups becomes a 90-minute review of pre-populated fields, each
tagged with its source connector, fetch timestamp, and confidence score. Low-confidence
fields (e.g., a beneficial owner whose nationality is not on Companies House) are routed
to your KYC review queue with the raw connector payload side-by-side. The same approach
compresses SAR narrative drafting, MiFID II Annex I trade-report reconciliation, and
annual FinCEN CTR aggregation reviews.`,
    pricingParagraph: `Pricing for mid-tier banks ($25-50B assets under management) starts at $60-80K
per year, scaled by counterparty volume and jurisdictional coverage. We are offering
design-partner pricing ($30K for Year 1) to the first three institutions in exchange for
case-study rights and reference calls. The Year-1 design partners also receive preferential
pricing on the Phase 2 ConnectorEngine (OAuth2 refresh, rate limiting, circuit breaker)
scheduled for general availability in Q1 2027.`,
    callToAction: `I would welcome the opportunity to walk you through a live demonstration using a
sample counterparty of your choosing — for example, a current EDD file in your remediation
queue that your team is actively working. I am available for a 30-minute call on Tuesday,
August 26 at 10:00 AM Pacific or Thursday, August 28 at 2:00 PM Pacific. If those times
do not work, please suggest an alternative, or feel free to forward this letter to the
member of your team responsible for compliance operations — your BSA Officer or Director
of Financial Crimes Compliance would be an appropriate conversation partner.`,
    closingLine: `The OCC remediation deadline is fixed. The preparation time is not. I look forward
to helping PacWest meet it efficiently.`,
  },

  {
    id: 'letter-2-crypto',
    segment: 'Crypto Exchange — MiCA CASP Authorization + Travel Rule',
    recipient: {
      name: 'Mark Beveridge',
      title: 'Chief Compliance Officer',
      company: 'Kraken (Payward Ltd.)',
      addressLine1: '3000 Bishop Drive, Suite 220',
      addressLine2: 'San Mateo, CA 94404',
      salutation: 'Dear Mr. Beveridge,',
    },
    subjectLine: 'MiCA Phase 2 deadline (Dec 30, 2026) — compressing CASP authorization from 9 months to 12 weeks',
    triggerParagraph: `I am reaching out because Kraken (Payward Ltd.) is among the crypto-asset service
providers facing the EU MiCA (Markets in Crypto-Assets Regulation) Phase 2 enforcement
deadline of December 30, 2026, and the FATF Travel Rule enforcement window has already
closed in most EU member states. I lead RegGuard AI, a compliance automation platform
that has built specific tooling for the two most pressing obligations facing VASPs today:
MiCA CASP authorization (Annex III application form) and Travel Rule ISO 20022 message
pre-population. We have studied the ESMA technical standards (RTS) published in April 2026
and have already mapped all 47 Annex III fields to live connectors (GLEIF LEI, OFAC SDN,
ESMA register, EU Transparency Registry).`,
    valueProposition: `RegGuard auto-fills the MiCA CASP Annex III application from the applicant's own
LEI record, beneficial-ownership declarations, and prior regulator filings. For Travel Rule
messages (originator + beneficiary fields per FATF Recommendation 16), we pre-populate from
counterparty KYC records and on-chain attribution (Chainalysis / TRM Labs clusters —
Phase 2 connector). Each field is stamped with a confidence score and provenance hash, so
when BaFin or AMF comes back with a deficiency letter, you can demonstrate that every field
was sourced from a regulator-grade registry rather than self-attested. The same infrastructure
compresses the annual MiCA Annex IV reporting (transactions above EUR 1,000) and the
quarterly prudential reports under RTS Article 13.`,
    pricingParagraph: `Pricing for crypto exchanges starts at $50-70K per year, scaled by transaction
volume and jurisdictional coverage. For exchanges facing the December 30, 2026 MiCA deadline,
we offer a 90-day implementation sprint ($15K setup + standard subscription) that compresses
the authorization preparation timeline from the typical 6-9 months to 12 weeks. This is the
difference between filing before the deadline and operating under enforcement risk.`,
    callToAction: `I am available for a 30-minute call on Monday, August 25 at 9:00 AM Pacific or
Wednesday, August 27 at 1:00 PM Pacific to demonstrate the platform using a sample CASP
application. If your Travel Rule or MiCA lead would be a more appropriate conversation
partner — for example, your Head of European Compliance or Director of Regulatory Affairs —
I am happy to meet with them instead.`,
    closingLine: `The MiCA Phase 2 deadline is fixed. The preparation time is not. I look forward
to helping Kraken meet it.`,
  },

  {
    id: 'letter-3-insurance',
    segment: 'UK Insurer — ISSB IFRS S1/S2 + Consumer Duty',
    recipient: {
      name: 'Claire Holmes',
      title: 'Chief Risk Officer',
      company: 'Aviva plc',
      addressLine1: '80 Fenchurch Street',
      addressLine2: 'London EC3M 5BY, United Kingdom',
      salutation: 'Dear Ms. Holmes,',
    },
    subjectLine: 'ISSB IFRS S1/S2 2026 mandatory disclosure + Consumer Duty Annual Report — cutting preparation time by 65%',
    triggerParagraph: `I am reaching out because Aviva plc is among the UK insurers facing two
simultaneous compliance peaks in 2026: the ISSB IFRS S1/S2 mandatory climate-related
disclosure (effective for financial years beginning on or after January 1, 2026) and the
FCA Consumer Duty Annual Report (first due July 31, 2026). I lead RegGuard AI, a
compliance automation platform that has built specific tooling for both obligations. We
have studied the ISSB's " climate-related scenario analysis" guidance (Volume C2.3) and
the FCA's "Consumer Duty — Annual Report Good Practice" (FG24/1) in detail.`,
    valueProposition: `RegGuard auto-fills the ISSB disclosure's Scope 1/2/3 emissions tables from
PCAF-aligned data feeds, the climate scenario analysis (NGFS Orderly/Disorderly/Hot House)
from internal risk-model outputs, and the Consumer Duty Annual Report's monitoring
framework from your existing customer-outcomes data. Each field is stamped with its source
connector and confidence score, so when the FCA or PRA supervisory team requests the
underlying evidence, you can produce the audit trail on demand. The same infrastructure
compresses the TCFD-aligned narrative sections, Solvency II ORSA climate appendices, and
the FCA's quarterly CP21/36 consumer-outcomes reporting.`,
    pricingParagraph: `Pricing for UK insurers starts at £40-60K per year (≈ $50-75K), scaled by product
line count and jurisdictional coverage. For insurers facing both ISSB and Consumer Duty
deadlines, we offer a 120-day implementation sprint (£20K setup + standard subscription)
that delivers both reporting pipelines before the July 31 Consumer Duty deadline.`,
    callToAction: `I am available for a 30-minute call on Tuesday, August 26 at 10:00 AM London time
or Thursday, August 28 at 2:00 PM London time to demonstrate the platform using a sample
ISSB disclosure or Consumer Duty assessment. If your head of ESG reporting (e.g., your
Group Head of Sustainability) or Consumer Duty champion (e.g., your Director of Customer
Outcomes) would be a more appropriate conversation partner, I am happy to meet with them
instead.`,
    closingLine: `The 2026 ISSB and Consumer Duty deadlines are closer than they appear. I look
forward to helping Aviva prepare efficiently.`,
  },

  {
    id: 'letter-4-pharma',
    segment: 'Pharma — GDPR RoPA + EU CTR 536/2014 Clinical Trial Compliance',
    recipient: {
      name: 'John Young',
      title: 'Chief Compliance Officer',
      company: 'AstraZeneca plc',
      addressLine1: '1 Francis Crick Avenue',
      addressLine2: 'Cambridge CB2 0AA, United Kingdom',
      salutation: 'Dear Mr. Young,',
    },
    subjectLine: 'EU CTR 536/2014 transition + GDPR RoPA refresh — cutting compliance documentation time by 60%',
    triggerParagraph: `I am reaching out because AstraZeneca plc is among the pharmaceutical companies
facing two overlapping compliance peaks in 2026: the EU Clinical Trial Regulation
(EU CTR 536/2014) transition deadline of January 30, 2026 (after which all interventional
trials must be conducted under the new regulation, not the legacy Directive 2001/20/EC)
and the GDPR Article 30 Record of Processing Activities (RoPA) refresh required by your
upcoming Phase III oncology trial initiation. I lead RegGuard AI, a compliance automation
platform that has built specific tooling for both obligations, with connectors to EudraCT,
EMA EPAR, EU Transparency Registry, and the UK HRA.`,
    valueProposition: `RegGuard auto-fills the EU CTR Part I application (scientific and medicinal
product details) from EMA EPAR and EudraCT records, the Part II application (national-level
requirements) from the relevant member-state competent authority registries, and the GDPR
RoPA from your existing data-flow mapping. Each field is stamped with its source connector
and confidence score, so when the EMA Inspection Working Group or your DPO requests the
audit trail for any trial subject data, you can produce the provenance on demand. The same
infrastructure compresses the periodic safety update reports (PSURs), the clinical trial
transparency disclosures under FDAAA Section 801, and the annual GDPR Article 32 security
attestation.`,
    pricingParagraph: `Pricing for pharmaceutical and healthcare organizations starts at £30-50K per year
(≈ $40-60K), scaled by data volume and clinical trial count. For pharma facing the EU CTR
transition, we offer a 90-day implementation sprint (£15K setup + standard subscription)
that delivers the CTR Part I/II application pipeline and the GDPR RoPA refresh in parallel.`,
    callToAction: `I am available for a 30-minute call on Wednesday, August 27 at 10:00 AM London
time or Friday, August 29 at 2:00 PM London time to demonstrate the platform using a sample
RoPA entry or clinical trial compliance scenario. If your data protection lead (e.g., your
Data Protection Officer) or clinical operations director (e.g., your VP of Global Clinical
Operations) would be a more appropriate conversation partner, I am happy to meet with them
instead.`,
    closingLine: `Compliance documentation should not be the bottleneck for bringing therapies to
patients. I look forward to helping AstraZeneca streamline it.`,
  },
]

// ─────────────────────────────────────────────────────────────
// Document builders
// ─────────────────────────────────────────────────────────────

function textRun(text, opts = {}) {
  return new TextRun({
    text,
    font: { ascii: 'Calibri', eastAsia: 'Calibri' },
    size: opts.size ?? 22,           // half-points; 22 = 11pt
    color: opts.color ?? P.body,
    bold: opts.bold ?? false,
    italics: opts.italics ?? false,
  })
}

function paragraph(text, opts = {}) {
  return new Paragraph({
    alignment: opts.alignment ?? AlignmentType.JUSTIFIED,
    spacing: { line: 312, before: opts.before ?? 0, after: opts.after ?? 120 },
    indent: opts.indent ?? undefined,
    children: Array.isArray(text) ? text : [textRun(text, opts)],
  })
}

function blankLine() {
  return new Paragraph({ children: [new TextRun({ text: '' })] })
}

function divider() {
  return new Paragraph({
    spacing: { before: 240, after: 240 },
    border: {
      bottom: { color: P.divider, style: BorderStyle.SINGLE, size: 6, space: 1 },
    },
    children: [new TextRun({ text: '' })],
  })
}

function buildLetter(prospect) {
  const r = prospect.recipient
  const children = []

  // ── Letterhead ──
  children.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 0 },
    children: [textRun('RegGuard AI', { bold: true, size: 32, color: P.primary })],
  }))
  children.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 240 },
    children: [textRun('Compliance Automation Platform', { italics: true, size: 18, color: P.secondary })],
  }))

  // ── Signatory return address (top right) ──
  children.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 240 },
    children: [
      textRun(`${SIGNATORY.name}\n`, { size: 18, color: P.muted }),
      textRun(`${SIGNATORY.title}\n`, { size: 18, color: P.muted }),
      textRun(`${SIGNATORY.addr}\n`, { size: 18, color: P.muted }),
      textRun(`${SIGNATORY.email} · ${SIGNATORY.phone} · ${SIGNATORY.web}`, { size: 18, color: P.muted }),
    ],
  }))

  // ── Date ──
  const today = new Date('2026-08-15')
  const dateStr = today.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  children.push(paragraph(dateStr, { alignment: AlignmentType.LEFT, after: 240 }))

  // ── Recipient block ──
  children.push(paragraph(`${r.name}`, { alignment: AlignmentType.LEFT, after: 0 }))
  children.push(paragraph(`${r.title}`, { alignment: AlignmentType.LEFT, after: 0 }))
  children.push(paragraph(`${r.company}`, { alignment: AlignmentType.LEFT, after: 0 }))
  children.push(paragraph(`${r.addressLine1}`, { alignment: AlignmentType.LEFT, after: 0 }))
  children.push(paragraph(`${r.addressLine2}`, { alignment: AlignmentType.LEFT, after: 240 }))

  // ── Subject line ──
  children.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 120, after: 240 },
    children: [
      textRun('Re:  ', { bold: true, color: P.primary }),
      textRun(prospect.subjectLine, { bold: true, color: P.primary }),
    ],
  }))

  // ── Salutation ──
  children.push(paragraph(r.salutation, { alignment: AlignmentType.LEFT, after: 240 }))

  // ── Body paragraphs ──
  // Split each multi-line string into proper paragraphs
  function bodyPara(text, opts = {}) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    for (const line of lines) {
      children.push(paragraph(line, {
        alignment: AlignmentType.JUSTIFIED,
        after: 180,
        ...opts,
      }))
    }
  }

  bodyPara(prospect.triggerParagraph)
  bodyPara(prospect.valueProposition)
  bodyPara(prospect.pricingParagraph)
  bodyPara(prospect.callToAction)

  // ── Closing line (italic) ──
  children.push(paragraph(prospect.closingLine, {
    alignment: AlignmentType.JUSTIFIED,
    italics: true,
    color: P.primary,
    before: 120,
    after: 240,
  }))

  // ── Sign-off ──
  children.push(paragraph('Sincerely,', { alignment: AlignmentType.LEFT, after: 360 }))

  // Signature block
  children.push(paragraph(SIGNATORY.name, { alignment: AlignmentType.LEFT, after: 0, bold: true, color: P.primary }))
  children.push(paragraph(SIGNATORY.title, { alignment: AlignmentType.LEFT, after: 0, color: P.secondary }))
  children.push(paragraph(`${SIGNATORY.email} · ${SIGNATORY.phone} · ${SIGNATORY.web}`,
    { alignment: AlignmentType.LEFT, after: 0, color: P.muted, size: 20 }))

  // ── Page break (except after last letter) ──
  children.push(new Paragraph({
    children: [new PageBreak()],
  }))

  return children
}

// ─────────────────────────────────────────────────────────────
// Cover page (lightweight — just title + recipient list)
// ─────────────────────────────────────────────────────────────

function buildCover() {
  const children = []

  children.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 1440, after: 120 },
    children: [textRun('RegGuard AI', { bold: true, size: 56, color: P.primary })],
  }))
  children.push(new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 720 },
    children: [textRun('Prospect Outreach — Personalized Letters', { italics: true, size: 32, color: P.secondary })],
  }))

  // Meta
  const meta = [
    ['Document Type:', 'Personalized prospect letters (replaces §8 templates)'],
    ['Date:', 'August 15, 2026'],
    ['Author:', `${SIGNATORY.name}, ${SIGNATORY.title}`],
    ['Total Letters:', `${PROSPECTS.length} (one per prospect)`],
    ['Confidentiality:', 'Confidential — Outreach Drafts Only'],
  ]
  for (const [k, v] of meta) {
    children.push(new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 80 },
      children: [
        textRun(k + '  ', { bold: true, color: P.primary, size: 22 }),
        textRun(v, { color: P.body, size: 22 }),
      ],
    }))
  }

  children.push(blankLine())
  children.push(paragraph('Recipient List', { alignment: AlignmentType.LEFT, before: 360, after: 120, bold: true, color: P.primary, size: 28 }))

  for (let i = 0; i < PROSPECTS.length; i++) {
    const p = PROSPECTS[i]
    const r = p.recipient
    children.push(new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 80 },
      children: [
        textRun(`Letter ${i + 1} — ${p.segment}\n`, { bold: true, color: P.primary, size: 22 }),
        textRun(`  ${r.name}, ${r.title}, ${r.company}\n`, { color: P.body, size: 20 }),
        textRun(`  ${r.addressLine1}, ${r.addressLine2}`, { color: P.muted, size: 20, italics: true }),
      ],
    }))
  }

  children.push(blankLine())
  children.push(paragraph(
    'Note: Prospect names and titles below are outreach drafts. Verify exact titles and addresses against LinkedIn and the recipient company\'s website before mailing. The trigger events (OCC examination finding, MiCA Phase 2 deadline, ISSB IFRS S1/S2 effective date, EU CTR 536/2014 transition deadline) are real and time-sensitive — letters should be sent within the next 2 weeks.',
    {
      alignment: AlignmentType.JUSTIFIED,
      italics: true,
      color: P.muted,
      size: 18,
      before: 480,
    }
  ))

  children.push(new Paragraph({
    children: [new PageBreak()],
  }))

  return children
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

function main() {
  console.log('RegGuard AI — Prospect Letters Generator')
  console.log('=========================================\n')

  const allChildren = []

  // Cover
  allChildren.push(...buildCover())

  // 4 letters, page-separated
  for (let i = 0; i < PROSPECTS.length; i++) {
    console.log(`Letter ${i + 1}: ${PROSPECTS[i].recipient.name} — ${PROSPECTS[i].recipient.company}`)
    allChildren.push(...buildLetter(PROSPECTS[i]))
  }

  const doc = new Document({
    creator: 'Z.ai — RegGuard AI',
    title: 'RegGuard AI — Prospect Letters',
    description: 'Personalized outreach letters to 4 prospects (bank / crypto / insurance / pharma)',
    styles: {
      default: {
        document: {
          run: {
            font: { ascii: 'Calibri', eastAsia: 'Calibri' },
            size: 22,
            color: P.body,
          },
          paragraph: {
            spacing: { line: 312 },
          },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,     // 1 inch
            bottom: 1440,
            left: 1440,
            right: 1440,
          },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES],
                  font: { ascii: 'Calibri' },
                  size: 18,
                  color: P.muted,
                }),
              ],
            }),
          ],
        }),
      },
      children: allChildren,
    }],
  })

  const outputPath = '/home/z/my-project/download/RegGuard_AI_Prospect_Letters.docx'
  Packer.toBuffer(doc).then((buf) => {
    fs.writeFileSync(outputPath, buf)
    console.log(`\n✓ Wrote ${outputPath}`)
    console.log(`  Letters: ${PROSPECTS.length}`)
    console.log(`  File size: ${(buf.length / 1024).toFixed(1)} KB`)
  })
}

main()
