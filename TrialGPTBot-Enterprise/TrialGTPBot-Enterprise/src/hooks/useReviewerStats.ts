/**
 * useReviewerStats - Reviewer Performance Statistics Hook
 * 
 * Tracks and displays comprehensive reviewer performance metrics for
 * TrialGPTBot Enterprise. Provides real-time statistics, historical trends,
 * and benchmarking data.
 * 
 * Features:
 * - Real-time performance tracking
 * - Historical trend analysis
 * - Team ranking and percentile calculations
 * - Goal progress monitoring
 * - Productivity analytics
 * - Quality metrics (accuracy, precision, recall)
 * - Streak and achievement tracking
 * 
 * @hook
 * @example
 * ```tsx
 * const {
 *   stats,
 *   loading,
 *   refreshStats,
 *   getTrendData,
 * } = useReviewerStats({
 *   reviewerId: 'reviewer_001',
 *   period: 'week',
 * });
 * ```
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ReviewerStatistics } from '@/lib/core/types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ReviewerStatsConfig {
  /** Reviewer/user ID to fetch stats for */
  reviewerId?: string;
  /** Time period for stats */
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year';
  /** Include team comparison data */
  includeTeamComparison?: boolean;
  /** Enable real-time updates via WebSocket */
  enableRealTime?: boolean;
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
  /** API base URL */
  apiBaseUrl?: string;
  /** Auth token */
  authToken?: string;
  /** Debug mode */
  debug?: boolean;
}

export interface ReviewerStatsState {
  /** Current reviewer statistics */
  stats: ReviewerStatistics | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Last updated timestamp */
  lastUpdated: Date | null;
  /** Whether currently refreshing */
  isRefreshing: boolean;
}

export interface TrendDataPoint {
  /** Timestamp for this data point */
  timestamp: Date;
  /** Value at this point */
  value: number;
  /** Optional secondary value */
  value2?: number;
  /** Optional label */
  label?: string;
}

export interface TrendData {
  /** Data points for the trend */
  data: TrendDataPoint[];
  /** Trend direction ('up', 'down', 'stable') */
  direction: 'up' | 'down' | 'stable';
  /** Percentage change from start to end */
  changePercent: number;
  /** Average value over the period */
  average: number;
  /** Maximum value */
  max: number;
  /** Minimum value */
  min: number;
  /** Standard deviation */
  stdDev: number;
}

export interface TeamComparison {
  /** Current reviewer's rank in team */
  rank: number;
  /** Total team members */
  totalMembers: number;
  /** Percentile ranking (0-100) */
  percentile: number;
  /** Team average for comparison */
  teamAverage: Record<string, number>;
  /** Top performer stats */
  topPerformer: Partial<ReviewerStatistics> & { name: string };
  /** Distribution histogram */
  distribution: { range: string; count: number }[];
}

export interface Achievement {
  /** Unique achievement ID */
  id: string;
  /** Achievement name */
  name: string;
  /** Description of what was achieved */
  description: string;
  /** Icon or emoji for display */
  icon: string;
  /** When it was earned */
  earnedAt: Date;
  /** Category of achievement */
  category: 'productivity' | 'quality' | 'consistency' | 'special';
  /** Rarity level */
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  /** Point value */
  points: number;
}

