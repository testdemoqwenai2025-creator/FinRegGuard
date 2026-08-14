import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jurisdiction = searchParams.get('jurisdiction')
  const status = searchParams.get('status')
  const category = searchParams.get('category')

  const where: Record<string, string> = {}
  if (jurisdiction) where.jurisdiction = jurisdiction
  if (status) where.status = status
  if (category) where.category = category

  const regulations = await db.regulation.findMany({
    where,
    orderBy: { effectiveDate: 'desc' },
  })
  return NextResponse.json({ regulations })
}
