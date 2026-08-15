// scripts/audit-plugins.ts
//
// Consumes plugins/manifest.json and verifies each plugin entry against the
// actual codebase. Detects three classes of drift:
//
//   1. STATUS DRIFT — manifest says "ready" but implementation file is missing,
//      or manifest says "not_implemented" but a working file exists.
//   2. DATA DRIFT — manifest references a staticData JSON file that doesn't
//      exist in public/data/ (would cause 404 on GitHub Pages).
//   3. DEPENDENCY DRIFT — plugin depends on another plugin that isn't "ready".
//
// Optionally hits the dev server (if running) to verify routes return 200.
//
// Usage:
//   bun scripts/audit-plugins.ts                    # static checks only
//   bun scripts/audit-plugins.ts --live http://localhost:3000   # + live URL checks
//   bun scripts/audit-plugins.ts --json > report.json           # machine-readable
//
// Exit code: 0 if no drift, 1 if any drift detected. Use in CI to block merges
// that would regress the plugin surface.

import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'

const REPO_ROOT = resolve(import.meta.dir, '..')
const MANIFEST_PATH = join(REPO_ROOT, 'plugins', 'manifest.json')
const PUBLIC_DATA = join(REPO_ROOT, 'public', 'data')

interface PluginManifest {
  version: string
  updatedAt: string
  plugins: Plugin[]
}

interface Plugin {
  key: string
  name: string
  description?: string
  category: string
  status: 'ready' | 'in_progress' | 'planned' | 'deprecated' | 'not_implemented'
  owner?: string
  expectedDelivery?: string
  implementation?: {
    component?: string
    viewKey?: string
    apiRoute?: string
    staticData?: string
  }
  capabilities?: string[]
  audit?: {
    minContentLength?: number
    expectedHeading?: string
    requiresLiveRuntime?: boolean
    requiresBackButton?: boolean
  }
  dependencies?: string[]
}

interface PluginResult {
  key: string
  name: string
  status: string
  claimed: string
  issues: string[]
  checks: { name: string; pass: boolean; detail?: string }[]
}

// --- Parse args ---
const args = process.argv.slice(2)
const liveMode = args.includes('--live')
const jsonMode = args.includes('--json')
const liveUrl = liveMode
  ? (args[args.indexOf('--live') + 1] || 'http://localhost:3000').replace(/\/$/, '')
  : null

// --- Load manifest ---
if (!existsSync(MANIFEST_PATH)) {
  console.error(`FATAL: manifest not found at ${MANIFEST_PATH}`)
  process.exit(2)
}

const manifest: PluginManifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'))
console.error(`Loaded manifest v${manifest.version} — ${manifest.plugins.length} plugins`)

// Build a lookup for dependency checks
const pluginByKey = new Map<string, Plugin>()
for (const p of manifest.plugins) pluginByKey.set(p.key, p)

// --- Audit each plugin ---
const results: PluginResult[] = []

