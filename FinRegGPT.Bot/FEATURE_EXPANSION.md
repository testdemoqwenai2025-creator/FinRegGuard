# RegGuard AI — Feature Expansion Roadmap (29 State Machines)

> **Document version:** 2.1  
> **Status:** Engineering specification — each state machine has acceptance criteria. **29/29 views shipped as of v2.1.**  
> **Audience:** Product, engineering, design partners  
> **Last updated:** 2026-08-14 (v2.1 — all 29 views live; Sanctions + Reg Watch wired to real free-tier feeds; Network Graph upgraded to force-directed canvas)

---

## 0. How to Read This Document

This is the engineering and product spec for the 29 state machines that constitute RegGuard AI v2.1. Each state machine is described in a fixed structure:

- **Purpose** — what user pain it solves
- **Primary user** — who interacts with it day-to-day
- **Key capabilities** — the functional surface
- **Data model** — Prisma models backing it
- **API endpoint** — the route that powers it
- **Acceptance criteria** — what "done" looks like in Wave 1/2/3
- **Dependencies** — what it needs from other state machines

State machines are grouped by zone. The 7 Core views are refactor targets (already exist in v1.0, being upgraded). The 22 new views are greenfield builds.

> **v2.1 status badge legend (used throughout this document):**
> - 🟢 **shipped** — view is live in the GitHub Pages preview with synthetic data
> - 🟢🔵 **shipped + live feed** — view is live AND wired to a real free-tier data source
> - 🟡 **partial** — view exists but needs further iteration
> - 🔴 **planned** — not yet built

> **v2.1 milestone summary (2026-08-14):** All 29 state machines are now 🟢 shipped. Two views are 🟢🔵 shipped + live feed: **Sanctions Screening** (real OFAC SDN entities via OpenSanctions index + curated public-record fallback) and **Regulatory Watch** (real US regulatory updates via Federal Register API). One view received a major interaction upgrade in v2.1: **Network Graph Explorer** moved from static SVG constellation to a live canvas-based force-directed simulation with drag-to-perturb, hover-to-highlight, zoom/pan, and play/pause controls. Every view across all 6 zones follows the **machine-proposes / human-confirms (Boolean)** interaction pattern — every decision surface presents a pre-computed recommendation with confidence score and reasoning; the human reviewer only clicks Approve or Reject.

---

## ZONE 1: CORE COMPLIANCE

### 1.1 Dashboard

- **Purpose:** Single-pane-of-glass view of compliance posture across all jurisdictions, business units, and risk categories.
- **Primary user:** CCO, CRO, CEO, board risk committee
- **Key capabilities (v2 upgrade):**
  - Real-time streaming alerts (sub-1s) instead of batch refresh
  - Zone-aware summary cards (one per zone, with roll-up score)
  - Drill-down from any metric to the underlying state machine
  - Personalizable by role (CCO sees different cards than CRO)
- **Data model:** `ComplianceMetric`, `RiskItem`, `SurveillanceAlert`, `ComplianceCase`, `AgentRun`
- **API:** `/api/metrics` (existing) + `/api/views/dashboard` (new, rolling up all zones)
- **Wave 1 acceptance criteria:**
  - Loads in <500ms with 6 month rolling data
  - 4 KPI cards: Overall score, Open findings, Overdue tasks, Policies current
  - Real-time alert ticker (last 25 alerts across all zones)
- **Wave 2 acceptance criteria:**
  - Zone roll-up cards (Core, Surveillance, Quant, Intelligence, Collaboration, Platform)
  - Drill-down navigation to specific zone view
- **Dependencies:** Every other state machine contributes data

### 1.2 Regulations

- **Purpose:** Multi-jurisdiction regulation tracker with versioning and impact analysis.
- **Primary user:** Compliance analyst, regulatory affairs
- **Key capabilities (v2 upgrade):**
  - Add: Regulation-as-Code view (each regulation has executable form)
  - Add: Cross-jurisdiction comparison via Rule Harmonizer
  - Add: Point-in-time version history (via Time Machine)
- **Data model:** `Regulation`, `RuleComparison`
- **API:** `/api/regulations` (existing)
- **Wave 1 acceptance criteria:**
  - Filterable by jurisdiction, regulator, category, status, impact
  - Detail view with full summary, affected units, related policies
