/**
 * useReviewQueue - Task Queue Management Hook
 * 
 * Manages the review task queue for TrialGPTBot Enterprise.
 * Provides comprehensive task lifecycle management including:
 * - Task retrieval and caching
 * - Priority-based sorting
 * - Status tracking
 * - Bulk operations
 * - Real-time synchronization
 * 
 * @hook
 * @example
 * ```tsx
 * const {
 *   tasks,
 *   loading,
 *   error,
 *   approveTask,
 *   rejectTask,
 *   fetchTasks,
 *   getFilteredTasks,
 * } = useReviewQueue({
 *   reviewerId: 'reviewer_001',
 *   trialId: 'TRIAL-123',
 *   autoRefresh: true,
 * });
 * ```
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BooleanConfirmationTask, TaskStatus, TaskPriority, ConfidenceLevel, ConfirmationDecision } from '@/lib/core/types';
import { useWebSocket, WebSocketMessage } from './useWebSocket';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ReviewQueueConfig {
  /** Current reviewer/user ID */
  reviewerId?: string;
  /** Filter by specific trial */
  trialId?: string;
  /** Filter by specific site */
  siteId?: string;
  /** Auto-refresh interval in milliseconds (0 = disabled) */
  autoRefreshInterval?: number;
  /** Enable real-time WebSocket updates */
  enableRealTime?: boolean;
  /** WebSocket endpoint for real-time updates */
  wsEndpoint?: string;
  /** Maximum number of tasks to keep in cache */
  maxCacheSize?: number;
  /** Default page size for pagination */
  pageSize?: number;
  /** Enable optimistic updates */
  optimisticUpdates?: boolean;
  /** Custom API base URL */
  apiBaseUrl?: string;
  /** Authentication token */
  authToken?: string;
  /** Debug mode */
  debug?: boolean;
}

export interface QueueState {
  /** All tasks in the queue (unfiltered) */
  tasks: BooleanConfirmationTask[];
  /** Currently selected task IDs */
  selectedTaskIds: Set<string>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Total count from server */
  totalCount: number;
  /** Current page (1-indexed) */
  currentPage: number;
  /** Total pages */
  totalPages: number;
  /** Last fetched timestamp */
  lastFetchedAt: Date | null;
  /** Is there more data to fetch? */
  hasMore: boolean;
  /** Whether data is being refreshed */
  isRefreshing: boolean;
}

export interface QueueFilters {
  /** Filter by status */
  status?: TaskStatus | 'all';
  /** Filter by priority */
  priority?: TaskPriority | 'all';
  /** Filter by confidence level */
  confidence?: ConfidenceLevel | 'all';
  /** Filter by EDC source */
  edcSource?: string | 'all';
  /** Search query (searches subject, form, field) */
  searchQuery?: string;
  /** Show only overdue tasks */
  overdueOnly?: boolean;
  /** Show only tasks assigned to current user */
  myTasksOnly?: boolean;
  /** Date range start */
  dateFrom?: Date;
  /** Date range end */
  dateTo?: Date;
}

export interface QueueStats {
  /** Total tasks in queue */
  total: number;
  /** Tasks pending review */
  pending: number;
  /** Tasks in progress */
  inProgress: number;
  /** Tasks completed */
  completed: number;
  /** Tasks escalated */
  escalated: number;
  /** Critical priority tasks */
  critical: number;
  /** High confidence tasks ready for quick approval */
  highConfidenceReady: number;
  /** Overdue tasks */
  overdue: number;
  /** Average confidence score */
  avgConfidence: number;
  /** Average risk score */
  avgRisk: number;
  /** Estimated time to clear queue (minutes) */
  estimatedClearanceMinutes: number;
}

