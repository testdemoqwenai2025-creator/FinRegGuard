/**
 * Connector Registry
 * ==================
 *
 * Wires the 5 connector implementations into a single lookup map.
 * The orchestrator (L5) imports `getConnector(slug)` to get the
 * implementation for a given Connector row in the DB.
 *
 * To add a new connector:
 *   1. Implement the BaseConnector interface in a new file
 *   2. Import it here and add to the CONNECTORS map
 *   3. Add a Connector row to the DB (via the seed script)
 */

import type { BaseConnector } from './types'
import { LeiConnector } from './lei'
import { CompaniesHouseConnector } from './companies-house'
import { EdgarConnector } from './edgar'
import { OfacConnector } from './ofac'
import { OpenCorporatesConnector } from './opencorporates'

const CONNECTORS: Record<string, BaseConnector> = {
  lei: new LeiConnector(),
  companies_house: new CompaniesHouseConnector(),
  edgar: new EdgarConnector(),
  ofac: new OfacConnector(),
  opencorporates: new OpenCorporatesConnector(),
}

/** Get a connector implementation by slug. Returns undefined if not registered. */
export function getConnector(slug: string): BaseConnector | undefined {
  return CONNECTORS[slug]
}

/** List all registered connector slugs. */
export function listConnectorSlugs(): string[] {
  return Object.keys(CONNECTORS)
}

/**
 * Parse an entity identifier string into an EntityLookup.
 *
 * Accepted formats:
 *   - "LEI:529900T8BM49AURQ"     → { kind: 'lei', value: '529900T8BM49AURQ' }
 *   - "CRN:12345678"             → { kind: 'crn', value: '12345678' }
 *   - "CIK:0001067983"           → { kind: 'edgar_id', value: '0001067983' }
 *   - "OFAC:12345"               → { kind: 'ofac_id', value: '12345' }
 *   - "NAME:Binance Holdings"    → { kind: 'name', value: 'Binance Holdings' }
 *   - "0xabc123..."              → { kind: 'txn_hash', value: '0xabc...' } (>=40 chars, starts with 0x)
 *   - "529900T8BM49AURQ"         → { kind: 'lei', value: '529900...' } (no prefix — assume LEI if 20 chars alphanumeric)
 *   - "Binance Holdings"         → { kind: 'name', value: 'Binance Holdings' } (default fallback)
 */
export function parseEntityId(raw: string, jurisdiction?: string): import('./types').EntityLookup {
  const trimmed = raw.trim()
  const upper = trimmed.toUpperCase()

  // Prefixed formats
  if (upper.startsWith('LEI:')) {
    return { raw: trimmed, kind: 'lei', value: trimmed.slice(4).trim(), jurisdiction }
  }
  if (upper.startsWith('CRN:')) {
    return { raw: trimmed, kind: 'crn', value: trimmed.slice(4).trim(), jurisdiction }
  }
  if (upper.startsWith('CIK:')) {
    return { raw: trimmed, kind: 'edgar_id', value: trimmed.slice(4).trim(), jurisdiction }
  }
  if (upper.startsWith('OFAC:')) {
    return { raw: trimmed, kind: 'ofac_id', value: trimmed.slice(5).trim(), jurisdiction }
  }
  if (upper.startsWith('NAME:')) {
    return { raw: trimmed, kind: 'name', value: trimmed.slice(5).trim(), jurisdiction }
  }

  // Transaction hash (Ethereum-style)
  if (/^0x[a-fA-F0-9]{40,}$/.test(trimmed)) {
    return { raw: trimmed, kind: 'txn_hash', value: trimmed, jurisdiction }
  }

  // Bare LEI (20 chars, alphanumeric, no spaces)
  if (/^[A-Z0-9]{20}$/.test(upper)) {
    return { raw: trimmed, kind: 'lei', value: upper, jurisdiction }
  }

  // Default: treat as a name search
  return { raw: trimmed, kind: 'name', value: trimmed, jurisdiction }
}
