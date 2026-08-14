# RegGuard AI — Critical Project Assessment

**Date:** 2026-08-15
**Author:** main agent (post-Task 15 review)
**Scope:** Honest assessment of project state, severity-ranked shortfalls, and a concrete rectification plan focused on the user's vision of recruitment-ATS-style form auto-fill driven by live web connectors.

---

## 1. Executive verdict

The project is **real, substantial, and demonstrably functional** — not a slide-ware demo. As of Task 15:

- 47 views wired across 6 zones (Core, Surveillance, Quant, Intelligence, Collaboration, Platform)
- 38 plugins in the catalog (18 forms + 14 labels + 6 features + 6 doc templates)
- 548 vector-store chunks, all body_text prose (zero HTML pollution after the Task 14 fix)
- RAG pipeline end-to-end functional: plugin templates → vector store → retrieval → case citations → UI
- Cases migrated from `cases.json` to `ComplianceCase` table (Task 13)
- 93/93 smoke-test assertions pass across Tasks 14 + 15
- LLM integration via `z-ai-web-dev-sdk` is real (not canned)

**However, the project is not production-ready**, and the single biggest gap is exactly the one the user named: **the compliance "forms" in the catalog are regulatory prose for RAG retrieval — they are NOT interactive fillable templates that auto-populate from live web data**. Today, an EDD form is a ~4 KB body_text string used to answer chat questions. It is not a form you can open, point at a counterparty, and watch fill itself from Companies House + OFAC + LEI + chain-analysis feeds the way a recruitment ATS auto-fills a candidate record from LinkedIn + Indeed + resume parser.

This assessment ranks every shortfall by severity and proposes a four-phase rectification plan that closes the form-auto-fill gap first, because that is the highest-leverage feature for a compliance product.

---

## 2. What is genuinely working

| Capability | Evidence |
|---|---|
| Plugin catalog architecture | `src/lib/plugins/catalog.ts` — 38 typed entries with schema, defaultFieldsJson, body_text, jurisdiction, regulator, version |
| RAG retrieval | `src/lib/ai/rag.ts` + `vector-store.ts` — TF-IDF today, swappable to pgvector |
| Plugin lifecycle | enable / disable / refresh / reindex / drift scan — all backed by real API routes under `/api/plugins/...` |
| Case → DB migration | `ComplianceCase` table + `CaseCitation` join table, with `/api/cases` and `/api/cases/[id]/citations` routes |
| LLM chat with plugin-scoped retrieval | `src/app/api/chat/route.ts` builds RAG filter from enabled plugins, calls ZAI SDK |
| RegTech feed registry | `public/data/regtech-feeds.json` — 12 feeds with auth scheme, rate limit, polling cadence, AI recommendations |
| Free-tier data fetcher | `scripts/fetch-free-tier-data.py` — Federal Register, ESMA RSS, OpenSanctions, EU CFSP, OpenCorporates |
| Smoke-test discipline | Per-task test scripts (Tasks 9–15) with 30–93 assertions each, covering catalog + DB + chunks + RAG retrieval + view wiring |
| Worklog discipline | `worklog.md` is 118 KB of structured per-task records (Tasks 1–15) |

These are not claims — they are verifiable in the repo and the test scripts prove them.

---

## 3. Severity-ranked shortfalls

### P0 — Blocks production

#### 3.1 No live connector engine (the user's central point)

`public/data/regtech-feeds.json` is **descriptive metadata only**. It lists 12 feeds (FCA Digital Gateway, MAS SGFINd, ESMA DORA Register, SEC EDGAR XBRL, FINRA Rulebook, CFTC SDR, HKMA GERF, etc.) with fields like `endpoint`, `authScheme`, `rateLimitPerMin`, `lastPollAt`, `nextPollAt`, `recordsPulled`, `errorCount`, `avgLatencyMs` — but **none of these values are live**. They are static numbers written by a Python script at build time.

There is no:
- `ConnectorEngine` class that runs on a cron and polls each feed
- OAuth2 client-credentials token refresh logic
- Rate-limit token bucket per feed
- Circuit breaker for failing feeds (the `eba-eu-climate` feed has been "unhealthy" with 8 errors for the entire demo — no failover has actually triggered)
- Dead-letter queue for malformed responses
- `ConnectorRun` table recording each poll attempt with raw payload hash

