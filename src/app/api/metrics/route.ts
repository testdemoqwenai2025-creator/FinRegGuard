import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const metrics = await db.complianceMetric.findMany({
    orderBy: { snapshotDate: 'asc' },
  })

  const latest = metrics[metrics.length - 1] ?? null
  const previous = metrics[metrics.length - 2] ?? null

  // Counts for KPI tiles
  const [regulations, policies, auditLogs, riskItems] = await Promise.all([
    db.regulation.count(),
    db.policy.count(),
    db.auditLog.count(),
    db.riskItem.count(),
  ])

  const pendingRegulations = await db.regulation.count({ where: { status: 'pending' } })
  const criticalRisks = await db.riskItem.count({ where: { residualRisk: { gte: 12 } } })
  const overduePolicies = await db.policy.count({ where: { reviewDate: { lt: new Date() } } })

  return NextResponse.json({
    latest,
    previous,
    history: metrics,
    counts: { regulations, policies, auditLogs, riskItems },
    kpis: { pendingRegulations, criticalRisks, overduePolicies },
  })
}
