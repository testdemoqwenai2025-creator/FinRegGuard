/**
 * Companies House Connector (UK)
 * ===============================
 *
 * Free tier: 600 req/month (requires free API key).
 * Docs: https://developer.company-information.service.gov.uk/
 *
 * Endpoint: https://api.company-information.service.gov.uk
 * Auth:     basic (api_key as username, empty password)
 *
 * Lookup modes:
 *   - kind=crn   → /company/{crn}             (exact, authoritative)
 *   - kind=name  → /search/companies?q={name} (heuristic, top 5)
 *
 * Parsed fields:
 *   - legal_name            (company_name)
 *   - jurisdiction          ("UK" — always UK)
 *   - incorporation_date    (date_of_creation)
 *   - company_status        (active | dissolved | liquidation)
 *   - company_type          (ltd | plc | llp | ...)
 *   - registered_address    (registered_office_address)
 *   - sic_codes             (array of SIC codes)
 *   - officers              (array of {name, role, appointed_on, nationality})
 *
 * Confidence:
 *   - CRN exact:            0.95 (authoritative UK registry)
 *   - Name search:          0.65 (multiple matches common)
 *
 * Beneficial owners (PSC register):
 *   - Separate endpoint: /company/{crn}/persons-with-significant-control
 *   - The orchestrator calls this separately and merges into the
 *     beneficial_owners[] field.
 */

import type { BaseConnector, EntityLookup, FetchResult, ParsedResponse, ParsedField } from './types'
import { sha256, truncate, redactUrl, acquireToken, checkCircuit, recordSuccess, recordFailure, requireEnv } from './types'

const CH_ENDPOINT = 'https://api.company-information.service.gov.uk'
const PARSER_VERSION = '1.0.0'

export class CompaniesHouseConnector implements BaseConnector {
  readonly slug = 'companies_house'
  readonly name = 'UK Companies House'
  readonly endpoint = CH_ENDPOINT
  readonly authScheme = 'basic' as const
  readonly rateLimitPerMin = 10 // gentle — 600/month budget

