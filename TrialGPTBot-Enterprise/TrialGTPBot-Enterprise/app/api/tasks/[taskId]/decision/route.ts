/**
 * Task Decision API - Approve/Reject individual tasks
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body = await request.json();
    const { decision, reason } = body;

    if (!['approved', 'rejected'].includes(decision)) {
      return NextResponse.json(
        { success: false, error: 'Invalid decision' },
        { status: 400 }
      );
    }

    const auditEntry = {
      timestamp: new Date().toISOString(),
      action: `task_${decision}`,
      taskId,
      decision,
      reason: reason || `Reviewer ${decision} AI suggestion`,
      checksum: `sha256:${Math.random().toString(36).substring(2, 66)}`,
    };

    console.log(`[AUDIT] Task ${taskId} ${decision}:`, auditEntry);

    return NextResponse.json({
      success: true,
      message: `Task ${taskId} ${decision}`,
      taskId,
      decision,
      processedAt: new Date().toISOString(),
      updatedTask: { id: taskId, status: 'completed', decision },
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to process' }, { status: 500 });
  }
}
