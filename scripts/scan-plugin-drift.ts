#!/usr/bin/env bun
/**
 * Cron-friendly drift scanner — scans all enabled plugins for template drift.
 *
 * For each enabled plugin:
 *   1. Fetches the latest template from its sourceUrl
 *   2. Compares SHA-256 hash to the cached hash
 *   3. If different: deletes old chunks + re-indexes new content into vector store
 *   4. Records a `drift_reindex` entry in PluginToggleHistory
 *
 * Usage:
 *   bun run scripts/scan-plugin-drift.ts                    # human-readable
 *   bun run scripts/scan-plugin-drift.ts --json             # machine-readable
 *   bun run scripts/scan-plugin-drift.ts --actor cron       # custom actor tag
 *
 * Cron example (run hourly):
 *   0 * * * * cd /home/z/my-project && bun run scripts/scan-plugin-drift.ts --json >> logs/drift-scan.log 2>&1
 */

import { scanAllForDrift } from '../src/lib/plugins/rag-bridge'
import { db } from '../src/lib/db'

// Parse CLI args
const args = process.argv.slice(2)
const jsonMode = args.includes('--json')
const actorIdx = args.indexOf('--actor')
const actor = actorIdx >= 0 ? args[actorIdx + 1] : 'cron'

async function main() {
  if (!jsonMode) {
    console.log('─'.repeat(60))
    console.log('Plugin Drift Scanner')
    console.log('─'.repeat(60))
    console.log('Started:', new Date().toISOString())
    console.log('Actor:  ', actor)
  }

  const result = await scanAllForDrift(actor)

  if (jsonMode) {
    console.log(JSON.stringify({
      ...result,
      scannedAt: new Date().toISOString(),
      actor,
    }))
  } else {
    console.log('\nSummary:')
    console.log('  Scanned:   ', result.scanned)
    console.log('  Drifted:   ', result.drifted)
    console.log('  Reindexed: ', result.reindexed)
    console.log('  Failed:    ', result.failed)

    if (result.details.length > 0) {
      console.log('\nDetails:')
      for (const d of result.details) {
        const status = d.error
          ? '✗ ' + d.error
          : d.driftDetected
            ? '⚡ drift detected, re-indexed ' + d.chunksIndexed + ' chunks'
            : '✓ no drift'
        console.log('  ' + d.slug.padEnd(30) + ' ' + status)
      }
    }

    console.log('\nFinished:', new Date().toISOString())
    console.log('─'.repeat(60))
  }

  // Exit non-zero if any failures (for cron monitoring)
  if (result.failed > 0) {
    process.exit(2)
  }
}

main()
  .catch((err) => {
    console.error('Drift scan failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
