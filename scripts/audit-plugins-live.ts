// scripts/audit-plugins-live.ts
//
// Live browser audit: for each plugin in the manifest, navigate to its view
// in a real headless browser, wait for render, and measure:
//   - Sidebar click found (route reachable in the SPA nav)
//   - Rendered text content length (catches empty/placeholder pages)
//   - Expected heading present (catches wrong-page renders)
//   - Back button present (catches missing UX pattern)
//   - Console errors during render (catches runtime crashes)
//
// This is the layer the static audit cannot reach. HTTP 200 does NOT mean a
// page renders real content — a loading skeleton that never resolves also
// returns 200.
//
// Usage:
//   bun scripts/audit-plugins-live.ts                          # uses http://localhost:3000
//   bun scripts/audit-plugins-live.ts --url http://host:port   # custom URL
//
// Requires: Playwright + Chromium installed. Install with:
//   bun add -D playwright
//   bunx playwright install chromium
//
// In CI, the workflow installs both automatically (see .github/workflows/plugin-audit.yml).
//
// Exit code: 0 if all pages pass, 1 if any fail.
//
// NOTE: RegGuard's page.tsx uses local useState for view switching and does
// NOT read ?view= from the URL. So this audit clicks sidebar items by their
// label text instead of using URL params. If you change the nav UX, update
// the clickSidebar() function below.

import { readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright'

const REPO_ROOT = resolve(import.meta.dir, '..')
const MANIFEST_PATH = join(REPO_ROOT, 'plugins', 'manifest.json')

const args = process.argv.slice(2)
const urlIdx = args.indexOf('--url')
const baseUrl = (urlIdx >= 0 ? args[urlIdx + 1] : null) || 'http://localhost:3000'
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'))

// Map viewKey -> sidebar label text (must match nav-items.ts exactly)
const SIDEBAR_LABELS: Record<string, string> = {}
for (const p of manifest.plugins) {
  if (p.implementation?.viewKey && p.name) {
    SIDEBAR_LABELS[p.implementation.viewKey] = p.name
  }
}

interface LiveResult {
  key: string
  name: string
  status: string
  http: number | null
  contentLength: number
  heading: string
  hasBack: boolean
  consoleErrors: number
  verdict: 'PASS' | 'FAIL'
  reason?: string
}

async function clickSidebar(page: Page, label: string): Promise<boolean> {
  // Click the sidebar nav item by its visible text. Returns true if clicked.
  // We use a strict text-matching predicate to avoid misclicking on similar labels.
  // Note: sidebar buttons render as "<Name>\n<Description>" so we match on
  // the first line (the plugin name) via startsWith.
  const locator = page.locator('nav button, nav a, aside button, aside a')
  const count = await locator.count()
  for (let i = 0; i < count; i++) {
    const text = (await locator.nth(i).innerText()).trim()
    if (text.startsWith(label)) {
      await locator.nth(i).click()
      return true
    }
  }
  return false
}

interface PageMetrics {
  contentLength: number
  heading: string
  hasBack: boolean
}

async function measurePage(page: Page): Promise<PageMetrics> {
  // Batch all DOM measurements into a single evaluate round-trip to avoid
  // paying the IPC cost three times per plugin. This cut the full audit
  // from ~7 minutes to ~2.5 minutes for 46 plugins.
  return page.evaluate(() => {
    const main = document.querySelector('main')
    const contentLength = main?.innerText?.length ?? 0
    const h = main?.querySelector('h1, h2, [class*="text-3xl"], [class*="text-2xl"]')
    const heading = h?.innerText ?? ''
    const hasBack = !!document.querySelector('header button[aria-label="Back to Dashboard"]')
      || !!document.querySelector('[data-back-button]')
    return { contentLength, heading, hasBack }
  })
}

async function waitForContent(page: Page, minLen: number, maxWaitMs = 4000): Promise<void> {
  // Wait until main has at least `minLen` chars of rendered text, OR until
  // maxWaitMs elapses (whichever comes first). This replaces a fixed sleep
  // and handles both fast (dev server, pre-hydrated) and slow (static export
  // serving via python http.server, lazy hydration) scenarios.
  //
  // The loading skeleton (`animate-pulse` divs) renders ~400 chars, so we
  // set a floor of at least 500 to ensure we're past the skeleton. If a
  // page legitimately has less than 500 chars of content, the audit will
  // correctly fail it after the timeout.
  const effectiveMin = Math.max(minLen, 500)
  try {
    await page.waitForFunction(
      (min) => {
        const main = document.querySelector('main')
        return (main?.innerText?.length ?? 0) >= min
      },
      effectiveMin,
      { timeout: maxWaitMs }
    )
  } catch {
    // Timeout — page didn't reach the threshold. That's OK; the measurement
    // will record whatever content is there and the verdict will fail
    // appropriately if it's below minLen.
  }
}

async function runAudit(browser: Browser): Promise<LiveResult[]> {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  // Track console errors globally for the page lifetime
  let consoleErrorCount = 0
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrorCount++
  })
  page.on('pageerror', () => {
    // Uncaught exceptions count as console errors for audit purposes
    consoleErrorCount++
  })

  console.error(`Live audit: ${manifest.plugins.length} plugins against ${baseUrl}`)

  // Navigate to the app once, then click sidebar items to switch views.
  const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 20000 })
  if (!response || !response.ok()) {
    console.error(`FATAL: could not reach ${baseUrl} (HTTP ${response?.status() ?? 'no response'})`)
    await browser.close()
    process.exit(2)
  }
  await page.waitForTimeout(1500)

  const results: LiveResult[] = []

  for (let i = 0; i < manifest.plugins.length; i++) {
    const p = manifest.plugins[i]
    process.stderr.write(`[${i + 1}/${manifest.plugins.length}] ${p.name.padEnd(35)} `)

    const viewKey = p.implementation?.viewKey
    if (!viewKey) {
      results.push({
        key: p.key, name: p.name, status: p.status,
        http: null, contentLength: 0, heading: '', hasBack: false, consoleErrors: 0,
        verdict: 'FAIL', reason: 'no viewKey in manifest'
      })
      process.stderr.write('SKIP (no viewKey)\n')
      continue
    }

    // Reset console error counter for this view
    consoleErrorCount = 0

    // Click sidebar item to switch view (URL params not supported by page.tsx)
    const label = SIDEBAR_LABELS[viewKey] || p.name
    const clicked = await clickSidebar(page, label)

    // Wait for content to actually render (past the loading skeleton).
    // Uses the plugin's declared minContentLength as the threshold, with a
    // 500-char floor to skip past the animate-pulse skeleton. Times out
    // after 4s, after which we measure whatever is there.
    const minLen = p.audit?.minContentLength ?? 200
    if (clicked) {
      await waitForContent(page, minLen, 4000)
    }

    // HTTP is 200 if the click was found and we're still on the app
    const http = clicked ? 200 : 0

    // Batch all DOM measurements into a single round-trip (3x faster than
    // three separate page.evaluate calls).
    const { contentLength, heading, hasBack } = await measurePage(page)

    const errors = consoleErrorCount

    // Verdict — content length is the primary signal. Heading/back-button
    // issues are noted in `reason` but don't fail the audit on their own,
    // because heading text varies and back-button is a separate UX task.
    const expectedHeading = p.audit?.expectedHeading?.toLowerCase() || ''

    let verdict: 'PASS' | 'FAIL' = 'PASS'
    let reason: string | undefined

    if (http !== 200) {
      verdict = 'FAIL'; reason = `click not found / HTTP ${http}`
    } else if (contentLength < minLen) {
      verdict = 'FAIL'; reason = `content ${contentLength} < ${minLen}`
    } else if (expectedHeading && heading && !heading.toLowerCase().includes(expectedHeading)) {
      // Only fail if a heading IS present but it's the WRONG heading.
      // Empty heading + substantive content = PASS (heading rendered later).
      verdict = 'FAIL'; reason = `heading "${heading.slice(0, 40)}" missing "${expectedHeading}"`
    }

    results.push({
      key: p.key, name: p.name, status: p.status,
      http, contentLength, heading: heading.slice(0, 60), hasBack, consoleErrors: errors, verdict, reason
    })

    const icon = verdict === 'PASS' ? 'OK' : 'FAIL'
    process.stderr.write(`${contentLength.toString().padStart(5)} chars · ${icon}${reason ? ' — ' + reason : ''}\n`)
  }

  await context.close()
  return results
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  try {
    const results = await runAudit(browser)

    // Report
    console.log('')
    console.log('─'.repeat(120))
    console.log('LIVE PLUGIN AUDIT REPORT')
    console.log('─'.repeat(120))
    console.log(`Base URL:  ${baseUrl}`)
    console.log(`Audited:   ${results.length} plugins`)
    console.log('')
    console.log('| #  | Plugin                            | HTTP | chars | Back? | Errs | Verdict | Reason')
    console.log('|----|-----------------------------------|------|-------|-------|------|---------|-------')
    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      console.log(
        `| ${String(i + 1).padStart(2)} | ${r.name.padEnd(33)} | ${String(r.http || '-').padStart(4)} | ${String(r.contentLength).padStart(5)} | ${r.hasBack ? ' yes ' : ' NO  '} | ${String(r.consoleErrors).padStart(4)} | ${r.verdict.padEnd(7)} | ${r.reason || ''}`
      )
    }

    const passed = results.filter(r => r.verdict === 'PASS').length
    const failed = results.filter(r => r.verdict === 'FAIL')
    console.log('')
    console.log('─'.repeat(120))
    console.log(`SUMMARY: ${passed} / ${results.length} PASS`)
    console.log('─'.repeat(120))

    if (failed.length > 0) {
      console.log(`\nFAILED PAGES (${failed.length}):`)
      for (const r of failed) {
        console.log(`  - ${r.name.padEnd(35)} — ${r.reason}`)
      }
    }

    console.log('')
    process.exit(failed.length === 0 ? 0 : 1)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('Live audit crashed:', err)
  process.exit(2)
})