- **Dependencies:** Rule Harmonizer (for comparison), Time Machine (for history)

### 1.3 Policies

- **Purpose:** Versioned policy library with AI-generated redlines for new regulations.
- **Primary user:** Policy owner, compliance analyst
- **Key capabilities (v2 upgrade):**
  - Add: Side-by-side redline view for proposed changes
  - Add: Approval workflow (draft → review → approved → published)
  - Add: AI suggestions cite specific regulation clauses
- **Data model:** `Policy`, `AgentRun` (policy_drafter agent outputs)
- **API:** `/api/policies` (existing)
- **Wave 1 acceptance criteria:**
  - List with version, status, owner, next review date
  - Detail view with AI suggestion panel
  - Approve / decline / request-changes buttons (UI only in Wave 1)
- **Dependencies:** Multi-Agent Console (policy_drafter agent)

### 1.4 Audit Trail

- **Purpose:** Immutable activity log for every compliance-relevant action.
- **Primary user:** Internal audit, external examiners, CCO
- **Key capabilities (v2 upgrade):**
  - Add: Every entry hashed and anchored to blockchain within 60s (via Chain Evidence)
  - Add: Point-in-time query support (via Time Machine)
- **Data model:** `AuditLog`, `ChainAnchor`
- **API:** `/api/audit` (existing)
- **Wave 1 acceptance criteria:**
  - Filterable by actor, action, target, severity, date range
  - Each row shows chain anchor status (anchored / pending / verified)
- **Dependencies:** Chain Evidence

### 1.5 Risk Matrix

- **Purpose:** 5×5 inherent + residual risk heatmap by business unit × regulation area.
- **Primary user:** CRO, business unit risk managers
- **Key capabilities (v2 upgrade):**
  - Add: Quantitative capital impact overlay (from Quant Lab)
  - Add: Climate risk overlay (from Climate & ESG)
  - Add: Counterfactual scenario toggle (from Counterfactual Simulator)
- **Data model:** `RiskItem`, `QuantScenario`, `ClimateMetric`
- **API:** `/api/risk` (existing)
- **Wave 1 acceptance criteria:**
  - 5×5 heatmap with cell counts
  - Drill-down to underlying risk items
  - Owner and mitigation plan columns
- **Dependencies:** Quant Lab, Climate & ESG, Counterfactual Simulator (for overlays)

### 1.6 AI Assistant

