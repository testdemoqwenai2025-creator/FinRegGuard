import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const risks = await db.riskItem.findMany({
    orderBy: { residualRisk: 'desc' },
  })

  // Aggregate by business unit
  const byUnit = new Map<string, { unit: string; avgResidual: number; count: number; maxInherent: number }>()
  for (const r of risks) {
    const entry = byUnit.get(r.businessUnit) ?? { unit: r.businessUnit, avgResidual: 0, count: 0, maxInherent: 0 }
    entry.avgResidual += r.residualRisk
    entry.count += 1
    entry.maxInherent = Math.max(entry.maxInherent, r.inherentRisk)
    byUnit.set(r.businessUnit, entry)
  }
  const unitSummary = Array.from(byUnit.values()).map((e) => ({
    unit: e.unit,
    avgResidual: Number((e.avgResidual / e.count).toFixed(1)),
    maxInherent: e.maxInherent,
    count: e.count,
  }))

  return NextResponse.json({ risks, unitSummary })
}