export interface QueueOperationResult {
  /** Whether operation succeeded */
  success: boolean;
  /** Affected task IDs */
  taskIds: string[];
  /** Error message if failed */
  error?: string;
  /** Timestamp of operation */
  timestamp: Date;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: Required<ReviewQueueConfig> = {
  reviewerId: '',
  trialId: '',
  siteId: '',
  autoRefreshInterval: 30000,
  enableRealTime: true,
  wsEndpoint: 'wss://api.trialgptbot.enterprise/ws/review-queue',
  maxCacheSize: 500,
  pageSize: 25,
  optimisticUpdates: true,
  apiBaseUrl: '/api/review',
  authToken: '',
  debug: false,
};

// ============================================================================
// MOCK DATA GENERATOR
// ============================================================================

const generateMockTasks = (count: number): BooleanConfirmationTask[] => {
  const statuses: TaskStatus[] = ['pending_review', 'in_progress', 'completed', 'escalated'];
  const priorities: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
  const confidences: ConfidenceLevel[] = ['very_high', 'high', 'medium', 'low', 'very_low'];
  const edcSources = ['medidata_rave', 'oracle_clinical_one', 'veeva_vault'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `task_${String(i + 1).padStart(4, '0')}`,
    trialId: `TRIAL-${Math.floor(Math.random() * 900) + 100}`,
    siteId: `SITE-${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`,
    subjectId: `SUBJ-${String(Math.floor(Math.random() * 1000) + 1).padStart(4, '0')}`,
    formId: `FORM_${['ICF', 'CRF', 'AE', 'CM', 'DV'][Math.floor(Math.random() * 5)]}_${Math.floor(Math.random() * 999) + 1}`,
    fieldId: `field_${Math.random().toString(36).substring(2, 10)}`,
    
    originalValue: i % 3 === 0 ? null : `Original value ${i + 1}`,
    aiSuggestedValue: `AI suggested value ${i + 1}`,
    confidence: confidences[Math.floor(Math.random() * confidences.length)],
    confidenceScore: Math.floor(Math.random() * 50) + 50,
    
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    riskCategory: 'data_integrity' as any,
    riskScore: Math.floor(Math.random() * 100),
    
    edcSource: edcSources[Math.floor(Math.random() * edcSources.length)] as any,
    edcRecordId: `EDC-${Date.now()}-${i}`,
    
    assignedReviewer: `reviewer_${Math.floor(Math.random() * 5) + 1}`,
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000),
    completedAt: Math.random() > 0.6 ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : undefined,
    
    decision: Math.random() > 0.65 ? (Math.random() > 0.5 ? 'approved' as ConfirmationDecision : 'rejected' as ConfirmationDecision) : undefined,
    decisionReason: Math.random() > 0.7 ? `Decision reason ${i + 1}` : undefined,
    reviewerComments: [],
    
    auditTrail: [],
    metadata: {
      sourceSystem: 'ai_engine',
      processingTime: Math.floor(Math.random() * 5000) + 100,
      modelVersion: `v${Math.floor(Math.random() * 5)}.2.1`,
      trainingDataSet: `clinical_v${Math.floor(Math.random() * 3) + 1}`,
      lastTrained: new Date(),
      featureImportance: {},
      alternativeSuggestions: [],
    },
    
    relatedTasks: [],
    attachments: [],
    version: 1,
    isDeleted: false,
    createdBy: `system`,
    updatedBy: `system`,
    tags: [],
  }));
};

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * useReviewQueue - React hook for managing the review task queue
 * 
 * Provides complete task queue functionality:
 * - Fetching and caching tasks
 * - Filtering and sorting
 * - CRUD operations with optimistic updates
 * - Real-time synchronization via WebSocket
 * - Bulk operations
 * - Statistics calculation
 * 
 * @param config - Configuration options
 * @returns Queue state and operations
 */