export interface GoalProgress {
  /** Goal ID */
  id: string;
  /** Goal name */
  name: string;
  /** Target value */
  target: number;
  /** Current value */
  current: number;
  /** Unit of measurement */
  unit: string;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Whether goal has been met */
  achieved: boolean;
  /** Period end date */
  deadline: Date;
  /** Days remaining */
  daysRemaining: number;
  /** Predicted final value based on current pace */
  predictedValue: number;
  /** Whether on track to meet goal */
  onTrack: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: Required<ReviewerStatsConfig> = {
  reviewerId: '',
  period: 'week',
  includeTeamComparison: true,
  enableRealTime: false,
  refreshInterval: 60000,
  apiBaseUrl: '/api/stats',
  authToken: '',
  debug: false,
};

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const generateMockStats = (): ReviewerStatistics => ({
  reviewerId: 'reviewer_001',
  reviewerName: 'Dr. Sarah Chen',
  role: 'Senior Clinical Reviewer',
  department: 'Clinical Operations',

  // Performance Metrics
  totalTasksReviewed: 1247,
  tasksToday: 23,
  tasksThisWeek: 156,
  tasksThisMonth: 489,
  averageReviewTime: 45,
  medianReviewTime: 38,
  p95ReviewTime: 120,
  p99ReviewTime: 180,

  // Accuracy Metrics
  approvalRate: 0.72,
  rejectionRate: 0.18,
  escalationRate: 0.10,
  overrideRate: 0.08,
  agreementWithAI: 0.92,

  // Quality Metrics
  accuracyScore: 0.97,
  precisionScore: 0.96,
  recallScore: 0.98,
  f1Score: 0.97,
  falsePositiveRate: 0.02,
  falseNegativeRate: 0.03,

  // Queue Metrics
  currentQueueDepth: 47,
  averageQueueDepth: 52,
  peakQueueDepth: 89,
  queueTrend: 'decreasing',
  estimatedClearanceTime: 2.5,

  // Time-based Analytics
  productivityByHour: Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    tasksCompleted: Math.floor(Math.random() * 15) + (i >= 9 && i <= 17 ? 8 : 0),
    avgConfidence: Math.random() * 0.2 + 0.75,
  })),
  productivityByDay: Array.from({ length: 7 }, (_, i) => ({
    day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
    tasksCompleted: Math.floor(Math.random() * 80) + (i < 5 ? 40 : 5),
    avgReviewTime: Math.floor(Math.random() * 30) + 35,
  })),

  // Specialization
  topCategories: [
    { category: 'data_integrity', count: 342, accuracy: 0.98 },
    { category: 'patient_safety', count: 256, accuracy: 0.99 },
    { category: 'regulatory_compliance', count: 198, accuracy: 0.97 },
    { category: 'protocol_deviation', count: 167, accuracy: 0.95 },
    { category: 'adverse_event', count: 134, accuracy: 0.99 },
  ],

  // Streaks & Achievements
  currentStreak: 12,
  longestStreak: 28,
  daysAboveTarget: 45,

  // Rankings
  teamRank: 3,
  percentileRank: 94,

  // Certifications & Training
  certifications: [
    { name: 'ICH-GCP Certified', obtained: new Date('2024-01-15'), expires: new Date('2026-01-14') },
    { name: 'FDA 21 CFR Part 11 Expert', obtained: new Date('2024-06-01'), expires: null },
    { name: 'EDC Systems Master', obtained: new Date('2023-11-20'), expires: new Date('2025-11-19') },
  ],

  // Recent Activity Timeline
  recentActivity: Array.from({ length: 10 }, (_, i) => ({
    id: `activity_${i}`,
    timestamp: new Date(Date.now() - i * 1800000),
    type: ['task_completed', 'decision_made', 'escalation_initiated', 'feedback_provided'][i % 4] as any,
    taskId: `task_${String(i + 1).padStart(4, '0')}`,
    details: `Recent activity ${i + 1}`,
    impact: ['high', 'medium', 'low'][i % 3] as 'high' | 'medium' | 'low',
  })),

  // Goals & Targets
  dailyTarget: 30,
  weeklyTarget: 150,
  monthlyTarget: 500,
  progressToMonthlyTarget: 0.978,

  calculatedAt: new Date(),
  periodStart: new Date(new Date().setDate(1)),
  periodEnd: new Date(),
});

