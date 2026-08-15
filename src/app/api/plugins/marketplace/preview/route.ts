import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'

/**
 * POST /api/plugins/marketplace/preview
 *
 * DeepSeek-style "test connection" probe — does a single fetch of the URL
 * and returns a preview of what the install would produce, WITHOUT
 * persisting anything to the database.
 *
 * Used by the Marketplace install form's "Test Connection" button so the
 * user can sanity-check a URL before committing to install.
 *
 * Body: { url: string }
 *
 * Returns:
 *   {
 *     ok: boolean,
 *     url: string,
 *     httpStatus: number,
 *     contentType: string | null,
 *     contentLength: number,
 *     contentHash: string,         // SHA-256 of the fetched bytes
 *     title: string | null,        // <title> for HTML, manifest name for JSON
 *     detected: {
 *       mode: 'manifest' | 'auto',
 *       regulator: string | null,
 *       jurisdiction: string | null,
 *       category: string | null,
 *       sourceType: 'web' | 'pdf' | 'manifest',
 *     },
 *     manifest?: { ... },          // full manifest if mode === 'manifest'
 *     snippet: string,             // first ~300 chars of content
 *     error?: string,
 *   }
 */
export async function POST(req: NextRequest) {
  try {
    const { url } = (await req.json()) as { url?: string }
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url required' }, { status: 400 })
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return NextResponse.json(
        {
          ok: false,
          url,
          error: 'URL must start with http:// or https://',
        },
        { status: 200 },
      )
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12_000)
    let res: Response
    try {
      res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'RegGuardAI-PluginMarketplace/1.0 (+https://github.com/testdemoqwenai2025-creator/FinRegGTP.BoT)',
        },
        redirect: 'follow',
      })
    } catch (err) {
      clearTimeout(timeout)
      const msg = err instanceof Error ? err.message : 'fetch failed'
      return NextResponse.json({
        ok: false,
        url,
        error: `Fetch failed: ${msg}`,
      })
    }
    clearTimeout(timeout)

    const contentType = res.headers.get('content-type')?.split(';')[0]?.trim() ?? null
    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        url,
        httpStatus: res.status,
        contentType,
        contentLength: 0,
        contentHash: '',
        title: null,
        detected: { mode: 'auto', regulator: null, jurisdiction: null, category: null, sourceType: 'web' },
        snippet: '',
        error: `HTTP ${res.status} ${res.statusText}`,
      })
    }

    const buf = await res.arrayBuffer()
    // Cap at 1MB for preview (install path uses 5MB cap; preview is lighter)
    const slice = buf.byteLength > 1_048_576 ? buf.slice(0, 1_048_576) : buf
    const rawContent = Buffer.from(slice).toString('utf-8')
    const contentHash = createHash('sha256').update(Buffer.from(slice)).digest('hex')

    // Detect mode: JSON manifest vs auto-discovery
    const isManifest =
      (contentType?.includes('application/json') || contentType?.includes('text/json')) &&
      rawContent.trim().startsWith('{') &&
      rawContent.includes('"manifestVersion"')

    let manifest: Record<string, unknown> | undefined
    let title: string | null = null
    let mode: 'manifest' | 'auto' = 'auto'

    if (isManifest) {
      try {
        const parsed = JSON.parse(rawContent) as Record<string, unknown>
        manifest = parsed
        title = (parsed.name as string) ?? null
        mode = 'manifest'
      } catch {
        // fall through to auto-discovery
      }
    }

    if (!title && rawContent) {
      // Extract <title> for HTML
      const m = rawContent.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (m && m[1]) {
        title = m[1].trim().slice(0, 120)
      }
    }

    // Detect regulator/jurisdiction/category from URL
    const detected = detectFromUrl(url, contentType)

    return NextResponse.json({
      ok: true,
      url,
      httpStatus: res.status,
      contentType,
      contentLength: buf.byteLength,
      contentHash,
      title,
      detected: { mode, ...detected },
      manifest,
      snippet: rawContent.slice(0, 300),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/plugins/marketplace/preview]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

const REGULATOR_BY_DOMAIN: Record<string, string> = {
  'sec.gov': 'SEC',
  'finra.org': 'FINRA',
  'fincen.gov': 'FinCEN',
  'irs.gov': 'IRS',
  'esma.europa.eu': 'ESMA',
  'eba.europa.eu': 'EBA',
  'eiopa.europa.eu': 'EIOPA',
  'ecb.europa.eu': 'ECB',
  'fca.org.uk': 'FCA',
  'pra.org.uk': 'PRA',
  'mas.gov.sg': 'MAS',
  'sfc.hk': 'SFC',
  'hkma.gov.hk': 'HKMA',
  'fsa.go.jp': 'FSA',
  'pmda.go.jp': 'PMDA',
  'apra.gov.au': 'APRA',
  'osfi-bsif.gc.ca': 'OSFI',
  'fatf-gafi.org': 'FATF',
  'bis.org': 'BIS',
  'gdpr-info.eu': 'EDPB',
  'gleif.org': 'GLEIF',
}

const JURISDICTION_BY_TLD: Array<{ test: RegExp; jurisdiction: string }> = [
  { test: /\.europa\.eu$/i, jurisdiction: 'EU' },
  { test: /\.eu$/i, jurisdiction: 'EU' },
  { test: /\.gov\.uk$/i, jurisdiction: 'UK' },
  { test: /\.org\.uk$/i, jurisdiction: 'UK' },
  { test: /\.gov\.sg$/i, jurisdiction: 'SG' },
  { test: /\.gov\.hk$/i, jurisdiction: 'HK' },
  { test: /\.go\.jp$/i, jurisdiction: 'JP' },
  { test: /\.gov\.au$/i, jurisdiction: 'AU' },
  { test: /\.gc\.ca$/i, jurisdiction: 'CA' },
  { test: /\.gov$/i, jurisdiction: 'US' },
]

const CATEGORY_BY_PATH: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /\/form[s]?\//i, category: 'form' },
  { pattern: /\/forms?\d/i, category: 'form' },
  { pattern: /\/template[s]?\//i, category: 'document' },
  { pattern: /\/guidance?\//i, category: 'document' },
  { pattern: /\/policy|policies/i, category: 'document' },
  { pattern: /\/handbook\//i, category: 'document' },
  { pattern: /\/rule[s]?\//i, category: 'document' },
  { pattern: /\/sanctions?/i, category: 'feature' },
  { pattern: /\/screening?/i, category: 'feature' },
]

function detectFromUrl(
  url: string,
  contentType: string | null,
): {
  regulator: string | null
  jurisdiction: string | null
  category: string | null
  sourceType: 'web' | 'pdf' | 'manifest'
} {
  let host: string
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    host = ''
  }

  // Regulator: longest matching domain suffix wins
  let regulator: string | null = null
  let regulatorDomainLength = 0
  for (const [domain, reg] of Object.entries(REGULATOR_BY_DOMAIN)) {
    if (host === domain || host.endsWith('.' + domain)) {
      if (domain.length > regulatorDomainLength) {
        regulator = reg
        regulatorDomainLength = domain.length
      }
    }
  }

  // Jurisdiction
  let jurisdiction: string | null = null
  for (const { test, jurisdiction: jur } of JURISDICTION_BY_TLD) {
    if (test.test(host)) {
      jurisdiction = jur
      break
    }
  }
  if (!jurisdiction && host.endsWith('.gov')) jurisdiction = 'US'
  if (!jurisdiction && (host.endsWith('.eu') || host.includes('europa.eu'))) jurisdiction = 'EU'

  // Category
  let category: string | null = null
  for (const { pattern, category: cat } of CATEGORY_BY_PATH) {
    if (pattern.test(url)) {
      category = cat
      break
    }
  }

  // Source type
  let sourceType: 'web' | 'pdf' | 'manifest' = 'web'
  if (contentType?.includes('application/pdf') || url.toLowerCase().endsWith('.pdf')) {
    sourceType = 'pdf'
  } else if (contentType?.includes('application/json')) {
    sourceType = 'manifest'
  }

  return { regulator, jurisdiction, category, sourceType }
}
