/**
 * Connector Layer — Types & Base Interface
 * ========================================
 *
 * L1 + L2 of the form auto-fill stack.
 *
 * A `Connector` is a typed wrapper around an external data feed
 * (LEI registry, Companies House, SEC EDGAR, OFAC SDN list,
 * OpenCorporates, etc.). Each connector implements:
 *
 *   1. `fetch()` — call the live API with an entity identifier
 *   2. `parse()` — convert the raw response into canonical JSON
 *
 * The orchestrator (L5) calls `fetch()` once per entity, then
 * walks the parsed canonical JSON to populate form fields. Every
 * fetch produces a `ConnectorRun` row in the DB with the raw
 * payload hash so reviewers can trace any field value back to
 * the exact API response that populated it.
 *
 * Auth model:
 *   - Secrets are read from `process.env` at runtime, never stored
 *     in the DB. The DB row only records the ENV variable NAME.
 *   - The `authScheme` field tells the engine how to attach the
 *     credential (header, query param, OAuth2 bearer, etc.).
 *
 * Rate limiting:
 *   - Each connector declares `rateLimitPerMin`.
 *   - The engine uses a simple in-memory token bucket per slug.
 *   - Production should swap to Redis-backed rate limiting.
 *
 * Circuit breaker:
 *   - 3 consecutive failures → open for 15 min → half-open probe.
 *   - State is persisted in `Connector.circuitBreakerState`.
 *   - When open, `fetch()` short-circuits and returns a
 *     `circuit_open` result without hitting the network.
 */


// ─────────────────────────────────────────────────────────────
// Canonical types
// ─────────────────────────────────────────────────────────────

/** The identifier used to look up an entity in a connector. */
export type EntityLookup = {
  /** The raw entity ID — e.g., "LEI:529900T8BM49AURQ", "CRN:12345678",
   *  "NAME:Binance Holdings" */
  raw: string
  /** Parsed type — lei | crn | edgar_id | name | ofac_id */
  kind: 'lei' | 'crn' | 'edgar_id' | 'name' | 'ofac_id' | 'txn_hash'
  /** Normalized value — e.g., "529900T8BM49AURQ" (LEI without prefix) */
  value: string
  /** Jurisdiction hint (ISO 3166-1 alpha-2) — picked from LEI registry
   *  if available, else from entity metadata */
  jurisdiction?: string
}

/** A single parsed field value with provenance metadata. */
export type ParsedField = {
  /** Canonical field name matching FieldOntology.fieldName */
  field: string
  /** Parsed value (JSON-serializable) */
  value: unknown
  /** Confidence score 0.0–1.0 */
  confidence: number
  /** JSON path within the raw payload — e.g., "/items/0/entity/legalName" */
  payloadPath: string
  /** Optional human-readable note (e.g., "Matched by LEI exact lookup") */
  note?: string
}

/** The canonical response shape every parser produces. */
export type ParsedResponse = {
  /** Connector slug — e.g., "lei", "companies_house" */
  connectorSlug: string
  /** Parser slug — e.g., "lei_search_json", "ofac_sd_xml" */
  parserSlug: string
  /** Parser version (semver) */
  parserVersion: string
  /** All fields extracted from the raw payload */
  fields: ParsedField[]
  /** Did the connector find the entity at all? */
  found: boolean
  /** Number of raw records in the response (before parsing) */
  rawRecordCount: number
}

/** The result of a single connector fetch. */
export type FetchResult = {
  /** Connector slug */
  connectorSlug: string
  /** HTTP status (0 if request never completed) */
  httpStatus: number
  /** Was the fetch successful (2xx + parsed without throwing)? */
  success: boolean
  /** Status enum — success | partial | failure | circuit_open | rate_limited */
  status: 'success' | 'partial' | 'failure' | 'circuit_open' | 'rate_limited'
  /** Raw response body (string — JSON, XML, etc.) */
  rawBody: string
  /** SHA-256 hash of rawBody */
  rawPayloadHash: string
  /** First 500 chars of rawBody (for the ConnectorRun row + reviewer UI) */
  payloadSnippet: string
  /** Endpoint actually called (with secrets redacted) */
  endpointCalled: string
  /** Latency in ms */
  latencyMs: number
  /** Error message if status != success */
  errorMessage?: string
  /** Parsed fields (only populated if success=true) */
  parsed?: ParsedResponse
}

// ─────────────────────────────────────────────────────────────
// Base connector interface
// ─────────────────────────────────────────────────────────────

