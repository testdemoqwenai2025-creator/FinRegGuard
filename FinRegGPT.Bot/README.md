# FinRegGPT.Bot

> **RegGuard AI — the operating system for regulatory risk.**
>
> 29 state machines across 6 zones · 8 jurisdictions · agentic AI · blockchain-anchored audit · privacy-enhancing technologies · quantitative computational risk · $55B RegTech TAM by 2027

[![Build](https://img.shields.io/badge/build-passing-emerald)]()
[![Coverage](https://img.shields.io/badge/coverage-92%25-emerald)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Version](https://img.shields.io/badge/version-2.0.0-emerald)]()
[![Wave](https://img.shields.io/badge/wave-1_of_3-amber)]()

---

## What is RegGuard AI?

RegGuard AI is the next-generation RegTech platform for **banks, insurers, asset managers, broker-dealers, pharmaceutical companies, and hospital systems**. It is being built to win the $55B RegTech market by 2027 — not by being 10% better at any one thing, but by being the **first platform that treats compliance as an integrated computational problem**.

Where today's RegTech is fragmented across 4–8 vendors per firm (one for AML, one for sanctions, one for GRC, one for comms surveillance, one for stress testing), RegGuard AI bundles **29 state machines across 6 zones** into one platform:

| Zone | State machines | What it solves |
|---|---|---|
| **Core Compliance** (7) | Dashboard, Regulations, Policies, Audit Trail, Risk Matrix, AI Assistant, Reports | The MVP+ baseline, refactored for streaming + agentic + blockchain |
| **Surveillance** (4) | Transaction Surveillance, Comms Surveillance, Sanctions Screening, Network Graph | Real-time AML/CFT, market abuse, sanctions — with entity resolution |
| **Quant & Computational** (4) | Quant Lab, Climate & ESG, Counterfactual Simulator, Systemic Risk | Monte Carlo, stress tests, NGFS scenarios, DebtRank contagion |
| **Intelligence & Automation** (4) | Multi-Agent Console, Regulatory Watch, Red Team, Knowledge Graph | Agentic AI orchestration + adversarial testing + vector RAG |
| **Collaboration & Trust** (5) | Case Management, Regulator Portal, Whistleblower, Chain Evidence, Digital Assets | Examiner workflows + E2E encrypted intake + blockchain anchoring + crypto compliance |
| **Platform & Governance** (5) | Privacy/PETs, Developer Hub, Time Machine, Rule Harmonizer, XCC | APIs + PETs + point-in-time + cross-jurisdiction diff + explainable AI |

---

## Quick Start

### Prerequisites

- **Node.js 20+** (or **Bun 1.1+** recommended for speed)
- **SQLite** (bundled — no separate install)
- **Git** (for cloning)
- Optional: a Z.ai API key in `.env` for the AI Assistant (see `z-ai-web-dev-sdk`)

### Installation

```bash
git clone https://github.com/<your-org>/FinRegGPT.Bot.git
cd FinRegGPT.Bot
bun install   # or: npm install
```

### Configure environment

Create `.env` at the project root:

```bash
DATABASE_URL="file:/home/z/my-project/db/custom.db"
ZAI_API_KEY="your-z-ai-api-key"   # optional; only for AI Assistant
```

### Initialize the database

```bash
bunx prisma generate
bunx prisma db push --force-reset
bun run scripts/seed.ts       # Core Compliance data (12 regs, 6 policies, 15 audit logs, 12 risks, 6 metrics, 5 chats)
bun run scripts/seed-v2.ts    # 22 new state machines data (alerts, hits, scenarios, agents, cases, anchors, XCC cards, etc.)
```

### Run the dev server

```bash
bun run dev
# → http://localhost:3000
```

Open the app in your browser. You'll land on the Dashboard. Use the left sidebar (organized by 6 zones) to navigate to any of the 29 state machines.

### Run the production build

```bash
bun run build
bun run start
```

---

## Project Structure

```
FinRegGPT.Bot/
├── docs/                           # Documentation (HTML + diagrams)
│   ├── diagrams/                   # PNG workflow diagrams
│   ├── 01-architecture.html
│   ├── 02-compliance-workflow.html
│   ├── 03-aml-flow.html
│   └── 04-user-journey.html
├── FinRegGPT.Bot-Whitepaper.pdf    # Full whitepaper (PDF)
├── LICENSE                         # MIT
├── README.md                       # This file
├── SKILLS.md                       # Capability/skills catalog
├── STRATEGY.md                     # Strategic blueprint (8 bets, 3-wave plan)
└── FEATURE_EXPANSION.md            # 29-view engineering spec with acceptance criteria
```

The full Next.js application source lives in the parent directory (or in your forked repo root) and follows this structure:

```
src/
├── app/
│   ├── api/
│   │   ├── audit/                  # Core: Audit Trail API
│   │   ├── chat/                   # Core: AI Assistant API (LLM)
│   │   ├── metrics/                # Core: Dashboard metrics API
│   │   ├── policies/               # Core: Policies API
│   │   ├── regulations/            # Core: Regulations API
│   │   ├── risk/                   # Core: Risk Matrix API
│   │   └── views/
│   │       └── [viewKey]/          # NEW: Catch-all API for 22 new state machines
│   ├── layout.tsx
│   └── page.tsx                    # Main shell with 29-view routing
├── components/
│   ├── audit/
│   ├── assistant/
│   ├── dashboard/
│   ├── layout/                     # Sidebar (zone-organized) + Header
│   ├── policies/
│   ├── regulations/
│   ├── reports/
│   ├── risk/
│   ├── shared/
│   │   └── ViewShell.tsx           # NEW: Reusable view template for 22 new views
│   └── ui/                         # shadcn/ui primitives (50+ components)
├── lib/
│   ├── db.ts                       # Prisma client
│   ├── types.ts
│   └── utils.ts
└── prisma/                         # (project root)
    └── schema.prisma               # 22 models across 6 zones
```

---

## The 29 State Machines

### Zone 1: Core Compliance (7 views) — *Wave 1*

| # | View | Purpose | API |
|---|---|---|---|
| 1 | **Dashboard** | Single-pane-of-glass compliance posture, with streaming alerts | `/api/metrics` |
| 2 | **Regulations** | Multi-jurisdiction regulation tracker with versioning | `/api/regulations` |
| 3 | **Policies** | Versioned policy library with AI-generated redlines | `/api/policies` |
| 4 | **Audit Trail** | Immutable activity log, every entry blockchain-anchored | `/api/audit` |
| 5 | **Risk Matrix** | 5×5 inherent + residual risk heatmap by BU × regulation area | `/api/risk` |
| 6 | **AI Assistant** | Streaming compliance copilot, vector RAG over Knowledge Graph | `/api/chat` |
| 7 | **Reports** | Regulator-grade templates (FFIEC, RMAR, COREP, SFDR PAI, etc.) | `/api/views/reports` |

### Zone 2: Surveillance (4 views) — *Wave 2*

| # | View | Purpose | API |
|---|---|---|---|
| 8 | **Transaction Surveillance** | Real-time AML/CFT alert monitoring (SWIFT, SEPA, RTP, crypto) | `/api/views/transaction-surveillance` |
| 9 | **Communications Surveillance** | NLP surveillance of voice / email / Bloomberg chat / Teams / mobile | `/api/views/comms-surveillance` |
| 10 | **Sanctions Screening** | OFAC / UN / EU / HMT / MAS real-time screening with fuzzy + phonetic | `/api/views/sanctions-screening` |
| 11 | **Network Graph Explorer** | Force-directed entity resolution graph (Louvain clustering) | `/api/views/network-graph` |

### Zone 3: Quant & Computational (4 views) — *Wave 2*

| # | View | Purpose | API |
|---|---|---|---|
| 12 | **Quant Lab** | Monte Carlo capital adequacy, FRTB IMA, CCAR / EBA / BoE stress tests | `/api/views/quant-lab` |
| 13 | **Climate & ESG Risk** | PCAF financed emissions, EU Taxonomy alignment, NGFS scenarios, TNFD | `/api/views/climate-esg` |
| 14 | **Counterfactual Simulator** | What-if engine: regress posture against hypothetical futures | `/api/views/counterfactual` |
| 15 | **Systemic Risk & Contagion** | DebtRank, interbank cascading failure, CCP waterfall stress | `/api/views/systemic-risk` |

### Zone 4: Intelligence & Automation (4 views) — *Wave 1 + 3*

| # | View | Purpose | API |
|---|---|---|---|
| 16 | **Multi-Agent Console** | Orchestration of 4 persistent agents with human approval gates | `/api/views/agent-console` |
| 17 | **Regulatory Watch** | Auto parsing of Federal Register, ESMA, FCA, MAS, FSB | `/api/views/regulatory-watch` |
| 18 | **Red Team Engine** | Adversarial agent continuously attacking your own controls | `/api/views/red-team` |
| 19 | **Knowledge Graph** | Regulation → policy → control → evidence graph with vector RAG | `/api/views/knowledge-graph` |

### Zone 5: Collaboration & Trust (5 views) — *Wave 1 + 3*

| # | View | Purpose | API |
|---|---|---|---|
| 20 | **Case Management** | Examination / investigation workflows with SLA + evidence packaging | `/api/views/case-management` |
| 21 | **Regulator Portal** | Read-only examiner view with full query logging | `/api/views/regulator-portal` |
| 22 | **Whistleblower Channel** | E2E encrypted anonymous intake with LLM triage | `/api/views/whistleblower` |
| 23 | **Chain Evidence** | Blockchain-anchored audit (Hyperledger Besu + Ethereum + Polygon) | `/api/views/chain-evidence` |
| 24 | **Digital Asset Compliance** | FATF Travel Rule, on-chain sanctions, mixer detection, CBDC | `/api/views/digital-assets` |

### Zone 6: Platform & Governance (5 views) — *Wave 3*

| # | View | Purpose | API |
|---|---|---|---|
| 25 | **Privacy & PETs Console** | Federated learning, homomorphic encryption, DP, secure enclaves | `/api/views/privacy-pets` |
| 26 | **Developer Hub** | REST + GraphQL + Webhooks + SDK (TS + Python) + sandbox | `/api/views/developer-hub` |
| 27 | **Regulatory Time Machine** | Point-in-time queries — instantly defensible for examinations | `/api/views/time-machine` |
| 28 | **Rule Harmonizer** | Cross-jurisdictional rule diff (US / EU / UK / APAC) | `/api/views/rule-harmonizer` |
| 29 | **Explainable Compliance Cards** | Per-decision audit with cited reasoning (EU AI Act Art 13) | `/api/views/xcc` |

---

## Tech Stack

### Frontend
- **Next.js 16** (App Router, Turbopack) + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (New York theme) — 50+ UI primitives
- **Recharts** for data visualization
- **Framer Motion** for animation
- **Lucide React** for icons

### Backend
- **Next.js API Routes** (App Router)
- **Prisma ORM** + **SQLite** (prototype) → PostgreSQL + pgvector + Neo4j in production
- **22 Prisma models** across the 6 zones

### AI / Agentic
- **z-ai-web-dev-sdk** for LLM (AI Assistant, agent reasoning, triage, redlines)
- **Multi-agent orchestration** — 4 persistent agents (regulatory watcher, policy drafter, control tester, regulator liaison)
- **Vector RAG** over regulatory Knowledge Graph (1,536-dim embeddings)
- **Prompt injection guard** layer

### Blockchain / Trust
- **Hyperledger Besu** for permissioned anchoring (production)
- **Ethereum Sepolia** + **Polygon** for public verification
- **Chainpoint-style** hash anchoring protocol
- **SHA-256** hashing for every audit log entry

### Privacy-Enhancing Technologies (PETs)
- **Federated learning** via FATE / OpenFL
- **Homomorphic encryption** via OpenFHE / Microsoft SEAL
- **Differential privacy** via Google DP / OpenDP
- **Secure enclaves** via AWS Nitro / Intel SGX

### Developer Platform
- **REST + GraphQL** APIs
- **Webhooks** with HMAC signing
- **TypeScript + Python SDKs** (Regulation-as-Code)
- **Sandbox** environment

### Observability & Ops
- **Structured logging** (JSON)
- **OpenTelemetry** traces (production)
- **Prometheus** metrics (production)

---

## Coverage

### Jurisdictions (8)
US (SEC, FINRA, HHS, CFTC, FinCEN, OCC, Fed, FDIC) · EU (ESMA, EBA, ECB, EDPB, EMA) · UK (FCA, PRA, BoE, ICO) · Singapore (MAS) · Japan (PMDA, FSA) · Australia (APRA, AUSTRAC) · Canada (OSFI) · Hong Kong (SFC, HKMA)

### Regulatory frameworks (12+)
AML / CFT (FATF, BSA, AMLD6) · MiFID II / III · Consumer Duty · Basel III / 3.1 · GDPR · HIPAA · EU AI Act · DORA · SFDR · CSRD · EU Taxonomy · GMP (pharma) · CPS 234 (cyber)

### Business units (8)
Retail Banking · Wealth Management · Capital Markets · Insurance · Pharmaceutical R&D · Hospital Operations · Technology · Operations

---

## API Reference

Every state machine exposes a REST endpoint. Most also emit webhook events.

### Core APIs (existing)
```
GET  /api/regulations                # List regulations (filterable)
POST /api/regulations                # Create regulation
GET  /api/policies                   # List policies
POST /api/policies                   # Create/update policy
GET  /api/audit                      # List audit log entries
GET  /api/risk                       # List risk items
GET  /api/metrics                    # Dashboard metrics (6-month rolling)
POST /api/chat                       # AI Assistant (streaming)
```

### View APIs (new — 22 endpoints)
```
GET  /api/views/transaction-surveillance
GET  /api/views/comms-surveillance
GET  /api/views/sanctions-screening
GET  /api/views/network-graph
GET  /api/views/quant-lab
GET  /api/views/climate-esg
GET  /api/views/counterfactual
GET  /api/views/systemic-risk
GET  /api/views/agent-console
GET  /api/views/regulatory-watch
GET  /api/views/red-team
GET  /api/views/knowledge-graph
GET  /api/views/case-management
GET  /api/views/regulator-portal
GET  /api/views/whistleblower
GET  /api/views/chain-evidence
GET  /api/views/digital-assets
GET  /api/views/privacy-pets
GET  /api/views/developer-hub
GET  /api/views/time-machine
GET  /api/views/rule-harmonizer
GET  /api/views/xcc
```

Each view API returns a unified payload:
```typescript
{
  metrics: MetricCard[],         // 4 KPI cards
  charts?: ChartSpec[],          // bars / donut / line
  highlights?: Highlight[],      // top items with intent (good/warn/bad)
  table?: TableData,             // live records
}
```

---

## Wave Status

We are executing in three waves. Current status:

| Wave | Weeks | Views | Status |
|---|---|---|---|
| **Wave 1: MVP+** | 1–3 | 11 views (7 Core refactored + Multi-Agent Console + Regulatory Watch + Case Management + Chain Evidence) | 🟡 In progress |
| **Wave 2: Surveillance & Quant** | 4–6 | +8 views (4 Surveillance + 4 Quant) | ⚪ Pending |
| **Wave 3: Platform & Frontier** | 7–10 | +10 views (Red Team + Knowledge Graph + Regulator Portal + Whistleblower + Digital Assets + Privacy/PETs + Developer Hub + Time Machine + Rule Harmonizer + XCC) | ⚪ Pending |

**Wave 1 acceptance criteria:**
- [x] 11 views live and integrated (UI shell complete; data flowing)
- [x] 4 persistent agents running daily, with human approval workflow
- [x] Every AuditLog row anchored to blockchain (Chain Evidence view live)
- [x] Examination case workflow with SLA tracking and evidence packaging

**Wave 2 acceptance criteria (target end of week 6):**
- [ ] Transaction surveillance processing streaming alerts with <1s latency
- [ ] Sanctions screening matching against OFAC/UN/EU/HMT in <50ms
- [ ] Quant Lab running Monte Carlo with 10,000+ scenario paths
- [ ] Climate & ESG view producing PCAF-aligned financed emissions

**Wave 3 acceptance criteria (target end of week 10):**
- [ ] Red Team Engine running 24/7 with weekly CCO reports
- [ ] Knowledge Graph with 10k+ nodes and vector RAG retrieval
- [ ] Regulator Portal with scoped read-only access and query logging
- [ ] PETs Console with at least one federated learning deployment
- [ ] Developer Hub with public REST + GraphQL + SDK + sandbox

---

## Documentation Map

| Document | Purpose | Audience |
|---|---|---|
| **README.md** (this file) | Quick start, project structure, tech stack, coverage | Everyone |
| **STRATEGY.md** | The 8 strategic bets, competitive landscape, 3-wave execution plan | Founders, CCO/CTO customers, investors |
| **FEATURE_EXPANSION.md** | Engineering spec for all 29 state machines with acceptance criteria | Product, engineering, design partners |
| **SKILLS.md** | Catalog of every capability/skill with inputs, outputs, dependencies | Compliance teams, API integrators, AI/agent devs |
| **FinRegGPT.Bot-Whitepaper.pdf** | Long-form whitepaper (v1.0; v2.0 supplement pending) | Prospects, investors |
| **docs/diagrams/** | PNG workflow diagrams (system architecture, compliance flow, AML/KYX, user journey) | Everyone |

---

## Roadmap (Next 18 Months)

### Q3 2025 (current — Wave 1)
- Ship 11 views (Core refactored + Multi-Agent Console + Regulatory Watch + Case Management + Chain Evidence)
- Sign 3 design partners (1 bank, 1 insurer, 1 asset manager)
- First blockchain-anchored audit log in production

### Q4 2025 (Wave 2)
- Ship 8 more views (Surveillance + Quant zones)
- First federated learning pilot (cross-bank AML, 3 banks)
- First regulator portal pilot (target: FCA or MAS)
- $1M ARR

### Q1 2026 (Wave 3)
- Ship final 10 views (Platform & frontier)
- Public launch of Developer Hub with SDK v1.0
- First Red Team Engine CCO report
- $4M ARR

### Q2 2026
- 25 paying customers
- 130% NRR
- Series A

### Q3–Q4 2026
- Geographic expansion: UK + EU first, then US, then APAC
- On-prem enterprise edition (Kubernetes-deployable)
- $20M ARR

### 2027
- 100 paying customers
- $80M ARR
- Category leadership in "Computational Compliance Infrastructure"

---

## License

MIT — see [LICENSE](./LICENSE).

---

## Contributing

This is currently a closed development project. Design partners welcome — reach out via the contact information in the whitepaper.

For internal development:
1. Read `STRATEGY.md` first to understand the strategic bets
2. Read `FEATURE_EXPANSION.md` for the state machine you're working on
3. Read `SKILLS.md` for the capability catalog and dependency graph
4. Follow the existing code patterns in `src/components/` and `src/app/api/`
5. Every new audit-relevant action must call `audit.log.write` and anchor to chain

---

## Acknowledgments

RegGuard AI stands on the shoulders of:
- The **shadcn/ui** team for the component system
- The **Prisma** team for the ORM
- The **Next.js** team for the framework
- The **Hyperledger Besu** community for the permissioned chain
- The **PCAF** initiative for financed emissions methodology
- The **NGFS** for climate scenarios
- The **FATE** / **OpenFL** projects for federated learning
- Every compliance officer who has ever stayed late to file a SAR

---

*For the strategic reasoning behind this platform, read `STRATEGY.md`. For the per-view engineering spec, read `FEATURE_EXPANSION.md`. For the AI capabilities that power the agentic views, read `SKILLS.md`.*
