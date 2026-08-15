/**
 * OFAC SDN Connector (US Treasury — Office of Foreign Assets Control)
 * ===================================================================
 *
 * Free, no auth, daily-refreshed XML list of sanctioned individuals &
 * entities. ~12,000 entries (individuals + entities + aircraft + vessels).
 *
 * Endpoint: https://www.treasury.gov/ofac/downloads/sdn.xml
 * Format:   LISTS + SDN XML schema (not standard XML — custom OFAC schema)
 * Docs:     https://sanctionslist.ofac.treas.gov/Home/SdnList
 *
 * Lookup modes:
 *   - kind=name   → XML scan for matching <FirstName>/<LastName> or <EntityName>
 *   - kind=ofac_id → XML scan for <SDN> programId match
 *
 * Parsed fields:
 *   - sanctions_screening_result (object: {hit: bool, matches: [...], checked_at})
 *   - sanctions_match_count      (integer)
 *
 * Confidence:
 *   - No hits:              0.95 (negative screen is high-confidence after
 *                              a full XML scan with no close matches)
 *   - Exact ID match:       1.00 (definitive sanctions hit)
 *   - Name near-match:      0.50 (heuristic — flagged for review)
 *
 * Performance:
 *   The SDN list is ~12 MB uncompressed. We download once per ConnectorRun
 *   and cache the parsed entries in-memory for 6 hours. Subsequent lookups
 *   hit the cache (no network call). The ConnectorRun row records the
 *   download hash so provenance is preserved.
 */

import type { BaseConnector, EntityLookup, FetchResult, ParsedResponse, ParsedField } from './types'
import { sha256, truncate, redactUrl, acquireToken, checkCircuit, recordSuccess, recordFailure } from './types'

const OFAC_SDN_URL = 'https://www.treasury.gov/ofac/downloads/sdn.xml'
const PARSER_VERSION = '1.0.0'

// In-memory cache of parsed SDN entries
type SdnEntry = {
  id: string
  type: 'individual' | 'entity' | 'vessel' | 'aircraft'
  primaryName: string
  altNames: string[]
  programs: string[]
  country: string | null
}
let sdnCache: { entries: SdnEntry[]; fetchedAt: number; payloadHash: string } | null = null
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

export class OfacConnector implements BaseConnector {
  readonly slug = 'ofac'
  readonly name = 'OFAC SDN Sanctions List (US Treasury)'
  readonly endpoint = OFAC_SDN_URL
  readonly authScheme = 'none' as const
  readonly rateLimitPerMin = 5 // 1 download per ~12 min — list is daily-refreshed

  async fetch(lookup: EntityLookup): Promise<FetchResult> {
    const startedAt = Date.now()

    if (checkCircuit(this.slug) === 'open') {
      return this.fail(lookup, 'circuit_open', 0, '', 'Circuit breaker open')
    }
    if (!acquireToken(this.slug, this.rateLimitPerMin)) {
      // Even if rate-limited, we can still serve from cache
      if (sdnCache && Date.now() - sdnCache.fetchedAt < CACHE_TTL_MS) {
        return this.screenFromCache(lookup, sdnCache, startedAt, true)
      }
      return this.fail(lookup, 'rate_limited', 0, '', `Rate limit exceeded (${this.rateLimitPerMin}/min) and no cache available`)
    }

    // Use cached list if fresh
    if (sdnCache && Date.now() - sdnCache.fetchedAt < CACHE_TTL_MS) {
      return this.screenFromCache(lookup, sdnCache, startedAt, false)
    }

    // Download fresh SDN list
    try {
      const res = await fetch(OFAC_SDN_URL, {
        headers: {
          'Accept': 'application/xml',
          'User-Agent': 'RegGuardAI/1.0 compliance-prototype contact@regguard.ai',
          'Accept-Encoding': 'gzip',
        },
        signal: AbortSignal.timeout(60_000),
      })
      const rawBody = await res.text()
      const latencyMs = Date.now() - startedAt

      if (!res.ok) {
        recordFailure(this.slug)
        return this.fail(lookup, 'failure', res.status, rawBody, `HTTP ${res.status}`, OFAC_SDN_URL, latencyMs)
      }

      const payloadHash = sha256(rawBody)
      const entries = this.parseSdnXml(rawBody)
      sdnCache = { entries, fetchedAt: Date.now(), payloadHash }
      recordSuccess(this.slug)

      const parsed = this.screenAgainstEntries(lookup, entries, payloadHash, false)
      return {
        connectorSlug: this.slug,
        httpStatus: res.status,
        success: true,
        status: 'success',
        rawBody,
        rawPayloadHash: payloadHash,
        payloadSnippet: truncate(rawBody),
        endpointCalled: redactUrl(OFAC_SDN_URL),
        latencyMs,
        parsed,
      }
    } catch (err) {
      recordFailure(this.slug)
      const msg = err instanceof Error ? err.message : String(err)
      return this.fail(lookup, 'failure', 0, '', msg, OFAC_SDN_URL, Date.now() - startedAt)
    }
  }

  parse(rawBody: string, lookup: EntityLookup): ParsedResponse {
    const payloadHash = sha256(rawBody)
    const entries = this.parseSdnXml(rawBody)
    return this.screenAgainstEntries(lookup, entries, payloadHash, false)
  }

