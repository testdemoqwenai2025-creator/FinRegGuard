import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const status = searchParams.get('status')

  const where: Record<string, string> = {}
  if (category) where.category = category
  if (status) where.status = status

  const policies = await db.policy.findMany({
    where,
    orderBy: { reviewDate: 'asc' },
  })
  return NextResponse.json({ policies })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, status, version } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const data: Record<string, string> = {}
  if (status) data.status = status
  if (version) data.version = version

  const updated = await db.policy.update({ where: { id }, data })
  await db.auditLog.create({
    data: {
      actor: 'sarah.chen@regco.io',
      action: 'policy.update',
      targetType: 'policy',
      targetId: id,
      description: `Policy updated via UI — ${Object.entries(data).map(([k, v]) => `${k}=${v}`).join(', ')}`,
      severity: 'info',
    },
  })
  return NextResponse.json({ policy: updated })
}
