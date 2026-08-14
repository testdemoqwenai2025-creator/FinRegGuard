/**
 * Task Escalate API - Escalate tasks to supervisor
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body = await request.json();
    const { reason, priority } = body;

    const escalationEntry = {
      timestamp: new Date().toISOString(),
      action: 'task_escalated',
      taskId,
      escalatedBy: 'reviewer_001',
      escalatedTo: 'supervisor_team',
      reason: reason || 'Requires supervisor review',
      priority: priority || 'high',
      previousStatus: 'pending_review',
      newStatus: 'escalated',
      slaTarget: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hour SLA
    };

    console.log('[ESCALATION] Task escalated:', escalationEntry);

    return NextResponse.json({
      success: true,
      message: `Task ${taskId} escalated to supervisor`,
      taskId,
      escalationId: `esc_${Date.now()}`,
      slaDeadline: escalationEntry.slaTarget,
      updatedTask: { id: taskId, status: 'escalated' },
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to escalate' }, { status: 500 });
  }
}
