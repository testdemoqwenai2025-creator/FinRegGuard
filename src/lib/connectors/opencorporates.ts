/**
 * OpenCorporates Connector (Global Corporate Registry Aggregator)
 * ================================================================
 *
 * Free tier: 50 req/month (requires free API token).
 * Covers 200+ jurisdictions — useful as a fallback when the local
 * registry (Companies House, SEC, etc.) returns no data.
 *
 * Endpoint: https://api.opencorporates.com/v0.4/companies/search
 * Auth:     api_key query param
 * Docs:     https://api.opencorporates.com/documentation/
 *
 * Lookup modes:
 *   - kind=name → ?q={name} (searches across all jurisdictions)
 *   - kind=crn  → ?q={crn}&jurisdiction_code={jur} (if jurisdiction known)
 *
 * Parsed fields:
 *   - legal_name            (company.name)
 *   - jurisdiction          (company.jurisdiction_code — e.g., "gb", "us_de")
 *   - incorporation_date    (company.incorporation_date)
 *   - company_status        (company.current_status)
 *   - company_type          (company.company_type)
 *   - registered_address    (company.registered_address)
 *   - officers              (array of {name, role, appointed_on})
 *   - previous_names        (array)
 *
 * Confidence:
 *   - Single match in correct jurisdiction:  0.85
 *   - Multiple matches:                      0.55 (heuristic — flagged for review)
 *   - No matches:                            0 (field not populated)
 */

import type { BaseConnector, EntityLookup, FetchResult, ParsedResponse, ParsedField } from './types'
import { sha256, truncate, redactUrl, acquireToken, checkCircuit, recordSuccess, recordFailure, requireEnv } from './types'

const OC_ENDPOINT = 'https://api.opencorporates.com/v0.4/companies/search'
const PARSER_VERSION = '1.0.0'

export class OpenCorporatesConnector implements BaseConnector {
  readonly slug = 'opencorporates'
  readonly name = 'OpenCorporates (global registry aggregator)'
  readonly endpoint = OC_ENDPOINT
  readonly authScheme = 'api_key_query' as const
  readonly rateLimitPerMin = 5 // gentle — 50/month budget

  async fetch(lookup: EntityLookup): Promise<FetchResult> {
    const startedAt = Date.now()

    if (checkCircuit(this.slug) === 'open') {
      return this.fail(lookup, 'circuit_open', 0, '', 'Circuit breaker open')
    }
    if (!acquireToken(this.slug, this.rateLimitPerMin)) {
      return this.fail(lookup, 'rate_limited', 0, '', `Rate limit exceeded (${this.rateLimitPerMin}/min)`)
    }

    let apiToken: string
    try {
      apiToken = requireEnv('OPENCORPORATES_API_TOKEN')
    } catch (e) {
      return this.fail(lookup, 'failure', 0, '', (e as Error).message)
    }

    // Build URL — OpenCorporates uses jurisdiction_code for filtering
    const params = new URLSearchParams({
      q: lookup.value,
      api_token: apiToken,
    })
    if (lookup.jurisdiction) {
      // Convert ISO 3166-1 alpha-2 to OC jurisdiction_code (lowercase)
      params.set('jurisdiction_code', lookup.jurisdiction.toLowerCase())
    }
    const url = `${OC_ENDPOINT}?${params.toString()}`

    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RegGuardAI/1.0 compliance-prototype',
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
      return { connectorSlug: this.slug, parserSlug: 'opencorporates_search_json', parserVersion: PARSER_VERSION, fields: [], found: false, rawRecordCount: 0 }
    }

    const results: any[] = data?.results?.companies ?? []
    if (results.length === 0) {
      return { connectorSlug: this.slug, parserSlug: 'opencorporates_search_json', parserVersion: PARSER_VERSION, fields: [], found: false, rawRecordCount: 0 }
    }

    // Pick best match — if jurisdiction specified, prefer entries from that jurisdiction
    let company: any
    let isJurisdictionMatch = false
    if (lookup.jurisdiction) {
      const jurLower = lookup.jurisdiction.toLowerCase()
      company = results.find((r) => r?.company?.jurisdiction_code?.toLowerCase().startsWith(jurLower)) ?? results[0]
      isJurisdictionMatch = !!company && company?.company?.jurisdiction_code?.toLowerCase().startsWith(jurLower)
    } else {
      company = results[0]
    }

    const c = company?.company ?? {}
    const confidence = results.length === 1 ? 0.85 : isJurisdictionMatch ? 0.75 : 0.55

    const fields: ParsedField[] = [
      { field: 'legal_name', value: c.name ?? null, confidence, payloadPath: '/results/companies/0/company/name', note: `Top of ${results.length} match(es)${isJurisdictionMatch ? ' (jurisdiction match)' : ''}` },
      { field: 'jurisdiction', value: (c.jurisdiction_code ?? '').toUpperCase(), confidence, payloadPath: '/results/companies/0/company/jurisdiction_code' },
      { field: 'incorporation_date', value: c.incorporation_date ?? null, confidence, payloadPath: '/results/companies/0/company/incorporation_date' },
      { field: 'company_status', value: c.current_status ?? null, confidence: confidence * 0.9, payloadPath: '/results/companies/0/company/current_status' },
      { field: 'company_type', value: c.company_type ?? null, confidence: confidence * 0.9, payloadPath: '/results/companies/0/company/company_type' },
      { field: 'registered_address', value: c.registered_address_in_full ?? null, confidence: confidence * 0.85, payloadPath: '/results/companies/0/company/registered_address_in_full' },
      { field: 'previous_names', value: c.previous_names ?? [], confidence: confidence * 0.85, payloadPath: '/results/companies/0/company/previous_names' },
    ]

    // Officers (if available — usually a separate API call, but sometimes embedded)
    if (c.officers?.length) {
      const officers = c.officers.slice(0, 20).map((o: any) => ({
        name: o?.name ?? null,
        role: o?.position ?? null,
        appointed_on: o?.start_date ?? null,
        resigned_on: o?.end_date ?? null,
      }))
      fields.push({
        field: 'officers',
        value: officers,
        confidence: confidence * 0.8,
        payloadPath: '/results/companies/0/company/officers',
        note: `${officers.length} officers listed`,
      })
    }

    return {
      connectorSlug: this.slug,
      parserSlug: 'opencorporates_search_json',
      parserVersion: PARSER_VERSION,
      fields,
      found: !!c.name,
      rawRecordCount: results.length,
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