for (const p of manifest.plugins) {
  const issues: string[] = []
  const checks: PluginResult['checks'] = []

  // Check 1: implementation.component file exists (if claimed)
  if (p.implementation?.component) {
    const compPath = join(REPO_ROOT, p.implementation.component)
    const exists = existsSync(compPath)
    checks.push({ name: 'component-file', pass: exists, detail: p.implementation.component })
    if (!exists && p.status === 'ready') {
      issues.push(`STATUS DRIFT: status=ready but component file missing: ${p.implementation.component}`)
    }
  }

  // Check 2: staticData file exists (if claimed)
  if (p.implementation?.staticData) {
    const dataPath = join(REPO_ROOT, p.implementation.staticData.replace(/^public\//, 'public/'))
    const exists = existsSync(dataPath)
    checks.push({ name: 'static-data', pass: exists, detail: p.implementation.staticData })
    if (!exists && p.status === 'ready') {
      issues.push(`DATA DRIFT: status=ready but static data missing: ${p.implementation.staticData}`)
    }
  }

  // Check 3: apiRoute directory exists (if claimed)
  if (p.implementation?.apiRoute) {
    const routePath = join(REPO_ROOT, 'src', 'app', p.implementation.apiRoute.replace(/^\//, ''))
    const routeExists = existsSync(routePath) || existsSync(join(routePath, 'route.ts'))
    checks.push({ name: 'api-route', pass: routeExists, detail: p.implementation.apiRoute })
    if (!routeExists && p.status === 'ready') {
      issues.push(`ROUTE DRIFT: status=ready but API route missing: ${p.implementation.apiRoute}`)
    }
  }

  // Check 4: dependencies are ready
  if (p.dependencies && p.dependencies.length > 0) {
    for (const depKey of p.dependencies) {
      const dep = pluginByKey.get(depKey)
      if (!dep) {
        issues.push(`DEPENDENCY DRIFT: depends on unknown plugin "${depKey}"`)
        checks.push({ name: `dep:${depKey}`, pass: false, detail: 'unknown' })
      } else if (dep.status !== 'ready') {
        issues.push(`DEPENDENCY DRIFT: depends on "${depKey}" which is ${dep.status}`)
        checks.push({ name: `dep:${depKey}`, pass: false, detail: dep.status })
      } else {
        checks.push({ name: `dep:${depKey}`, pass: true })
      }
    }
  }

  // Check 5: status-specific expectations
  if (p.status === 'not_implemented') {
    // Should have NO implementation files
    if (p.implementation?.component && existsSync(join(REPO_ROOT, p.implementation.component))) {
      issues.push(`STATUS DRIFT: status=not_implemented but component file exists`)
    }
  }

  if (p.status === 'planned' && p.expectedDelivery) {
    const delivery = new Date(p.expectedDelivery)
    const now = new Date()
    if (delivery < now) {
      issues.push(`SCHEDULE DRIFT: expectedDelivery ${p.expectedDelivery} is in the past`)
    }
  }

  // Check 6: live URL (optional)
  if (liveMode && liveUrl && p.implementation?.viewKey) {
    try {
      const res = await fetch(`${liveUrl}/?view=${p.implementation.viewKey}`, {
        signal: AbortSignal.timeout(5000),
      })
      const pass = res.status === 200
      checks.push({ name: 'live-url', pass, detail: `HTTP ${res.status}` })
      if (!pass) issues.push(`LIVE DRIFT: ${liveUrl}/?view=${p.implementation.viewKey} returned ${res.status}`)
    } catch (e: any) {
      checks.push({ name: 'live-url', pass: false, detail: e.message })
      issues.push(`LIVE DRIFT: could not reach dev server — ${e.message}`)
    }
  }

  results.push({
    key: p.key,
    name: p.name,
    status: p.status,
    claimed: p.status,
    issues,
    checks,
  })
}

// --- Report ---
const total = results.length
const ready = results.filter((r) => r.status === 'ready').length
const inProgress = results.filter((r) => r.status === 'in_progress').length
const planned = results.filter((r) => r.status === 'planned').length
const notImpl = results.filter((r) => r.status === 'not_implemented').length
const deprecated = results.filter((r) => r.status === 'deprecated').length
const withIssues = results.filter((r) => r.issues.length > 0)

if (jsonMode) {
  console.log(JSON.stringify({
    manifestVersion: manifest.version,
    auditedAt: new Date().toISOString(),
    liveMode: !!liveUrl,
    liveUrl,
    summary: { total, ready, inProgress, planned, notImplemented: notImpl, deprecated, withIssues: withIssues.length },
    results,
  }, null, 2))
} else {
  console.log('')
  console.log('─'.repeat(110))
  console.log('PLUGIN AUDIT REPORT')
  console.log('─'.repeat(110))
  console.log(`Manifest:  v${manifest.version}  (${manifest.plugins.length} plugins)`)
  console.log(`Live URL:  ${liveUrl || '(not checked — pass --live <url> to enable)'}`)
  console.log('')
  console.log('| #  | Plugin                            | Category                  | Status        | Issues | Checks')
  console.log('|----|-----------------------------------|---------------------------|---------------|--------|-------')
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    const plugin = manifest.plugins.find((p) => p.key === r.key)!
    const passed = r.checks.filter((c) => c.pass).length
    const total = r.checks.length
    const issueIcon = r.issues.length > 0 ? `${r.issues.length}` : '-'
    console.log(
      `| ${String(i + 1).padStart(2)} | ${r.name.padEnd(33)} | ${plugin.category.padEnd(25)} | ${r.status.padEnd(13)} | ${String(issueIcon).padStart(6)} | ${passed}/${total}`,
    )
  }

  console.log('')
  console.log('─'.repeat(110))
  console.log('SUMMARY')
  console.log('─'.repeat(110))
  console.log(`  ready:            ${ready} / ${total}`)
  console.log(`  in_progress:      ${inProgress}`)
  console.log(`  planned:          ${planned}`)
  console.log(`  not_implemented:  ${notImpl}`)
  console.log(`  deprecated:       ${deprecated}`)
  console.log(`  with issues:      ${withIssues.length}`)

  if (withIssues.length > 0) {
    console.log('')
    console.log('─'.repeat(110))
    console.log('ISSUES (drift between manifest and codebase)')
    console.log('─'.repeat(110))
    for (const r of withIssues) {
      console.log(`\n  ${r.name}  [${r.key}]  (claimed: ${r.claimed})`)
      for (const issue of r.issues) {
        console.log(`    - ${issue}`)
      }
    }
  }

  console.log('')
  console.log('─'.repeat(110))
  console.log(withIssues.length === 0 ? 'PASS — no drift detected' : `FAIL — ${withIssues.length} plugins have drift`)
  console.log('─'.repeat(110))
}

process.exit(withIssues.length === 0 ? 0 : 1)