export function useReviewQueue(config: ReviewQueueConfig = {}) {
  // Merge configuration
  const cfg: Required<ReviewQueueConfig> = { ...DEFAULT_CONFIG, ...config };
  
  // Refs
  const cacheRef = useRef<Map<string, BooleanConfirmationTask>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [tasks, setTasks] = useState<BooleanConfirmationTask[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Computed values
  const hasMore = useMemo(() => tasks.length < totalCount || totalCount === 0, [tasks.length, totalCount]);
  const totalPages = useMemo(() => Math.ceil(totalCount / cfg.pageSize), [totalCount, cfg.pageSize]);

  // ==========================================================================
  // WEBSOCKET INTEGRATION
  // ==========================================================================

  const handleWsMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'task_created':
        // Add new task to beginning of queue
        if (message.payload?.task) {
          setTasks(prev => {
            // Prevent duplicates
            if (prev.some(t => t.id === message.payload.task.id)) {
              return prev;
            }
            return [message.payload.task, ...prev].slice(0, cfg.maxCacheSize);
          });
          setTotalCount(prev => prev + 1);
        }
        break;

      case 'task_updated':
        // Update existing task
        if (message.payload?.task) {
          setTasks(prev => prev.map(t =>
            t.id === message.payload.task.id ? { ...t, ...message.payload.task } : t
          ));
        }
        break;

      case 'task_completed':
      case 'task_escalated':
        // Update task status
        if (message.payload?.taskId && message.payload?.status) {
          setTasks(prev => prev.map(t =>
            t.id === message.payload.taskId
              ? { ...t, status: message.payload.status, completedAt: new Date() }
              : t
          ));
        }
        break;

      case 'queue_update':
        // Full queue refresh triggered
        if (message.payload?.stats) {
          setTotalCount(message.payload.stats.total || 0);
        }
        break;

      default:
        break;
    }

    if (cfg.debug) {
      console.log('[useReviewQueue] WS Message:', message.type, message.payload);
    }
  }, [cfg.maxCacheSize, cfg.debug]);

  const wsState = useWebSocket(
    cfg.enableRealTime ? cfg.wsEndpoint : '',
    {
      authToken: cfg.authToken,
      onMessage: handleWsMessage,
      debug: cfg.debug,
    }
  );

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  /**
   * Fetch tasks from API (or mock)
   */
  const fetchTasks = useCallback(async (
    options: {
      page?: number;
      append?: boolean;
      silent?: boolean;
    } = {}
  ) => {
    const { page = 1, append = false, silent = false } = options;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (!silent) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsRefreshing(true);
    }

    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
      
      if (abortControllerRef.current.signal.aborted) return;

      // Generate mock tasks (in production, this would be an API call)
      const newTasks = generateMockTasks(cfg.pageSize);
      
      setTasks(prev => append ? [...prev, ...newTasks] : newTasks);
      setTotalCount(Math.floor(Math.random() * 200) + 50); // Random total for demo
      setCurrentPage(page);
      setLastFetchedAt(new Date());

      // Update cache
      newTasks.forEach(task => {
        cacheRef.current.set(task.id, task);
      });

    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || 'Failed to fetch tasks');
        if (cfg.debug) {
          console.error('[useReviewQueue] Fetch error:', err);
        }
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [cfg.pageSize, cfg.debug]);

  /**
   * Refresh current data (silent background update)
   */
  const refreshTasks = useCallback(() => {
    fetchTasks({ page: currentPage, silent: true });
  }, [fetchTasks, currentPage]);

  /**
   * Load next page (infinite scroll)
   */
  const loadMore = useCallback(() => {
    if (!hasMore || isLoading || isRefreshing) return;
    fetchTasks({ page: currentPage + 1, append: true });
  }, [hasMore, isLoading, isRefreshing, fetchTasks, currentPage]);

  /**
   * Reset and refetch from beginning
   */
  const resetQueue = useCallback(() => {
    setTasks([]);
    setSelectedTaskIds(new Set());
    setCurrentPage(1);
    setTotalCount(0);
    fetchTasks({ page: 1 });
  }, [fetchTasks]);

  // ==========================================================================
  // TASK OPERATIONS
  // ==========================================================================

  /**
   * Approve a single task
   */
  const approveTask = useCallback(async (taskId: string): Promise<QueueOperationResult> => {
    try {
      // Optimistic update
      if (cfg.optimisticUpdates) {
        setTasks(prev => prev.map(t =>
          t.id === taskId
            ? { ...t, status: 'completed' as TaskStatus, decision: 'approved' as ConfirmationDecision, completedAt: new Date() }
            : t
        ));
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));

      // Remove from selection
      setSelectedTaskIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });

      return {
        success: true,
        taskIds: [taskId],
        timestamp: new Date(),
      };

    } catch (err) {
      // Rollback optimistic update
      if (cfg.optimisticUpdates) {
        setTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, status: 'pending_review' as TaskStatus, decision: undefined } : t
        ));
      }

      return {
        success: false,
        taskIds: [taskId],
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }, [cfg.optimisticUpdates]);

  /**
   * Reject a single task
   */
  const rejectTask = useCallback(async (taskId: string, reason?: string): Promise<QueueOperationResult> => {
    try {
      // Optimistic update
      if (cfg.optimisticUpdates) {
        setTasks(prev => prev.map(t =>
          t.id === taskId
            ? { ...t, status: 'completed' as TaskStatus, decision: 'rejected' as ConfirmationDecision, decisionReason: reason, completedAt: new Date() }
            : t
        ));
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));

      // Remove from selection
      setSelectedTaskIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });

      return {
        success: true,
        taskIds: [taskId],
        timestamp: new Date(),
      };

    } catch (err) {
      // Rollback
      if (cfg.optimisticUpdates) {
        setTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, status: 'pending_review' as TaskStatus, decision: undefined } : t
        ));
      }

      return {
        success: false,
        taskIds: [taskId],
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }, [cfg.optimisticUpdates]);

  /**
   * Escalate a task
   */
  const escalateTask = useCallback(async (taskId: string, reason?: string): Promise<QueueOperationResult> => {
    try {
      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, status: 'escalated' as TaskStatus, decisionReason: reason }
          : t
      ));

      await new Promise(resolve => setTimeout(resolve, 150));

      return {
        success: true,
        taskIds: [taskId],
        timestamp: new Date(),
      };

    } catch (err) {
      return {
        success: false,
        taskIds: [taskId],
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }, []);

  /**
   * Bulk approve multiple tasks
   */
  const bulkApprove = useCallback(async (taskIds: string[]): Promise<QueueOperationResult> => {
    const results: QueueOperationResult[] = [];

    for (const taskId of taskIds) {
      const result = await approveTask(taskId);
      results.push(result);
    }

    const succeeded = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      success: failed.length === 0,
      taskIds: succeeded.map(r => r.taskIds[0]),
      error: failed.length > 0 ? `${failed.length} tasks failed` : undefined,
      timestamp: new Date(),
    };
  }, [approveTask]);

  /**
   * Bulk reject multiple tasks
   */
  const bulkReject = useCallback(async (taskIds: string[], reason?: string): Promise<QueueOperationResult> => {
    const results: QueueOperationResult[] = [];

    for (const taskId of taskIds) {
      const result = await rejectTask(taskId, reason);
      results.push(result);
    }

    const succeeded = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      success: failed.length === 0,
      taskIds: succeeded.map(r => r.taskIds[0]),
      error: failed.length > 0 ? `${failed.length} tasks failed` : undefined,
      timestamp: new Date(),
    };
  }, [rejectTask]);

  /**
   * Auto-approve all high confidence tasks
   */
  const autoApproveHighConfidence = useCallback(async (): Promise<QueueOperationResult> => {
    const highConfidenceTasks = tasks.filter(t =>
      (t.confidence === 'very_high' || t.confidence === 'high') &&
      t.status !== 'completed'
    );

    return bulkApprove(highConfidenceTasks.map(t => t.id));
  }, [tasks, bulkApprove]);

  // ==========================================================================
  // SELECTION MANAGEMENT
  // ==========================================================================

  /**
   * Select/deselect a task
   */
  const selectTask = useCallback((taskId: string, selected: boolean) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  }, []);

  /**
   * Select all visible tasks
   */
  const selectAll = useCallback(() => {
    setSelectedTaskIds(new Set(tasks.map(t => t.id)));
  }, [tasks]);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    setSelectedTaskIds(new Set());
  }, []);

  /**
   * Get selected tasks
   */
  const getSelectedTasks = useCallback(() => {
    return tasks.filter(t => selectedTaskIds.has(t.id));
  }, [tasks, selectedTaskIds]);

  // ==========================================================================
  // FILTERING & SORTING
  // ==========================================================================

  /**
   * Get filtered tasks based on criteria
   */
  const getFilteredTasks = useCallback((filters: QueueFilters): BooleanConfirmationTask[] => {
    let result = [...tasks];

    if (filters.status && filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status);
    }

    if (filters.priority && filters.priority !== 'all') {
      result = result.filter(t => t.priority === filters.priority);
    }

    if (filters.confidence && filters.confidence !== 'all') {
      result = result.filter(t => t.confidence === filters.confidence);
    }

    if (filters.edcSource && filters.edcSource !== 'all') {
      result = result.filter(t => t.edcSource === filters.edcSource);
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(t =>
        t.subjectId.toLowerCase().includes(query) ||
        t.formId.toLowerCase().includes(query) ||
        t.fieldId.toLowerCase().includes(query) ||
        t.trialId.toLowerCase().includes(query) ||
        t.aiSuggestedValue?.toLowerCase().includes(query)
      );
    }

    if (filters.overdueOnly) {
      result = result.filter(t => t.dueDate && t.dueDate < new Date() && !t.completedAt);
    }

    if (filters.myTasksOnly && cfg.reviewerId) {
      result = result.filter(t => t.assignedReviewer === cfg.reviewerId);
    }

    if (filters.dateFrom) {
      result = result.filter(t => t.createdAt >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      result = result.filter(t => t.createdAt <= filters.dateTo!);
    }

    return result;
  }, [tasks, cfg.reviewerId]);

  /**
   * Sort tasks by various criteria
   */
  const sortTasks = useCallback((
    taskList: BooleanConfirmationTask[],
    sortBy: 'priority' | 'confidence' | 'date' | 'risk' | 'dueDate',
    order: 'asc' | 'desc' = 'desc'
  ): BooleanConfirmationTask[] => {
    return [...taskList].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'confidence':
          comparison = a.confidenceScore - b.confidenceScore;
          break;
        case 'date':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'risk':
          comparison = a.riskScore - b.riskScore;
          break;
        case 'dueDate':
          if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = a.dueDate.getTime() - b.dueDate.getTime();
          break;
      }

      return order === 'desc' ? -comparison : comparison;
    });
  }, []);

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  /**
   * Calculate queue statistics
   */
  const getQueueStats = useCallback((): QueueStats => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending_review').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const escalated = tasks.filter(t => t.status === 'escalated').length;
    const critical = tasks.filter(t => t.priority === 'critical').length;
    const highConfidenceReady = tasks.filter(t =>
      (t.confidence === 'very_high' || t.confidence === 'high') &&
      t.status !== 'completed'
    ).length;
    const overdue = tasks.filter(t =>
      t.dueDate && t.dueDate < new Date() && !t.completedAt
    ).length;

    const avgConfidence = total > 0
      ? tasks.reduce((sum, t) => sum + t.confidenceScore, 0) / total
      : 0;

    const avgRisk = total > 0
      ? tasks.reduce((sum, t) => sum + t.riskScore, 0) / total
      : 0;

    // Estimate clearance time (assuming ~45s per task, parallel reviewers)
    const avgReviewTimeSeconds = 45;
    const activeReviewers = 5; // This could come from config or API
    const estimatedClearanceMinutes = Math.ceil(
      ((pending + inProgress) * avgReviewTimeSeconds) / (activeReviewers * 60)
    );

    return {
      total,
      pending,
      inProgress,
      completed,
      escalated,
      critical,
      highConfidenceReady,
      overdue,
      avgConfidence: Math.round(avgConfidence),
      avgRisk: Math.round(avgRisk),
      estimatedClearanceMinutes,
    };
  }, [tasks]);

  // ==========================================================================
  // AUTO-REFRESH
  // ==========================================================================

  useEffect(() => {
    if (cfg.autoRefreshInterval > 0) {
      refreshTimeoutRef.current = setInterval(() => {
        refreshTasks();
      }, cfg.autoRefreshInterval);

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
        }
      };
    }
  }, [cfg.autoRefreshInterval, refreshTasks]);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, []); // Only run once on mount

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, []);

  // ==========================================================================
  // RETURN VALUE
  // ==========================================================================

  const queueState: QueueState = {
    tasks,
    selectedTaskIds,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    lastFetchedAt,
    hasMore,
    isRefreshing,
  };

  return {
    // State
    ...queueState,

    // WebSocket integration
    wsConnected: wsState.isConnected,
    wsLastMessage: wsState.lastMessage,

    // Data fetching
    fetchTasks,
    refreshTasks,
    loadMore,
    resetQueue,

    // Task operations
    approveTask,
    rejectTask,
    escalateTask,
    bulkApprove,
    bulkReject,
    autoApproveHighConfidence,

    // Selection
    selectTask,
    selectAll,
    clearSelection,
    getSelectedTasks,

    // Filtering & sorting
    getFilteredTasks,
    sortTasks,

    // Statistics
    getQueueStats,

    // Utility
    hasCache: cacheRef.current.size > 0,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useReviewQueue;

// Type exports
export type {
  ReviewQueueConfig,
  QueueState,
  QueueFilters,
  QueueStats,
  QueueOperationResult,
};