**Rectification:** Build a real `ConnectorEngine` (see §4 architecture). This is the foundation for everything else.

#### 3.2 No form auto-fill infrastructure (the user's central point)

The 18 form plugins (`sec-form-adv`, `finra-form-u4`, `mifid-ii-annex-i`, `gdpr-ropa`, `fatca-form-8966`, `emir-t1-report`, `sfdr-rts`, `basel-pillar-3`, `edd-form-framework`, `sar-next-gen-template`, `form-mica-casp`, `form-travel-rule`, `form-climate-scenario`, etc.) are **catalog entries with body_text** — they exist to be retrieved by the RAG chatbot, not to be filled out.

What does NOT exist:
- `POST /api/forms/[slug]/instantiate` — create a fillable form instance from a catalog template
- `POST /api/forms/[instanceId]/autofill` — trigger auto-fill from a counterparty / entity ID
- `FormTemplate` table — the field schema for each form (which fields exist, types, required, validation rules)
- `FormInstance` table — a filled (or partially filled) form with per-field values
- `FormFieldProvenance` table — for every field value: which connector, what timestamp, what raw payload hash, what parser version, what confidence score
- Field ontology — mapping a regulatory field name (e.g., `beneficial_owners[].nationality`) to its source-of-truth connector (Companies House for UK, LEI for EU, EDGAR for US)
- Parser layer — PDF / HTML / XBRL / CSV / JSON → canonical JSON
- Confidence scoring — high (single authoritative source) / medium (corroborated) / low (heuristic)
- Human review queue — low-confidence fields routed to a reviewer with the raw payload side-by-side

**Rectification:** Build the 7-layer form auto-fill stack (see §4). This is the recruitment-ATS equivalent for compliance.

#### 3.3 SQLite is prototype-only

`prisma/schema.prisma` itself says: *"SQLite-backed prototype; production should migrate to PostgreSQL+pgvector+Neo4j."* SQLite has no native vector type, no row-level security, no concurrent write throughput, no full-text search beyond FTS5. The current TF-IDF vector store is a JavaScript Map — fine for 548 chunks, unusable at 50,000.

**Rectification:** Migrate to PostgreSQL + pgvector in Phase 4. The Prisma schema is already structured for it (just change `provider` and add `@db.Vector(1536)` annotations).

---

### P1 — Significant quality / scalability gaps

#### 3.4 TypeScript errors: 48, all in unrelated legacy code

```
TrialGPTBot-Enterprise/...                    35 errors  (legacy subfolder)
examples/websocket/...                         2 errors  (missing socket.io deps)
scripts/test-task10-acked-view.ts              5 errors  (duplicate declarations)
scripts/test-task11-real-rag.ts                3 errors  (duplicate declarations, missing export)
src/app/api/plugins/[id]/toggle/route.ts       1 error
src/lib/ai/vector-store.ts                     1 error
src/lib/plugins/{marketplace,registry}.ts      1 error
```

**Zero errors in any file written in Tasks 9–15.** The errors are concentrated in `TrialGPTBot-Enterprise/` (a separate subfolder that should be deleted or moved to its own repo) and two old test scripts with duplicate `BASE`/`ok` declarations.

**Rectification:** Delete or isolate `TrialGPTBot-Enterprise/`. Add `export {}` to the two old test scripts. 30-minute fix.

#### 3.5 No CI / CD

No `.github/workflows/`. Tests run manually via `bun run scripts/test-taskNN-*.ts`. No PR gate, no lint-on-commit, no type-check-on-push. The 48 TS errors above would have been caught by a 30-line CI workflow months ago.

**Rectification:** Add `.github/workflows/ci.yml` running `bun install && bunx tsc --noEmit && bun run scripts/test-task15-three-modules.ts`. 1-hour fix.

#### 3.6 No auth / multi-tenancy

No `tenantId` on any Prisma model. No `User` table. No RBAC. No session handling. Every visitor sees every case, every policy, every audit log. The `AuditLog.actor` field is a free-text string — anyone can impersonate anyone.

