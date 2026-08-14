# RegGuard AI — Strategic Blueprint

> **Document version:** 2.1  
> **Status:** Living document — the strategic north star for the next 18 months of RegGuard AI development  
> **Audience:** Founders, CCO/CTO customers, design partners, prospective investors  
> **Last updated:** 2026-08-14 (v2.1 — all 29 state machines shipped; live OFAC + Federal Register feeds wired; force-directed network explorer live)

---

## 0. Executive Summary

RegGuard AI is being built to win the **$55B RegTech market by 2027** (Burke, 2024; Juniper Research; ComplyAdvantage market sizing). The category today is dominated by point solutions: NICE Actimize for AML, ComplyAdvantage for sanctions, MetricStream for GRC, Behavox for comms surveillance, Ascent for regulatory change. No platform stitches them together. **No platform is built for the agentic, blockchain-anchored, multi-jurisdictional, climate-aware future of compliance that is arriving in 2025–2027.**

Our bet: the winning RegTech of 2027 is not a better dashboard — it is an **operating system for regulatory risk** that combines (1) agentic AI for autonomous monitoring and drafting, (2) blockchain-anchored immutable audit trails, (3) privacy-enhancing technologies for cross-firm collaboration, (4) quantitative computational risk models running in real time, and (5) a developer-platform surface that lets regulated firms embed compliance into their core systems.

This document captures the strategic thinking behind that bet, the competitive landscape, the 29 state machines we are building to deliver it, and the three-wave execution plan that takes us from MVP+ to category leader.

> **v2.1 milestone (2026-08-14):** All 29 state machines are now live in the GitHub Pages preview at <https://testdemoqwenai2025-creator.github.io/FinRegGTP.BoT/>. Every view follows the **machine-proposes / human-confirms (Boolean)** interaction pattern: forms are pre-populated, recommendations carry confidence scores, and the human reviewer only clicks Approve / Reject. Two views (Sanctions Screening and Regulatory Watch) now ingest **real free-tier data** at build time — Federal Register API for US regulatory updates and the public OFAC SDN list for sanctioned-entity matches — clearly badged `● live` in the UI so reviewers can distinguish real-feed entries from synthetic ones. The Network Graph Explorer has been upgraded from a static SVG layout to a **live force-directed canvas simulation** with drag-to-perturb, hover-to-highlight, and zoom controls.

---

## 1. The Problem We Are Solving

### 1.1 Scale of the problem

Regulated financial institutions — banks, insurers, asset managers, broker-dealers — operate under **simultaneous obligations from 8+ jurisdictions**, with **200+ regulatory updates published every business day** (Federal Register alone publishes ~250 documents/day; ESMA, FCA, MAS, EBA, BoE PRA add hundreds more). The cost of non-compliance is catastrophic: HSBC paid $1.9B for AML failures (2012); Goldman Sachs paid $5B for 1MDB (2020); Danske Bank's Estonia AML scandal cost €1.6B+ and triggered the CEO's resignation (2019). The aggregate cost of financial crime compliance across global banks exceeds **$200B/year** (LexisNexis Risk Solutions, True Cost of Financial Crime Compliance Study 2024).

### 1.2 Why current tools fail

Today's RegTech stack is fragmented across 4–8 vendors per firm. The results are predictable:

- **Manual rule-change tracking.** Compliance analysts print Federal Register PDFs and highlight relevant sections in yellow. New rules take 60–180 days to operationalize.
- **Siloed surveillance.** Transaction monitoring, comms surveillance, and sanctions screening sit in separate products from separate vendors. The same customer appears as three different IDs in three different systems.
- **Document-based, not computational.** Basel III capital adequacy is computed in Excel models with version control nightmares. Stress tests run quarterly in batch, not continuously.
- **Reactive, not anticipatory.** Firms find out about compliance gaps when the regulator comes knocking. There is no counterfactual capability to ask "what would happen if MiFID III passes?"
- **Trust asymmetry.** Regulators and regulated firms operate in a low-trust, document-dump dynamic. Every examination is a multi-week firefight.
- **No defensible decision audit.** When a transaction is approved or declined, the *why* lives in an analyst's head, not in a citable, regulator-grade artifact.