  async fetch(lookup: EntityLookup): Promise<FetchResult> {
    const startedAt = Date.now()

    // Circuit breaker
    if (checkCircuit(this.slug) === 'open') {
      return this.fail(lookup, 'circuit_open', 0, '', 'Circuit breaker open')
    }

    // Rate limit
    if (!acquireToken(this.slug, this.rateLimitPerMin)) {
      return this.fail(lookup, 'rate_limited', 0, '', `Rate limit exceeded (${this.rateLimitPerMin}/min)`)
    }

    // Auth — read API key from env
    let apiKey: string
    try {
      apiKey = requireEnv('COMPANIES_HOUSE_API_KEY')
    } catch (e) {
      return this.fail(lookup, 'failure', 0, '', (e as Error).message)
    }

    // Build URL
    let url: string
    if (lookup.kind === 'crn') {
      url = `${CH_ENDPOINT}/company/${encodeURIComponent(lookup.value)}`
    } else {
      url = `${CH_ENDPOINT}/search/companies?q=${encodeURIComponent(lookup.value)}&items_per_page=5`
    }

    const authHeader = 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64')

    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': authHeader,
          'User-Agent': 'RegGuardAI/1.0 (compliance-prototype)',
        },
        signal: AbortSignal.timeout(20_000),
      })
      const rawBody = await res.text()
      const latencyMs = Date.now() - startedAt

      if (!res.ok) {
        recordFailure(this.slug)
        return this.fail(lookup, 'failure', res.status, rawBody, `HTTP ${res.status}`, url, latencyMs)
      }

      // If CRN lookup, also fetch PSC register (beneficial owners)
      let pscRaw = ''
      let pscFields: ParsedField[] = []
      if (lookup.kind === 'crn' && res.status === 200) {
        const pscUrl = `${CH_ENDPOINT}/company/${encodeURIComponent(lookup.value)}/persons-with-significant-control`
        try {
          const pscRes = await fetch(pscUrl, {
            headers: { 'Accept': 'application/json', 'Authorization': authHeader },
            signal: AbortSignal.timeout(15_000),
          })
          if (pscRes.ok) {
            pscRaw = await pscRes.text()
            pscFields = this.parsePsc(pscRaw)
          }
        } catch {
          // PSC fetch failure is non-fatal — main record still parses
        }
      }

      const parsed = this.parse(rawBody, lookup)
      parsed.fields.push(...pscFields)

      recordSuccess(this.slug)
      return {
        connectorSlug: this.slug,
        httpStatus: res.status,
        success: parsed.found,
        status: parsed.found ? 'success' : 'partial',
        rawBody: pscRaw ? rawBody + '\n---PSC---\n' + pscRaw : rawBody,
        rawPayloadHash: sha256(rawBody + (pscRaw ? pscRaw : '')),
        payloadSnippet: truncate(rawBody + (pscRaw ? '\n---PSC---\n' + pscRaw : '')),
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
      return { connectorSlug: this.slug, parserSlug: 'companies_house_company_json', parserVersion: PARSER_VERSION, fields: [], found: false, rawRecordCount: 0 }
    }

    // CRN lookup returns a single object; name search returns { items: [...] }
    let company: any
    let isExact: boolean
    if (lookup.kind === 'crn') {
      company = data
      isExact = data?.company_number === lookup.value
    } else {
      const items = data?.items ?? []
      if (items.length === 0) {
        return { connectorSlug: this.slug, parserSlug: 'companies_house_search_json', parserVersion: PARSER_VERSION, fields: [], found: false, rawRecordCount: 0 }
      }
      company = items[0]
      isExact = false
    }

    const confidence = isExact ? 0.95 : 0.65
    const addr = company.registered_office_address ?? {}

    const fields: ParsedField[] = [
      { field: 'legal_name', value: company.company_name ?? null, confidence, payloadPath: lookup.kind === 'crn' ? '/company_name' : '/items/0/company_name' },
      { field: 'jurisdiction', value: 'GB', confidence: 1.0, payloadPath: '(derived — Companies House is UK-only)' },
      { field: 'incorporation_date', value: company.date_of_creation ?? null, confidence, payloadPath: lookup.kind === 'crn' ? '/date_of_creation' : '/items/0/date_of_creation' },
      { field: 'company_status', value: company.company_status ?? null, confidence, payloadPath: '/company_status' },
      { field: 'company_type', value: company.type ?? null, confidence, payloadPath: '/type' },
      { field: 'registered_address', value: addr, confidence, payloadPath: '/registered_office_address' },
      { field: 'sic_codes', value: company.sic_codes ?? [], confidence: confidence * 0.95, payloadPath: '/sic_codes' },
    ]

    return {
      connectorSlug: this.slug,
      parserSlug: lookup.kind === 'crn' ? 'companies_house_company_json' : 'companies_house_search_json',
      parserVersion: PARSER_VERSION,
      fields,
      found: !!company?.company_name,
      rawRecordCount: lookup.kind === 'crn' ? 1 : (data?.items?.length ?? 0),
    }
  }

  /** Parse the PSC (persons with significant control) register. */
  private parsePsc(rawBody: string): ParsedField[] {
    let data: any
    try {
      data = JSON.parse(rawBody)
    } catch {
      return []
    }
    const items: any[] = data?.items ?? []
    if (items.length === 0) return []

    const owners = items.map((it, idx) => ({
      name: it.name ?? null,
      role: it.natures_of_control?.[0] ?? null,
      appointed_on: it.notified_on ?? null,
      nationality: it.nationality ?? null,
      country_of_residence: it.country_of_residence ?? null,
      address: it.address ?? null,
      kind: it.kind ?? null,
      _source_idx: idx,
    }))

    return [
      {
        field: 'beneficial_owners',
        value: owners,
        confidence: 0.9, // PSC register is authoritative when populated
        payloadPath: '/items',
        note: `${owners.length} PSC records from UK Companies House PSC register`,
      },
    ]
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