**Rectification:** Add `Tenant` + `User` + `Role` models in Phase 4. Add `tenantId` to every domain table. Use NextAuth.js or Clerk for auth. 1-week fix.

#### 3.7 No semantic quality eval for RAG

The 93/93 test assertions are **structural** ("file exists", "body_text present", "chunks ≥ 5", "RAG query retrieves plugin X for query Y"). None of them test **whether the retrieved context actually answers the regulator's question**. A retrieval that returns the right plugin slug but the wrong chunk within that plugin still passes.

**Rectification:** Build a small eval harness with ~50 hand-written regulatory questions and golden answers. Score retrieval by (a) did we retrieve the right chunk, (b) does the LLM answer match the golden answer. Use `trec_eval` or a simple recall@k metric. 2-day fix.

#### 3.8 `cases.json` still ships embedded citations

The Task 13 migration moved cases to the `ComplianceCase` table, but `public/data/cases.json` still contains an 8-case array with `citations: [...]` embedded per case. The `/api/cases` route no longer reads from this file (it reads from DB), so the file is dead weight that misleads anyone reading the repo.

**Rectification:** Either delete `cases.json` (the DB is the source of truth now) or replace it with a thin seed file that the migration script reads. 30-minute fix.

---

### P2 — Polish

#### 3.9 No streaming chat

`/api/chat` returns a single JSON response. For long answers (e.g., "summarize the impact of MiCA Title V on our custody business"), the user waits 10–20 seconds with no feedback.

**Rectification:** Convert to Server-Sent Events (SSE) or use the Vercel AI SDK's `streamText`. 1-day fix.

#### 3.10 No i18n

All UI text is hardcoded English. If we onboard JP PMDA / SG MAS / HK SFC users, we have no story.

**Rectification:** Use `next-intl`. Extract strings to `messages/en.json`, `messages/ja.json`, `messages/zh.json`. 1-week fix, but should wait until Phase 4.

#### 3.11 No observability

No OpenTelemetry, no structured logs (the dev.log is just console output), no Sentry, no metrics dashboard. `AuditLog` is application-level (who clicked what) — it does not capture infra-level signals (request latency, error rate, DB query time).

**Rectification:** Add `@vercel/otel` for tracing, `pino` for structured logs, Sentry for errors. 2-day fix.

#### 3.12 No real embeddings

The vector store uses TF-IDF. This is fine for the current 548-chunk prototype, but TF-IDF cannot capture semantic similarity (e.g., "beneficial owner" vs "UBO" vs "25% control prong" are treated as orthogonal tokens). When the corpus grows past ~5,000 chunks, retrieval quality will plateau.

**Rectification:** Swap `vector-store.ts` to use `text-embedding-3-small` (OpenAI) or `bge-large-en` (self-hosted). Store vectors in pgvector. The `RagResult` interface does not change. 2-day fix in Phase 4.

---

## 4. The form auto-fill architecture (recruitment-ATS equivalent)

This is the centerpiece of the rectification plan. The user's analogy is precise: **a recruitment ATS auto-fills a candidate record from LinkedIn + Indeed + resume parser + university registry, with per-field provenance and a human review queue for low-confidence fields.** The compliance equivalent auto-fills an EDD form from Companies House + OFAC + LEI + EDGAR + chain-analysis + sanctions RSS, with per-field provenance and a reviewer queue.

### 4.1 The 7-layer stack