### 1.3 The shift we are riding

Three secular shifts make a step-function improvement possible right now:

1. **Agentic AI maturity (2024–2026).** Multi-agent orchestration frameworks (CrewAI, AutoGen, LangGraph) have crossed the production-readiness threshold. We can now build agents that *read* regulations, *draft* policy updates, *test* controls, and *pre-populate* regulator returns — with a human in the loop for approval.
2. **Blockchain anchoring as commodity infrastructure (2025+).** Permissioned chains (Hyperledger Besu) and public testnets (Ethereum Sepolia, Polygon) make cryptographic audit trails effectively free. A SHA-256 hash anchored on-chain costs less than $0.0001 and proves a record existed at a point in time without revealing its contents.
3. **Privacy-enhancing technologies (PETs) leaving the lab.** Federated learning (FATE, OpenFL), homomorphic encryption (OpenFHE, Microsoft SEAL), differential privacy (Google DP, OpenDP), and secure enclaves (AWS Nitro, Intel SGX) have all reached production-grade libraries. Cross-bank AML collaboration without data sharing is now technically feasible.

The firms that combine these three shifts *first* and *coherently* will define the next RegTech category.

---

## 2. Competitive Landscape

### 2.1 The eight platforms we benchmark against

| Platform | Strength | Weakness | Our wedge |
|---|---|---|---|
| **ComplyAdvantage** | Best-in-class sanctions screening with ML fuzzy matching | Single-domain; no audit, no policies, no risk quantification | We bundle sanctions with 28 other state machines on one platform |
| **NICE Actimize** | Industry-standard transaction monitoring, deep banking coverage | Legacy on-prem architecture; no agentic AI; weak APIs | Modern cloud-native + agentic AI; full developer platform |
| **Palantir Foundry (Financial Services)** | Entity resolution + data lineage at scale; bank-grade | Engineering-heavy deployment; not compliance-first; extremely expensive | Compliance-first UX; sub-100ms decisioning; 10x cheaper TCO |
| **IBM OpenPages** | Enterprise GRC; massive install base | UI from 2010; no AI; no quantitative risk; no blockchain | Modern UI; agentic AI; quant + chain anchoring built in |
| **MetricStream** | Case management + examination workflows | No surveillance; no quant; no AI beyond simple workflow | Full-stack: surveillance + quant + case management in one |
| **Ascent RegTech** | Best regulatory-change parsing; regulation-as-code | Narrow scope; no monitoring, no surveillance | RCM is one view of 29; we mirror Ascent's RCM and add everything else |
| **Behavox** | Best comms surveillance NLP; deep trader coverage | Single-domain; very expensive; no transaction monitoring | Comms is one view; integrated with transaction + sanctions |
| **Smarsh** | Best archiving/comms capture | Surveillance is bolted on; UI dated; no agentic AI | Archiving is a feature; surveillance is integrated; agentic from day 1 |

### 2.2 What no incumbent ships

Cross-referencing the 8 platforms above, **none** ship:

