// src/app/api/control-monitor/route.ts
//
// GET /api/control-monitor
//
// Returns the Continuous Control Monitoring (CCM) payload. This is the L2
// backend for the `control-monitor` plugin — the only plugin in the manifest
// that declared L2 dynamism without an apiRoute at the time of the GCP
// migration planning (see GCP-MIGRATION-TODO.md, Priority 1).
//
// Dynamism contract (plugins/manifest.json → control-monitor.dynamism):
//   - level: L2 (static shell + dynamic data)
//   - dynamicSlots: ["summary.realTimePassRate"]
//   - refreshStrategy: on-mount
//   - fallback: static-json
//   - timeoutMs: 2000
//
// The static JSON at public/data/ccm.json ships with `summary.realTimePassRate: null`
// (the reserved buffer pattern, see STATIC-DYNAMIC-CAPACITY-PATTERN.txt). This
// route populates that slot with the *current* real-time pass rate, computed
// from the most recent run of each control. The UI's `usePluginData` hook will:
//   1. Render from static JSON immediately (showing null for realTimePassRate)
//   2. Fetch /api/control-monitor in the background
//   3. On success: merge `summary.realTimePassRate` into the rendered data
//   4. On failure/timeout: keep showing the static JSON (graceful degradation)
//
// In static-export mode this route is not built (Next.js forbids /api routes
// under output: 'export'). The build script temporarily moves src/app/api out
// during static export. In dev mode and on GCP, this route is live.

import { NextResponse } from 'next/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const dynamic = 'force-dynamic' // never cached at build time

interface ControlHistoryEntry {
  runAt: string
  result: 'pass' | 'warn' | 'fail'
  durationMs: number
  evidenceCount: number
  passRate: number
}

interface Control {
  id: string
  controlId: string
  name: string
  status: 'passing' | 'degraded' | 'failing'
  passRate: number
  lastResult: 'pass' | 'warn' | 'fail'
  history: ControlHistoryEntry[]
}

interface CcmPayload {
  controls: Control[]
  summary: {
    passing: number
    degraded: number
    failing: number
    eventDriven: number
    batch: number
    scheduled: number
    totalEvidenceItems: number
    avgPassRate: number
    realTimePassRate: number | null
  }
  total: number
}

function loadStaticCcm(): CcmPayload {
  // Read the static JSON. In production on GCP this would be replaced by a
  // Prisma query (db.controlMonitor.findMany or similar). For now, computing
  // from the static snapshot is honest — the slot we're populating is
  // genuinely "live" in the sense that it's recomputed on every request,
  // even if the source data is still a snapshot.
  const path = join(process.cwd(), 'public', 'data', 'ccm.json')
  return JSON.parse(readFileSync(path, 'utf-8')) as CcmPayload
}

/**
 * Compute the real-time pass rate: weighted average of each control's most
 * recent run passRate, weighted by evidenceCount so controls with more
 * evidence carry more signal. Returns a number 0-100 rounded to 1 decimal.
 *
 * This is the field that's `null` in the static JSON and populated here.
 * Upgrading the static page to L2 dynamism was a no-op for the UI because
 * the slot was already reserved — see STATIC-DYNAMIC-CAPACITY-PATTERN.txt.
 */
function computeRealTimePassRate(controls: Control[]): number {
  if (controls.length === 0) return 0
  let weightedSum = 0
  let totalWeight = 0
  for (const c of controls) {
    // Use the most recent run's passRate; fall back to the control's headline passRate
    const latestRun = c.history?.[0]
    const rate = latestRun?.passRate ?? c.passRate ?? 0
    const weight = Math.max(1, latestRun?.evidenceCount ?? 1)
    weightedSum += rate * weight
    totalWeight += weight
  }
  return Number((weightedSum / totalWeight).toFixed(1))
}

export async function GET() {
  try {
    const ccm = loadStaticCcm()
    const realTimePassRate = computeRealTimePassRate(ccm.controls)

    // Populate the reserved dynamic slot. Everything else comes through
    // unchanged so the UI can do a shallow merge.
    const payload: CcmPayload = {
      ...ccm,
      summary: {
        ...ccm.summary,
        realTimePassRate,
      },
    }

    return NextResponse.json(payload, {
      headers: {
        // Short cache — real-time means real-time, but allow a tiny window
        // to absorb concurrent refreshes from many clients.
        'Cache-Control': 'public, max-age=5, stale-while-revalidate=10',
      },
    })
  } catch (err) {
    // Per the dynamism contract, fallback is "static-json". So on error we
    // return 503 and let the client's usePluginData hook fall back to the
    // static JSON file. We do NOT return partial data — that would lie
    // about which fields are fresh.
    console.error('[api/control-monitor] failed to compute payload:', err)
    return NextResponse.json(
      { error: 'control-monitor unavailable', fallback: 'static-json' },
      { status: 503 }
    )
  }
}