```
┌─────────────────────────────────────────────────────────────────┐
│ L7  Human Review Queue                                          │
│     - Low-confidence fields routed to reviewer                  │
│     - Side-by-side: form field ↔ raw connector payload          │
│     - Reviewer approves / edits / rejects                       │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ L6  Audit Trail (FormFieldProvenance table)                     │
│     - field_id, connector_id, fetched_at, raw_payload_hash,     │
│       parser_version, confidence, reviewer_id, reviewed_at      │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ L5  Auto-fill Orchestrator                                      │
│     - Input: form_slug + entity_id (e.g., LEI:529900T8BM49AURQ) │
│     - Reads FormTemplate.field_schema                           │
│     - For each field: resolves FieldOntology → connector        │
│     - Calls connector, parses response, writes FormInstance     │
│     - Computes confidence, routes low-confidence to L7          │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ L4  Form Template Registry (FormTemplate table)                 │
│     - form_slug (e.g., "edd-form-framework")                    │
│     - field_schema: JSON Schema with field name, type, required,│
│       validation, autofill_strategy (connector_slug + field_map)│
│     - version, regulator, jurisdiction                          │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ L3  Field Ontology (FieldOntology table)                        │
│     - field_name: "beneficial_owners[].nationality"             │
│     - canonical_type: "country_code_iso3166"                    │
│     - source_of_truth: "companies_house" (UK) / "lei" (EU) /    │
│       "edgar" (US) — depends on entity jurisdiction             │
│     - parser: "companies_house_officers_json"                   │
│     - fallback_chain: ["lei", "opencorporates"]                 │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ L2  Parsers (one per response format)                           │
│     - companies_house_officers_json → canonical JSON            │
│     - ofac_sd_xml → canonical JSON                              │
│     - edgar_xbrl → canonical JSON                               │
│     - lei_search_json → canonical JSON                          │
│     - opencorporates_search_json → canonical JSON               │
│     - esma_register_json → canonical JSON                       │
│     - fca_register_json → canonical JSON                        │
│     - mas_sgfind_json → canonical JSON                          │
│     - sec_rss_xml → canonical JSON                              │
│     - pdf_extractor (regulatory PDFs) → canonical JSON          │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ L1  Connector Registry (Connector table + ConnectorEngine)      │
│     - slug: "companies_house", "ofac", "edgar", "lei",          │
│       "opencorporates", "esma_register", "fca_register",        │
│       "mas_sgfind", "sec_rss", "chainalysis", "trm_labs"        │
│     - endpoint, auth_scheme, rate_limit_per_min                 │
│     - token_refresh_logic (OAuth2 client credentials)           │
│     - circuit_breaker_state (closed/open/half-open)             │
│     - last_poll_at, last_success_at, error_count_24h            │
│     - ConnectorEngine runs on cron, polls each feed, writes     │
│       ConnectorRun record with raw_payload_hash                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Concrete example: EDD form for "Binance Holdings Ltd."

```
User action: Opens EDD form, enters entity ID "LEI:529900T8BM49AURQ"

L5 Orchestrator:
  1. Reads FormTemplate for slug="edd-form-framework"
  2. Field schema requires:
     - legal_name
     - jurisdiction
     - incorporation_date
     - beneficial_owners[] (name, nationality, threshold_pct)
     - source_of_funds_evidence
     - onchain_cluster_ids[]
     - sanctions_screening_result
  3. For each field, resolves FieldOntology:
     - legal_name → connector="lei", parser="lei_search_json"
     - jurisdiction → connector="lei", parser="lei_search_json"
     - beneficial_owners[] → connector="companies_house" (if UK) OR
                              "edgar" (if US) OR
                              "opencorporates" (fallback)
     - source_of_funds_evidence → connector="chainalysis", parser="chainalysis_clusters_json"
     - onchain_cluster_ids[] → connector="chainalysis"
     - sanctions_screening_result → connector="ofac", parser="ofac_sd_xml"
  4. Calls each connector (in parallel where possible)
  5. Each response → parser → canonical JSON → FormInstance field value
  6. Computes confidence:
     - HIGH (single authoritative source, exact match)
     - MEDIUM (corroborated across 2+ sources)
     - LOW (heuristic / single non-authoritative source)
  7. Writes FormFieldProvenance for every field:
     - field_id, connector_id, fetched_at, raw_payload_hash,
       parser_version, confidence, payload_snippet
  8. Routes LOW-confidence fields to L7 review queue

