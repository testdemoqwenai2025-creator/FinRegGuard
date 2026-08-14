/**
 * SEC EDGAR Connector (US)
 * ========================
 *
 * Free, no auth, ~10TB of regulatory filings (10-K, 10-Q, 8-K, Form ADV, Form PF, etc.).
 * Docs: https://www.sec.gov/edgar/sec-api-documentation
 *
 * Endpoint: https://efts.sec.gov/LATEST/search-index?q=...
 *          https://data.sec.gov/submissions/CIK{padded}.json
 *
 * Auth:     none — but requires a descriptive User-Agent header
 * Rate:     10 req/s (SEC fair-access policy)
 *
 * Lookup modes:
 *   - kind=name → full-text search for filings by company name
 *   - kind=edgar_id → direct CIK lookup (submissions endpoint)
 *
 * Parsed fields:
 *   - legal_name            (entity name)
 *   - jurisdiction          ("US" — SEC is US-only)
 *   - incorporation_date    (not directly available; we report entityCreationDate if present)
 *   - cik                   (Central Index Key — SEC's permanent entity ID)
 *   - sic_code              (Standard Industrial Classification)
 *   - sic_description       (human-readable SIC)
 *   - filings_count         (total filings on file)
 *   - recent_filings        (array of {form, filingDate, accessionNo})
 *   - state_of_incorporation (e.g., "DE" for Delaware)
 *
 * Confidence:
 *   - CIK exact:            0.95 (authoritative US registry)
 *   - Name search:          0.70 (multiple matches common)
 *
 * Note: EDGAR does not maintain a beneficial-ownership register directly.
 * The SEC's Form ADV (for investment advisers) has Schedule D owners, but
 * that is a separate dataset — handled by the form-adv plugin, not here.
 */

import type { BaseConnector, EntityLookup, FetchResult, ParsedResponse, ParsedField } from './types'
import { sha256, truncate, redactUrl, acquireToken, checkCircuit, recordSuccess, recordFailure } from './types'

const EDGAR_SEARCH_ENDPOINT = 'https://efts.sec.gov/LATEST/search-index'
const EDGAR_SUBMISSIONS_ENDPOINT = 'https://data.sec.gov/submissions'
const PARSER_VERSION = '1.0.0'

export class EdgarConnector implements BaseConnector {
  readonly slug = 'edgar'
  readonly name = 'SEC EDGAR (US filings registry)'
  readonly endpoint = EDGAR_SEARCH_ENDPOINT
  readonly authScheme = 'none' as const
  readonly rateLimitPerMin = 600 // 10 req/s

