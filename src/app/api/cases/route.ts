import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/cases
 *
 * Returns all compliance cases from the ComplianceCase table.
 * Replaces the cases.json file read that the CaseManagementView used
 * to do via dataUrl('cases') — which silently 404'd in dev mode
 * (no /api/cases route existed) and only worked in static-build mode.
 *
 * v3 (Task 13) — DB-backed. Cases were migrated from cases.json by
 * scripts/migrate-cases-to-db.ts, preserving the original case IDs so
 * existing URLs continue to resolve.
 *
 * Response shape mirrors cases.json for backward compat with the UI:
 *   { cases: CaseRow[], total: number }
 *
 * CaseRow includes:
 *   id, caseType, title, regulator, priority, status, assignee,
 *   dueDate (ISO string), description, createdAt (ISO string),
 *   evidenceCount, slaStatus, aiRecommendation (parsed object or null)
 *
 * Citations are NOT included in the list response — fetch them
 * per-case via /api/cases/[id]/citations.
 */
export async function GET() {
  try {
    const rows = await db.complianceCase.findMany({
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    })

    const cases = rows.map((r) => ({
      id: r.id,
      caseType: r.caseType,
      title: r.title,
      regulator: r.regulator,
      priority: r.priority,
      status: r.status,
      assignee: r.assignee,
      dueDate: r.dueDate.toISOString(),
      description: r.description,
      createdAt: r.createdAt.toISOString(),
      evidenceCount: r.evidenceCount,
      slaStatus: r.slaStatus,
      aiRecommendation: r.aiRecommendationJson
        ? JSON.parse(r.aiRecommendationJson)
        : null,
    }))

    return NextResponse.json({ cases, total: cases.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[/api/cases]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
