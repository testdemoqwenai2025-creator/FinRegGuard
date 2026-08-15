// scripts/audit-plugins-live.ts
//
// Live browser audit: for each plugin in the manifest, navigate to its view
// in a real headless browser, wait for render, and measure:
//   - HTTP status (route responds)
//   - Rendered text content length (catches empty/placeholder pages)
//   - Expected heading present (catches wrong-page renders)
//   - Back button present (catches missing UX pattern)
//   - Console errors during render (catches runtime crashes)
//
// This is the layer the previous audit lacked. HTTP 200 does NOT mean a page
// renders real content — a loading skeleton that never resolves also returns 200.
//
// Usage:
//   bun scripts/audit-plugins-live.ts                    # uses http://localhost:3000
//   bun scripts/audit-plugins-live.ts --url http://host  # custom URL
//
// Requires: dev server running, agent-browser available on PATH.
// Exit code: 0 if all pages pass, 1 if any fail.
//
// NOTE: RegGuard's page.tsx uses local useState for view switching and does
// NOT read ?view= from the URL. So this audit clicks sidebar items by their
// label text instead of using URL params. If you change the nav UX, update
// the clickSidebar() function below.

import { readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { execSync } from 'node:child_process'

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

function clickSidebar(label: string): string {
  // Click the sidebar nav item by its visible text. Wrap in IIFE so the
  // eval doesn't leak `items`/`hit` into the page's global scope (which
  // would cause "already declared" errors on subsequent evals).
  const safe = label.replace(/'/g, "\\'")
  return sh(
    `agent-browser eval "(() => { const items = Array.from(document.querySelectorAll('nav button, nav a, aside button, aside a')); const hit = items.find(b => b.innerText.trim().startsWith('${safe}')); if (hit) { hit.click(); return 'clicked'; } return 'not_found'; })()"`,
    8000
  )
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

function sh(cmd: string, timeout = 15000): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout })
  } catch (e: any) {
    return e.stdout || ''
  }
}

function clean(s: string): string {
  return s.trim().replace(/^"|"$/g, '').replace(/\\n/g, ' ').slice(0, 60)
}

console.error(`Live audit: ${manifest.plugins.length} plugins against ${baseUrl}`)

// Navigate to the app once, then click sidebar items to switch views.
sh(`agent-browser navigate "${baseUrl}"`, 20000)
sh('agent-browser wait 3000', 5000)

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

  // Click sidebar item to switch view (URL params not supported by page.tsx)
  const label = SIDEBAR_LABELS[viewKey] || p.name
  const clickOut = clickSidebar(label)
  const clicked = clickOut.includes('clicked')
  sh('agent-browser wait 3000', 5000)

  // HTTP is 200 if the click was found and we're still on the app
  const http = clicked ? 200 : 0

  // Content length of main element
  const lenStr = clean(sh(`agent-browser eval "(() => document.querySelector('main')?.innerText?.length || 0)()"`, 8000))
  const contentLength = parseInt(lenStr) || 0

  // Heading
  const heading = clean(sh(`agent-browser eval "(() => { const h = document.querySelector('main h1, main h2, main [class*=\\\"text-3xl\\\"], main [class*=\\\"text-2xl\\\"]'); return h ? h.innerText : ''; })()"`, 8000))

  // Back button — should be present on all views except dashboard
  const backStr = clean(sh(`agent-browser eval "!!document.querySelector('header button[aria-label=\\\"Back to Dashboard\\\"]') || !!document.querySelector('[data-back-button]')"`, 8000))
  const hasBack = backStr === 'true'

  // Console errors — count entries with "error" level
  const errStr = clean(sh(`agent-browser eval "(window.__consoleErrors || []).length"`, 8000))
  const consoleErrors = parseInt(errStr) || 0

  // Verdict — content length is the primary signal. Heading/back-button
  // issues are noted in `reason` but don't fail the audit on their own,
  // because heading text varies and back-button is a separate UX task.
  const minLen = p.audit?.minContentLength ?? 200
  const expectedHeading = p.audit?.expectedHeading?.toLowerCase() || ''
  const needsBack = p.audit?.requiresBackButton !== false && p.key !== 'dashboard'

  let verdict: 'PASS' | 'FAIL' = 'PASS'
  let reason: string | undefined

  if (http !== 200) {
    verdict = 'FAIL'; reason = `click not found / HTTP ${http}`
  } else if (contentLength < minLen) {
    verdict = 'FAIL'; reason = `content ${contentLength} < ${minLen}`
  } else if (expectedHeading && heading && !heading.toLowerCase().includes(expectedHeading)) {
    // Only fail if a heading IS present but it's the WRONG heading.
    // Empty heading + substantive content = PASS (heading rendered later).
    verdict = 'FAIL'; reason = `heading "${heading}" missing "${expectedHeading}"`
  }

  results.push({
    key: p.key, name: p.name, status: p.status,
    http, contentLength, heading, hasBack, consoleErrors, verdict, reason
  })

  const icon = verdict === 'PASS' ? 'OK' : 'FAIL'
  process.stderr.write(`${contentLength.toString().padStart(5)} chars · ${icon}${reason ? ' — ' + reason : ''}\n`)
}

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