export interface BaseConnector {
  /** Connector slug — matches Connector.slug in DB */
  readonly slug: string
  /** Human-readable name */
  readonly name: string
  /** Default endpoint URL */
  readonly endpoint: string
  /** Auth scheme — none | api_key_header | api_key_query | oauth2_client_credentials */
  readonly authScheme: AuthScheme
  /** Requests per minute (0 = unlimited) */
  readonly rateLimitPerMin: number

  /**
   * Fetch the raw response from the connector for the given entity.
   * Implementations MUST:
   *   - Check the circuit breaker (short-circuit if open)
   *   - Acquire a rate-limit token (short-circuit if exhausted)
   *   - Attach auth credentials from process.env
   *   - Time the request
   *   - Compute the SHA-256 hash of the raw body
   *   - Parse the response into canonical fields
   *   - Return a FetchResult (never throw — wrap errors in status=failure)
   */
  fetch(lookup: EntityLookup): Promise<FetchResult>

  /**
   * Parse a raw response body into canonical fields. Separated from
   * `fetch()` so reviewers can re-parse old payloads with new parser
   * versions without re-calling the API.
   */
  parse(rawBody: string, lookup: EntityLookup): ParsedResponse
}

export type AuthScheme =
  | 'none'
  | 'api_key_header'
  | 'api_key_query'
  | 'oauth2_client_credentials'
  | 'basic'

// ─────────────────────────────────────────────────────────────
// Shared utilities
// ─────────────────────────────────────────────────────────────

import { createHash } from 'node:crypto'

/** Compute SHA-256 hash of a string, return hex. */
export function sha256(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex')
}

/** Truncate a string to N chars, appending "..." if truncated. */
export function truncate(s: string, n = 500): string {
  if (s.length <= n) return s
  return s.slice(0, n) + '...'
}

/** Read an env var, throw if missing (with a clear error message). */
export function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

/** Redact secrets from a URL for safe logging. Replaces api_key=XXX query params. */
export function redactUrl(url: string): string {
  return url.replace(/([?&])(api_key|token|access_token|client_secret)=([^&]+)/gi, '$1$2=REDACTED')
}

/** Sleep for N ms. */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ─────────────────────────────────────────────────────────────
// Confidence scoring
// ─────────────────────────────────────────────────────────────

/** Map a numeric confidence (0.0–1.0) to a band label. */
export function confidenceBand(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.9) return 'high'
  if (score >= 0.7) return 'medium'
  return 'low'
}

// ─────────────────────────────────────────────────────────────
// In-memory rate limiter (token bucket per slug)
// ─────────────────────────────────────────────────────────────

const buckets = new Map<string, { tokens: number; lastRefill: number }>()

/** Acquire 1 token from the bucket; return false if exhausted. */
export function acquireToken(slug: string, rateLimitPerMin: number): boolean {
  if (rateLimitPerMin <= 0) return true // unlimited
  const now = Date.now()
  const refillRate = rateLimitPerMin / 60_000 // tokens per ms
  let bucket = buckets.get(slug)
  if (!bucket) {
    bucket = { tokens: rateLimitPerMin, lastRefill: now }
    buckets.set(slug, bucket)
  }
  // Refill
  const elapsed = now - bucket.lastRefill
  bucket.tokens = Math.min(rateLimitPerMin, bucket.tokens + elapsed * refillRate)
  bucket.lastRefill = now
  if (bucket.tokens < 1) return false
  bucket.tokens -= 1
  return true
}

// ─────────────────────────────────────────────────────────────
// Circuit breaker (in-memory; persisted via Connector table)
// ─────────────────────────────────────────────────────────────

const circuits = new Map<string, { state: 'closed' | 'open' | 'half_open'; failureCount: number; openedAt: number }>()

/** Check the circuit; return 'open' to short-circuit, else 'closed' or 'half_open'. */
export function checkCircuit(slug: string): 'closed' | 'open' | 'half_open' {
  const c = circuits.get(slug)
  if (!c) return 'closed'
  if (c.state === 'open') {
    // 15-min cooldown
    if (Date.now() - c.openedAt > 15 * 60_000) {
      c.state = 'half_open'
      return 'half_open'
    }
    return 'open'
  }
  return c.state
}

/** Record a success — close the circuit. */
export function recordSuccess(slug: string): void {
  circuits.set(slug, { state: 'closed', failureCount: 0, openedAt: 0 })
}

/** Record a failure — open the circuit after 3 consecutive failures. */
export function recordFailure(slug: string): void {
  const c = circuits.get(slug) ?? { state: 'closed' as const, failureCount: 0, openedAt: 0 }
  c.failureCount += 1
  if (c.failureCount >= 3) {
    c.state = 'open'
    c.openedAt = Date.now()
  }
  circuits.set(slug, c)
}
