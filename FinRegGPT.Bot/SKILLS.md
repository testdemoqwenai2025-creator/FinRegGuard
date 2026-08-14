# RegGuard AI — Skills & Capabilities Reference

> **Document version:** 2.0  
> **Purpose:** Comprehensive catalog of every capability RegGuard AI ships, organized by zone. Use this document to understand what the platform can do, what each skill depends on, and how to invoke it via UI or API.  
> **Audience:** Compliance teams, engineers integrating via API, AI/agent developers  
> **Last updated:** 2026-08-14

---

## Table of Contents

1. [How to Read This Document](#how-to-read-this-document)
2. [Core Compliance Skills](#core-compliance-skills)
3. [Surveillance Skills](#surveillance-skills)
4. [Quant & Computational Skills](#quant--computational-skills)
5. [Intelligence & Automation Skills](#intelligence--automation-skills)
6. [Collaboration & Trust Skills](#collaboration--trust-skills)
7. [Platform & Governance Skills](#platform--governance-skills)
8. [Cross-Cutting Capabilities](#cross-cutting-capabilities)
9. [Skill Dependency Graph](#skill-dependency-graph)

---

## How to Read This Document

Each skill is described with the following fields:

- **Skill name** — the canonical name used in code, docs, and API
- **What it does** — one-paragraph functional description
- **Inputs** — what data or triggers it requires
- **Outputs** — what artifacts or state changes it produces
- **Invoked from** — which UI view(s) and API endpoint(s)
- **Depends on** — other skills it calls or data it consumes
- **SLA / target** — performance or quality bar
- **Notes** — gotchas, version notes, or roadmap items

---

## Core Compliance Skills

### `compliance.posture.summary`

- **What it does:** Computes the overall compliance posture score (0–100) across all jurisdictions, business units, and risk categories. Aggregates findings, overdue tasks, policy currency, and training completion.
- **Inputs:** Snapshot date (default: now); optional jurisdiction / businessUnit filters
- **Outputs:** Overall score, sub-scores per zone, trend vs prior period
- **Invoked from:** Dashboard view, `/api/metrics`
- **Depends on:** Every other skill (it's the top-level roll-up)
- **SLA:** <500ms p99 for any 6-month window
- **Notes:** Score weights are configurable per customer; default weights favor Audit + Risk + Surveillance

### `regulation.track.change`

- **What it does:** Tracks a regulation across its lifecycle (monitoring → pending → effective → superseded) and identifies which internal policies and business units are affected.
- **Inputs:** Regulation ID or filter (jurisdiction, regulator, category, status, impact)
- **Outputs:** Regulation record with affectedUnits, relatedPolicies, impactLevel
- **Invoked from:** Regulations view, `/api/regulations`
- **Depends on:** `regulation.parse.publication` (from Regulatory Watch)
- **SLA:** Query <200ms; update within 24h of regulator publication

### `policy.draft.redline`

- **What it does:** Generates a redline of an existing policy in response to a new or amended regulation. The redline cites the specific regulation clauses that drove each proposed edit.
- **Inputs:** Policy ID, Regulation ID
- **Outputs:** Side-by-side diff with citations, summary of changes, confidence score
- **Invoked from:** Policies view, Multi-Agent Console (policy_drafter agent)
- **Depends on:** `regulation.track.change`, `knowledge.graph.retrieve`, `policy.citation.check`
- **SLA:** First redline in <60s; full redline in <5min
- **Notes:** All drafts require human approval before applying

### `policy.citation.check`

- **What it does:** Validates that every citation in a policy draft actually exists in the source regulation. Rejects drafts with unverifiable citations.
- **Inputs:** Draft policy text
- **Outputs:** List of citations with verified / unverified status
- **Invoked from:** Internally by `policy.draft.redline`
- **Depends on:** `knowledge.graph.retrieve`

### `audit.log.write`

- **What it does:** Writes an immutable audit log entry for any compliance-relevant action (policy update, regulation review, risk escalation, agent run, etc.).
- **Inputs:** Actor, action, targetType, targetId, description, severity
- **Outputs:** AuditLog record with cryptographic hash
- **Invoked from:** Every other skill (transverse)
- **Depends on:** `chain.anchor.write`
- **SLA:** Write <50ms; anchor confirmation within 60s

### `risk.score.business_unit`

- **What it does:** Computes inherent and residual risk scores for each business unit × regulation area combination, on a 5×5 likelihood × impact matrix.
- **Inputs:** Business unit, regulation area
- **Outputs:** Likelihood (1–5), impact (1–5), inherentRisk (1–25), residualRisk (1–25), trend
- **Invoked from:** Risk Matrix view, Dashboard
- **Depends on:** `audit.log.write` (for trend data)
- **SLA:** Daily refresh; query <100ms

### `ai.assistant.chat`

- **What it does:** Streaming conversational compliance copilot. Each response is grounded in the Knowledge Graph via vector RAG, and every response includes an Explainable Compliance Card.
- **Inputs:** User message, optional context tag (e.g., `regulation:EU-MiFID`)
- **Outputs:** Streaming assistant response, XCC card, retrieved context nodes
- **Invoked from:** AI Assistant view, `/api/chat`
- **Depends on:** `knowledge.graph.retrieve`, `xcc.generate`, `agent.guard.prompt_injection`
- **SLA:** Time to first token <2s; full response <30s

### `report.generate.template`

- **What it does:** Auto-populates a regulator-grade report template (FFIEC Call Report, FCA RMAR, ESMA MiFID II RTS 22, FinCEN SAR, ECB COREP) with current data.
- **Inputs:** Template ID, as-of date
- **Outputs:** Populated report (XBRL / PDF / CSV), evidence chain, sign-off workflow
- **Invoked from:** Reports view, Multi-Agent Console (regulator_liaison agent)
- **Depends on:** Every data skill; `xcc.generate` per field
- **SLA:** <5min for any template

---

## Surveillance Skills

### `surveillance.transaction.monitor`

- **What it does:** Real-time monitoring of all transaction channels (SWIFT, SEPA, RTP, wire, crypto) against a typology library. Produces alerts with risk scores and narratives.
- **Inputs:** Transaction stream (Kafka / Redpanda in production; mock stream in prototype)
- **Outputs:** `SurveillanceAlert` records with alertType, severity, riskScore, narrative, triggeredRule
- **Invoked from:** Transaction Surveillance view, `/api/views/transaction-surveillance`
- **Depends on:** `entity.resolve`, `case.create.from_alert`
- **SLA:** <1s end-to-end (ingest → rule → alert)
- **Notes:** Typology library: structuring, layering, integration, smurfing, rapid_movement, round_tripping

### `surveillance.comms.monitor`

- **What it does:** NLP surveillance of voice, email, Bloomberg chat, Teams, mobile for market abuse, collusion, insider trading, off-channel activity.
- **Inputs:** Channel transcripts (voice transcribed via ASR)
- **Outputs:** `CommsEvent` records with signalType, riskScore, transcript snippet
- **Invoked from:** Comms Surveillance view, `/api/views/comms-surveillance`
- **Depends on:** `case.create.from_event`
- **SLA:** <5s from transcript to signal

### `sanctions.screen.realtime`

- **What it does:** Real-time screening against OFAC SDN, UN Consolidated, EU Consolidated, UK HMT, MAS, OFSI lists. Supports exact, fuzzy (Levenshtein), phonetic (Double Metaphone), and partial matching.
- **Inputs:** Name, entity ID, wallet address, or transaction counterparty
- **Outputs:** `SanctionsHit` records with matchType, score, status
- **Invoked from:** Sanctions Screening view, `/api/views/sanctions-screening`
- **Depends on:** `chain.anchor.write` (for blocking decisions)
- **SLA:** <50ms p99 match latency
- **Notes:** Auto-block on score=100; auto-clear requires documented rationale

### `entity.resolve.graph`

- **What it does:** Entity resolution across all data sources — turns transactional rows into a unified entity graph (persons, organizations, accounts, wallets, addresses, phones, emails).
- **Inputs:** Raw entity references from any source
- **Outputs:** Unified entity graph with edges (owns, transacts_with, shares_phone, etc.)
- **Invoked from:** Network Graph Explorer, `surveillance.transaction.monitor`, `sanctions.screen.realtime`
- **Depends on:** Neo4j or GraphDB in production
- **SLA:** Resolution <2s for any entity

### `network.cluster.detect`

- **What it does:** Detects suspicious clusters in the entity graph using Louvain or Leiden community detection algorithms. Flags bridge nodes connecting multiple clusters.
- **Inputs:** Entity graph
- **Outputs:** Cluster IDs, bridge node list, cluster risk scores
- **Invoked from:** Network Graph Explorer
- **SLA:** <30s for 10k-node graph

---

## Quant & Computational Skills

### `quant.montecarlo.capital`

- **What it does:** Monte Carlo simulation of capital adequacy under a specified scenario (CCAR, EBA, BoE ACS, FRTB IMA, NGFS, custom). Runs 10,000+ scenario paths.
- **Inputs:** Scenario ID, portfolio
- **Outputs:** P99 loss, expected loss, capital impact (bps CET1)
- **Invoked from:** Quant Lab view, `/api/views/quant-lab`
- **SLA:** 10k paths in <10min on 16-core node
- **Notes:** Production: NumPy + Numba; prototype: pre-computed results

### `quant.stress.frtb_ima`

- **What it does:** FRTB Internal Models Approach capital calculation — expected shortfall (ES) at 97.5% confidence, with liquidity horizon scaling per risk factor.
- **Inputs:** Trading book positions, risk factor mappings
- **Outputs:** ES per desk, capital requirement, comparison vs Standardized Approach
- **Invoked from:** Quant Lab view
- **SLA:** <15min for full book

### `climate.pcaf.financed_emissions`

- **What it does:** Calculates financed emissions using the PCAF (Partnership for Carbon Accounting Financials) methodology — attribution of borrower/issuer emissions to the firm's financing.
- **Inputs:** Loan / bond / equity portfolio, counterparty emissions data
- **Outputs:** Financed emissions (tCO2e) per asset class, per sector, per counterparty
- **Invoked from:** Climate & ESG view, `/api/views/climate-esg`
- **SLA:** <30min for 100k-asset portfolio

### `climate.eu_taxonomy.align`

- **What it does:** Assesses EU Taxonomy alignment — substantial contribution, Do No Significant Harm (DNSH), minimum safeguards — for financed activities.
- **Inputs:** Activity, counterparty, financing type
- **Outputs:** Alignment %, missing criteria, recommended remediation
- **Invoked from:** Climate & ESG view
- **SLA:** <5s per activity

### `climate.ngfs.scenario`

- **What it does:** Applies NGFS (Network for Greening the Financial System) climate scenarios to the portfolio. Scenarios: Orderly, Disorderly, Hot House World.
- **Inputs:** Scenario variant, portfolio, time horizon
- **Outputs:** Transition risk score, physical risk score, capital impact
- **Invoked from:** Climate & ESG view, Quant Lab (cross-listed)
- **SLA:** <5min

### `quant.counterfactual.simulate`

- **What it does:** Regresses the entire compliance + risk posture against a hypothetical future (rate hike, MiFID III passage, sovereign default, stablecoin ban, CBDC adoption, climate shock).
- **Inputs:** Counterfactual specification
- **Outputs:** CET1 trajectory (12 months), compliance posture delta, material impact count, confidence
- **Invoked from:** Counterfactual Simulator view, `/api/views/counterfactual`
- **Depends on:** `quant.montecarlo.capital`, `risk.score.business_unit`
- **SLA:** <15min per counterfactual

### `systemic.debtrank.compute`

- **What it does:** Computes DebtRank for every node in the interbank exposure graph — a measure of systemic importance based on cascading default potential.
- **Inputs:** Interbank exposure matrix
- **Outputs:** DebtRank per node, systemic bank list, cascading failure simulation results
- **Invoked from:** Systemic Risk view, `/api/views/systemic-risk`
- **SLA:** <30s for 250-bank network

### `systemic.ccp.waterfall.stress`

- **What it does:** Stresses CCP (Central Counterparty) waterfall resources — default fund, skin-in-the-game, assessment power — against member default scenarios.
- **Inputs:** CCP exposure, member defaults
- **Outputs:** Waterfall depletion per CCP, surviving CCPs, recommended exposure reductions
- **Invoked from:** Systemic Risk view

---

## Intelligence & Automation Skills

### `agent.regulatory_watcher.run`

- **What it does:** Daily scrape of Federal Register, ESMA, FCA, MAS, FSB, EBA, BoE PRA publications. Classifies by topic, scores impact, identifies affected policies.
- **Inputs:** RSS / API endpoints (12 sources)
- **Outputs:** `RegulatoryChange` records, `AgentRun` log
- **Invoked from:** Multi-Agent Console (regulatory_watcher agent), Regulatory Watch view
- **Depends on:** `regulation.parse.publication`, `policy.affected.identify`
- **SLA:** Daily 06:00 UTC; <60min for full scrape + classify

### `agent.policy_drafter.run`

- **What it does:** Generates redlines of existing policies in response to new regulations. Outputs await CCO approval before applying.
- **Inputs:** Regulation ID, affected policy IDs
- **Outputs:** Redlines with citations, `AgentRun` log awaiting approval
- **Invoked from:** Multi-Agent Console (policy_drafter agent)
- **Depends on:** `policy.draft.redline`, `policy.citation.check`
- **SLA:** <5min per policy

### `agent.control_tester.run`

- **What it does:** Simulates failures of specified controls against current policy and reports gaps. E.g., "What if sanctions screening is bypassed for high-net-worth clients?"
- **Inputs:** Control ID, failure scenario
- **Outputs:** Gap report, recommended mitigations, `AgentRun` log
- **Invoked from:** Multi-Agent Console (control_tester agent)
- **SLA:** <15min per control

### `agent.regulator_liaison.run`

- **What it does:** Pre-populates regulator returns (FFIEC, FCA RMAR, ESMA, ECB COREP) with cited evidence. Outputs await sign-off before submission.
- **Inputs:** Return template, as-of date
- **Outputs:** Populated return, evidence chain, `AgentRun` log awaiting sign-off
- **Invoked from:** Multi-Agent Console (regulator_liaison agent), Reports view
- **Depends on:** `report.generate.template`
- **SLA:** <30min per return

### `agent.guard.prompt_injection`

- **What it does:** Guards the AI Assistant against prompt injection attacks. Rejects inputs asking to "ignore previous rules", "reveal system prompt", or override policy.
- **Inputs:** User message
- **Outputs:** Sanitized message or rejection
- **Invoked from:** Internally by `ai.assistant.chat`
- **SLA:** <50ms
- **Notes:** Continuously tested by `redteam.prompt_injection`

### `regulation.parse.publication`

- **What it does:** Parses a regulator publication (PDF / HTML / XML) into a structured `RegulatoryChange` record with title, summary, jurisdiction, impact score.
- **Inputs:** Publication URL or document
- **Outputs:** `RegulatoryChange` record
- **Invoked from:** Internally by `agent.regulatory_watcher.run`
- **SLA:** <30s per publication

### `policy.affected.identify`

- **What it does:** Given a new regulation, identifies which existing internal policies are affected, with confidence score.
- **Inputs:** Regulation ID
- **Outputs:** Affected policy IDs with confidence
- **Invoked from:** Internally by `agent.regulatory_watcher.run`
- **Depends on:** `knowledge.graph.retrieve`

### `redteam.attack.run`

- **What it does:** Continuously attacks the firm's own controls — simulates structuring patterns, sanctions obfuscation, market abuse coded language, prompt injection, off-channel smuggling, crypto mixer exposure.
- **Inputs:** Attack vector library
- **Outputs:** `RedTeamTest` records with result (blocked / detected / bypassed) and remediation recommendations
- **Invoked from:** Red Team Engine view, `/api/views/red-team`
- **Depends on:** `surveillance.transaction.monitor`, `surveillance.comms.monitor`, `sanctions.screen.realtime`, `ai.assistant.chat` (all attack targets)
- **SLA:** Continuous; weekly CCO report

### `knowledge.graph.retrieve`

- **What it does:** Vector RAG retrieval over the regulatory knowledge graph (regulations, policies, controls, evidence, risks). Returns the most semantically relevant nodes with citations.
- **Inputs:** Natural-language query, optional filter (jurisdiction, category)
- **Outputs:** Top-K nodes with similarity scores, full graph context
- **Invoked from:** AI Assistant, `policy.draft.redline`, `policy.affected.identify`
- **SLA:** <100ms p95
- **Notes:** Embeddings are 1,536-dim (OpenAI text-embedding-3-small or equivalent)

### `knowledge.graph.impact_query`

- **What it does:** Given a node (e.g., a regulation), traverses the graph to identify all affected nodes (policies, controls, evidence, risks).
- **Inputs:** Node ID
- **Outputs:** Affected node IDs by type, with depth
- **Invoked from:** Regulations view, Multi-Agent Console
- **SLA:** <500ms

---

## Collaboration & Trust Skills

### `case.create.from_alert`

- **What it does:** Creates a `ComplianceCase` from a surveillance alert or comms event, auto-linking the source evidence.
- **Inputs:** Alert ID or Event ID
- **Outputs:** `ComplianceCase` with linked evidence
- **Invoked from:** Transaction Surveillance view, Comms Surveillance view
- **SLA:** <2s

### `case.evidence.package`

- **What it does:** Collects all related evidence (alerts, comms, audit logs, decisions, XCC cards) into a single exportable case file.
- **Inputs:** Case ID
- **Outputs:** Zipped evidence package with manifest, chain anchor
- **Invoked from:** Case Management view
- **SLA:** <60s for typical case

### `case.sla.monitor`

- **What it does:** Monitors all open cases for SLA breach risk. Alerts case owner 7 days before due date.
- **Inputs:** All open `ComplianceCase` records
- **Outputs:** SLA breach alerts, escalation recommendations
- **Invoked from:** Case Management view, Dashboard

### `regulator.scope.enforce`

- **What it does:** Enforces scope on every Regulator Portal access attempt. Blocked attempts are logged.
- **Inputs:** Examiner session, requested resource
- **Outputs:** Allowed / blocked decision; logged access attempt
- **Invoked from:** Regulator Portal
- **Depends on:** `audit.log.write`, `chain.anchor.write`
- **SLA:** <50ms per access check

### `regulator.query.log`

- **What it does:** Logs every query, document view, and download performed by an examiner. Produces "examiner footprint" report.
- **Inputs:** Examiner session, action
- **Outputs:** `AuditLog` entry, `ChainAnchor`
- **Invoked from:** Regulator Portal (transverse)
- **SLA:** <50ms per log

### `whistleblower.intake.anonymous`

- **What it does:** Accepts anonymous whistleblower report via end-to-end encrypted channel. No PII collected (no IP, no email, no name).
- **Inputs:** Encrypted report blob
- **Outputs:** `WhistleblowerReport` with encryptedHash
- **Invoked from:** Whistleblower Channel
- **SLA:** <2s intake
- **Notes:** Uses Signal Protocol or equivalent for E2E

### `whistleblower.triage.llm`

- **What it does:** LLM-based triage of whistleblower reports — categorizes (fraud, market_abuse, harassment, safety, other) and assigns severity and triage score.
- **Inputs:** Decrypted report text
- **Outputs:** Category, severity, triage score, recommended assignee
- **Invoked from:** Whistleblower Channel
- **SLA:** <60s per report

### `chain.anchor.write`

- **What it does:** Hashes (SHA-256) a payload and anchors it to a blockchain (Hyperledger Besu by default; Ethereum Sepolia and Polygon as alternatives). Returns tx hash and block number.
- **Inputs:** Payload (audit log row, evidence, decision, attestation)
- **Outputs:** `ChainAnchor` record with tx hash, block number, chain
- **Invoked from:** `audit.log.write`, `case.evidence.package`, `regulator.query.log`
- **SLA:** <60s to confirmation
- **Notes:** Verification job re-anchors daily; tampering detected within 24h

### `chain.verify.integrity`

- **What it does:** Verifies that the on-chain hash matches the current payload hash. Any mismatch indicates tampering.
- **Inputs:** `ChainAnchor` ID
- **Outputs:** Verified / tampered status
- **Invoked from:** Audit Trail view, Chain Evidence view, daily verification job
- **SLA:** <5s per verification

### `digital.travel_rule.enforce`

- **What it does:** Enforces FATF Recommendation 16 (Travel Rule) for crypto transactions ≥$1,000 — requires originator and beneficiary information.
- **Inputs:** Crypto transaction
- **Outputs:** Compliant / non-compliant decision, required missing fields
- **Invoked from:** Digital Assets view
- **SLA:** <500ms

### `digital.mixer.detect`

- **What it does:** Detects exposure to known crypto mixers (Tornado Cash, etc.) via on-chain analytics.
- **Inputs:** Wallet address
- **Outputs:** Mixer exposure score, list of mixer interactions
- **Invoked from:** Digital Assets view
- **SLA:** <2s

### `digital.ofac.wallet.screen`

- **What it does:** Screens wallet addresses against OFAC's Specially Designated Nationals (SDN) crypto address list.
- **Inputs:** Wallet address
- **Outputs:** Match / no-match, score
- **Invoked from:** Digital Assets view
- **SLA:** <50ms

---

## Platform & Governance Skills

### `pet.federated.train`

- **What it does:** Trains a model (e.g., AML classifier) across multiple banks without sharing raw data. Uses federated learning with differential privacy.
- **Inputs:** Model architecture, federated clients (banks), DP parameters (epsilon, delta)
- **Outputs:** Trained model weights, F1 / precision / recall per round
- **Invoked from:** Privacy & PETs Console
- **SLA:** 50 rounds in <4 hours
- **Notes:** Uses FATE or OpenFL framework

### `pet.homomorphic.compute`

- **What it does:** Computes on encrypted data (e.g., cross-border regulatory aggregation) without decrypting.
- **Inputs:** Encrypted data, computation specification
- **Outputs:** Encrypted result (decrypted by authorized party)
- **Invoked from:** Privacy & PETs Console
- **SLA:** 10–100x slower than plaintext; suitable for batch only

### `pet.differential_privacy.apply`

- **What it does:** Applies differential privacy to a dataset before sharing (e.g., aggregate exposure to regulator).
- **Inputs:** Raw dataset, epsilon, delta
- **Outputs:** DP-protected dataset
- **Invoked from:** Privacy & PETs Console, Regulator Portal (for aggregate views)
- **SLA:** <1s per query

### `pet.secure_enclave.attest`

- **What it does:** Attests that code is running in a secure enclave (AWS Nitro / Intel SGX) before processing sensitive data (e.g., sanctions list matching).
- **Inputs:** Enclave instance
- **Outputs:** Attestation document
- **Invoked from:** Sanctions Screening (when running in enclave)
- **SLA:** <500ms per attestation

### `developer.api_key.manage`

- **What it does:** Manages API keys with scoped permissions and rate limits.
- **Inputs:** Key name, scopes, rate limit
- **Outputs:** API key (with prefix stored), status
- **Invoked from:** Developer Hub view
- **SLA:** <1s

### `developer.webhook.dispatch`

- **What it does:** Dispatches a webhook to a registered endpoint for a subscribed event (surveillance alert, regulatory change, case update).
- **Inputs:** Event type, payload, subscriber URL
- **Outputs:** Delivery confirmation, retry log
- **Invoked from:** Every event-emitting skill
- **SLA:** <1s delivery; 5 retries with exponential backoff
- **Notes:** HMAC-signed payloads for verification

### `developer.sdk.regulation_as_code`

- **What it does:** Executes a regulation as code. E.g., `isCompliantMiFIDII(order)` returns true/false with explanation.
- **Inputs:** Regulation ID, input data (order, transaction, etc.)
- **Outputs:** Compliance decision, explanation, XCC card
- **Invoked from:** Customer application code via SDK
- **SLA:** <100ms per check
- **Notes:** TypeScript + Python SDKs in npm + PyPI

### `time.point_in_time.query`

- **What it does:** Returns the state of any data model at a specified timestamp. Used for examination defense.
- **Inputs:** Model, timestamp
- **Outputs:** Snapshot of model state at that timestamp
- **Invoked from:** Time Machine view, Regulator Portal
- **SLA:** <500ms p99
- **Notes:** Hourly snapshots; compressed storage

### `time.diff.compute`

- **What it does:** Computes the diff between two snapshots of the same model.
- **Inputs:** Model, two timestamps
- **Outputs:** Added / modified / removed records
- **Invoked from:** Time Machine view

### `harmonizer.compare.jurisdictions`

- **What it does:** Compares how a specific topic (e.g., derivatives reporting) is regulated across multiple jurisdictions. Surfaces differences and recommends a harmonization path.
- **Inputs:** Topic, jurisdictions
- **Outputs:** Per-jurisdiction requirements, differences, harmonization path
- **Invoked from:** Rule Harmonizer view
- **SLA:** <2s per topic
- **Notes:** Maps to ISO 20022 / CDE taxonomy where applicable

### `xcc.generate`

- **What it does:** Generates an Explainable Compliance Card for a compliance decision. Includes decision, regulation cited, policy referenced, evidence, reasoning, confidence score.
- **Inputs:** Decision ID, decision, regulation, policy, evidence, reasoning
- **Outputs:** `ComplianceCard` record
- **Invoked from:** Every decision-making skill (surveillance, sanctions, AI assistant, etc.)
- **SLA:** <500ms
- **Notes:** Required by EU AI Act Article 13 for high-risk AI decisions

### `xcc.export.pdf`

- **What it does:** Exports an XCC card as a one-page PDF for legal/examination purposes.
- **Inputs:** `ComplianceCard` ID
- **Outputs:** PDF document
- **Invoked from:** XCC view, Case Management view

---

## Cross-Cutting Capabilities

### `auth.rbac.check`

- **What it does:** Role-based access control check. Every UI view and API endpoint enforces RBAC.
- **Inputs:** User session, resource, action
- **Outputs:** Allowed / denied
- **SLA:** <20ms

### `auth.scim.sync`

- **What it does:** Syncs users and groups from customer IdP (Okta, Azure AD, etc.) via SCIM 2.0.
- **SLA:** <5min propagation

### `notify.user.in_app`

- **What it does:** Sends an in-app notification to a user (e.g., "Agent run awaiting approval", "SLA breach in 7 days").
- **SLA:** <2s

### `notify.user.email`

- **What it does:** Sends an email notification. Used for offline alerts.
- **SLA:** <30s

### `notify.user.slack`

- **What it does:** Sends a Slack notification. Used for team alerts.
- **SLA:** <5s

### `export.data.csv`

- **What it does:** Exports any tabular data as CSV.
- **SLA:** <60s for 100k rows

### `export.data.json`

- **What it does:** Exports any data as JSON (including nested).
- **SLA:** <60s for 100k rows

### `export.report.pdf`

- **What it does:** Renders a PDF report from a template and data. Used for regulator-grade exports.
- **SLA:** <30s per report

---

## Skill Dependency Graph

```
                                     ┌─────────────────────┐
                                     │ compliance.posture  │
                                     │      .summary       │
                                     └──────────┬──────────┘
                                                │ rolls up
              ┌─────────────────────────────────┼──────────────────────────────────┐
              │                                 │                                  │
    ┌─────────▼─────────┐           ┌───────────▼───────────┐             ┌────────▼─────────┐
    │  surveillance.    │           │     risk.score.       │             │     audit.       │
    │  transaction.     │           │     business_unit     │             │     log.write    │
    │  monitor          │           └───────────┬───────────┘             └────────┬─────────┘
    └─────────┬─────────┘                       │                                  │
              │ creates                         │ depends                          │ anchors
              ▼                                 ▼                                  ▼
    ┌─────────────────────┐           ┌─────────────────────┐             ┌──────────────────┐
    │  case.create.       │           │  quant.montecarlo.  │             │ chain.anchor.    │
    │  from_alert         │           │  capital            │             │ write            │
    └─────────────────────┘           └─────────────────────┘             └──────────────────┘
              │                                 │                                  ▲
              │ evidence                        │ inputs                           │
              ▼                                 ▼                                  │
    ┌─────────────────────┐           ┌─────────────────────┐             ┌──────────────────┐
    │  case.evidence.     │           │  quant.stress.      │             │ chain.verify.    │
    │  package            │           │  frtb_ima           │             │ integrity        │
    └─────────────────────┘           └─────────────────────┘             └──────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                          agent.* (Multi-Agent Console)                              │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
    │  │ regulatory_  │  │ policy_      │  │ control_     │  │ regulator_liaison      │   │
    │  │ watcher      │  │ drafter      │  │ tester       │  │                        │   │
    │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └───────────┬────────────┘   │
    │         │                 │                 │                      │                │
    │         ▼                 ▼                 ▼                      ▼                │
    │  regulation.parse  policy.draft.    surveillance.*           report.generate       │
    │  .publication      redline          (attack targets)         .template             │
    │                    └─ policy.citation.check                                          │
    │                    └─ knowledge.graph.retrieve                                        │
    └─────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                              ai.assistant.chat                                      │
    │         ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐               │
    │         │ knowledge.graph │  │ xcc.generate    │  │ agent.guard.    │               │
    │         │ .retrieve       │  │                 │  │ prompt_injection│               │
    │         └─────────────────┘  └─────────────────┘  └─────────────────┘               │
    └─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Versioning

This document is versioned alongside the RegGuard AI codebase. Each skill's behavior is locked to a major version. Breaking changes require a new major version of the skill (e.g., `policy.draft.redline` v2) with a deprecation path for v1.

| Skill | Current version | Stability |
|---|---|---|
| All Core Compliance skills | 2.0 | Stable |
| All Surveillance skills | 1.0 | Beta (Wave 2) |
| All Quant skills | 1.0 | Beta (Wave 2) |
| All Intelligence skills | 1.0 | Beta (Wave 1 for agents, Wave 3 for Red Team + Knowledge Graph) |
| All Collaboration skills | 1.0 | Beta (Wave 1 for Case + Chain, Wave 3 for rest) |
| All Platform skills | 1.0 | Beta (Wave 3) |

---

*For the strategic reasoning behind these skills, see `STRATEGY.md`. For the per-view feature spec, see `FEATURE_EXPANSION.md`. For setup and usage, see `README.md`.*
