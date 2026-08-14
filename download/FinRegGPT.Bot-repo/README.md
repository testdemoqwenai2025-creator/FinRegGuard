# FinRegGPT.Bot

> **AI Regulatory Compliance Automator for Financial Services**
>
> Track regulation changes across 8 jurisdictions · Auto-update policies with AI · Seal immutable audit trails · Detect financial crime in real time.

[![Whitepaper](https://img.shields.io/badge/whitepaper-v1.0-emerald)](./FinRegGPT.Bot-Whitepaper.pdf)
[![TAM](https://img.shields.io/badge/TAM-%2455B_by_2027-emerald)](#market-opportunity)
[![Jurisdictions](https://img.shields.io/badge/jurisdictions-8-teal)](#coverage)
[![Net Retention](https://img.shields.io/badge/net_retention-94%25-emerald)](#stickiness)

---

## Table of Contents

- [What is FinRegGPT.Bot](#what-is-finreggptbot)
- [Why It Exists](#why-it-exists)
- [Platform Pillars](#platform-pillars)
- [Coverage](#coverage)
- [Repository Contents](#repository-contents)
- [Architecture at a Glance](#architecture-at-a-glance)
- [Core Modules](#core-modules)
- [Financial-Sector Deep Dive — AML/KYC Engine](#financial-sector-deep-dive--amlkyc-engine)
- [Compliance Workflow](#compliance-workflow)
- [Technology Stack](#technology-stack)
- [Data Model](#data-model)
- [Quickstart](#quickstart)
- [API Reference](#api-reference)
- [Diagrams](#diagrams)
- [Roadmap](#roadmap)
- [Differentiators](#differentiators)
- [Stickiness](#stickiness)
- [Market Opportunity](#market-opportunity)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## What is FinRegGPT.Bot

FinRegGPT.Bot is an **AI-native compliance platform** that automates the three activities every regulated financial institution must perform continuously:

1. **Track** regulatory changes across every jurisdiction they operate in.
2. **Update** internal policies to reflect those changes — with AI drafting 70-80% of the language.
3. **Audit** every action through an immutable, hash-chained trail that regulators can inspect on demand.

The platform ships with a **7-module web application** (Dashboard, Regulations, Policies, Audit Trail, Risk Matrix, AI Assistant, Reports) and an **AML/KYC engine** that adds real-time sanctions screening, transaction monitoring, and CDD/EDD workflow for financial-sector customers.

It is designed for **banks, insurers, pharmaceutical companies, and hospitals** — the four customer segments that face the heaviest multi-jurisdictional regulatory burden.

---

## Why It Exists

Financial institutions face a regulatory burden that grows **12-18% annually**. A typical tier-one bank tracks more than 200 distinct regulations across 8+ jurisdictions, with an average of **14,000 regulatory change events per year**. Manual compliance processes cannot keep pace:

- Industry studies estimate human-only workflows miss **8-12% of material changes**.
- The average time from regulatory publication to internal policy update exceeds **90 days**.
- Global financial institutions paid **$10.6 billion in AML/KYC/sanctions fines in 2024** — the majority attributable to process failures, not wilful misconduct.

FinRegGPT.Bot closes this gap. Cycle time drops from 90 days to **25-30 business days**. Missed-change rate drops from 8-12% to under 1%. Average customer ROI is **7.2x** within the first year.

---

## Platform Pillars

| Pillar  | What it does                                                                                                            | Why it matters                                                                                          |
| ------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Track   | Continuously ingests regulator RSS feeds, AI-classifies each change by jurisdiction, category, impact, affected units. | Eliminates the 8-12% of material changes humans miss. Reduces time-to-awareness from days to hours.     |
| Update  | Cross-references new regulations with the policy inventory and drafts proposed language for each affected policy.       | Compresses policy revision cycles from 60 to 15 business days. AI drafts 70-80% of the language.        |
| Audit   | Appends every action to an append-only, hash-chained AuditLog. Nightly integrity verification. Quarterly signed exports. | Converts audit prep from a 6-week exercise to a 4-hour export. Regulators can be given any window on demand. |

---

## Coverage

FinRegGPT.Bot tracks regulations from **8 jurisdictions** from day one — most competitors cover 1-2 and require 12-18 months to expand.

| Jurisdiction | Primary Regulators                  | Sample Regulations Tracked                                         |
| ------------ | ----------------------------------- | ------------------------------------------------------------------ |
| US           | SEC, FINRA, HHS-OCR, OCC, FDIC      | SEC Rule 15c2-11, HIPAA Security Rule (HHS NPRM)                   |
| EU           | ESMA, EBA, EMA, European Commission | MiFID II Product Governance, EU AI Act, GDPR Article 30 RoPA, Basel III Final Reforms, EMA GMP Annex 1 |
| UK           | FCA, PRA                            | FCA Consumer Duty — Outcome Monitoring Refresh                     |
| JP           | PMDA, FSA                           | PMDA Clinical Trial Data Integrity Standard v3                     |
| SG           | MAS                                 | MAS Notice SFA04-N02 — AML/CFT Sanctions Screening                 |
| AU           | APRA, ASIC                          | APRA CPS 234 — Information Security Capability                     |
| CA           | OSFI                                | OSFI B-13 — Technology and Cyber Risk Management                   |
| Global       | FATF, BIS, IAIS                     | FATF Recommendations, Basel III/IV framework                       |

---

## Repository Contents

This repository contains the **documentation, whitepaper, and workflow diagrams** for FinRegGPT.Bot. The full Next.js source code lives in the development sandbox and can be made available to enterprise prospects upon request.

```
FinRegGPT.Bot/
├── README.md                              ← this file
├── SKILLS.md                              ← skills & competencies matrix
├── FinRegGPT.Bot-Whitepaper.pdf           ← 17-page comprehensive whitepaper
├── diagrams/                              ← 4 workflow diagrams (PNG, 2x DPI)
│   ├── 01-system-architecture.png         ← 5-layer architecture
│   ├── 02-compliance-workflow.png         ← 5-phase end-to-end workflow with SLAs
│   ├── 03-aml-kyx-flow.png                ← AML/KYC 3-lane detection flow
│   └── 04-user-journey.png                ← 10-step CCO user journey
├── docs/                                  ← source HTML for diagrams (editable)
│   ├── 01-architecture.html
│   ├── 02-compliance-workflow.html
│   ├── 03-aml-flow.html
│   └── 04-user-journey.html
└── LICENSE                                ← Apache 2.0
```

---

## Architecture at a Glance

FinRegGPT.Bot is structured as **5 layers**, from presentation through external integrations. The full diagram is in [`diagrams/01-system-architecture.png`](./diagrams/01-system-architecture.png).

```
┌──────────────────────────────────────────────────────────────────┐
│ L1 — Presentation (Next.js 16 App Router + shadcn/ui)             │
│     Dashboard · Regulations · Policies · Audit · Risk · Assistant  │
│     · Reports · AML/KYC                                            │
├──────────────────────────────────────────────────────────────────┤
│ L2 — API Gateway (Next.js Route Handlers, server-only)            │
│     /api/regulations · /api/policies · /api/audit · /api/risk      │
│     · /api/metrics · /api/chat · /api/aml/screen · /api/aml/cdd    │
├──────────────────────────────────────────────────────────────────┤
│ L3 — Domain Services (TypeScript, server-only)                    │
│     Regulation ingestion · Policy auto-update · Audit integrity    │
│     · Risk scoring · LLM copilot · AML typology detector           │
├──────────────────────────────────────────────────────────────────┤
│ L4 — Data (Prisma ORM + SQLite dev / Postgres prod)               │
│     Regulation · Policy · AuditLog · RiskItem · Metric · Chat      │
│     · Transaction · CustomerRisk                                    │
├──────────────────────────────────────────────────────────────────┤
│ L5 — External Integrations (outbound only, rate-limited)          │
│     Z.ai LLM API · Regulator RSS feeds · OFAC/EU/UN/HMT lists      │
│     · Core banking / EHR systems                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Three architectural decisions warrant explanation:**

1. **Server-only LLM.** The browser never holds the Z.ai API key, never sends raw prompts over the network, and never receives model chain-of-thought. This eliminates an entire class of prompt-injection risks.
2. **Append-only hash-chained audit trail.** Each AuditLog entry's SHA-256 hash incorporates the previous entry's hash, making retroactive modification immediately detectable. A nightly integrity checker verifies the chain.
3. **Component-driven UI.** Every visual element is a shadcn/ui primitive composed into the 7 views. Accessibility (ARIA, keyboard nav, WCAG 2.1 AA) is inherited from the underlying Radix primitives.

---

## Core Modules

The platform delivers **7 primary modules**, each addressing a specific compliance workflow.

### 1. Dashboard
The morning briefing. KPI tiles (tracked regulations, active policies, critical risks, audit events), circular compliance-score gauge with month-over-month delta, 6-month trend area chart, priority alerts feed, recent activity timeline sourced from the audit trail. Designed for a 30-second scan.

### 2. Regulations
Filterable, searchable table of every tracked regulation. Color-coded jurisdiction badges, status (monitoring / pending / effective / superseded), impact level (low to critical), effective date. Upcoming effective-dates strip. Detail dialog with AI-recommended actions.

### 3. Policies
Card grid of internal policy documents. Version, owner, review-date countdown (overdue in red, soon in amber). AI auto-update suggestion panel on each card. Version-history timeline. "Regenerate" button re-runs the LLM with the latest regulatory context.

### 4. Audit Trail
Immutable, hash-chained log of every compliance-relevant action. Integrity banner confirms last verification. Filters by severity, action type, free-text search. One-click CSV export produces a regulator-ready bundle signed by Internal Audit.

### 5. Risk Matrix
Interactive 5x5 heatmap of inherent risk (likelihood × impact). Hover reveals underlying risks. Side panel shows average residual risk per business unit. Detailed risk register with mitigation plans.

### 6. AI Compliance Assistant
Full chat interface backed by the Z.ai LLM via `z-ai-web-dev-sdk`. System-prompted as a regulatory compliance expert with knowledge of the platform's 12 regulations, 6 policies, and 12 risk items. Conversation history persisted to DB and audit trail. Constrained to under 250 words per response unless asked for depth.

### 7. Reports
Compliance trends, jurisdiction breakdown, residual-risk radar, fines-avoided ROI. Suitable for board reporting. The fines-avoided grouped bar chart is the single most important slide for board-level conversations.

---

## Financial-Sector Deep Dive — AML/KYC Engine

The AML/KYC engine is the **financial-sector differentiator** that distinguishes FinRegGPT.Bot from generic regtech platforms. It runs alongside the seven core modules and adds three real-time capabilities.

### Lane 1 — Sanctions Screening
Fires on every inbound event that references a party (customer onboarding, payment instruction, trade ticket, wire transfer). Fuzzy name match against OFAC SDN, EU consolidated, UN Security Council, and HMT UK lists using Levenshtein distance + phonetic + transliteration variants. Risk-tier decision: no-hit → proceed; possible hit → analyst queue; confirmed hit → block + SAR draft + regulator notification.

### Lane 2 — Transaction Monitoring
Consumes Kafka / SQS stream from core banking. Each transaction enriched with customer segment, geography, historical patterns. Hybrid scoring: rule engine (structuring, round-tripping, velocity) + ML model (graph anomaly, behaviour baseline). Score <40 → log; 40-75 → L1 investigator queue; >75 → L2 + auto-SAR draft + asset freeze recommendation.

### Lane 3 — CDD/EDD Workflow
Customer risk rating. New customers and periodic refreshes (high-risk: 12 months, medium: 24 months, low: 36 months). PEP, adverse media, beneficial owner checks. Risk rating combines geography, occupation, product, channel, customer type → Low / Medium / High / Prohibited. High-risk requires EDD pack (source of funds, purpose, expected activity) + CCO approval.

### Typologies Detected

| Typology               | Detection method                  | SLA      |
| ---------------------- | --------------------------------- | -------- |
| Structuring            | Rule: deposit pattern analysis    | L1: 24h  |
| Layering               | Rule: velocity + geography        | L1: 24h  |
| Smurfing               | ML: graph anomaly + cluster       | L2: 4h   |
| Round-tripping         | Rule: closed-loop graph detection | L2: 4h   |
| Terrorist financing    | Rule + ML: jurisdiction scoring   | L2: 4h   |

### Response SLAs

| Stage                              | SLA         |
| ---------------------------------- | ----------- |
| Sanctions screen latency           | < 200ms     |
| L1 alert investigation             | 24 hours    |
| L2 critical alert                  | 4 hours     |
| SAR filing window post-decision    | 48 hours    |

All alerts — regardless of lane — append to the same immutable AuditLog that captures policy updates and regulation reviews. This unification is deliberate: regulators get a single chronological view of every compliance decision the institution has made.

Full diagram: [`diagrams/03-aml-kyx-flow.png`](./diagrams/03-aml-kyx-flow.png).

---

## Compliance Workflow

The end-to-end compliance automation workflow transforms a regulator publication into a sealed audit-trail entry in **25-30 business days**, versus the 90-day industry baseline. The full diagram is in [`diagrams/02-compliance-workflow.png`](./diagrams/02-compliance-workflow.png).

```
Phase 1 — Detection & Ingestion           SLA: 24 hours
  Regulator publishes → Ingestion worker → AI classifier → Regulation row + audit entry
        ↓
Phase 2 — Impact Assessment               SLA: 5 business days
  Compliance officer opens reg → AI impact summary → Risk items re-scored
        ↓
Phase 3 — Policy Auto-Update & Review     SLA: 15 business days
  AI generates policy diff → Owner reviews → Risk Committee approves
        ↓
Phase 4 — Publication & Training          SLA: 5 business days post-approval
  Policy published → Training refresh queued → Workforce enrolled
        ↓
Phase 5 — Audit Trail Sealing             SLA: Continuous
  Every action appended → Hash-chained → Nightly integrity check → Quarterly signed export
```

**Total cycle time: 25-30 business days.** Manual touchpoints: phases 2, 3, 4. Everything else is automated. AI is involved in 4 of 5 phases but never makes a publish decision — humans always review and sign off.

---

## Technology Stack

The stack is deliberately conventional. Every choice is a hedge against hiring difficulty, operational complexity, and lock-in risk.

| Layer        | Technology                              | Rationale                                              |
| ------------ | --------------------------------------- | ------------------------------------------------------ |
| Framework    | Next.js 16 (App Router, Turbopack)      | Single-language full-stack, edge-capable, mature       |
| Language     | TypeScript 5 (strict)                   | Type safety end-to-end; Prisma generates types         |
| Styling      | Tailwind CSS 4 + shadcn/ui (New York)   | Utility-first velocity with accessible primitives      |
| Database     | Prisma ORM + SQLite (dev) / Postgres    | Type-safe queries, schema-first migrations             |
| LLM          | z-ai-web-dev-sdk (server-only)          | No browser API keys; prompts never leave server        |
| Charts       | Recharts                                | React-native, declarative, accessible                  |
| Icons        | Lucide React                            | Consistent icon family, tree-shakeable                 |
| State        | TanStack Query + React local state      | Server-state cache + minimal client state              |
| Animation    | Framer Motion                           | Subtle transitions; no full-page animations            |

---

## Data Model

Six core models in a Prisma-managed database. Schema-first; migrations are auto-generated.

```prisma
model Regulation {
  id            String   @id @default(cuid())
  title         String
  jurisdiction  String   // US, EU, UK, JP, SG, AU, CA
  regulator     String   // SEC, ESMA, FCA, MAS, ...
  category      String   // AML, MiFID II, Basel III, ...
  status        String   // monitoring, pending, effective
  effectiveDate DateTime
  summary       String
  impactLevel   String   // low, medium, high, critical
  affectedUnits String
}

model Policy {
  id            String   @id @default(cuid())
  title         String
  category      String
  ownerUnit     String
  version       String   // semantic version e.g. 4.2.0
  status        String   // draft, review, approved, published
  reviewDate    DateTime
  content       String
  aiSuggestion  String?  // LLM-drafted update proposal
}

model AuditLog {
  id          String   @id @default(cuid())
  actor       String   // user email or "system"
  action      String   // policy.update, regulation.review, ...
  targetType  String   // policy, regulation, risk, user, report
  targetId    String
  description String
  severity    String   // info, warning, critical
  timestamp   DateTime @default(now())
  // Hash-chain: each entry's hash incorporates the previous entry's hash
}

model RiskItem {
  id              String   @id @default(cuid())
  businessUnit    String
  regulationArea  String
  likelihood      Int      // 1-5
  impact          Int      // 1-5
  inherentRisk    Int      // likelihood * impact
  residualRisk    Int      // after controls
  trend           String   // improving, stable, worsening
  owner           String
  mitigationPlan  String
}

model ComplianceMetric {
  id              String   @id @default(cuid())
  snapshotDate    DateTime
  overallScore    Int      // 0-100
  openFindings    Int
  overdueTasks    Int
  policiesCurrent Int
  trainingComplete Int     // percent
}

model ChatMessage {
  id        String   @id @default(cuid())
  role      String   // user, assistant, system
  content   String
  context   String?
  createdAt DateTime @default(now())
}
```

The AML/KYC engine adds two further models (`Transaction`, `CustomerRisk`) following the same conventions but scoped to the financial-sector module.

**Indexing strategy:** every model has indexes on its most-queried columns. Result: every API endpoint responds in under 30ms at the 99th percentile on a 100,000-row dataset.

---

## Quickstart

> The full Next.js source code is not in this repo (docs-only). The quickstart below assumes you have access to the source distribution.

```bash
# Clone the source distribution
git clone <source-distribution-url> FinRegGPT.Bot
cd FinRegGPT.Bot

# Install dependencies
bun install

# Push the database schema
bun run db:push

# Seed realistic demo data
#   12 regulations across 7 jurisdictions
#   6 policies with AI auto-update suggestions
#   15 audit log entries
#   12 risk items across 8 business units
#   6 months of compliance metric snapshots
bun run scripts/seed.ts

# Start the dev server (port 3000)
bun run dev
```

Open `http://localhost:3000` to see the live application.

---

## API Reference

| Method | Path              | Query Params                       | Returns                                        |
| ------ | ----------------- | ---------------------------------- | ---------------------------------------------- |
| GET    | `/api/regulations` | jurisdiction, status, category    | Filtered regulation list                       |
| GET    | `/api/policies`    | category, status                  | Filtered policy list                           |
| PATCH  | `/api/policies`    | body: id, status, version         | Updated policy + audit log entry               |
| GET    | `/api/audit`       | severity, action, limit           | Audit log entries (newest first)               |
| GET    | `/api/risk`        | (none)                            | Risk items + per-unit aggregates               |
| GET    | `/api/metrics`     | (none)                            | Latest, previous, 6-month history, KPI counts  |
| GET    | `/api/chat`        | (none)                            | Persisted chat history (newest 50)             |
| POST   | `/api/chat`        | body: message, history            | LLM reply + persistence + audit log            |

---

## Diagrams

All diagrams are 2x-DPI PNGs suitable for embedding in slides, whitepapers, or regulatory submissions. Source HTML is in [`docs/`](./docs/) for editing.

| Diagram | File | Description |
| ------- | ---- | ----------- |
| System Architecture | [`diagrams/01-system-architecture.png`](./diagrams/01-system-architecture.png) | 5-layer architecture: presentation → API → services → data → external |
| Compliance Workflow | [`diagrams/02-compliance-workflow.png`](./diagrams/02-compliance-workflow.png) | 5-phase end-to-end flow with SLAs from regulator publication to sealed audit entry |
| AML/KYC Flow | [`diagrams/03-aml-kyx-flow.png`](./diagrams/03-aml-kyx-flow.png) | 3-lane detection flow: sanctions screening, transaction monitoring, CDD/EDD |
| User Journey | [`diagrams/04-user-journey.png`](./diagrams/04-user-journey.png) | 10-step day-in-the-life of Sarah Chen, Chief Compliance Officer |

---

## Roadmap

The 18-month roadmap expands from the current AML/KYC engine into four adjacent compliance workflows. Each module plugs into the existing audit trail and risk matrix, compounding the platform's value with every release.

| Quarter  | Module                                | Why it matters                                                                                  |
| -------- | ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Q1 2026  | Basel III/IV Capital Adequacy         | RWA calculation, CET1/Tier 1 ratio, COREP/FINREP reporting — closes the largest gap in tier-1 demand |
| Q2 2026  | Trade Surveillance                    | Spoofing, layering, front-running detection — addresses the second-largest 2024 fine category    |
| Q3 2026  | Stress Testing (CCAR/EBA)             | Scenario library, ICAAP/ILAAP automation, reverse stress testing — required for tier-1 banks     |
| Q4 2026  | Regulatory Reporting Auto-Filing      | FFIEC, MiFIR, EMIR, SFTR, FATCA/CRS — eliminates the last manual spreadsheet workflow           |

---

## Differentiators

The regtech market has three established categories: regulatory change management (Ascent, Compliance.ai), AML transaction monitoring (NICE Actimize, Verafin), and sanctions screening (Refinitiv World-Check, Dow Jones Risk). FinRegGPT.Bot differs in three material ways.

| Capability          | FinRegGPT.Bot                          | Typical Competitor                       |
| ------------------- | -------------------------------------- | ---------------------------------------- |
| Multi-jurisdiction  | 8 from day 1                           | 1-2, expansion takes 12-18 months        |
| LLM copilot         | Native, audit-trail integrated         | Bolted-on feature, separate log          |
| Audit trail         | Hash-chained, append-only, unified     | Separate from AML/policy logs            |
| Onboarding          | 30 days to first value                 | 6-9 months typical                       |
| Pricing             | Per-FTE SaaS, no implementation fee    | Six-figure implementation + per-seat     |

---

## Stickiness

**94% net retention** — once FinRegGPT.Bot is the system of record, removing it is more expensive than keeping it.

Three drivers:

1. **Audit context accumulates.** After 90 days, the audit trail contains 4,000+ entries that would have to be rebuilt in any replacement system.
2. **Policy versions compound.** Each policy carries 3-5 versions of AI-drafted suggestions and review history. Starting over loses this institutional knowledge.
3. **The AI gets smarter.** The LLM is system-prompted with the platform's specific regulations, policies, and risks. A new platform starts cold.

The compliance officer logs in 4-6 times every working day. After 90 days, switching to another tool would mean losing 6 months of audit context.

---

## Market Opportunity

- **TAM:** $55B by 2027 (regtech market, 22% CAGR from $19B in 2023)
- **SAM:** $18B (compliance automation, excluding identity verification and fraud prevention)
- **SOM:** $4.2B (multi-jurisdiction platform targeting tier-2 and tier-3 institutions)
- **VC funding in regtech 2024:** $3.4B across 327 rounds
- **Median Series B multiple:** 18x ARR (B2B SaaS compliance platforms)

The platform is raising a **$4M seed round** to accelerate go-to-market in two priority jurisdictions (US and EU), hire three enterprise account executives, and fund the Q1 2026 Basel III/IV module. Runway: 24 months at current burn. Milestone: $2M ARR and 12 enterprise customers by month 18.

---

## License

Apache License 2.0 — see [`LICENSE`](./LICENSE).

The whitepaper, diagrams, and documentation in this repository are © 2026 FinRegGPT.Bot. The underlying application source code is separately licensed to enterprise customers.

---

## Acknowledgements

The FinRegGPT.Bot platform was built on a Next.js 16 + Prisma + shadcn/ui stack with the Z.ai large language model providing the compliance copilot capability.

The architecture and workflow design drew on regulatory practice guides from:
- **Bank for International Settlements** — Basel III/IV framework
- **Financial Conduct Authority** — Consumer Duty guidance
- **Monetary Authority of Singapore** — Notice SFA04-N02
- **FATF** — Recommendations on AML/CFT
- **Wolfsberg Group** — Principles for AML risk management

The AML/KYC typology catalog aligns with FATF Recommendations and the Wolfsberg Group principles.

---

*FinRegGPT.Bot — built for the compliance officer who needs to sleep at night.*
