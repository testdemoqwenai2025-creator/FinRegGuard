/**
 * POST /api/forms/[slug]/autofill
 * ===============================
 *
 * Triggers L5/L6/L7 auto-fill for a form template against a given entity ID.
 *
 * Request body:
 *   {
 *     "entityId": "LEI:529900T8BM49AURQ",   // or "CRN:03977902", "Binance Holdings"
 *     "entityType": "counterparty",          // optional
 *     "createdBy": "system"                  // optional
 *   }
 *
 * Response (200):
 *   {
 *     "instanceId": "clxxx...",
 *     "status": "success" | "partial" | "failure",
 *     "autoFilledFields": 9,
 *     "reviewQueueItems": 2,
 *     "overallConfidence": 0.78,
 *     "fieldResults": [...],
 *     "connectorRuns": [...]
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { runAutofill } from '@/lib/forms/orchestrator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  let body: { entityId?: string; entityType?: string; createdBy?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  if (!body.entityId || typeof body.entityId !== 'string') {
    return NextResponse.json(
      { error: 'Missing required field: entityId' },
      { status: 400 },
    )
  }

  try {
    const result = await runAutofill({
      formSlug: slug,
      entityId: body.entityId,
      entityType: body.entityType,
      createdBy: body.createdBy,
    })

    if (result.status === 'failure' && !result.instanceId) {
      return NextResponse.json(
        { error: result.errorMessage || 'Auto-fill failed', result },
        { status: 404 },
      )
    }

    return NextResponse.json({ result })
  } catch (e) {
    console.error('Autofill route error:', e)
    return NextResponse.json(
      { error: 'Auto-fill failed', message: (e as Error).message },
      { status: 500 },
    )
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  return NextResponse.json({
    formSlug: slug,
    message: `POST to this endpoint with { entityId, entityType?, createdBy? } to trigger auto-fill.`,
    examples: [
      { entityId: 'LEI:529900T8BM49AURQ', note: 'Binance Holdings Ltd.' },
      { entityId: 'LEI:HWUPKR0MPOU8FGXBT394', note: 'Apple Inc.' },
      { entityId: 'CRN:03977902', note: 'Apple Marketing (UK) Limited' },
      { entityId: 'CIK:0000320193', note: 'Apple Inc. (SEC CIK)' },
      { entityId: 'Binance Holdings', note: 'Free-text name search' },
    ],
  })
}