- **Purpose:** Conversational compliance copilot for ad-hoc queries.
- **Primary user:** Any compliance user
- **Key capabilities (v2 upgrade):**
  - Add: Vector RAG over Knowledge Graph (regulation → policy → control → evidence)
  - Add: Tool-use (agent can call APIs on user's behalf with confirmation)
  - Add: Every response includes Explainable Compliance Card
- **Data model:** `ChatMessage`
- **API:** `/api/chat` (existing)
- **Wave 1 acceptance criteria:**
  - Streaming responses
  - Persistent chat history
  - Context tags (e.g., `regulation:EU-MiFID`)
- **Dependencies:** Knowledge Graph, Explainable Compliance Cards

### 1.7 Reports

- **Purpose:** Regulator-grade report templates with auto-populated data.
- **Primary user:** Regulatory reporting team, CCO
- **Key capabilities (v2 upgrade):**
  - Add: 20+ templates (FFIEC Call Report, RMAR, COREP, FINREP, AnaCredit, SFDR PAI, etc.)
  - Add: Auto-population via Regulator Liaison Agent
  - Add: Sign-off workflow with evidence chain
- **Data model:** `ComplianceMetric`, `ComplianceCard`, `ChainAnchor`
- **API:** `/api/views/reports` (new)
- **Wave 1 acceptance criteria:**
  - 5 templates live: FFIEC Call Report, FCA RMAR, ESMA MiFID II RTS 22, FinCEN SAR, ECB COREP
  - Each template shows field-level completion status
  - Export to PDF/XBRL/CSV
- **Dependencies:** Case Management (for submission tracking), Chain Evidence (for sign-off)

---

## ZONE 2: SURVEILLANCE

### 2.1 Transaction Surveillance

- **Purpose:** Real-time AML/CFT monitoring of all transaction channels (SWIFT, SEPA, RTP, wire, crypto).
- **Primary user:** AML investigator, BSA officer
- **Key capabilities:**
  - Streaming alert ingestion (Kafka/Redpanda → Flink → Online inference in production; mock stream in prototype)
  - Typology library: structuring, layering, integration, smurfing, rapid movement, round-tripping
  - Risk scoring 0–100 with explainable features
  - Case creation → Case Management
- **Data model:** `SurveillanceAlert`
- **API:** `/api/views/transaction-surveillance`
- **Wave 2 acceptance criteria:**
  - Live alert stream with <1s end-to-end latency
  - Filter by severity, status, channel, jurisdiction
  - Detail view with full narrative and counterparty network preview
  - "Escalate to case" action creates a `ComplianceCase`
- **Dependencies:** Network Graph (for counterparty context), Case Management, Red Team (for control validation)

### 2.2 Communications Surveillance

- **Purpose:** NLP surveillance of voice, email, Bloomberg chat, Teams, mobile for market abuse, collusion, insider trading, off-channel activity.
- **Primary user:** Surveillance analyst, market abuse team
- **Key capabilities:**
  - Channel coverage: voice (call transcripts), email, Bloomberg chat, Teams, mobile SMS
  - Signal types: insider trading, market abuse, collusion, off-channel, swearing/professionalism
  - Per-desk view (Equities, FX, Rates, Credit, Macro)
  - MiFID II Article 16 compliance (all comms recorded + surveilled)
- **Data model:** `CommsEvent`
- **API:** `/api/views/comms-surveillance`
- **Wave 2 acceptance criteria:**
  - 5 channels monitored (mock data in prototype)
  - Signal classification with risk score
  - Transcript snippet view
  - "Escalate to case" for insider trading signals
- **Dependencies:** Case Management, Red Team (for coded-language detection testing)

### 2.3 Sanctions Screening

- **Purpose:** Real-time OFAC, UN, EU, HMT, MAS sanctions list screening with fuzzy / phonetic / exact / partial match scoring.
- **Primary user:** Sanctions officer, operations team
- **Key capabilities:**
  - Multi-list: OFAC SDN, UN Consolidated, EU Consolidated, UK HMT, MAS, OFSI
  - Match types: exact, fuzzy (Levenshtein), phonetic (Double Metaphone), partial
  - Confidence score 0–100
  - Auto-block on true positive; auto-clear on false positive (with documented rationale)
- **Data model:** `SanctionsHit`
- **API:** `/api/views/sanctions-screening`
- **Wave 2 acceptance criteria:**
  - All 6 lists loaded
  - Match latency <50ms p99
  - Reviewer workflow (pending → true_positive / false_positive / escalated)
  - SAR auto-filing integration (UI only in prototype)
- **Dependencies:** Network Graph (for entity context), Red Team (for obfuscation testing)

### 2.4 Network Graph Explorer

- **Purpose:** Force-directed entity resolution graph — turn money laundering from a row problem into a graph problem.
- **Primary user:** AML investigator, intelligence analyst
- **Key capabilities:**
  - Entity types: person, organization, account, wallet, address, phone, email
  - Edge types: owns, transacts_with, shares_phone, shares_address, beneficial_owner_of
  - Cluster detection (Louvain / Leiden algorithms)
  - Bridge node identification
  - Path finding between any two entities
- **Data model:** `SurveillanceAlert` (entity data extracted), Neo4j or GraphDB in production
- **API:** `/api/views/network-graph`
- **Wave 2 acceptance criteria:**
  - Interactive force-directed visualization
  - Click entity → detail panel with all connections
  - Cluster highlighting
  - Path-finding query
- **Dependencies:** Transaction Surveillance, Sanctions Screening, Digital Assets

---

## ZONE 3: QUANT & COMPUTATIONAL

### 3.1 Quant Lab

- **Purpose:** Monte Carlo capital adequacy, FRTB IMA, CCAR/EBA/BoE stress testing with 10,000+ scenario paths.
- **Primary user:** Quantitative risk analyst, market risk team
- **Key capabilities:**
  - Scenario library: CCAR (Fed), EBA stress test, BoE ACS, FRTB IMA, NGFS, custom
  - 10,000+ Monte Carlo paths per scenario
  - P99 loss, expected loss, capital impact (bps CET1)
  - Compare scenarios side-by-side
  - Custom scenario builder
- **Data model:** `QuantScenario`
- **API:** `/api/views/quant-lab`
- **Wave 2 acceptance criteria:**
  - 5+ pre-built scenarios
  - Run status (draft → running → complete → archived)
  - P99 / expected loss / capital impact metrics
  - Export to PDF risk report
- **Dependencies:** Climate & ESG (NGFS scenarios), Counterfactual (custom scenarios)

### 3.2 Climate & ESG Risk

- **Purpose:** PCAF financed emissions, EU Taxonomy alignment, NGFS scenarios, TNFD nature-related financial risk.
- **Primary user:** ESG risk team, sustainability officer
- **Key capabilities:**
  - Scope 1, 2, 3 emissions tracking
  - PCAF financed emissions methodology
  - EU Taxonomy alignment (substantial contribution + DNSH + minimum safeguards)
  - Physical risk score (flood, wildfire, sea-level rise on collateral)
  - Transition risk score (carbon price scenarios)
  - NGFS scenario integration
  - TNFD nature-related risk (Wave 3)
- **Data model:** `ClimateMetric`
- **API:** `/api/views/climate-esg`
- **Wave 2 acceptance criteria:**
  - Scope 1/2/3 + financed emissions
  - Taxonomy alignment %
  - Physical + transition risk scores
  - NGFS scenario integration
- **Dependencies:** Quant Lab (for stress scenarios), Reports (for SFDR/CSRD reporting)

### 3.3 Counterfactual Simulator

- **Purpose:** What-if engine — regress the entire compliance + risk posture against hypothetical futures.
- **Primary user:** CRO, CCO, strategy team
- **Key capabilities:**
  - Pre-built counterfactuals: "Fed raises rates 200bps", "MiFID III passes", "Sovereign default (Italy)", "Stablecoin ban", "CBDC 30% adoption", "Climate shock NGFS"
  - Custom counterfactual builder
  - CET1 impact projection (bps over 12 months)
  - Compliance posture delta
  - Confidence scoring (validated vs exploratory)
- **Data model:** `QuantScenario` (custom type)
- **API:** `/api/views/counterfactual`
- **Wave 2 acceptance criteria:**
  - 6+ pre-built counterfactuals
  - CET1 trajectory chart
  - Material impact count
  - Save counterfactual results for comparison
- **Dependencies:** Quant Lab, Risk Matrix (for posture delta)

### 3.4 Systemic Risk & Contagion

- **Purpose:** DebtRank and interbank exposure graphs — model cascading failures and central-clearing chokepoints.
- **Primary user:** Systemic risk team, financial stability unit
- **Key capabilities:**
  - Interbank exposure graph
  - DebtRank calculation per node
  - Cascading failure simulation (default one bank, see impact)
  - CCP concentration analysis (waterfall stress)
  - Systemically important bank identification
- **Data model:** `QuantScenario` (systemic type), Neo4j in production
- **API:** `/api/views/systemic-risk`
- **Wave 2 acceptance criteria:**
  - Top-8 banks by DebtRank
  - CCP exposure breakdown
  - Cascading failure simulation (interactive)
- **Dependencies:** Network Graph (for graph infrastructure), Quant Lab

---

## ZONE 4: INTELLIGENCE & AUTOMATION

### 4.1 Multi-Agent Console

- **Purpose:** Orchestration of regulatory watcher, policy drafter, control tester, and regulator liaison agents with human-in-the-loop approval.
- **Primary user:** CCO, compliance operations lead
- **Key capabilities:**
  - 4 persistent agents:
    1. **Regulatory Watcher** — daily scrape, classify, triage new rules
    2. **Policy Drafter** — generate redlines against new rules with citations
    3. **Control Tester** — simulate control failures against policy
    4. **Regulator Liaison** — pre-populate examination responses
  - Run status: queued → running → awaiting_approval → complete / failed
  - Tools used per run (RAG, redliner, citation checker, simulator, etc.)
  - Approval gate: human approves agent outputs before they apply
  - Audit trail: every run logged in `AuditLog` and anchored
- **Data model:** `AgentRun`, `AuditLog`
- **API:** `/api/views/agent-console`
- **Wave 1 acceptance criteria:**
  - 4 agents running daily on schedule
  - Run history table with status, inputs, outputs, tools used
  - Approve / decline buttons for awaiting_approval runs
  - Approval action itself logged and anchored
- **Dependencies:** Regulatory Watch (provides inputs), Policies (drafter outputs), Audit Trail (anchoring), Reports (liaison outputs)

### 4.2 Regulatory Watch

- **Purpose:** Automated parsing of Federal Register, ESMA, FCA, MAS, FSB publications — classified, scored, and triaged by AI.
- **Primary user:** Regulatory affairs team
- **Key capabilities:**
  - Sources: Federal Register, ESMA, FCA Handbook, MAS Notices, FSB publications, EBA, BoE PRA, ESMA
  - Auto-classification by topic (AML, MiFID, Basel, etc.)
  - Impact score 0–100
  - Affected policies auto-identified
  - Triage workflow: new → triaged → drafting → applied / dismissed
- **Data model:** `RegulatoryChange`
- **API:** `/api/views/regulatory-watch`
- **Wave 1 acceptance criteria:**
  - 12 sources monitored (RSS + API)
  - Auto-classification with confidence score
  - Affected policies list per change
  - Triage workflow with status transitions
- **Dependencies:** Multi-Agent Console (regulatory_watcher agent), Policies (affected), Rule Harmonizer (cross-jurisdiction context)

### 4.3 Red Team Engine

- **Purpose:** Adversarial agent that continuously attacks your own controls — simulating structuring, sanctions evasion, prompt injection, insider trading.
- **Primary user:** CCO, head of model risk management
- **Key capabilities:**
  - Attack vectors:
    - Structuring patterns (sub-threshold transactions)
    - Sanctions list obfuscation (transliteration, substring, phonetic)
    - Market abuse (coded language in comms)
    - Prompt injection (against AI Assistant)
    - Off-channel comms smuggling
    - Crypto mixer exposure
  - Result: blocked / detected / bypassed
  - Remediation tracking per bypass
  - Weekly CCO report
- **Data model:** `RedTeamTest`
- **API:** `/api/views/red-team`
- **Wave 3 acceptance criteria:**
  - 6+ attack vectors running continuously
  - Bypass → remediation ticket workflow
  - Weekly summary report
  - Trend over time (bypass rate should decrease)
- **Dependencies:** Transaction Surveillance, Comms Surveillance, Sanctions Screening, AI Assistant (all are attack targets)

### 4.4 Knowledge Graph

- **Purpose:** Regulation → policy → control → evidence as a navigable semantic graph with vector RAG retrieval.
- **Primary user:** AI Assistant (primary consumer), compliance analyst (for exploration)
- **Key capabilities:**
  - Node types: Regulation, Policy, Control, Evidence, Risk
  - Edge types: regulates, implements, evidences, mitigates
  - Vector embeddings (1,536-dim) on every node
  - Vector RAG retrieval (cosine similarity)
  - Impact query: "If regulation X changes, what's affected?"
  - Graph traversal: "Show me all controls mitigating risk Y"
- **Data model:** Neo4j + Pinecone/Weaviate in production; simulated in prototype
- **API:** `/api/views/knowledge-graph`
- **Wave 3 acceptance criteria:**
  - 10,000+ nodes (mostly Evidence)
  - Vector RAG retrieval <100ms p95
  - Impact query returns affected nodes in <500ms
  - Interactive graph visualization (force-directed)
- **Dependencies:** Regulations, Policies, Audit Trail, Risk Matrix (all contribute nodes)

---

## ZONE 5: COLLABORATION & TRUST

### 5.1 Case Management

- **Purpose:** Examination, investigation, and regulator-request workflows with SLA tracking and evidence packaging.
- **Primary user:** Examination manager, regulatory affairs
- **Key capabilities:**
  - Case types: examination, investigation, regulatory_request, internal_review
  - Priority: low / medium / high / critical
  - Status: open → in_progress → awaiting_response → closed
  - SLA tracking (due date countdown)
  - Evidence packaging (collect related alerts, comms, audit logs into a case file)
  - Assignee and reviewer roles
  - Regulator field (OCC, FCA, ECB, FINRA, etc.)
- **Data model:** `ComplianceCase`
- **API:** `/api/views/case-management`
- **Wave 1 acceptance criteria:**
  - Case list with priority, status, assignee, due date
  - Detail view with description and evidence panel
  - "Add evidence" action (links to AuditLog, SurveillanceAlert, CommsEvent)
  - SLA breach alerts
- **Dependencies:** Audit Trail, Surveillance, Comms Surveillance (all evidence sources), Regulator Portal (for examiner visibility)

### 5.2 Regulator Portal

- **Purpose:** Read-only, scoped examiner view — they see what they're entitled to, every query they make is itself logged.
- **Primary user:** External examiner (OCC, FCA, ECB, FINRA, etc.)
- **Key capabilities:**
  - Scoped read-only access (examiner sees only their scope)
  - Document search and download
  - Query logging (every action by examiner logged)
  - No over-disclosure enforcement (blocked attempts logged)
  - Session-based access with audit trail
  - Auto-generated disclosure reports
- **Data model:** `AuditLog` (examiner actions), `ComplianceCase` (examination scope)
- **API:** `/api/views/regulator-portal`
- **Wave 3 acceptance criteria:**
  - Examiner login with scoped credentials
  - Search and download within scope
  - All queries logged
  - Scope violation attempts blocked + logged
  - Auto-generated "examiner footprint" report for the firm
- **Dependencies:** Case Management (scope), Audit Trail (logging), Chain Evidence (anchoring examiner actions)

### 5.3 Whistleblower Channel

- **Purpose:** End-to-end encrypted anonymous intake with LLM triage — catches problems before regulators do.
- **Primary user:** Whistleblower (anonymous), ethics team, investigations
- **Key capabilities:**
  - Anonymous intake form (no PII collected)
  - End-to-end encryption (Signal Protocol or equivalent)
  - LLM triage (auto-categorize + severity score)
  - Encrypted hash for tamper detection
  - Investigation workflow (received → triaged → investigating → resolved)
  - Anonymous two-way communication channel
- **Data model:** `WhistleblowerReport`
- **API:** `/api/views/whistleblower`
- **Wave 3 acceptance criteria:**
  - Anonymous submission (no IP, no PII)
  - E2E encryption
  - LLM triage with severity score
  - Investigation workflow
  - Anonymous follow-up channel
- **Dependencies:** Case Management (for investigation), Chain Evidence (for hash anchoring)

### 5.4 Chain Evidence

- **Purpose:** Every audit log entry hashed and anchored to Hyperledger Besu / Ethereum Sepolia / Polygon — cryptographic tamper detection.
- **Primary user:** Internal audit, external examiners (via Regulator Portal)
- **Key capabilities:**
  - SHA-256 hash of every audit log entry
  - Anchor to Hyperledger Besu (permissioned) by default
  - Optional anchor to Ethereum Sepolia (public) for verification
  - Verification job re-anchors daily; tampering detected within 24h
  - Regulator read-only node access
- **Data model:** `ChainAnchor`, `AuditLog`
- **API:** `/api/views/chain-evidence`
- **Wave 1 acceptance criteria:**
  - Every `AuditLog` row anchored within 60s of creation
  - Verification job runs daily
  - Anchor history viewable per log entry
  - 3 chains supported (Besu, Sepolia, Polygon)
- **Dependencies:** Audit Trail (anchors every entry)

### 5.5 Digital Asset Compliance

- **Purpose:** FATF Travel Rule, on-chain sanctions screening, mixer detection, and CBDC compliance for crypto flows.
- **Primary user:** Crypto compliance officer, digital assets team
- **Key capabilities:**
  - Travel Rule enforcement (FATF Recommendation 16) — originator + beneficiary info for transactions ≥$1,000
  - On-chain sanctions screening (wallet attribution via Chainalysis-style data)
  - Mixer detection (Tornado Cash, etc.)
  - OFAC match on wallet addresses
  - CBDC compliance (BoE digital pound, MAS Project Orchid, etc.)
  - Multi-chain support (Bitcoin, Ethereum, Tron, Polygon, CBDC rails)
- **Data model:** `DigitalAssetEvent`
- **API:** `/api/views/digital-assets`
- **Wave 3 acceptance criteria:**
  - 5+ chains monitored
  - Travel Rule compliance 100%
  - Mixer detection with risk score
  - Auto-block on OFAC wallet match
- **Dependencies:** Sanctions Screening (for list matching), Network Graph (for wallet clustering)

---

## ZONE 6: PLATFORM & GOVERNANCE

### 6.1 Privacy & PETs Console

- **Purpose:** Federated learning, homomorphic encryption, differential privacy, secure enclaves — toggle per dataset.
- **Primary user:** CISO, CDO, data governance team
- **Key capabilities:**
  - 4 techniques:
    - **Federated learning** — train AML models across banks without sharing data
    - **Homomorphic encryption** — compute on encrypted cross-border reporting
    - **Differential privacy** — share aggregate risk without exposing PII
    - **Secure enclaves** — Intel SGX / AWS Nitro for sanctions list matching
  - Per-dataset enable / disable
  - CISO approval gate
  - Parameter configuration (epsilon for DP, min_clients for FL, etc.)
- **Data model:** `PetConfig`
- **API:** `/api/views/privacy-pets`
- **Wave 3 acceptance criteria:**
  - 4 techniques configurable
  - At least 1 federated learning deployment (cross-bank AML)
  - At least 1 secure enclave deployment (sanctions)
  - Differential privacy applied to regulator aggregate exposure
- **Dependencies:** Sanctions Screening (for secure enclave), Transaction Surveillance (for federated AML)

### 6.2 Developer Hub

- **Purpose:** REST + GraphQL API keys, webhooks, SDK docs, and sandbox — embed compliance into business apps.
- **Primary user:** Engineering teams at customer firms
- **Key capabilities:**
  - REST API for every state machine
  - GraphQL for flexible queries
  - Webhooks for real-time alerting (sub-1s delivery, HMAC-signed)
  - SDK: TypeScript + Python (Regulation-as-Code)
  - Sandbox environment
  - API key management with scopes and rate limits
  - Documentation with interactive examples
- **Data model:** `ApiKey`
- **API:** `/api/views/developer-hub`
- **Wave 3 acceptance criteria:**
  - REST + GraphQL live
  - Webhooks for surveillance alerts, regulatory changes, case updates
  - SDK v1.0 in npm + PyPI
  - Sandbox with sample data
  - 10+ API keys active
- **Dependencies:** Every state machine (all expose API)

### 6.3 Regulatory Time Machine

- **Purpose:** Point-in-time queries — "What was our compliance posture on 14 Aug 2024 at 3:47pm?" — instantly defensible for examinations.
- **Primary user:** CCO, internal audit, external examiners
- **Key capabilities:**
  - Hourly snapshots of every state machine (8,760/year)
  - Point-in-time query: select any timestamp, see system state at that moment
  - Diff between two timestamps (e.g., policy AML-3.1 → 3.2 changes)
  - Snapshot export for examination evidence
  - Compressed storage (target <1GB/year)
- **Data model:** Snapshot tables (all existing models with `asOf` timestamp)
- **API:** `/api/views/time-machine`
- **Wave 3 acceptance criteria:**
  - Hourly snapshots running
  - Point-in-time query <500ms
  - Diff between two timestamps
  - Snapshot export
- **Dependencies:** Every state machine (snapshots every model)

### 6.4 Rule Harmonizer

- **Purpose:** Cross-jurisdictional rule comparison — visual diff engine showing where US/EU/UK/APAC rules diverge for the same activity.
- **Primary user:** Global compliance team, regulatory affairs
- **Key capabilities:**
  - Topic library: derivatives reporting, client classification, best execution, beneficial ownership, margin requirements, etc.
  - Side-by-side jurisdiction comparison
  - Differences highlighted with severity
  - Harmonization path recommendation (e.g., "operate at 10% globally to exceed all local beneficial ownership thresholds")
  - Map to ISO 20022 / CDE taxonomy where applicable
- **Data model:** `RuleComparison`
- **API:** `/api/views/rule-harmonizer`
- **Wave 3 acceptance criteria:**
  - 5+ topics harmonized
  - 8 jurisdictions covered (US, EU, UK, SG, JP, HK, AU, CA)
  - Visual diff view
  - Harmonization path per topic
- **Dependencies:** Regulations (source data)

### 6.5 Explainable Compliance Cards (XCC)

- **Purpose:** Every approve / flag / decline decision ships with a one-page cited explanation — defensible in court, mandated by EU AI Act Article 13.
- **Primary user:** CCO, legal, external examiners
- **Key capabilities:**
  - Auto-generated card for every compliance decision (transaction approval, sanctions screening, policy decision, AI assistant response)
  - Card includes: decision, regulation cited, policy referenced, evidence, reasoning, confidence score
  - One-page PDF / HTML export
  - Stored permanently + anchored to chain
  - Searchable by decision type, regulation, confidence
- **Data model:** `ComplianceCard`
- **API:** `/api/views/xcc`
- **Wave 3 acceptance criteria:**
  - Every surveillance alert, sanctions hit, AI assistant response generates a card
  - Card includes all required fields
  - Confidence score on every card
  - Export to PDF
  - Searchable
- **Dependencies:** Every state machine that makes decisions (Surveillance, Sanctions, AI Assistant, etc.)

---

## Appendix A: Wave Sequencing Summary

| Wave | Weeks | Views | Goal |
|---|---|---|---|
| **Wave 1: MVP+** | 1–3 | 7 Core (refactored) + Multi-Agent Console + Regulatory Watch + Case Management + Chain Evidence = **11 views** | Agentic + blockchain foundation |
| **Wave 2: Surveillance & Quant** | 4–6 | + Transaction Surveillance + Comms Surveillance + Sanctions Screening + Network Graph + Quant Lab + Climate & ESG + Counterfactual + Systemic Risk = **19 views cumulative** | High-revenue-per-customer features |
| **Wave 3: Platform & Frontier** | 7–10 | + Red Team + Knowledge Graph + Regulator Portal + Whistleblower + Digital Assets + Privacy/PETs + Developer Hub + Time Machine + Rule Harmonizer + XCC = **29 views** | Category-defining differentiation |

## Appendix B: Acceptance Criteria Roll-Up

At end of Wave 3, the following must be true:

- [ ] 29/29 state machines live and integrated
- [ ] 4 persistent agents running daily with approval workflow
- [ ] Every AuditLog row anchored to blockchain within 60s
- [ ] Transaction surveillance <1s end-to-end latency
- [ ] Sanctions screening <50ms p99 match latency
- [ ] Quant Lab running 10,000+ Monte Carlo paths
- [ ] Climate & ESG producing PCAF-aligned financed emissions
- [ ] Red Team Engine running 24/7 with weekly CCO reports
- [ ] Knowledge Graph with 10k+ nodes, <100ms vector RAG retrieval
- [ ] Regulator Portal with scoped access and full query logging
- [ ] PETs Console with at least 1 federated learning deployment
- [ ] Developer Hub with public REST + GraphQL + SDK + sandbox
- [ ] Time Machine supporting point-in-time queries <500ms
- [ ] Rule Harmonizer covering 5+ topics across 8 jurisdictions
- [ ] XCC generated for every compliance decision

## Appendix C: Prisma Model → View Mapping

| Prisma model | Feeds view(s) |
|---|---|
| `Regulation` | Regulations, Knowledge Graph, Rule Harmonizer |
| `Policy` | Policies, Knowledge Graph, Multi-Agent Console |
| `AuditLog` | Audit Trail, Regulator Portal, Chain Evidence |
| `RiskItem` | Risk Matrix, Dashboard, Knowledge Graph |
| `ComplianceMetric` | Dashboard, Reports, Time Machine |
| `ChatMessage` | AI Assistant |
| `SurveillanceAlert` | Transaction Surveillance, Network Graph, Case Management |
| `SanctionsHit` | Sanctions Screening, Network Graph |
| `CommsEvent` | Comms Surveillance, Case Management |
| `QuantScenario` | Quant Lab, Counterfactual, Systemic Risk |
| `ClimateMetric` | Climate & ESG, Risk Matrix |
| `AgentRun` | Multi-Agent Console, Audit Trail |
| `RegulatoryChange` | Regulatory Watch, Multi-Agent Console |
| `RedTeamTest` | Red Team Engine |
| `ComplianceCase` | Case Management, Regulator Portal |
| `WhistleblowerReport` | Whistleblower Channel |
| `ChainAnchor` | Chain Evidence, Audit Trail |
| `DigitalAssetEvent` | Digital Assets, Network Graph |
| `PetConfig` | Privacy & PETs Console |
| `ApiKey` | Developer Hub |
| `RuleComparison` | Rule Harmonizer, Regulations |
| `ComplianceCard` | XCC, AI Assistant, Audit Trail |

---

*For the strategic reasoning behind these 29 state machines, see `STRATEGY.md`. For setup and usage, see `README.md`. For the AI capabilities that power the agentic views, see `SKILLS.md`.*
