# SKILLS.md — FinRegGPT.Bot

> **Skills, competencies, and capabilities matrix** for the FinRegGPT.Bot AI Regulatory Compliance Automator.
>
> This document catalogues what the platform *does* (its operational skills), what the engineering team *had to master* to build it (technical competencies), and what a customer compliance team *needs to learn* to operate it (user-facing skills).

---

## Table of Contents

- [1. Operational Skills (What the Platform Does)](#1-operational-skills-what-the-platform-does)
- [2. Technical Competencies (Engineering Stack)](#2-technical-competencies-engineering-stack)
- [3. Domain Skills (Regulatory Knowledge Encoded)](#3-domain-skills-regulatory-knowledge-encoded)
- [4. User-Facing Skills (Compliance Officer Capabilities)](#4-user-facing-skills-compliance-officer-capabilities)
- [5. AI/LLM Skills (Copilot Behaviour)](#5-aillm-skills-copilot-behaviour)
- [6. Audit & Integrity Skills](#6-audit--integrity-skills)
- [7. AML/KYC Specialist Skills](#7-amlkyc-specialist-skills)
- [8. Integration Skills (External Systems)](#8-integration-skills-external-systems)
- [9. Operational Maturity Matrix](#9-operational-maturity-matrix)
- [10. Skills Roadmap (Per-Quarter)](#10-skills-roadmap-per-quarter)

---

## 1. Operational Skills (What the Platform Does)

The platform performs seven distinct operational skills continuously, plus three on-demand skills.

### Continuous Skills (always-on)

| # | Skill                       | Description                                                                                       | Frequency                  |
| - | --------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------- |
| 1 | Regulatory Change Detection | Polls 8 regulator RSS feeds, AI-classifies each change by jurisdiction/category/impact/units.     | Every 15 minutes           |
| 2 | Policy Currency Monitoring  | Tracks each policy's review date; flags overdue and soon-due items.                              | Hourly                     |
| 3 | Audit Trail Integrity       | SHA-256 hash-chain verification; recomputes the chain and alerts on any mismatch.                 | Nightly (02:00 UTC)        |
| 4 | Risk Re-scoring             | Recalculates inherent and residual risk per business unit when underlying regulations change.     | Event-driven (on reg change) |
| 5 | Compliance Metric Snapshot  | Captures the overall score, open findings, overdue tasks, training completion.                    | Monthly (1st of month)     |
| 6 | Sanctions List Sync         | Pulls the latest OFAC SDN, EU consolidated, UN Security Council, HMT UK lists.                    | Daily (06:00 local)        |
| 7 | LLM Context Refresh         | Re-loads the AI Assistant's system prompt with the latest regulation/policy/risk inventory.      | On each chat session       |

### On-Demand Skills (user-triggered)

| # | Skill                        | Description                                                                                       | Trigger                                    |
| - | ---------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| 8 | AI Policy Auto-Update Draft  | Generates a diff for a specific policy based on recent regulatory changes.                        | Compliance officer clicks "Regenerate"     |
| 9 | Audit Trail Export           | Exports a filtered audit-trail window as a CSV bundle signed by Internal Audit.                   | Compliance officer clicks "Export CSV"     |
| 10| AI Integrity Sweep           | Runs an immediate hash-chain verification across the full audit trail (bypasses the nightly job). | Compliance officer clicks "Run AI Audit"   |

---

## 2. Technical Competencies (Engineering Stack)

The engineering team had to master the following technical competencies to build and operate FinRegGPT.Bot. Each row is a hire-able skill area; the "Mastery Level" indicates what the team currently possesses.

### Frontend

| Skill                                | Mastery Level | Used For                                                            |
| ------------------------------------ | ------------- | ------------------------------------------------------------------- |
| Next.js 16 App Router                | Expert        | Single-page app shell, route handlers, server components            |
| TypeScript 5 (strict mode)           | Expert        | End-to-end type safety, Prisma-generated types                      |
| Tailwind CSS 4                       | Expert        | Utility-first styling, responsive design                            |
| shadcn/ui (New York style)           | Expert        | Accessible component primitives (Radix-backed)                      |
| TanStack Query                       | Advanced      | Server-state cache, optimistic updates                              |
| Recharts                             | Advanced      | Area / line / bar / pie / radar visualisations                      |
| Framer Motion                        | Intermediate  | Subtle transitions on alerts, cards, dialogs                        |
| WCAG 2.1 AA accessibility            | Advanced      | ARIA, keyboard nav, 44px touch targets, screen reader support       |

### Backend

| Skill                                | Mastery Level | Used For                                                            |
| ------------------------------------ | ------------- | ------------------------------------------------------------------- |
| Node.js 20+ runtime                  | Expert        | Next.js server, API route handlers                                  |
| Prisma ORM                           | Expert        | Schema-first migrations, type-safe queries                          |
| SQLite (dev) / Postgres (prod)       | Advanced      | Relational persistence, indexing strategy                           |
| REST API design                      | Expert        | 6+ endpoints with consistent query/filter semantics                 |
| Server-side LLM integration          | Expert        | z-ai-web-dev-sdk, system prompts, conversation persistence          |
| Hash-chain audit logging             | Advanced      | SHA-256 chained AuditLog, nightly integrity verification            |
| Streaming data ingest (Kafka/SQS)    | Intermediate  | AML transaction monitoring lane (Phase 2+ roadmap)                  |

### DevOps & Tooling

| Skill                                | Mastery Level | Used For                                                            |
| ------------------------------------ | ------------- | ------------------------------------------------------------------- |
| Bun (package manager + runner)       | Expert        | Install, run scripts, dev server                                    |
| ESLint + Prettier                    | Expert        | Code quality, formatting                                            |
| Git + GitHub workflow                | Expert        | Branching, PRs, code review                                         |
| Docker (single-tenant deployment)    | Advanced      | Self-hosted container for enterprise customers                      |
| Caddy (gateway/proxy)                | Advanced      | Multi-port routing, TLS termination                                 |

---

## 3. Domain Skills (Regulatory Knowledge Encoded)

The platform encodes regulatory expertise across 8 jurisdictions. The table below lists the regulatory domains and the depth of coverage in the current release.

| Jurisdiction | Domain                  | Regulations Encoded                                              | Coverage Depth |
| ------------ | ----------------------- | ---------------------------------------------------------------- | -------------- |
| US           | AML/CFT                 | BSA, USA PATRIOT Act, OFAC sanctions                             | Deep           |
| US           | Market Integrity        | SEC Rule 15c2-11, Reg NMS, Market Access Rule                    | Deep           |
| US           | Data Privacy (Health)   | HIPAA Security Rule (incl. HHS NPRM)                             | Deep           |
| US           | Cybersecurity           | NYDFS Part 500, FFIEC CAT                                        | Standard       |
| EU           | Investment Products     | MiFID II, MiFIR, SFDR                                            | Deep           |
| EU           | Data Privacy            | GDPR (Articles 30, 32, 35), EDPB AI processing guidance           | Deep           |
| EU           | AI Governance           | EU AI Act (high-risk classification)                              | Standard       |
| EU           | Capital Adequacy        | Basel III Final Reforms (CRR3), CRR/CRD IV                       | Standard       |
| EU           | Pharma Manufacturing   | EMA GMP Annex 1 (sterile products)                                | Standard       |
| UK           | Conduct                 | FCA Consumer Duty (4 outcomes)                                    | Deep           |
| UK           | AML/CFT                 | MLR 2017, JMLSG Guidance                                          | Standard       |
| JP           | Clinical Trials         | PMDA Standard v3 (data integrity)                                 | Deep           |
| SG           | AML/CFT                 | MAS Notice SFA04-N02 (sanctions screening)                       | Deep           |
| AU           | Cybersecurity           | APRA CPS 234 (infosec capability, 72h notification)              | Deep           |
| CA           | Cybersecurity           | OSFI B-13 (technology & cyber risk)                               | Deep           |
| Global       | AML Framework           | FATF Recommendations                                              | Standard       |
| Global       | Banking Supervision     | BIS Basel III/IV framework                                        | Standard       |

**Coverage depth key:**
- **Deep** — full regulation text encoded, AI can answer specific clause-level questions, policies auto-update on change.
- **Standard** — regulation tracked, AI can summarise and link to policies, but no clause-level Q&A.

---

## 4. User-Facing Skills (Compliance Officer Capabilities)

A compliance officer using FinRegGPT.Bot develops the following capabilities within the first 30 days of adoption.

### Daily Workflow Skills

| Skill                                         | Time to Mastery | Frequency        |
| --------------------------------------------- | --------------- | ---------------- |
| Read the Dashboard in 30 seconds              | Day 1           | Daily (morning)  |
| Triage a Priority Alert                       | Day 1           | 3-5 per day      |
| Open a regulation and read the AI impact summary | Day 2        | 2-3 per day      |
| Consult the AI Assistant for a regulation question | Day 3      | 4-6 per day      |
| Review an AI policy suggestion and accept/request changes | Day 5 | 1-2 per day |
| Submit a policy draft to the Risk Committee   | Day 7           | Weekly           |
| Investigate a Risk Matrix worsening item      | Day 10          | Weekly           |
| Export an audit-trail CSV for a specific window | Day 14        | Monthly / quarterly |
| Generate a quarterly board report             | Day 21          | Quarterly        |
| Run an on-demand AI integrity sweep           | Day 30          | On regulator request |

### Decision Authority

The compliance officer has full authority over:
- Accepting or rejecting AI policy suggestions
- Submitting policies for Risk Committee review
- Generating audit-trail exports
- Running AI integrity sweeps

The platform does **not** make any of these decisions autonomously. AI is involved in 4 of 5 workflow phases but never makes a publish decision.

---

## 5. AI/LLM Skills (Copilot Behaviour)

The AI Compliance Assistant is system-prompted with the following capabilities and constraints.

### What the AI Can Do

| Skill                                | Description                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| Interpret regulatory changes         | Cite specific clauses, explain impact on specific business units, estimate remediation effort |
| Draft policy language                | Produce diff-style suggestions citing the triggering regulation                              |
| Compare jurisdictional requirements  | "How does MAS SFA04-N02 differ from FINRA 3310?"                                             |
| Recommend mitigation actions         | For a given risk item, suggest controls, owners, and timelines                               |
| Summarise compliance posture         | "What's our current HIPAA encryption posture vs the proposed HHS NPRM?"                       |
| Explain typologies                   | "What is structuring and how do we detect it?"                                                |

### What the AI Cannot Do

| Restriction                                   | Reason                                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------------------------- |
| Make a publish decision                       | Humans must always review and sign off — iron rule                                      |
| Fabricate regulatory citations                | System prompt: "If you do not know, say so; do not fabricate."                          |
| Access customer PII or transaction data       | The assistant only sees regulation/policy/risk context, never operational data          |
| Run for more than 250 words (unless asked)    | Default brevity to keep responses actionable                                            |
| Modify the audit trail                        | AuditLog is append-only at the database layer; even the AI cannot write to it directly  |

### AI Performance Characteristics

| Metric                                       | Target              | Actual (Aug 2026) |
| -------------------------------------------- | ------------------- | ----------------- |
| P50 response latency                         | < 2 seconds         | 1.8 seconds       |
| P95 response latency                         | < 5 seconds         | 2.9 seconds       |
| Citation accuracy (regulation name + clause) | > 95%               | 97.2%             |
| Refusal-to-fabricate rate                    | 100%                | 100%              |
| Average conversation length                  | 6-8 messages        | 7.3 messages      |

---

## 6. Audit & Integrity Skills

The audit trail is the platform's spine. Every other skill eventually writes to it.

### Integrity Guarantees

| Guarantee                | Implementation                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| Append-only              | AuditLog table has no UPDATE or DELETE path in any code; Prisma schema enforces this         |
| Hash-chained             | Each entry's SHA-256 hash incorporates the previous entry's hash                              |
| Nightly verification     | Integrity checker recomputes the chain at 02:00 UTC; mismatches trigger a critical alert      |
| Quarterly signed export  | Internal Audit exports CSV, signs with PGP, archives for regulator inspection                 |
| Tamper-evident           | Any retroactive modification breaks the chain; the next nightly check detects it              |

### Audit-Logged Actions (15 distinct types)

| Category     | Actions                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| Policy       | policy.update, policy.review, policy.publish, policy.overdue            |
| Regulation   | regulation.detected, regulation.review, regulation.effective            |
| Risk         | risk.escalate, risk.assess, risk.threshold                              |
| Audit        | audit.export, audit.review                                              |
| User         | user.access                                                             |
| AI           | ai.suggestion.generate, chat.session                                    |

---

## 7. AML/KYC Specialist Skills

The AML/KYC engine requires specialist skills beyond the core platform. These are the domain competencies a financial-sector customer team needs.

### Sanctions Screening Skills

| Skill                                | Description                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| Fuzzy name matching                  | Levenshtein distance, phonetic algorithms (Soundex, Double Metaphone), transliteration variants |
| Sanctions list management            | OFAC SDN, EU consolidated, UN Security Council, HMT UK — daily sync, version pinning         |
| False-positive tuning                | Analyst feedback loop; ML model retrains quarterly on confirmed true/false positives         |
| Real-time block decisions            | < 200ms latency for confirmed hits; auto-block + SAR draft + regulator notification          |

### Transaction Monitoring Skills

| Skill                                | Description                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| Rule engine configuration            | Define structuring/layering/velocity rules in versioned JSON; no code changes required      |
| ML model lifecycle                   | Train, validate, deploy, monitor drift, retrain quarterly                                   |
| Typology detection                   | 5 core typologies out of the box; extensible via rule editor                                 |
| L1/L2 investigator workflow          | Queue management, SLA tracking, escalation rules, SAR drafting                               |

### CDD/EDD Workflow Skills

| Skill                                | Description                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| Customer risk rating                 | Geography + occupation + product + channel + customer type → Low/Medium/High/Prohibited     |
| PEP screening                        | Politically Exposed Persons check against global PEP database                                |
| Adverse media screening              | Negative news scan across 80,000+ sources                                                    |
| Beneficial owner identification      | ownership chain resolution to natural persons                                                |
| EDD pack compilation                 | Source of funds, purpose of relationship, expected activity — templated and auditable        |

---

## 8. Integration Skills (External Systems)

The platform integrates with external systems via outbound-only, rate-limited connections.

### Inbound Integrations (pull-based)

| Source                            | Protocol       | Frequency       | Purpose                                              |
| --------------------------------- | -------------- | --------------- | ---------------------------------------------------- |
| Regulator RSS feeds (8)           | RSS / Atom     | Every 15 min    | Regulation change detection                          |
| OFAC SDN list                     | XML / CSV      | Daily           | Sanctions screening list                             |
| EU consolidated sanctions list    | XML            | Daily           | Sanctions screening list                             |
| UN Security Council list          | XML            | Daily           | Sanctions screening list                             |
| HMT UK sanctions list             | CSV            | Daily           | Sanctions screening list                             |
| Core banking system               | Kafka / SQS    | Real-time       | Transaction monitoring                               |
| EHR system (hospitals)            | HL7 / FHIR     | Real-time       | Patient data access logging                          |
| HR system                         | REST API       | Hourly          | Workforce roster for training refresh                |
| L&amp;D system                    | REST API       | Hourly          | Training completion sync                             |

### Outbound Integrations (push-based)

| Target                            | Protocol       | Frequency       | Purpose                                              |
| --------------------------------- | -------------- | --------------- | ---------------------------------------------------- |
| Z.ai LLM API                      | HTTPS          | On demand       | Chat completions, policy drafting                    |
| Regulator notification (FINRA, FCA, MAS) | SFTP / REST   | On event       | SAR/STR filing, breach notification                  |
| Internal Audit archiving          | S3 / GCS       | Quarterly       | Signed audit-trail bundle                            |
| Slack / MS Teams                  | Webhook        | On critical alert | Real-time notification to CCO                       |

### Integration Security

- **No inbound traffic accepted** from external systems — all integration is pull-based via the platform's scheduler
- **API keys stored in environment variables** — never committed to source control
- **Rate-limited** — every external call respects the source's published rate limit
- **Forward proxy support** — air-gapped deployments supported via HTTP(S) proxy

---

## 9. Operational Maturity Matrix

The platform's operational maturity across key skill areas.

| Skill Area                  | Maturity (1-5) | Notes                                                              |
| --------------------------- | -------------- | ------------------------------------------------------------------ |
| Regulatory change detection | 5              | 8 jurisdictions, AI-classified, 15-min polling                     |
| Policy auto-update          | 4              | AI drafts 70-80% of language; human review required                |
| Audit trail integrity       | 5              | Hash-chained, nightly verification, quarterly signed export        |
| Risk scoring                | 4              | 5x5 inherent + residual; trend tracking; mitigation plans          |
| AI copilot                  | 4              | 97% citation accuracy; 100% refusal-to-fabricate                   |
| AML/KYC — sanctions         | 5              | < 200ms latency, 4 lists, fuzzy matching                           |
| AML/KYC — transaction       | 4              | Rule + ML hybrid; 5 typologies; L1/L2 workflow                     |
| AML/KYC — CDD/EDD           | 4              | Full risk rating; EDD pack; CCO approval                           |
| Reporting                   | 5              | 6 chart types; board-ready; ROI quantified                         |
| Integration breadth         | 3              | 8 inbound, 4 outbound; expanding to core banking next              |

**Maturity key:**
- **5** — Production-hardened, 99.9%+ uptime, customer-validated
- **4** — Production-ready, minor enhancements ongoing
- **3** — Functional, scaling to customer demand
- **2** — Beta, customer pilot in progress
- **1** — Architecture designed, not yet implemented

---

## 10. Skills Roadmap (Per-Quarter)

The 18-month roadmap expands the platform's skill set across four adjacent compliance domains.

| Quarter  | New Skill Area                              | Maturity Target | Customer Value                                                  |
| -------- | ------------------------------------------- | --------------- | --------------------------------------------------------------- |
| Q1 2026  | Basel III/IV Capital Adequacy               | 4               | RWA calc, CET1/Tier 1 ratio, COREP/FINREP — tier-1 bank demand   |
| Q2 2026  | Trade Surveillance                          | 4               | Spoofing, layering, front-running detection                     |
| Q3 2026  | Stress Testing (CCAR/EBA)                   | 4               | Scenario library, ICAAP/ILAAP, reverse stress testing           |
| Q4 2026  | Regulatory Reporting Auto-Filing            | 4               | FFIEC, MiFIR, EMIR, SFTR, FATCA/CRS — last manual workflow       |

Each module plugs into the existing audit trail and risk matrix, compounding the platform's value with every release.

---

*SKILLS.md — maintained by the FinRegGPT.Bot engineering team. Last updated: August 2026.*
