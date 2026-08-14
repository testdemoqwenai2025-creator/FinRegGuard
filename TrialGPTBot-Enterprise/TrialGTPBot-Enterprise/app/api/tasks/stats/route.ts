/**
 * Tasks Stats API - Statistics endpoint
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simulated statistics (in production, query database)
    const stats = {
      success: true,
      calculatedAt: new Date().toISOString(),
      
      totalTasks: 47,
      pendingReview: 23,
      inProgress: 8,
      completed: 12,
      escalated: 4,
      criticalCount: 5,
      overdueCount: 3,
      avgConfidence: 84,
      
      reviewerStats: {
        tasksToday: 23,
        avgReviewTime: 45,
        approvalRate: 0.72,
        accuracy: 0.97,
        streak: 12,
        totalReviewed: 1247,
        teamRank: 3,
        percentileRank: 94,
      },
      
      edcStatus: [
        { system: 'Medidata Rave', status: 'healthy', uptime: 99.97, latency: 45, recordsProcessed: 15420 },
        { system: 'Oracle Clinical One', status: 'healthy', uptime: 99.85, latency: 128, recordsProcessed: 8934 },
        { system: 'Veeva Vault EDC', status: 'degraded', uptime: 98.92, latency: 256, recordsProcessed: 6789 },
      ],
      
      complianceStatus: {
        fda21CFR11: { score: 98.5, status: 'compliant' },
        emaAnnex11: { score: 97.2, status: 'compliant' },
        gdpr: { score: 99.1, status: 'compliant' },
        hipaa: { score: 94.8, status: 'warning' },
      },

      systemHealth: { overall: 98.7, apiLatency: 45, memoryUsage: 67, cpuUsage: 34 },
    };

    return NextResponse.json(stats);
    
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