- Multi-agent orchestration (only LogicGate and Ascent have early versions)
- Blockchain-anchored audit trails (only Chainyard has explored, not in financial RegTech)
- Federated learning for cross-bank AML (only R3 + FATE research prototypes)
- Counterfactual / what-if compliance simulation (nobody)
- Adversarial red-team engine that attacks your own controls (nobody)
- Regulator portal with full examiner query logging (partial in MetricStream)
- Climate + ESG compliance integrated with financial risk (only Manifest Climate, separately)
- Regulatory time machine for point-in-time queries (only Palantir Foundry's snapshot feature, not compliance-focused)
- Explainable compliance cards with cited reasoning (only early EU AI Act compliance work)
- Digital asset / Travel Rule compliance (only Chainalysis + Elliptic, separately)

**These ten gaps are our differentiation.** Each maps to one or more of the 22 new state machines we are adding on top of the original 7.

### 2.3 The category we are creating

We are not playing in "RegTech" as it is currently defined. We are creating a new category we call **"Computational Compliance Infrastructure"** — combining:

- **GRC** (MetricStream / IBM OpenPages)
- **Surveillance** (NICE / Behavox / ComplyAdvantage)
- **Quant risk** (Fermat / Numerix)  
- **Agentic AI** (CrewAI / AutoGen applied to compliance)
- **Trust infrastructure** (Chainalysis + Hyperledger + PETs)

This is a **$55B TAM by 2027** (ComplyAdvantage market sizing), of which we believe $8–12B is addressable by a single platform that does all five.

---

## 3. Our Strategic Bets

We are making eight explicit strategic bets. Each is reversible if disproven by the market, but each shapes the architecture.

### Bet 1: Agentic AI is the new UX

> **The compliance analyst of 2027 doesn't open a dashboard. They review agent work.**

Single-turn LLM chatbots (the current `AI Assistant` view, ChatGPT, etc.) are a transitional form. The durable UX is **multi-agent orchestration with human approval gates**. We are building four persistent agents from day one:

1. **Regulatory Watcher Agent** — daily scrape, classify, and triage new rules
2. **Policy Drafter Agent** — generate redlines against new rules with citations
3. **Control Tester Agent** — simulate control failures against policy
4. **Regulator Liaison Agent** — pre-populate examination responses

The user's day becomes: open the Multi-Agent Console, review overnight work, approve/decline/rework, ship.

### Bet 2: Blockchain anchoring is table stakes

> **If your audit trail isn't cryptographically anchored, you don't have an audit trail.**

Every audit log, evidence artifact, and compliance decision is hashed (SHA-256) and anchored to a chain (Hyperledger Besu for permissioned, Ethereum Sepolia for public verification). Cost: <$0.001 per anchor. Benefit: tampering becomes cryptographically detectable, and regulators can run read-only nodes for real-time supervision.

This is not a feature; it's the foundation. We will anchor every `AuditLog` row by default.

### Bet 3: Privacy-enhancing technologies unlock cross-firm value

> **The biggest AML breakthrough of the decade is banks training models together without sharing data.**

Today, each bank sees only its own transaction graph. Money launderers exploit this fragmentation. Federated learning across 5+ banks, with differential privacy preserving individual customer anonymity, can lift AML F1 scores by 5–10 percentage points (per R3 + FATE research). We are building a PETs Console that lets a CCO toggle federated learning on for cross-bank AML features, with explicit CISO approval gates.

### Bet 4: Quantitative risk and compliance are one problem

> **You cannot assess market risk without assessing the regulatory capital impact, and vice versa.**

The current bifurcation (risk teams use Fermat/Numerix; compliance teams use MetricStream) is artificial. We are unifying them: the Quant Lab view runs Monte Carlo capital adequacy, FRTB IMA, CCAR/EBA/BoE stress testing — all feeding the same risk posture that the Compliance Dashboard surfaces.

### Bet 5: Climate risk is financial risk

> **NGFS scenarios are stress scenarios. Taxonomy alignment is capital allocation. Financed emissions is counterparty risk.**

By 2026, every major jurisdiction (ECB, BoE, Fed, MAS, BoJ) requires climate stress testing and TCFD/TNFD/ISSB disclosure. This is no longer a sustainability sidebar — it is core financial regulation. We are building the Climate & ESG view with PCAF financed emissions, EU Taxonomy alignment, NGFS scenarios, and TNFD nature-related risk as first-class capabilities.

### Bet 6: The Regulator is a user, not an adversary

> **The fastest path to lower examination cost is to give examiners a read-only portal that does the work for them.**

Today: regulator requests documents → firm assembles document dump → regulator spends 3 months reviewing → findings issued. Tomorrow: regulator logs into the Regulator Portal → sees exactly what they're entitled to → every query they make is logged → findings issued in 3 weeks.

This is the single biggest lever for reducing examination cost. We are building it from day one.

### Bet 7: Developer platform is the moat

> **If compliance isn't embedded in the application layer, it doesn't happen.**

The reason Stripe Compliance, Plaid, and Modern Treasury are winning is they ship APIs that bake compliance into product code. We are building a Developer Hub with REST + GraphQL APIs, webhooks for real-time alerting, a Regulation-as-Code SDK (Python + TypeScript), and a sandbox. Compliance teams buy RegGuard; engineering teams consume it via API. That two-sided adoption is the moat.

### Bet 8: Adversarial testing beats hope

> **The only way to know your controls work is to attack them.**

We are shipping a Red Team Engine that runs continuously — simulating structuring patterns, sanctions list obfuscation, insider trading signals, LLM prompt injection, and off-channel comms smuggling. Every bypass becomes a prioritized remediation ticket. No incumbent does this. We believe that within 2 years, regulators will *require* adversarial testing as part of model risk management (SR 11-7 extension).

---

## 4. The 29 State Machines

Our 29 state machines are organized into six zones. The full architectural detail is in `FEATURE_EXPANSION.md`; the summary:

| Zone | State machines | What it does |
|---|---|---|
| **Core Compliance** (7) | Dashboard, Regulations, Policies, Audit Trail, Risk Matrix, AI Assistant, Reports | The MVP+ — every RegTech has these; we ship them with streaming, agentic, and blockchain enhancements |
| **Surveillance** (4) | Transaction Surveillance, Comms Surveillance, Sanctions Screening, Network Graph | Real-time AML/CFT, market abuse, sanctions — with entity resolution as a graph |
| **Quant & Computational** (4) | Quant Lab, Climate & ESG, Counterfactual Simulator, Systemic Risk | Monte Carlo, stress tests, NGFS scenarios, DebtRank contagion |
| **Intelligence & Automation** (4) | Multi-Agent Console, Regulatory Watch, Red Team, Knowledge Graph | The agentic + graph layer — autonomous monitoring and adversarial testing |
| **Collaboration & Trust** (5) | Case Management, Regulator Portal, Whistleblower, Chain Evidence, Digital Assets | The trust layer — examiners, whistleblowers, blockchain, crypto |
| **Platform & Governance** (5) | Privacy/PETs, Developer Hub, Time Machine, Rule Harmonizer, Explainable Compliance Cards | The platform layer — APIs, PETs, point-in-time, cross-jurisdiction, XAI |

---

## 5. Three-Wave Execution Plan

### Wave 1 (weeks 1–3): MVP+ with agentic and blockchain foundation

**Goal:** Ship the 7 refactored core views + 4 highest-leverage new views (Multi-Agent Console, Regulatory Watch, Case Management, Chain Evidence).

**Why these 4:** Multi-Agent Console + Regulatory Watch deliver the agentic AI story (Bet 1). Chain Evidence delivers blockchain anchoring (Bet 2). Case Management delivers examination workflow — the highest-value pain point for CCOs.

**Acceptance criteria:**
- 11 views live and integrated
- 4 persistent agents running daily, with human approval workflow
- Every AuditLog row anchored to Hyperledger Besu within 60 seconds
- Examination case workflow with SLA tracking and evidence packaging

### Wave 2 (weeks 4–6): Surveillance and Quant zones

**Goal:** Ship the 4 surveillance views + 4 quant views.

**Why:** These are the highest-revenue-per-customer features. AML transaction monitoring alone is a $3B sub-market. Quant Lab is what differentiates us from pure GRC players.

**Acceptance criteria:**
- Transaction surveillance processing streaming alerts with <1s latency
- Sanctions screening matching against OFAC/UN/EU/HMT in <50ms
- Quant Lab running Monte Carlo with 10,000+ scenario paths
- Climate & ESG view producing PCAF-aligned financed emissions

### Wave 3 (weeks 7–10): Platform and frontier

**Goal:** Ship the remaining 10 views (Red Team, Knowledge Graph, Regulator Portal, Whistleblower, Digital Assets, Privacy/PETs, Developer Hub, Time Machine, Rule Harmonizer, XCC).

**Why last:** These are the differentiation layer that defines the category, but they depend on the foundation being solid. Red Team needs working controls to attack. Knowledge Graph needs the regulation/policy/control data model. Regulator Portal needs Case Management and Audit Trail.

**Acceptance criteria:**
- Red Team Engine running 24/7 with weekly CCO reports
- Knowledge Graph with 10k+ nodes and vector RAG retrieval
- Regulator Portal with scoped read-only access and query logging
- PETs Console with at least one federated learning deployment
- Developer Hub with public REST + GraphQL + SDK + sandbox

---

## 6. Business Model

### 6.1 Pricing tiers

| Tier | Price/yr | Target | Includes |
|---|---|---|---|
| **Compliance Starter** | $24k | Community banks, credit unions, fintechs <$1B AUM | 7 Core views, 1 jurisdiction, 5 users |
| **Compliance Pro** | $120k | Regional banks, insurers, mid-market | All 29 views, 3 jurisdictions, 25 users, 1M API calls/mo |
| **Compliance Enterprise** | $480k+ | GSIBs, G-Sibs, large insurers | All 29 views, all 8 jurisdictions, unlimited users, dedicated infra, on-prem option, regulator portal |
| **Add-on: Quant Lab** | $60k | Banks needing FRTB/CCAR | Quant + Climate + Counterfactual + Systemic |
| **Add-on: Regulator Portal** | $40k | Examinations-heavy firms | Regulator Portal + Case Management premium |

### 6.2 Unit economics (target by year 2)

- **CAC:** $48k (direct enterprise sales, 6-month cycle)
- **ACV:** $180k blended
- **NRR:** 130% (expansion via add-ons and API usage)
- **Gross margin:** 78% (cloud + LLM costs)
- **Payback:** 8 months
- **LTV:** $720k (4-year average customer life at 130% NRR)

### 6.3 Land-and-expand motion

1. **Land** on Core Compliance Starter at $24k — easy budget approval, replaces an existing point solution
2. **Expand** to Compliance Pro at $120k within 12 months — add Multi-Agent Console + Surveillance
3. **Expand** to Enterprise at $480k — add Regulator Portal, Quant Lab, dedicated infra
4. **Lock-in** via Developer Hub — engineering teams build against the API, switching cost becomes prohibitive

---

## 7. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **LLM hallucination in policy drafts** | High | Severe (regulator-grade errors) | Mandatory human approval gate; citation checker that rejects drafts without verifiable sources; red team agent that attacks policy drafts |
| **Blockchain anchoring rejected by regulator** | Medium | High (loses differentiator) | Lead with read-only regulator node pilot; offer traditional hash-only audit as fallback; published verification protocol |
| **Federated learning blocked by legal** | Medium | Medium (loses Bet 3) | Start with intra-firm federated (works without cross-firm data sharing); develop legal framework with outside counsel; lobby via IIF |
| **Agentic AI regulation (EU AI Act high-risk classification)** | High | High (compliance burden) | Embrace Article 13 transparency from day 1 via Explainable Compliance Cards; pursue conformity assessment early |
| **Incumbent acquires point solution to bundle** | Medium | Medium | Speed — we ship the bundle before incumbents can integrate acquisitions; lock in design partners with multi-year contracts |
| **Climate/ESG regulation softens under political pressure (US)** | Medium | Low-Medium | Climate is global mandate (EU SFDR, CSRD, NGFS); US is one market of 8; we lead with EU + UK |
| **Cloud cost overruns from streaming + LLM** | Medium | Medium | Tiered storage (hot 30d, warm 90d, cold 1y); LLM caching; smaller fine-tuned models for routine tasks |
| **Talent scarcity (compliance + AI engineers)** | High | Medium | Hire former compliance officers as domain experts; train AI engineers on compliance via internal academy; remote-first to widen pool |

---

## 8. North-Star Metrics

We will measure ourselves against these metrics, reviewed quarterly:

### 8.1 Customer outcomes
- **Customer compliance cost reduction:** Target 35% reduction in compliance OpEx within 18 months of deployment
- **Examination cycle time:** Target 60% reduction (12 weeks → 5 weeks) for customers using Regulator Portal
- **AML alert false-positive rate:** Target <30% (industry avg: 95%+)
- **Time-to-apply new regulation:** Target 14 days (industry avg: 60–180 days)

### 8.2 Product
- **29/29 state machines shipped:** By end of Wave 3
- **API uptime:** 99.95% SLA
- **API p99 latency:** <200ms for read endpoints
- **Agent run success rate:** >98%

### 8.3 Business
- **ARR:** $4M by end of year 1; $20M by end of year 2; $80M by end of year 3
- **Logo count:** 25 paying customers by year 1; 100 by year 2; 300 by year 3
- **NRR:** 130% by year 2
- **Net Promoter Score:** >50 by year 2

---

## 9. Open Strategic Questions

These are the questions we don't yet have answers to. We will resolve each within the next 2 quarters via customer discovery or market testing:

1. **Will regulators actually use the Regulator Portal?** It depends on individual examiner willingness and bank regulatory affairs team readiness. Pilot with one cooperative regulator (likely FCA or MAS) in 2026.
2. **What is the right pricing for the Developer Hub?** Per-call, per-seat, or revenue-share? We will test per-call at $0.001/call for surveillance alerts and $0.0001/call for read endpoints.
3. **How far to push agentic autonomy?** Today: human approval for every action. By end of Wave 3: maybe auto-apply for low-risk regulatory changes? Customer appetite will dictate.
4. **Build vs buy for sanctions list data?** ComplyAdvantage and Refinitiv both sell lists. We will resell ComplyAdvantage lists in Wave 2, build our own in Wave 3 if volume justifies.
5. **On-prem vs cloud-only?** GSIBs will require on-prem. We will offer a Kubernetes-deployable enterprise edition in Wave 3.
6. **Geographic expansion sequence?** UK + EU first (largest TAM, most regulation), then US, then APAC (SG + JP + AU). Question: do we enter India (RBI) and Brazil (BACEN) in year 3?

---

## 10. v2.1 Delivery Status (2026-08-14)

| Zone | Views shipped | Live data wired | Notes |
|---|---|---|---|
| Core Compliance | 7/7 | 6/7 (SQLite via Prisma in dev; static JSON on Pages) | Dashboard, Regulations, Policies, Audit, Risk, Assistant, Reports |
| Surveillance | 4/4 | 1/4 (Sanctions = real OFAC SDN) | Network Graph upgraded to force-directed canvas in v2.1 |
| Quant & Computational | 4/4 | — | Synthetic Monte Carlo / FRTB / NGFS / climate scenarios |
| Intelligence & Automation | 4/4 | 1/4 (Reg Watch = real Federal Register) | Synthetic for agents / red team / knowledge graph |
| Collaboration & Trust | 5/5 | — | Synthetic case management, regulator portal, chain evidence |
| Platform & Governance | 5/5 | — | Synthetic PETs, developer hub, time machine, harmonizer, XCC |
| **Total** | **29/29** | **2/29 live + 27/29 synthetic** | All badged; reviewer sees `● live` for real-feed entries |

**Deployment artefacts**

- **Live preview:** <https://testdemoqwenai2025-creator.github.io/FinRegGTP.BoT/>
- **Source:** <https://github.com/testdemoqwenai2025-creator/FinRegGTP.BoT>
- **Static export:** 73 files, 2.4 MB, zero server runtime required
- **Data layer:** 28 JSON files in `public/data/` totalling ~210 KB (up from ~190 KB pre-v2.1)
- **Free-tier data fetcher:** `scripts/fetch-free-tier-data.py` runs at build time; idempotent and gracefully falls back to curated real-world OFAC samples if the live OpenSanctions search endpoint is unavailable
- **Design principle verified:** every interactive surface in every view presents a pre-computed recommendation with confidence score; the human reviewer only confirms Boolean Approve / Reject

---

## 11. Conclusion

The RegTech category is fragmented, document-centric, and built for the regulatory world of 2015. The next decade demands a computational, agentic, blockchain-anchored, climate-aware, developer-platform approach. **RegGuard AI is our bet on that future.** The 29 state machines documented in `FEATURE_EXPANSION.md` are how we execute the bet. The three-wave plan in Section 5 is how we sequence it.

We do not expect to win by being 10% better at any one thing. We expect to win by being **the first platform that treats compliance as an integrated computational problem** — and by making that integration feel inevitable in retrospect, the way Stripe made payments integration feel inevitable.

---

*This document is the strategic north star. For implementation detail, see `FEATURE_EXPANSION.md`. For technical setup, see `README.md`. For the AI capabilities that power the agentic views, see `SKILLS.md`.*
