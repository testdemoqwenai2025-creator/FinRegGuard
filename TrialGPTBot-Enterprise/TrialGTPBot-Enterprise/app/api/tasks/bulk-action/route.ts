/**
 * Bulk Action API - Process multiple tasks at once
 * POST /api/tasks/bulk-action
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, taskIds } = body;

    if (!action || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request. Provide action and taskIds array.' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject', 'escalate', 'reassign'].includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action: ${action}` },
        { status: 400 }
      );
    }

    // Simulate bulk processing
    const startTime = Date.now();
    const results = [];
    
    for (const taskId of taskIds) {
      // Simulate processing each task
      await new Promise(resolve => setTimeout(resolve, 10));
      
      results.push({
        taskId,
        action,
        status: 'success',
        processedAt: new Date().toISOString(),
      });
    }

    const processingTime = Date.now() - startTime;

    // Create bulk audit entry
    const bulkAuditEntry = {
      timestamp: new Date().toISOString(),
      action: `bulk_${action}`,
      userId: 'reviewer_001',
      taskIds,
      totalTasks: taskIds.length,
      successfulTasks: results.length,
      failedTasks: 0,
      processingTime,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    };

    console.log(`[BULK AUDIT] ${action} ${taskIds.length} tasks:`, bulkAuditEntry);

    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed successfully`,
      action,
      affected: results.length,
      results,
      processingTime: `${processingTime}ms`,
      auditEntryId: `bulk_audit_${Date.now()}`,
    });

  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json(
      { success: false, error: 'Bulk action failed' },
      { status: 500 }
    );
  }
}