const generateMockTeamComparison = (): TeamComparison => ({
  rank: 3,
  totalMembers: 12,
  percentile: 94,
  teamAverage: {
    tasksReviewed: 892,
    approvalRate: 68,
    accuracyScore: 94,
    averageReviewTime: 52,
    agreementWithAI: 88,
  },
  topPerformer: {
    reviewerName: 'Dr. Michael Torres',
    totalTasksReviewed: 1567,
    accuracyScore: 0.99,
    currentStreak: 45,
    name: 'Dr. Michael Torres',
  },
  distribution: [
    { range: '90-100%', count: 2 },
    { range: '80-89%', count: 3 },
    { range: '70-79%', count: 4 },
    { range: '60-69%', count: 2 },
    { range: '<60%', count: 1 },
  ],
});

const generateMockAchievements = (): Achievement[] => [
  {
    id: 'ach_001',
    name: 'Speed Demon',
    description: 'Complete 50+ tasks in a single day',
    icon: '⚡',
    earnedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    category: 'productivity',
    rarity: 'rare',
    points: 100,
  },
  {
    id: 'ach_002',
    name: 'Accuracy Master',
    description: 'Maintain 98%+ accuracy for a month',
    icon: '🎯',
    earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    category: 'quality',
    rarity: 'epic',
    points: 250,
  },
  {
    id: 'ach_003',
    name: 'Consistency King',
    description: '30-day review streak',
    icon: '🔥',
    earnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    category: 'consistency',
    rarity: 'uncommon',
    points: 75,
  },
  {
    id: 'ach_004',
    name: 'Patient Safety Guardian',
    description: 'Correctly identify 100 safety-critical issues',
    icon: '🛡️',
    earnedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    category: 'special',
    rarity: 'legendary',
    points: 500,
  },
  {
    id: 'ach_005',
    name: 'Early Bird',
    description: 'Complete first task before 8 AM for 20 consecutive days',
    icon: '🌅',
    earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    category: 'consistency',
    rarity: 'common',
    points: 25,
  },
];

const generateMockGoals = (): GoalProgress[] => [
  {
    id: 'goal_001',
    name: 'Monthly Task Target',
    target: 500,
    current: 489,
    unit: 'tasks',
    percentage: 97.8,
    achieved: false,
    deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    daysRemaining: 5,
    predictedValue: 512,
    onTrack: true,
  },
  {
    id: 'goal_002',
    name: 'Accuracy Maintenance',
    target: 95,
    current: 97,
    unit: '%',
    percentage: 100,
    achieved: true,
    deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    daysRemaining: 5,
    predictedValue: 97,
    onTrack: true,
  },
  {
    id: 'goal_003',
    name: 'Average Review Time',
    target: 50,
    current: 45,
    unit: 'seconds',
    percentage: 100,
    achieved: true,
    deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    daysRemaining: 5,
    predictedValue: 44,
    onTrack: true,
  },
];

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * useReviewerStats - React hook for reviewer performance statistics
 * 
 * Provides comprehensive performance analytics:
 * - Real-time statistics fetching
 * - Historical trend analysis
 * - Team comparison and ranking
 * - Achievement tracking
 * - Goal progress monitoring
 * - Productivity insights
 * 
 * @param config - Configuration options
 * @returns Stats state and utility methods
 */
