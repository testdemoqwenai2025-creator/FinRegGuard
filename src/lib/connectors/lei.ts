/**
 * LEI Connector (GLEIF — Global Legal Entity Identifier Foundation)
 * =================================================================
 *
 * Free, no auth, ~2.5M entities globally. The closest thing to a
 * universal corporate registry — every regulated financial counterparty
 * is required to have an LEI under MiFID II / EMIR / Dodd-Frank.
 *
 * Endpoint: https://api.gleif.org/api/v1/legal-entities
 * Docs:     https://api.gleif.org/api/v1/
 * Auth:     none (public API)
 * Rate:     60 req/min (gentleman's agreement; no hard limit enforced)
 *
 * Lookup modes:
 *   - kind=lei   → filter[lei]=<value>
 *   - kind=name  → search[name]=<value>
 *
 * Parsed fields (canonical):
 *   - legal_name            (from entity.legalName.name)
 *   - jurisdiction          (from entity.legalAddress.country, ISO 3166-1 alpha-2)
 *   - incorporation_date    (from entity.registrationAuthority.entityRegistrationDateList, if present)
 *   - lei_status            (from entity.status — ISSUED|LAPSED|RETIRED)
 *   - entity_category       (from entity.category — GENERAL|FINANCIAL|...)
 *   - legal_address         (from entity.legalAddress — full object)
 *   - headquarters_address  (from entity.headquartersAddress — full object)
 *   - parent_lei            (from entity.directParent.lei, if present)
 *
 * Confidence:
 *   - LEI exact lookup:     0.95 (authoritative, regulator-grade)
 *   - Name search:          0.70 (heuristic — multiple matches possible)
 */

import type { BaseConnector, EntityLookup, FetchResult, ParsedResponse, ParsedField } from './types'
import { sha256, truncate, redactUrl, acquireToken, checkCircuit, recordSuccess, recordFailure, confidenceBand } from './types'

const GLEIF_ENDPOINT = 'https://api.gleif.org/api/v1/legal-entities'
const PARSER_VERSION = '1.0.0'

export class LeiConnector implements BaseConnector {
  readonly slug = 'lei'
  readonly name = 'GLEIF LEI Registry'
  readonly endpoint = GLEIF_ENDPOINT
  readonly authScheme = 'none' as const
  readonly rateLimitPerMin = 60

  async fetch(lookup: EntityLookup): Promise<FetchResult> {
    const startedAt = Date.now()

    // Circuit breaker
    const circuit = checkCircuit(this.slug)
    if (circuit === 'open') {
      return this.fail(lookup, 'circuit_open', 0, '', 'Circuit breaker open (3 consecutive failures)')
    }

    // Rate limit
    if (!acquireToken(this.slug, this.rateLimitPerMin)) {
      return this.fail(lookup, 'rate_limited', 0, '', `Rate limit exceeded (${this.rateLimitPerMin}/min)`)
    }

    // Build URL
    let url: string
    if (lookup.kind === 'lei') {
      url = `${GLEIF_ENDPOINT}?filter[lei]=${encodeURIComponent(lookup.value)}`
    } else if (lookup.kind === 'name') {
      url = `${GLEIF_ENDPOINT}?search[name]=${encodeURIComponent(lookup.value)}&page[size]=5`
    } else {
      // Try as name fallback
      url = `${GLEIF_ENDPOINT}?search[name]=${encodeURIComponent(lookup.value)}&page[size]=5`
    }

    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
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
      return { connectorSlug: this.slug, parserSlug: 'lei_search_json', parserVersion: PARSER_VERSION, fields: [], found: false, rawRecordCount: 0 }
    }

    const items: any[] = data?.data ?? []
    if (items.length === 0) {
      return { connectorSlug: this.slug, parserSlug: 'lei_search_json', parserVersion: PARSER_VERSION, fields: [], found: false, rawRecordCount: 0 }
    }

    // Pick best match: exact LEI match wins; else first result
    let entity: any
    if (lookup.kind === 'lei') {
      entity = items.find((it) => it.attributes?.lei === lookup.value) ?? items[0]
    } else {
      entity = items[0] // name search — first result is best match
    }

    const attrs = entity?.attributes ?? {}
    const legalAddress = attrs.legalAddress ?? {}
    const hqAddress = attrs.headquartersAddress ?? {}
    const isExactLei = lookup.kind === 'lei' && attrs.lei === lookup.value
    const confidence = isExactLei ? 0.95 : 0.7

    const fields: ParsedField[] = [
      { field: 'legal_name', value: attrs.legalName?.name ?? null, confidence, payloadPath: '/data/0/attributes/legalName/name', note: isExactLei ? 'Exact LEI match' : 'Name search top hit' },
      { field: 'jurisdiction', value: legalAddress.country ?? null, confidence, payloadPath: '/data/0/attributes/legalAddress/country' },
      { field: 'incorporation_date', value: attrs.registrationAuthority?.entityRegistrationDateList?.[0]?.entityRegistrationDate ?? null, confidence: confidence * 0.9, payloadPath: '/data/0/attributes/registrationAuthority/entityRegistrationDateList/0/entityRegistrationDate' },
      { field: 'lei_status', value: attrs.status ?? null, confidence, payloadPath: '/data/0/attributes/status' },
      { field: 'entity_category', value: attrs.category ?? null, confidence, payloadPath: '/data/0/attributes/category' },
      { field: 'legal_address', value: legalAddress, confidence, payloadPath: '/data/0/attributes/legalAddress' },
      { field: 'headquarters_address', value: hqAddress, confidence: confidence * 0.95, payloadPath: '/data/0/attributes/headquartersAddress' },
    ]

    const parent = attrs.directParent
    if (parent?.lei) {
      fields.push({ field: 'parent_lei', value: parent.lei, confidence: confidence * 0.9, payloadPath: '/data/0/attributes/directParent/lei' })
    }

    return {
      connectorSlug: this.slug,
      parserSlug: 'lei_search_json',
      parserVersion: PARSER_VERSION,
      fields,
      found: true,
      rawRecordCount: items.length,
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

// Avoid unused-import warning when confidenceBand is not used in this file
void confidenceBand
