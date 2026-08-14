import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const severity = searchParams.get('severity')
  const action = searchParams.get('action')
  const limit = Math.min(Number(searchParams.get('limit') ?? '100'), 500)

  const where: Record<string, string> = {}
  if (severity) where.severity = severity
  if (action) where.action = action

  const logs = await db.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: limit,
  })
  return NextResponse.json({ logs, count: logs.length })
}