export function useReviewerStats(config: ReviewerStatsConfig = {}) {
  // Merge configuration
  const cfg: Required<ReviewerStatsConfig> = { ...DEFAULT_CONFIG, ...config };

  // State
  const [stats, setStats] = useState<ReviewerStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Derived data (computed from stats)
  const [teamComparison, setTeamComparison] = useState<TeamComparison | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [goals, setGoals] = useState<GoalProgress[]>([]);

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  /**
   * Fetch reviewer statistics
   */
  const fetchStats = useCallback(async (silent: boolean = false) => {
    if (!silent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 400));

      // Generate mock data
      const mockStats = generateMockStats();
      setStats(mockStats);
      setLastUpdated(new Date());

      // Fetch related data if needed
      if (cfg.includeTeamComparison) {
        setTeamComparison(generateMockTeamComparison());
      }
      setAchievements(generateMockAchievements());
      setGoals(generateMockGoals());

      if (cfg.debug) {
        console.log('[useReviewerStats] Stats fetched:', mockStats.reviewerName);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statistics';
      setError(errorMessage);
      if (cfg.debug) {
        console.error('[useReviewerStats] Fetch error:', err);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [cfg.includeTeamComparison, cfg.debug]);

  /**
   * Refresh stats silently (background update)
   */
  const refreshStats = useCallback(() => {
    fetchStats(true);
  }, [fetchStats]);

  // ==========================================================================
  // TREND ANALYSIS
  // ==========================================================================

  /**
   * Get productivity trend data for charts
   */
  const getProductivityTrend = useCallback((): TrendData => {
    if (!stats) return { data: [], direction: 'stable', changePercent: 0, average: 0, max: 0, min: 0, stdDev: 0 };

    const dataPoints: TrendDataPoint[] = stats.productivityByDay.map(day => ({
      timestamp: new Date(), // Would be actual dates in production
      value: day.tasksCompleted,
      value2: day.avgReviewTime,
      label: day.day,
    }));

    const values = dataPoints.map(d => d.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    // Calculate standard deviation
    const squaredDiffs = values.map(v => Math.pow(v - average, 2));
    const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);

    // Determine trend direction
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    const direction = changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable';

    return {
      data: dataPoints,
      direction,
      changePercent,
      average: Math.round(average),
      max,
      min,
      stdDev: Math.round(stdDev),
    };
  }, [stats]);

  /**
   * Get hourly productivity pattern
   */
  const getHourlyPattern = useCallback((): TrendData => {
    if (!stats) return { data: [], direction: 'stable', changePercent: 0, average: 0, max: 0, min: 0, stdDev: 0 };

    const dataPoints: TrendDataPoint[] = stats.productivityByHour.map(hour => ({
      timestamp: new Date(2024, 0, 1, hour.hour, 0, 0),
      value: hour.tasksCompleted,
      value2: hour.avgConfidence,
      label: `${hour.hour}:00`,
    }));

    const values = dataPoints.map(d => d.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;

    return {
      data: dataPoints,
      direction: 'stable', // Hourly data doesn't have a "trend"
      changePercent: 0,
      average: Math.round(average),
      max: Math.max(...values),
      min: Math.min(...values),
      stdDev: 0,
    };
  }, [stats]);

  /**
   * Get accuracy trend over time (simulated)
   */
  const getAccuracyTrend = useCallback((): TrendData => {
    // Simulate accuracy trend data
    const days = cfg.period === 'today' ? 1 : 
                 cfg.period === 'week' ? 7 :
                 cfg.period === 'month' ? 30 : 90;

    const dataPoints: TrendDataPoint[] = Array.from({ length: days }, (_, i) => {
      const baseAccuracy = stats?.accuracyScore || 0.95;
      const variation = (Math.random() - 0.5) * 0.04; // ±2% variation
      return {
        timestamp: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000),
        value: Math.min(1, Math.max(0.85, baseAccuracy + variation)) * 100,
        label: undefined,
      };
    });

    const values = dataPoints.map(d => d.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const changePercent = ((values[values.length - 1] - values[0]) / values[0]) * 100;

    return {
      data: dataPoints,
      direction: changePercent > 1 ? 'up' : changePercent < -1 ? 'down' : 'stable',
      changePercent: Math.round(changePercent * 10) / 10,
      average: Math.round(average * 10) / 10,
      max: Math.round(Math.max(...values) * 10) / 10,
      min: Math.round(Math.min(...values) * 10) / 10,
      stdDev: 0,
    };
  }, [stats, cfg.period]);

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Format large numbers with commas
   */
  const formatNumber = useCallback((num: number): string => {
    return num.toLocaleString();
  }, []);

  /**
   * Format seconds to human-readable duration
   */
  const formatDuration = useCallback((seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }, []);

  /**
   * Get performance rating based on score
   */
  const getPerformanceRating = useCallback((score: number): {
    rating: 'exceptional' | 'excellent' | 'good' | 'needs_improvement' | 'below_expectations';
    color: string;
    label: string;
  } => {
    if (score >= 98) return { rating: 'exceptional', color: 'text-purple-600', label: 'Exceptional' };
    if (score >= 95) return { rating: 'excellent', color: 'text-emerald-600', label: 'Excellent' };
    if (score >= 90) return { rating: 'good', color: 'text-blue-600', label: 'Good' };
    if (score >= 80) return { rating: 'needs_improvement', color: 'text-amber-600', label: 'Needs Improvement' };
    return { rating: 'below_expectations', color: 'text-red-600', label: 'Below Expectations' };
  }, []);

  /**
   * Calculate estimated time to complete remaining queue
   */
  const getTimeToClearQueue = useCallback((): string => {
    if (!stats) return '--';

    const remainingTasks = stats.currentQueueDepth;
    const avgTasksPerHour = 60 * 60 / stats.averageReviewTime; // Tasks per hour at current rate
    const hoursNeeded = remainingTasks / avgTasksPerHour;

    if (hoursNeeded < 1) return `${Math.ceil(hoursNeeded * 60)} min`;
    if (hoursNeeded < 8) return `${Math.round(hoursNeeded * 10) / 10} hours`;
    return `${Math.round(hoursNeeded / 10) / 10} days`;
  }, [stats]);

  /**
   * Check if reviewer is on track for monthly goals
   */
  const isOnTrackForGoals = useCallback((): boolean => {
    if (!stats) return false;
    return goals.every(goal => goal.onTrack);
  }, [stats, goals]);

  /**
   * Get next milestone prediction
   */
  const getNextMilestone = useCallback((): {
    type: 'streak' | 'total_tasks' | 'accuracy';
    description: string;
    estimatedDate: Date;
  } | null => {
    if (!stats) return null;

    const milestones = [
      {
        type: 'streak' as const,
        description: `Reach ${stats.longestStreak + 1}-day streak`,
        estimatedDate: new Date(Date.now() + (stats.longestStreak + 1 - stats.currentStreak) * 24 * 60 * 60 * 1000),
      },
      {
        type: 'total_tasks' as const,
        description: `Complete ${Math.ceil(stats.totalTasksReviewed / 100) * 100 + 100} total tasks`,
        estimatedDate: new Date(Date.now() + ((Math.ceil(stats.totalTasksReviewed / 100) * 100 + 100 - stats.totalTasksReviewed) / (stats.tasksThisMonth / 30)) * 24 * 60 * 60 * 1000),
      },
    ];

    // Return closest milestone
    return milestones.sort((a, b) => a.estimatedDate.getTime() - b.estimatedDate.getTime())[0];
  }, [stats]);

  // ==========================================================================
  // AUTO-REFRESH
  // ==========================================================================

  useEffect(() => {
    if (cfg.refreshInterval > 0) {
      const interval = setInterval(() => {
        refreshStats();
      }, cfg.refreshInterval);

      return () => clearInterval(interval);
    }
  }, [cfg.refreshInterval, refreshStats]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, []); // Only run once on mount

  // ==========================================================================
  // RETURN VALUE
  // ==========================================================================

  const state: ReviewerStatsState = {
    stats,
    isLoading,
    error,
    lastUpdated,
    isRefreshing,
  };

  return {
    // State
    ...state,

    // Derived data
    teamComparison,
    achievements,
    goals,

    // Trend analysis
    getProductivityTrend,
    getHourlyPattern,
    getAccuracyTrend,

    // Utility methods
    formatNumber,
    formatDuration,
    getPerformanceRating,
    getTimeToClearQueue,
    isOnTrackForGoals,
    getNextMilestone,

    // Actions
    refreshStats,
    refetch: () => fetchStats(false),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useReviewerStats;

// Type exports
export type {
  ReviewerStatsConfig,
  ReviewerStatsState,
  TrendData,
  TrendDataPoint,
  TeamComparison,
  Achievement,
  GoalProgress,
};