  /** Parse the OFAC SDN XML into a flat array of entries. */
  private parseSdnXml(xml: string): SdnEntry[] {
    const entries: SdnEntry[] = []
    // Lightweight regex extraction — avoids pulling in a full XML parser
    // dependency. OFAC SDN XML is well-structured and predictable.
    const sdnRegex = /<sdnEntry>([\s\S]*?)<\/sdnEntry>/g
    let match: RegExpExecArray | null
    while ((match = sdnRegex.exec(xml)) !== null) {
      const block = match[1]
      const id = this.extractTag(block, 'sdnNumber') ?? ''
      const type = (this.extractTag(block, 'sdnType') ?? '').toLowerCase() as SdnEntry['type']
      const firstName = this.extractTag(block, 'firstName') ?? ''
      const lastName = this.extractTag(block, 'lastName') ?? ''
      const entityName = this.extractTag(block, 'entityName') ?? ''

      const primaryName = type === 'individual'
        ? `${firstName} ${lastName}`.trim()
        : entityName

      const altNames: string[] = []
      const akaRegex = /<aka>([\s\S]*?)<\/aka>/g
      let aka: RegExpExecArray | null
      while ((aka = akaRegex.exec(block)) !== null) {
        const akaType = this.extractTag(aka[1], 'type') ?? ''
        const akaCategory = this.extractTag(aka[1], 'category') ?? ''
        const akaFirstName = this.extractTag(aka[1], 'firstName') ?? ''
        const akaLastName = this.extractTag(aka[1], 'lastName') ?? ''
        const akaEntityName = this.extractTag(aka[1], 'entityName') ?? ''
        const akaName = akaType === 'individual' || akaCategory === 'individual'
          ? `${akaFirstName} ${akaLastName}`.trim()
          : akaEntityName
        if (akaName) altNames.push(akaName)
      }

      const programs: string[] = []
      const progRegex = /<program>([\s\S]*?)<\/program>/g
      let prog: RegExpExecArray | null
      while ((prog = progRegex.exec(block)) !== null) {
        const p = this.extractTag(prog[1], 'program') ?? ''
        if (p) programs.push(p)
      }

      const country = this.extractTag(block, 'country') ?? null

      if (primaryName) {
        entries.push({
          id,
          type: type || 'entity',
          primaryName,
          altNames,
          programs,
          country,
        })
      }
    }
    return entries
  }

  private extractTag(block: string, tag: string): string | null {
    const re = new RegExp(`<${tag}>([^<]*)</${tag}>`)
    const m = block.match(re)
    return m ? m[1].trim() : null
  }

  /** Screen the lookup value against the parsed SDN entries. */
  private screenAgainstEntries(
    lookup: EntityLookup,
    entries: SdnEntry[],
    payloadHash: string,
    fromCache: boolean,
  ): ParsedResponse {
    const searchValue = lookup.value.toLowerCase().trim()
    const matches: any[] = []

    for (const entry of entries) {
      let score = 0
      if (lookup.kind === 'ofac_id' && entry.id === lookup.value) {
        score = 1.0
      } else if (lookup.kind === 'name') {
        const primaryLower = entry.primaryName.toLowerCase()
        if (primaryLower === searchValue) {
          score = 0.95 // exact name match
        } else if (primaryLower.includes(searchValue) || searchValue.includes(primaryLower)) {
          score = 0.7 // substring match
        } else if (entry.altNames.some((a) => a.toLowerCase().includes(searchValue))) {
          score = 0.5 // alt-name match
        }
      }
      if (score > 0) {
        matches.push({
          sdn_id: entry.id,
          name: entry.primaryName,
          type: entry.type,
          programs: entry.programs,
          country: entry.country,
          match_score: score,
        })
      }
    }

    const hit = matches.length > 0
    const confidence = hit
      ? Math.max(...matches.map((m) => m.match_score))
      : 0.95 // negative screen is high-confidence (full XML scanned)

    const screeningResult = {
      hit,
      match_count: matches.length,
      matches: matches.slice(0, 10), // cap at 10 for the field value
      checked_at: new Date().toISOString(),
      list_hash: payloadHash.slice(0, 16),
      list_fetched_at_cache: fromCache,
    }

    const fields: ParsedField[] = [
      {
        field: 'sanctions_screening_result',
        value: screeningResult,
        confidence,
        payloadPath: '(derived from full SDN list scan)',
        note: hit
          ? `SANCTIONS HIT — ${matches.length} match(es). Highest score: ${confidence.toFixed(2)}`
          : `No sanctions hits. Full SDN list (${entries.length} entries) scanned.`,
      },
      {
        field: 'sanctions_match_count',
        value: matches.length,
        confidence,
        payloadPath: '(derived from full SDN list scan)',
      },
    ]

    return {
      connectorSlug: this.slug,
      parserSlug: 'ofac_sd_xml',
      parserVersion: PARSER_VERSION,
      fields,
      found: true, // always "found" — even a no-hit screen is a valid result
      rawRecordCount: entries.length,
    }
  }

  /** Screen from cached SDN list — no network call needed. */
  private screenFromCache(
    lookup: EntityLookup,
    cache: NonNullable<typeof sdnCache>,
    startedAt: number,
    rateLimited: boolean,
  ): FetchResult {
    const parsed = this.screenAgainstEntries(lookup, cache.entries, cache.payloadHash, true)
    return {
      connectorSlug: this.slug,
      httpStatus: 200,
      success: true,
      status: 'success',
      rawBody: `(served from cache — list hash ${cache.payloadHash.slice(0, 16)})`,
      rawPayloadHash: cache.payloadHash,
      payloadSnippet: `(served from cache — ${cache.entries.length} SDN entries, fetched at ${new Date(cache.fetchedAt).toISOString()})`,
      endpointCalled: `(cache hit${rateLimited ? ' after rate-limit short-circuit' : ''})`,
      latencyMs: Date.now() - startedAt,
      parsed,
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