  async fetch(lookup: EntityLookup): Promise<FetchResult> {
    const startedAt = Date.now()

    if (checkCircuit(this.slug) === 'open') {
      return this.fail(lookup, 'circuit_open', 0, '', 'Circuit breaker open')
    }
    if (!acquireToken(this.slug, this.rateLimitPerMin)) {
      return this.fail(lookup, 'rate_limited', 0, '', `Rate limit exceeded (${this.rateLimitPerMin}/min)`)
    }

    let url: string
    if (lookup.kind === 'edgar_id') {
      // Direct CIK lookup — pad to 10 digits
      const cikPadded = lookup.value.padStart(10, '0')
      url = `${EDGAR_SUBMISSIONS_ENDPOINT}/CIK${cikPadded}.json`
    } else {
      // Full-text search
      url = `${EDGAR_SEARCH_ENDPOINT}?q=${encodeURIComponent(`"${lookup.value}"`)}&dateRange=custom&startdt=2024-01-01&forms=10-K,10-Q`
    }

    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RegGuardAI/1.0 compliance-prototype contact@regguard.ai',
        },
        signal: AbortSignal.timeout(20_000),
      })
      const rawBody = await res.text()
      const latencyMs = Date.now() - startedAt

      if (!res.ok) {
        recordFailure(this.slug)
        return this.fail(lookup, 'failure', res.status, rawBody, `HTTP ${res.status}`, url, latencyMs)
      }

      const parsed = this.parse(rawBody, lookup)
      recordSuccess(this.slug)

      return {
        connectorSlug: this.slug,
        httpStatus: res.status,
        success: parsed.found,
        status: parsed.found ? 'success' : 'partial',
        rawBody,
        rawPayloadHash: sha256(rawBody),
        payloadSnippet: truncate(rawBody),
        endpointCalled: redactUrl(url),
        latencyMs,
        parsed,
      }
    } catch (err) {
      recordFailure(this.slug)
      const msg = err instanceof Error ? err.message : String(err)
      return this.fail(lookup, 'failure', 0, '', msg, url, Date.now() - startedAt)
    }
  }

  parse(rawBody: string, lookup: EntityLookup): ParsedResponse {
    let data: any
    try {
      data = JSON.parse(rawBody)
    } catch {
      return { connectorSlug: this.slug, parserSlug: 'edgar_submissions_json', parserVersion: PARSER_VERSION, fields: [], found: false, rawRecordCount: 0 }
    }

    if (lookup.kind === 'edgar_id') {
      // Submissions endpoint — single entity
      const entity = data
      const name = entity?.name ?? null
      if (!name) {
        return { connectorSlug: this.slug, parserSlug: 'edgar_submissions_json', parserVersion: PARSER_VERSION, fields: [], found: false, rawRecordCount: 0 }
      }
      const cik = String(entity?.cik ?? lookup.value)
      const sic = entity?.sic ?? null
      const sicDesc = entity?.sicDescription ?? null
      const stateInc = entity?.addresses?.mailing?.stateOrCountry ?? entity?.entityType ?? null
      const recent = entity?.filings?.recent ?? {}
      const recentFilings = (recent.form ?? []).slice(0, 10).map((f: string, i: number) => ({
        form: f,
        filingDate: recent.filingDate?.[i] ?? null,
        accessionNo: recent.accessionNumber?.[i] ?? null,
      }))

      const fields: ParsedField[] = [
        { field: 'legal_name', value: name, confidence: 0.95, payloadPath: '/name' },
        { field: 'jurisdiction', value: 'US', confidence: 1.0, payloadPath: '(derived — SEC EDGAR is US-only)' },
        { field: 'cik', value: cik, confidence: 0.95, payloadPath: '/cik' },
        { field: 'sic_code', value: sic, confidence: 0.95, payloadPath: '/sic' },
        { field: 'sic_description', value: sicDesc, confidence: 0.95, payloadPath: '/sicDescription' },
        { field: 'state_of_incorporation', value: stateInc, confidence: 0.85, payloadPath: '/addresses/mailing/stateOrCountry' },
        { field: 'filings_count', value: entity?.filings?.files?.[0]?.filingCount ?? recentFilings.length, confidence: 0.9, payloadPath: '/filings/files/0/filingCount' },
        { field: 'recent_filings', value: recentFilings, confidence: 0.95, payloadPath: '/filings/recent' },
      ]
      return {
        connectorSlug: this.slug,
        parserSlug: 'edgar_submissions_json',
        parserVersion: PARSER_VERSION,
        fields,
        found: true,
        rawRecordCount: 1,
      }
    } else {
      // Full-text search — { hits: { hits: [...] } }
      const hits = data?.hits?.hits ?? []
      if (hits.length === 0) {
        return { connectorSlug: this.slug, parserSlug: 'edgar_search_json', parserVersion: PARSER_VERSION, fields: [], found: false, rawRecordCount: 0 }
      }
      const top = hits[0]._source ?? {}
      const cik = top?.cik ?? null
      const name = top?.entity_name ?? top?.display_names?.[0] ?? null

      const fields: ParsedField[] = [
        { field: 'legal_name', value: name, confidence: 0.7, payloadPath: '/hits/hits/0/_source/entity_name', note: 'Top search hit — verify with CIK lookup' },
        { field: 'jurisdiction', value: 'US', confidence: 1.0, payloadPath: '(derived — SEC EDGAR is US-only)' },
        { field: 'cik', value: cik, confidence: 0.75, payloadPath: '/hits/hits/0/_source/cik' },
      ]
      return {
        connectorSlug: this.slug,
        parserSlug: 'edgar_search_json',
        parserVersion: PARSER_VERSION,
        fields,
        found: !!name,
        rawRecordCount: hits.length,
      }
    }
  }

  private fail(
    lookup: EntityLookup,
    status: FetchResult['status'],
    httpStatus: number,
    rawBody: string,
    errorMessage: string,
    endpointCalled?: string,
    latencyMs = 0,
  ): FetchResult {
    return {
      connectorSlug: this.slug,
      httpStatus,
      success: false,
      status,
      rawBody,
      rawPayloadHash: rawBody ? sha256(rawBody) : '',
      payloadSnippet: truncate(rawBody || errorMessage),
      endpointCalled: endpointCalled ?? '',
      latencyMs,
      errorMessage,
      parsed: undefined,
    }
  }
}
