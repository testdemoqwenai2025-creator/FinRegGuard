# RegGuard AI — Project Report v2.0

> **The operating system for regulatory risk.**  
> A unified, in-depth report covering the why, what, and how of RegGuard AI — the 29-state-machine platform for computational compliance.

**Document version:** 2.0  
**Date:** 2026-08-14  
**Status:** Living document — Wave 1 in progress  
**Audience:** Founders, design partners, prospective customers, prospective investors  
**Companion documents:** `STRATEGY.md` · `FEATURE_EXPANSION.md` · `SKILLS.md` · `README.md`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Market Opportunity](#2-the-market-opportunity)
3. [The Problem We Solve](#3-the-problem-we-solve)
4. [Competitive Landscape](#4-competitive-landscape)
5. [Our Eight Strategic Bets](#5-our-eight-strategic-bets)
6. [The 29 State Machines](#6-the-29-state-machines)
7. [Architecture & Tech Stack](#7-architecture--tech-stack)
8. [Implementation Status](#8-implementation-status)
9. [Three-Wave Execution Plan](#9-three-wave-execution-plan)
10. [Business Model & Unit Economics](#10-business-model--unit-economics)
11. [Risks & Mitigations](#11-risks--mitigations)
12. [North-Star Metrics](#12-north-star-metrics)
13. [Open Strategic Questions](#13-open-strategic-questions)
14. [Conclusion](#14-conclusion)

---

## 1. Executive Summary

RegGuard AI is being built to win the **$55B RegTech market by 2027** by becoming the first platform that treats compliance as an integrated computational problem. The category today is fragmented across 4–8 point solutions per regulated firm — one for AML, one for sanctions, one for GRC, one for comms surveillance, one for stress testing. No platform stitches them together. No platform is built for the agentic, blockchain-anchored, multi-jurisdictional, climate-aware future of compliance that is arriving in 2025–2027.

Our product is **29 state machines across 6 zones**: Core Compliance (7), Surveillance (4), Quant & Computational (4), Intelligence & Automation (4), Collaboration & Trust (5), and Platform & Governance (5). Each state machine is a full UI view with backing API, data model, and acceptance criteria. Together they form the first "operating system for regulatory risk."

We are executing in three waves over 10 weeks. Wave 1 (weeks 1–3) ships 11 views including the 7 Core views refactored plus Multi-Agent Console, Regulatory Watch, Case Management, and Chain Evidence. Wave 2 (weeks 4–6) adds 8 Surveillance and Quant views. Wave 3 (weeks 7–10) completes the platform with the final 10 views including Red Team Engine, Knowledge Graph, Regulator Portal, Privacy/PETs Console, Developer Hub, and Explainable Compliance Cards.

The business model targets $4M ARR by end of year 1, $20M by year 2, and $80M by year 3. Pricing is tiered ($24k / $120k / $480k+) with add-ons for Quant Lab and Regulator Portal. Target unit economics: 78% gross margin, 130% net revenue retention, 8-month CAC payback.

---

## 2. The Market Opportunity

### 2.1 Market sizing

The global RegTech market was valued at approximately **$14.3B in 2024** and is projected to reach **$55B by 2027** (Juniper Research; ComplyAdvantage market sizing; Burke 2024). This represents a compound annual growth rate of approximately 40%, making RegTech one of the fastest-growing verticals in enterprise software.

The broader financial crime compliance market — which includes AML, sanctions, fraud, and market abuse — exceeds **$200B/year in direct spending** across global banks alone (LexisNexis Risk Solutions, True Cost of Financial Crime Compliance Study 2024). Adding insurance, asset management, pharmaceutical, and healthcare compliance pushes the addressable spend above $300B.

### 2.2 Why the market is expanding

Three forces are driving accelerated adoption:

**First, regulatory complexity is compounding.** Regulators publish 200+ updates every business day across the US, EU, UK, and APAC. The Federal Register alone produces ~250 documents daily. ESMA, FCA, MAS, EBA, and BoE PRA add hundreds more. No human team can keep up; automated regulatory change management is becoming mandatory.

**Second, enforcement is intensifying.** HSBC paid $1.9B for AML failures (2012). Goldman Sachs paid $5B for 1MDB (2020). Danske Bank's Estonia AML scandal cost €1.6B+ and triggered the CEO's resignation (2019). The aggregate cost of non-compliance now exceeds the cost of compliance by 2.6× (MetricStream benchmark). Boards are authorizing unprecedented compliance spend.

**Third, technology is catching up.** Agentic AI (CrewAI, AutoGen, LangGraph) crossed production-readiness in 2024. Blockchain anchoring became effectively free (<$0.001 per anchor on permissioned chains). Privacy-enhancing technologies (FATE, OpenFHE, OpenDP, AWS Nitro) all reached production-grade libraries. The technical preconditions for a step-function improvement now exist.

### 2.3 Our addressable market

We define our Serviceable Addressable Market (SAM) as the subset of the $55B RegTech market that can be served by an integrated platform rather than point solutions. We estimate this at **$18B by 2027** — roughly one-third of total RegTech spend.

Our Serviceable Obtainable Market (SOM) — what we can realistically capture in 3 years — is **$80M to $200M ARR**, representing 0.4% to 1.1% of SAM. This is consistent with the trajectory of comparable category leaders at year 3 (ComplyAdvantage ~$100M ARR at year 5; Behavox ~$80M ARR at year 6).

---

## 3. The Problem We Solve

### 3.1 The fragmented stack

A typical global bank operates 4–8 RegTech point solutions simultaneously. Each was purchased at a different time by a different stakeholder, integrates poorly with the others, and produces its own silo of data. The results are predictable:

- **Manual rule-change tracking.** Compliance analysts still print Federal Register PDFs and highlight relevant sections in yellow. New regulations take 60–180 days to operationalize, by which time the bank may have been non-compliant for months.
- **Siloed surveillance.** Transaction monitoring, comms surveillance, and sanctions screening live in separate products from separate vendors. The same customer appears as three different identifiers in three different systems. Entity resolution across products is impossible.
- **Document-based, not computational.** Basel III capital adequacy is computed in Excel models with version control nightmares. Stress tests run quarterly in batch jobs rather than continuously. Risk and compliance operate in separate worlds despite measuring the same underlying exposures.
- **Reactive, not anticipatory.** Firms find out about compliance gaps when a regulator comes knocking. There is no counterfactual capability to ask "what would our compliance posture look like if MiFID III passes?" or "what happens to our capital ratios if Italy defaults?"
- **Trust asymmetry.** Regulators and regulated firms operate in a low-trust, document-dump dynamic. Every examination is a multi-week firefight. Compliance teams spend more time assembling documents than actually managing risk.
- **No defensible decision audit.** When a transaction is approved or declined, the *why* lives in an analyst's head, not in a citable, regulator-grade artifact. This makes examinations adversarial and creates legal exposure.

### 3.2 Why nobody has solved this

The barriers to building an integrated platform are not primarily technical — they are organizational. Each point solution has a different buyer inside the bank (BSA officer for AML, surveillance head for comms, CRO for stress testing, CCO for GRC). No vendor has had the credibility to sell across all of them simultaneously. The result: a fragmented market with no clear category leader.

The technical barriers are real but surmountable. They include: (1) building a unified entity graph that works across transaction, comms, and sanctions data; (2) integrating quantitative risk models with qualitative compliance data; (3) deploying agentic AI safely in a regulated environment; (4) anchoring audit trails to blockchain without revealing sensitive content; (5) deploying privacy-enhancing technologies that work across legal entities.

We have made explicit architectural choices to address each of these barriers. Those choices are documented in `FEATURE_EXPANSION.md` and `SKILLS.md`.

---

## 4. Competitive Landscape

### 4.1 The eight incumbents

We benchmark against eight platforms that collectively define the RegTech category today: **ComplyAdvantage** (sanctions screening), **NICE Actimize** (transaction monitoring), **Palantir Foundry for Financial Services** (entity resolution + data lineage), **IBM OpenPages** (GRC), **MetricStream** (case management), **Ascent RegTech** (regulatory change), **Behavox** (comms surveillance), and **Smarsh** (archiving).

Each is strong in its domain. None ships an integrated platform. Each requires a separate procurement cycle, separate integration effort, separate training program, and produces a separate data silo. The total cost of ownership for a typical global bank using 6+ of these solutions exceeds $20M/year in licensing alone, before counting the integration and headcount costs.

### 4.2 What no incumbent ships

Cross-referencing the eight platforms above, **none** ship:

1. **Multi-agent orchestration** — only LogicGate and Ascent have early versions, neither with the breadth we are building
2. **Blockchain-anchored audit trails** — only Chainyard has explored, not in financial RegTech
3. **Federated learning for cross-bank AML** — only R3 + FATE research prototypes
4. **Counterfactual compliance simulation** — nobody
5. **Adversarial red-team engine attacking your own controls** — nobody
6. **Regulator portal with full examiner query logging** — partial in MetricStream
7. **Climate + ESG compliance integrated with financial risk** — only Manifest Climate, separately
8. **Regulatory time machine for point-in-time queries** — only Palantir Foundry's snapshot feature, not compliance-focused
9. **Explainable compliance cards with cited reasoning** — only early EU AI Act compliance work
10. **Digital asset / Travel Rule compliance** — only Chainalysis + Elliptic, separately

These ten gaps are our differentiation. Each maps to one or more of the 22 new state machines we are adding on top of the original 7.

### 4.3 The category we are creating

We are not playing in "RegTech" as currently defined. We are creating a new category we call **"Computational Compliance Infrastructure"** — combining GRC (MetricStream / IBM OpenPages), Surveillance (NICE / Behavox / ComplyAdvantage), Quant risk (Fermat / Numerix), Agentic AI (CrewAI / AutoGen applied to compliance), and Trust infrastructure (Chainalysis + Hyperledger + PETs).

This is a $55B TAM by 2027, of which we believe $8–12B is addressable by a single platform that does all five.

---

## 5. Our Eight Strategic Bets

We are making eight explicit strategic bets. Each is reversible if disproven by the market, but each shapes the architecture.

**Bet 1: Agentic AI is the new UX.** The compliance analyst of 2027 doesn't open a dashboard — they review agent work. Single-turn LLM chatbots are a transitional form. The durable UX is multi-agent orchestration with human approval gates. We are building four persistent agents: Regulatory Watcher, Policy Drafter, Control Tester, Regulator Liaison.

**Bet 2: Blockchain anchoring is table stakes.** If your audit trail isn't cryptographically anchored, you don't have an audit trail. Every audit log, evidence artifact, and compliance decision is hashed (SHA-256) and anchored to a chain (Hyperledger Besu for permissioned, Ethereum Sepolia for public verification). Cost: <$0.001 per anchor. Benefit: tampering becomes cryptographically detectable, and regulators can run read-only nodes for real-time supervision.

**Bet 3: Privacy-enhancing technologies unlock cross-firm value.** The biggest AML breakthrough of the decade is banks training models together without sharing data. Today each bank sees only its own transaction graph. Money launderers exploit this fragmentation. Federated learning across 5+ banks, with differential privacy preserving individual customer anonymity, can lift AML F1 scores by 5–10 percentage points.

**Bet 4: Quantitative risk and compliance are one problem.** You cannot assess market risk without assessing the regulatory capital impact, and vice versa. The current bifurcation (risk teams use Fermat/Numerix; compliance teams use MetricStream) is artificial. We are unifying them.

**Bet 5: Climate risk is financial risk.** NGFS scenarios are stress scenarios. Taxonomy alignment is capital allocation. Financed emissions is counterparty risk. By 2026, every major jurisdiction requires climate stress testing and TCFD/TNFD/ISSB disclosure. This is no longer a sustainability sidebar — it is core financial regulation.

**Bet 6: The Regulator is a user, not an adversary.** The fastest path to lower examination cost is to give examiners a read-only portal that does the work for them. Today: regulator requests documents → firm assembles document dump → regulator spends 3 months reviewing → findings issued. Tomorrow: regulator logs into the Regulator Portal → sees exactly what they're entitled to → every query they make is logged → findings issued in 3 weeks.

**Bet 7: Developer platform is the moat.** If compliance isn't embedded in the application layer, it doesn't happen. The reason Stripe Compliance, Plaid, and Modern Treasury are winning is they ship APIs that bake compliance into product code. We are building a Developer Hub with REST + GraphQL APIs, webhooks, a Regulation-as-Code SDK, and a sandbox.

**Bet 8: Adversarial testing beats hope.** The only way to know your controls work is to attack them. We are shipping a Red Team Engine that runs continuously — simulating structuring patterns, sanctions list obfuscation, insider trading signals, LLM prompt injection, and off-channel comms smuggling. Every bypass becomes a prioritized remediation ticket. No incumbent does this.

---

## 6. The 29 State Machines

Our 29 state machines are organized into six zones. Full architectural detail is in `FEATURE_EXPANSION.md`; the summary:

### Zone 1: Core Compliance (7 state machines)

The MVP+ baseline that every RegTech has — but refactored for streaming, agentic, and blockchain enhancements. Includes Dashboard, Regulations, Policies, Audit Trail, Risk Matrix, AI Assistant, and Reports. The Dashboard now consumes real-time streaming alerts instead of batch refresh. Audit Trail anchors every entry to blockchain within 60 seconds. AI Assistant is grounded in the Knowledge Graph via vector RAG and ships an Explainable Compliance Card with every response.

### Zone 2: Surveillance (4 state machines)

Real-time AML/CFT, market abuse, and sanctions screening — with entity resolution as a graph problem rather than a row problem. Includes Transaction Surveillance (streaming alerts with <1s latency across SWIFT/SEPA/RTP/crypto), Comms Surveillance (NLP across voice/email/Bloomberg/Teams/mobile for MiFID II Article 16 compliance), Sanctions Screening (OFAC/UN/EU/HMT/MAS with <50ms p99 match latency and fuzzy/phonetic/exact matching), and Network Graph Explorer (force-directed visualization with Louvain clustering and bridge node detection).

### Zone 3: Quant & Computational (4 state machines)

Monte Carlo capital adequacy, stress tests, climate scenarios, and systemic contagion — unified with the compliance posture. Includes Quant Lab (10,000+ scenario paths for CCAR/EBA/BoE/FRTB IMA), Climate & ESG Risk (PCAF financed emissions, EU Taxonomy alignment, NGFS scenarios, TNFD), Counterfactual Simulator ("what if MiFID III passes?" — regress the entire posture against hypothetical futures), and Systemic Risk & Contagion (DebtRank, interbank cascading failure, CCP waterfall stress).

### Zone 4: Intelligence & Automation (4 state machines)

The agentic and graph layer — autonomous monitoring, drafting, testing, and adversarial probing. Includes Multi-Agent Console (4 persistent agents with human approval gates), Regulatory Watch (auto-parsing of Federal Register, ESMA, FCA, MAS, FSB with impact scoring), Red Team Engine (continuous adversarial testing of your own controls), and Knowledge Graph (regulation → policy → control → evidence with 1,536-dim vector embeddings and <100ms RAG retrieval).

### Zone 5: Collaboration & Trust (5 state machines)

The trust layer — examiners, whistleblowers, blockchain, and crypto. Includes Case Management (examination/investigation workflows with SLA tracking and evidence packaging), Regulator Portal (read-only examiner view with full query logging and scope enforcement), Whistleblower Channel (end-to-end encrypted anonymous intake with LLM triage), Chain Evidence (SHA-256 hash anchoring to Hyperledger Besu/Ethereum Sepolia/Polygon with daily verification), and Digital Asset Compliance (FATF Travel Rule, on-chain sanctions screening, mixer detection, CBDC compliance).

### Zone 6: Platform & Governance (5 state machines)

The platform layer — APIs, PETs, point-in-time, cross-jurisdiction, and explainable AI. Includes Privacy/PETs Console (federated learning, homomorphic encryption, differential privacy, secure enclaves with per-dataset toggles), Developer Hub (REST + GraphQL + Webhooks + TS/Python SDK + sandbox), Regulatory Time Machine (hourly snapshots enabling point-in-time queries for examination defense), Rule Harmonizer (cross-jurisdictional diff for derivatives reporting, client classification, beneficial ownership, etc.), and Explainable Compliance Cards (per-decision audit with cited reasoning, mandated by EU AI Act Article 13).

---

## 7. Architecture & Tech Stack

### 7.1 Frontend

The frontend is **Next.js 16** (App Router, Turbopack) with **TypeScript 5**. We use **Tailwind CSS 4** + **shadcn/ui** (New York theme) with 50+ UI primitives. Data visualization is via **Recharts**. Animations use **Framer Motion**. Icons are **Lucide React**. The sidebar is organized by zone (6 collapsible sections, 29 navigation items), with a horizontal pill bar on mobile.

### 7.2 Backend

The backend is **Next.js API Routes** (App Router). The ORM is **Prisma** with **SQLite** in the prototype, with a planned production migration to **PostgreSQL + pgvector + Neo4j**. The Prisma schema has **22 models** spanning the 6 zones: Regulation, Policy, AuditLog, RiskItem, ComplianceMetric, ChatMessage, SurveillanceAlert, SanctionsHit, CommsEvent, QuantScenario, ClimateMetric, AgentRun, RegulatoryChange, RedTeamTest, ComplianceCase, WhistleblowerReport, ChainAnchor, DigitalAssetEvent, PetConfig, ApiKey, RuleComparison, ComplianceCard.

### 7.3 AI / Agentic

The AI stack is built on **z-ai-web-dev-sdk** for the LLM (used in AI Assistant, agent reasoning, triage, and redlines). Multi-agent orchestration runs four persistent agents (regulatory watcher, policy drafter, control tester, regulator liaison) with a human approval gate for every output. Vector RAG retrieval operates over the regulatory Knowledge Graph using 1,536-dim embeddings. A prompt injection guard layer protects the AI Assistant from adversarial inputs.

### 7.4 Blockchain / Trust

The trust layer uses **Hyperledger Besu** for permissioned anchoring (production default), with **Ethereum Sepolia** and **Polygon** as alternatives for public verification. We use a Chainpoint-style hash anchoring protocol: every audit log entry is SHA-256 hashed and anchored within 60 seconds. A daily verification job re-anchors the entire daily set — any tampering is detected within 24 hours.

### 7.5 Privacy-Enhancing Technologies (PETs)

We support four PET techniques, all configurable per dataset: **Federated learning** via FATE/OpenFL (for cross-bank AML model training without data sharing), **Homomorphic encryption** via OpenFHE/Microsoft SEAL (for computing on encrypted cross-border regulatory data), **Differential privacy** via Google DP/OpenDP (for sharing aggregate exposure to regulators without revealing PII), and **Secure enclaves** via AWS Nitro/Intel SGX (for sanctions list matching with attestation).

### 7.6 Developer Platform

The Developer Hub exposes **REST + GraphQL APIs** for every state machine. **Webhooks** deliver real-time alerts with HMAC signing and exponential backoff retry. **TypeScript + Python SDKs** enable Regulation-as-Code (`isCompliantMiFIDII(order)` returns true/false with explanation). A **sandbox** environment with sample data lets engineers test integrations before promoting to production.

---

## 8. Implementation Status

As of this report (2026-08-14), Wave 1 is in progress and the foundation is complete:

### 8.1 What is working today

- **29 state machines wired with routing and navigation.** The sidebar is organized by 6 zones; clicking any item navigates to its view. The Core 7 views (Dashboard, Regulations, Policies, Audit, Risk, Assistant, Reports) are full-featured from v1.0. The 22 new views share a reusable `ViewShell` component that fetches from a dedicated API endpoint and renders metrics, charts, highlights, and a live records table.
- **22 new API endpoints live and returning HTTP 200.** Each endpoint at `/api/views/[viewKey]` returns a unified payload with metrics, charts, highlights, and a live records table populated from real Prisma models with realistic seed data.
- **22 Prisma models deployed to SQLite.** The database has been reset and re-seeded with both `scripts/seed.ts` (Core Compliance: 12 regulations, 6 policies, 15 audit logs, 12 risks, 6 metrics, 5 chats) and `scripts/seed-v2.ts` (22 new models: surveillance alerts, sanctions hits, comms events, quant scenarios, climate metrics, agent runs, regulatory changes, red team tests, cases, whistleblower reports, chain anchors, digital asset events, PET configs, API keys, rule comparisons, compliance cards).
- **Production build passes.** `bun run build` compiles cleanly with all 29 routes registered.
- **6 workflow diagrams generated as PNG.** Located in `docs/diagrams/`: system architecture, agent orchestration, chain evidence, surveillance flow, three-wave roadmap, knowledge graph.
- **4 documentation files complete.** README.md, STRATEGY.md, FEATURE_EXPANSION.md, SKILLS.md — totaling approximately 1,800 lines of strategic, engineering, and capability documentation.

### 8.2 What is in progress

- **Persistent agent scheduling.** The Multi-Agent Console view is live and shows agent runs from seed data, but the actual scheduled execution (daily scrape, daily policy draft generation, etc.) is not yet wired to a real scheduler. Next step: integrate a cron-based agent runner that creates real `AgentRun` records.
- **Blockchain anchoring.** The Chain Evidence view is live with seed data, but the actual SHA-256 hashing and Hyperledger Besu anchoring on every `AuditLog` write is not yet implemented. Next step: integrate a `chain.anchor.write` skill that fires on every audit log creation.
- **Real-time surveillance streaming.** The Transaction Surveillance view shows alerts from seed data, but the actual Kafka/Redpanda → Flink → online inference pipeline is not yet wired. Next step: build a mock streaming source for prototype demos, then integrate real Kafka in production.

### 8.3 What is pending (Waves 2 and 3)

Wave 2 (weeks 4–6): full implementation of the 4 Surveillance views (real streaming, real sanctions list loading, real network graph rendering) and 4 Quant views (real Monte Carlo, real PCAF calculations, real NGFS scenario application, real DebtRank computation).

Wave 3 (weeks 7–10): the final 10 views including Red Team Engine (continuous adversarial testing), Knowledge Graph (real Neo4j + pgvector), Regulator Portal (real scoped auth), Whistleblower Channel (real E2E encryption), Digital Assets (real on-chain analytics), Privacy/PETs Console (real federated learning pilot), Developer Hub (public REST + GraphQL + SDK), Time Machine (hourly snapshots), Rule Harmonizer (real jurisdiction comparison engine), and Explainable Compliance Cards (auto-generation on every decision).

---

## 9. Three-Wave Execution Plan

### Wave 1: MVP+ with agentic and blockchain foundation (weeks 1–3)

**Goal:** Ship 11 views — the 7 Core views refactored plus Multi-Agent Console, Regulatory Watch, Case Management, and Chain Evidence.

**Why these 4 new views:** Multi-Agent Console + Regulatory Watch deliver the agentic AI story (Bet 1). Chain Evidence delivers blockchain anchoring (Bet 2). Case Management delivers examination workflow — the highest-value pain point for CCOs.

**Acceptance criteria:**
- 11 views live and integrated ✓ (UI shell complete; data flowing)
- 4 persistent agents running daily, with human approval workflow (in progress — scheduler pending)
- Every AuditLog row anchored to Hyperledger Besu within 60 seconds (in progress — integration pending)
- Examination case workflow with SLA tracking and evidence packaging ✓

### Wave 2: Surveillance and Quant zones (weeks 4–6)

**Goal:** Ship the 4 surveillance views + 4 quant views.

**Why:** These are the highest-revenue-per-customer features. AML transaction monitoring alone is a $3B sub-market. Quant Lab is what differentiates us from pure GRC players.

**Acceptance criteria:**
- Transaction surveillance processing streaming alerts with <1s latency
- Sanctions screening matching against OFAC/UN/EU/HMT in <50ms
- Quant Lab running Monte Carlo with 10,000+ scenario paths
- Climate & ESG view producing PCAF-aligned financed emissions

### Wave 3: Platform and frontier (weeks 7–10)

**Goal:** Ship the remaining 10 views.

**Why last:** These are the differentiation layer that defines the category, but they depend on the foundation being solid. Red Team needs working controls to attack. Knowledge Graph needs the regulation/policy/control data model. Regulator Portal needs Case Management and Audit Trail.

**Acceptance criteria:**
- Red Team Engine running 24/7 with weekly CCO reports
- Knowledge Graph with 10k+ nodes and vector RAG retrieval
- Regulator Portal with scoped read-only access and query logging
- PETs Console with at least one federated learning deployment
- Developer Hub with public REST + GraphQL + SDK + sandbox

---

## 10. Business Model & Unit Economics

### 10.1 Pricing tiers

| Tier | Price/yr | Target | Includes |
|---|---|---|---|
| **Compliance Starter** | $24k | Community banks, credit unions, fintechs <$1B AUM | 7 Core views, 1 jurisdiction, 5 users |
| **Compliance Pro** | $120k | Regional banks, insurers, mid-market | All 29 views, 3 jurisdictions, 25 users, 1M API calls/mo |
| **Compliance Enterprise** | $480k+ | GSIBs, G-Sibs, large insurers | All 29 views, all 8 jurisdictions, unlimited users, dedicated infra, on-prem option, regulator portal |
| **Add-on: Quant Lab** | $60k | Banks needing FRTB/CCAR | Quant + Climate + Counterfactual + Systemic |
| **Add-on: Regulator Portal** | $40k | Examinations-heavy firms | Regulator Portal + Case Management premium |

### 10.2 Unit economics (target by year 2)

- **CAC:** $48k (direct enterprise sales, 6-month cycle)
- **ACV:** $180k blended
- **NRR:** 130% (expansion via add-ons and API usage)
- **Gross margin:** 78% (cloud + LLM costs)
- **Payback:** 8 months
- **LTV:** $720k (4-year average customer life at 130% NRR)

### 10.3 Land-and-expand motion

The motion is designed for low-friction land and high-LTV expansion. **Land** on Core Compliance Starter at $24k — easy budget approval, replaces an existing point solution. **Expand** to Compliance Pro at $120k within 12 months by adding Multi-Agent Console + Surveillance. **Expand** to Enterprise at $480k by adding Regulator Portal, Quant Lab, and dedicated infrastructure. **Lock-in** via Developer Hub — once engineering teams build against the API, switching cost becomes prohibitive.

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **LLM hallucination in policy drafts** | High | Severe | Mandatory human approval gate; citation checker that rejects drafts without verifiable sources; red team agent that attacks policy drafts |
| **Blockchain anchoring rejected by regulator** | Medium | High | Lead with read-only regulator node pilot; offer traditional hash-only audit as fallback; published verification protocol |
| **Federated learning blocked by legal** | Medium | Medium | Start with intra-firm federated; develop legal framework with outside counsel; lobby via IIF |
| **Agentic AI regulation (EU AI Act high-risk)** | High | High | Embrace Article 13 transparency from day 1 via Explainable Compliance Cards; pursue conformity assessment early |
| **Incumbent acquires point solution to bundle** | Medium | Medium | Speed — we ship the bundle before incumbents can integrate acquisitions; lock in design partners with multi-year contracts |
| **Climate/ESG regulation softens under political pressure (US)** | Medium | Low-Medium | Climate is global mandate (EU SFDR, CSRD, NGFS); US is one market of 8; we lead with EU + UK |
| **Cloud cost overruns from streaming + LLM** | Medium | Medium | Tiered storage (hot 30d, warm 90d, cold 1y); LLM caching; smaller fine-tuned models for routine tasks |
| **Talent scarcity (compliance + AI engineers)** | High | Medium | Hire former compliance officers as domain experts; train AI engineers on compliance via internal academy; remote-first to widen pool |

---

## 12. North-Star Metrics

### 12.1 Customer outcomes
- **Customer compliance cost reduction:** Target 35% reduction in compliance OpEx within 18 months of deployment
- **Examination cycle time:** Target 60% reduction (12 weeks → 5 weeks) for customers using Regulator Portal
- **AML alert false-positive rate:** Target <30% (industry average: 95%+)
- **Time-to-apply new regulation:** Target 14 days (industry average: 60–180 days)

### 12.2 Product
- **29/29 state machines shipped:** By end of Wave 3
- **API uptime:** 99.95% SLA
- **API p99 latency:** <200ms for read endpoints
- **Agent run success rate:** >98%

### 12.3 Business
- **ARR:** $4M by end of year 1; $20M by end of year 2; $80M by end of year 3
- **Logo count:** 25 paying customers by year 1; 100 by year 2; 300 by year 3
- **NRR:** 130% by year 2
- **Net Promoter Score:** >50 by year 2

---

## 13. Open Strategic Questions

These are the questions we don't yet have answers to. We will resolve each within the next 2 quarters via customer discovery or market testing:

1. **Will regulators actually use the Regulator Portal?** It depends on individual examiner willingness and bank regulatory affairs team readiness. Pilot with one cooperative regulator (likely FCA or MAS) in 2026.
2. **What is the right pricing for the Developer Hub?** Per-call, per-seat, or revenue-share? We will test per-call at $0.001/call for surveillance alerts and $0.0001/call for read endpoints.
3. **How far to push agentic autonomy?** Today: human approval for every action. By end of Wave 3: maybe auto-apply for low-risk regulatory changes? Customer appetite will dictate.
4. **Build vs buy for sanctions list data?** ComplyAdvantage and Refinitiv both sell lists. We will resell ComplyAdvantage lists in Wave 2, build our own in Wave 3 if volume justifies.
5. **On-prem vs cloud-only?** GSIBs will require on-prem. We will offer a Kubernetes-deployable enterprise edition in Wave 3.
6. **Geographic expansion sequence?** UK + EU first (largest TAM, most regulation), then US, then APAC (SG + JP + AU). Question: do we enter India (RBI) and Brazil (BACEN) in year 3?

---

## 14. Conclusion

The RegTech category is fragmented, document-centric, and built for the regulatory world of 2015. The next decade demands a computational, agentic, blockchain-anchored, climate-aware, developer-platform approach. **RegGuard AI is our bet on that future.**

The 29 state machines documented in `FEATURE_EXPANSION.md` are how we execute the bet. The three-wave plan in Section 9 is how we sequence it. The eight strategic bets in Section 5 are the architecture-shaping decisions. The business model in Section 10 is how we monetize it.

We do not expect to win by being 10% better at any one thing. We expect to win by being **the first platform that treats compliance as an integrated computational problem** — and by making that integration feel inevitable in retrospect, the way Stripe made payments integration feel inevitable.

Wave 1 is in progress. The foundation is solid. The next 8 weeks will determine whether we ship the full vision on schedule. We are optimistic.

---

## Appendix A: Document Map

| Document | Purpose | Audience |
|---|---|---|
| **PROJECT_REPORT.md** (this file) | Unified in-depth report — the why, what, and how | Everyone (start here) |
| **STRATEGY.md** | Deep strategic blueprint — 8 bets, competitive landscape, business model | Founders, CCO/CTO customers, investors |
| **FEATURE_EXPANSION.md** | Engineering spec for all 29 state machines with acceptance criteria | Product, engineering, design partners |
| **SKILLS.md** | Catalog of every capability/skill with inputs, outputs, dependencies | Compliance teams, API integrators, AI/agent devs |
| **README.md** | Quick start, project structure, tech stack, coverage | Everyone |
| **FinRegGPT.Bot-Whitepaper.pdf** | Long-form whitepaper (v1.0; v2.0 supplement pending) | Prospects, investors |
| **docs/diagrams/** | PNG workflow diagrams (6 v2.0 diagrams) | Everyone |

## Appendix B: Coverage

**Jurisdictions (8):** US (SEC, FINRA, HHS, CFTC, FinCEN, OCC, Fed, FDIC) · EU (ESMA, EBA, ECB, EDPB, EMA) · UK (FCA, PRA, BoE, ICO) · Singapore (MAS) · Japan (PMDA, FSA) · Australia (APRA, AUSTRAC) · Canada (OSFI) · Hong Kong (SFC, HKMA)

**Regulatory frameworks (12+):** AML / CFT (FATF, BSA, AMLD6) · MiFID II / III · Consumer Duty · Basel III / 3.1 · GDPR · HIPAA · EU AI Act · DORA · SFDR · CSRD · EU Taxonomy · GMP (pharma) · CPS 234 (cyber)

**Business units (8):** Retail Banking · Wealth Management · Capital Markets · Insurance · Pharmaceutical R&D · Hospital Operations · Technology · Operations

---

*This is the master project report. For the strategic reasoning, see `STRATEGY.md`. For the per-view engineering spec, see `FEATURE_EXPANSION.md`. For the AI capabilities that power the agentic views, see `SKILLS.md`. For setup and usage, see `README.md`.*