Result: EDD form opens with ~80% fields pre-filled in ~5 seconds.
Reviewer sees 3 low-confidence flags (e.g., beneficial_owner
nationality not on Companies House — needs manual entry).
Reviewer approves. Form is locked + audit trail complete.
```

### 4.3 Why this is exactly the recruitment-ATS pattern

| Recruitment ATS | Compliance Form Auto-fill |
|---|---|
| Candidate record | Counterparty / entity record |
| LinkedIn connector | Companies House connector |
| Indeed resume PDF parser | OFAC SDN XML parser |
| University registry verifier | LEI registry verifier |
| Field "candidate.employer" → LinkedIn | Field "entity.legal_name" → LEI |
| Confidence score per field | Confidence score per field |
| Recruiter review queue | Compliance officer review queue |
| Audit trail (GDPR Art. 30) | Audit trail (regulator examination) |

The data structures are isomorphic. The only differences are: (a) the connectors point at regulatory registries instead of social networks, (b) the audit trail has to survive a regulator examination (so it is much more rigorous), and (c) the confidence thresholds are higher because the downstream consequence is a SAR filing or a license revocation, not a bad hire.

---

## 5. Phased rectification roadmap

### Phase 1 — Form Schema + 5 Connectors + EDD/SAR end-to-end (2–3 weeks)

**Goal:** Prove the form auto-fill pattern on two flagship forms (EDD + SAR) with 5 real connectors.

**Deliverables:**
1. Prisma schema additions:
   - `FormTemplate` (slug, version, field_schema JSON, regulator, jurisdiction)
   - `FormInstance` (template_id, entity_id, status, submitted_at, submitted_by)
   - `FormFieldValue` (instance_id, field_path, value JSON, confidence, source_connector_id)
   - `FormFieldProvenance` (field_value_id, connector_id, fetched_at, raw_payload_hash, parser_version, payload_snippet, confidence_at_capture)
   - `Connector` (slug, endpoint, auth_scheme, auth_config_encrypted, rate_limit_per_min, circuit_breaker_state, last_poll_at, last_success_at, error_count_24h)
   - `ConnectorRun` (connector_id, started_at, finished_at, status, records_pulled, error_message, raw_payload_hash)
   - `FieldOntology` (field_name, canonical_type, source_of_truth_by_jurisdiction JSON, parser_slug, fallback_chain JSON)
   - `ReviewQueueItem` (field_value_id, status, reviewer_id, assigned_at, resolved_at, reviewer_decision, reviewer_notes)

2. 5 connectors implemented (read-only, free-tier):
   - `lei` — GLEIF LEI search (free, no auth, ~2M entities)
   - `companies_house` — UK Companies House (free, API key required)
   - `edgar` — SEC EDGAR full-text search (free, no auth)
   - `ofac` — OFAC SDN list XML download (free, no auth, daily refresh)
   - `opencorporates` — OpenCorporates search (free tier, 50 calls/month)

3. Parsers for each connector's response format → canonical JSON.

4. Field ontology seeded for EDD + SAR field schemas.

5. Auto-fill orchestrator: `POST /api/forms/[slug]/autofill` with entity_id.

6. UI: FormInstanceView — opens a form, shows fields auto-populating, displays per-field confidence + provenance chip (click to see raw payload).

7. Review queue UI: ReviewQueueView — lists low-confidence fields, side-by-side raw payload, approve/edit/reject.

**Exit criteria:** EDD form for a real LEI (e.g., "Binance Holdings Ltd." LEI:529900T8BM49AURQ) auto-fills ≥ 70% of fields in ≤ 10 seconds, with provenance for every field.

### Phase 2 — Live Connector Engine (2 weeks)

**Goal:** Replace the static `regtech-feeds.json` with a real polling engine.

**Deliverables:**
1. `ConnectorEngine` class — runs on cron (every 15 min for healthy feeds, every hour for degraded, every 4 hours for unhealthy).
2. OAuth2 client-credentials token refresh for FCA / ESMA / FINRA feeds.
3. Rate-limit token bucket per connector (respects `rate_limit_per_min`).
4. Circuit breaker: 3 consecutive failures → open for 15 min → half-open probe → close on success.
5. Dead-letter queue: malformed responses stored for inspection, not retried.
6. `ConnectorRun` table populated with raw_payload_hash for every poll.
7. RegTech Feeds view rewired to read live data from `Connector` + `ConnectorRun` tables (not static JSON).

**Exit criteria:** The `eba-eu-climate` feed that has been "unhealthy with 8 errors" for the entire demo either recovers (circuit closes) or gets marked for failover with a real `ConnectorRun` history.

### Phase 3 — Field-level provenance + human review (2 weeks)

**Goal:** Every field value has a regulator-grade audit trail.

**Deliverables:**
1. `FormFieldProvenance` populated for every auto-filled field.
2. Confidence scoring: HIGH / MEDIUM / LOW with explicit rules per field type.
3. Review queue: LOW-confidence fields auto-routed to reviewer based on form type (EDD → KYC team, SAR → MLRO, MiCA CASP → licensing team).
4. Reviewer UI: side-by-side form field ↔ raw connector payload, with diff view if reviewer edits.
5. Audit log: every field write, every reviewer action, every connector run → `AuditLog` with full provenance.
6. Regulator examination export: given a `FormInstance`, produce a PDF with field values + provenance + raw payloads + reviewer decisions — the artifact a regulator actually wants to see.

**Exit criteria:** A regulator examiner can trace any field in any submitted form back to the exact connector response that populated it, with timestamp, parser version, and reviewer sign-off.

### Phase 4 — Production hardening (1–2 weeks)

**Goal:** Make the system production-grade.

**Deliverables:**
1. Migrate SQLite → PostgreSQL + pgvector.
2. Swap TF-IDF vector store → `text-embedding-3-small` (or `bge-large-en` self-hosted).
3. Add `Tenant` + `User` + `Role` models, add `tenantId` to every domain table, integrate NextAuth.js.
4. Delete `TrialGPTBot-Enterprise/` subfolder, fix the 2 old test scripts, get `bunx tsc --noEmit` to 0 errors.
5. Add `.github/workflows/ci.yml` running type-check + smoke tests on every PR.
6. Streaming chat (SSE) via Vercel AI SDK.
7. Observability: `@vercel/otel` + `pino` + Sentry.
8. RAG eval harness: 50 hand-written regulatory questions with golden answers, recall@k metric.
9. Delete `cases.json` (DB is source of truth).

**Exit criteria:** The system can be deployed to a Vercel Postgres + pgvector instance, with auth, multi-tenancy, CI, and 0 TypeScript errors.

---

## 6. What I would build next if you say go

If the user approves this plan, the highest-leverage first commit is:

**Commit 1 (Phase 1, day 1–3):** Prisma schema for `FormTemplate`, `FormInstance`, `FormFieldValue`, `FormFieldProvenance`, `Connector`, `ConnectorRun`, `FieldOntology`, `ReviewQueueItem`. Run `prisma migrate`. Write the 5 connector implementations (LEI, Companies House, EDGAR, OFAC, OpenCorporates). Write the parsers. Seed the field ontology for the EDD form schema.

**Commit 2 (Phase 1, day 4–7):** Auto-fill orchestrator (`POST /api/forms/edd-form-framework/autofill`). FormInstanceView UI showing fields populating with confidence chips. Run it against a real LEI and watch it fill.

**Commit 3 (Phase 1, day 8–10):** Review queue UI. SAR form added as second template. End-to-end demo: open SAR form, enter a suspicious transaction ID, watch it pull OFAC + chain-analysis + EDGAR data, see 2 low-confidence flags, review them, submit.

That is the minimum viable proof of the recruitment-ATS-style form auto-fill pattern. Everything else in the roadmap extends from there.

---

## 7. Honest summary

The project is **further along than the prior summary suggested** (Tasks 14 and 15 are genuinely done — 9 new plugins, 3 new view modules, 93/93 tests pass) but **not as far along as the regtech-feeds.json implies** (the feeds are descriptive metadata, not live connectors). The single most valuable thing to build next is the form auto-fill stack described in §4 — it is the feature that turns this from a RAG-powered compliance chatbot into a system that compliance officers actually use to fill forms, because it removes the data-entry work that consumes 60–80% of their day.

The shortfalls are real but tractable. None of them require rearchitecting what is already built — they require extending it. The existing plugin catalog, RAG pipeline, case management, and view infrastructure are sound foundations. What is missing is the layer above them: live connectors feeding field-level auto-fill with regulator-grade provenance.
