// scripts/audit-all-pages.ts
// Headless audit: click through every sidebar item on the live GitHub Pages
// site, measure actual rendered content length, detect placeholder-only
// pages, and check whether each page has a Back button.

import { execSync } from 'node:child_process'

const URL = 'https://testdemoqwenai2025-creator.github.io/FinRegGuard/'

const PAGES = [
  { name: 'Dashboard',                  ref: 'e15' },
  { name: 'Regulations',                ref: 'e16' },
  { name: 'Policies',                   ref: 'e17' },
  { name: 'Audit Trail',                ref: 'e18' },
  { name: 'Risk Matrix',                ref: 'e19' },
  { name: 'AI Assistant',               ref: 'e20' },
  { name: 'Reports',                    ref: 'e21' },
  { name: 'Control Monitor',            ref: 'e22' },
  { name: 'Consumer Duty & AI Rights',  ref: 'e23' },
  { name: 'Form Auto-Fill',             ref: 'e24' },
  { name: 'Transaction Surveillance',   ref: 'e25' },
  { name: 'Comms Surveillance',         ref: 'e26' },
  { name: 'Sanctions Screening',        ref: 'e27' },
  { name: 'Network Graph',              ref: 'e28' },
  { name: 'Adaptive Thresholds',        ref: 'e29' },
  { name: 'TM Alert Taxonomy',          ref: 'e30' },
  { name: 'Quant Lab',                  ref: 'e31' },
  { name: 'Climate & ESG',              ref: 'e32' },
  { name: 'Counterfactual Simulator',   ref: 'e33' },
  { name: 'Systemic Risk',              ref: 'e34' },
  { name: 'ESG Reporting',              ref: 'e35' },
  { name: 'Multi-Agent Console',        ref: 'e36' },
  { name: 'Regulatory Watch',           ref: 'e37' },
  { name: 'Red Team Engine',            ref: 'e38' },
  { name: 'Knowledge Graph',            ref: 'e39' },
  { name: 'Fairness Testing',           ref: 'e40' },
  { name: 'Reporting Evolution',        ref: 'e41' },
  { name: 'AI/ML Model Risk Tiers',     ref: 'e42' },
  { name: 'AI/ML Governance',           ref: 'e43' },
  { name: 'Case Management',            ref: 'e44' },
  { name: 'Regulator Portal',           ref: 'e45' },
  { name: 'Whistleblower',              ref: 'e46' },
  { name: 'Chain Evidence',             ref: 'e47' },
  { name: 'Digital Assets',             ref: 'e48' },
  { name: 'RegTech Feeds',              ref: 'e49' },
  { name: 'Crypto Regulation',          ref: 'e50' },
  { name: 'Privacy & PETs',             ref: 'e51' },
  { name: 'Developer Hub',              ref: 'e52' },
  { name: 'Time Machine',               ref: 'e53' },
  { name: 'Rule Harmonizer',            ref: 'e54' },
  { name: 'Compliance Cards (XCC)',     ref: 'e55' },
  { name: 'Plugin Manager',             ref: 'e56' },
  { name: 'Marketplace',                ref: 'e57' },
  { name: 'Localization Matrix',        ref: 'e58' },
  { name: 'Transfer Impact (TIA)',      ref: 'e59' },
  { name: 'Data Sensitivity',           ref: 'e60' },
]

function sh(cmd: string): string {
  try { return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 15000 }) }
  catch (e: any) { return e.stdout || '' }
}

console.log(`Auditing ${PAGES.length} pages on ${URL}\n`)

const results = []
for (let i = 0; i < PAGES.length; i++) {
  const p = PAGES[i]
  process.stderr.write(`→ [${i+1}/${PAGES.length}] ${p.name}... `)
  sh(`agent-browser click @${p.ref}`)
  sh('agent-browser wait 2000')
  // Three simple eval calls — much more reliable than one complex one
  const lenStr = sh(`agent-browser eval "document.querySelector('main')?.innerText?.length || 0"`).trim().replace(/^"|"$/g, '')
  const len = parseInt(lenStr) || 0
  const heading = sh(`agent-browser eval "document.querySelector('main h1, main h2, main [class*=\\"text-3xl\\"]')?.innerText || 'NO_HEADING'"`).trim().replace(/^"|"$/g, '').slice(0, 50)
  // Back button: check header for "Back to Dashboard" button (only appears on non-dashboard views)
  const backStr = sh(`agent-browser eval "!!document.querySelector('header button[aria-label=\\\\\\"Back to Dashboard\\\\\\"]')"`).trim().replace(/^"|"$/g, '')
  const hasBack = backStr === 'true'

  const status = len === 0 ? 'EMPTY' : len < 200 ? 'THIN' : len < 800 ? 'LIGHT' : 'OK'
  process.stderr.write(`${len} chars · ${status}\n`)
  results.push({ ...p, len, heading, hasBack, status })
}

// Print results table
console.log('\n')
console.log('─'.repeat(100))
console.log('PAGE-BY-PAGE AUDIT RESULTS')
console.log('─'.repeat(100))
console.log('| # | Page                              | chars | Back? | Status | Heading')
console.log('|---|-----------------------------------|-------|-------|--------|--------')
for (let i = 0; i < results.length; i++) {
  const r = results[i]
  const icon = r.status === 'OK' ? '✅' : r.status === 'LIGHT' ? '🟡' : r.status === 'THIN' ? '⚠️' : '❌'
  console.log(`| ${(i+1).toString().padStart(2)} | ${r.name.padEnd(33)} | ${r.len.toString().padStart(5)} | ${r.hasBack ? ' yes ' : ' NO  '} | ${icon} ${r.status.padEnd(5)} | ${r.heading}`)
}

// Summary
const empty = results.filter(r => r.status === 'EMPTY')
const thin = results.filter(r => r.status === 'THIN')
const light = results.filter(r => r.status === 'LIGHT')
const ok = results.filter(r => r.status === 'OK')
const noBack = results.filter(r => !r.hasBack)

console.log('\n')
console.log('─'.repeat(100))
console.log('SUMMARY')
console.log('─'.repeat(100))
console.log(`✅ OK (≥800 chars):       ${ok.length} / ${results.length}`)
console.log(`🟡 LIGHT (200-799 chars): ${light.length}`)
console.log(`⚠️  THIN (<200 chars):     ${thin.length}`)
console.log(`❌ EMPTY (0 chars):        ${empty.length}`)

if (empty.length > 0) {
  console.log(`\n❌ EMPTY PAGES (${empty.length}):`)
  empty.forEach(r => console.log(`   - ${r.name}`))
}
if (thin.length > 0) {
  console.log(`\n⚠️  THIN PAGES (${thin.length}):`)
  thin.forEach(r => console.log(`   - ${r.name} (${r.len} chars)`))
}
if (light.length > 0) {
  console.log(`\n🟡 LIGHT PAGES (${light.length}):`)
  light.forEach(r => console.log(`   - ${r.name} (${r.len} chars)`))
}

console.log(`\nBack button:`)
console.log(`   Pages WITH Back button:    ${results.length - noBack.length}`)
console.log(`   Pages WITHOUT Back button: ${noBack.length}`)
if (noBack.length > 0 && noBack.length < results.length) {
  console.log(`   Missing on:`)
  noBack.forEach(r => console.log(`     - ${r.name}`))
}
