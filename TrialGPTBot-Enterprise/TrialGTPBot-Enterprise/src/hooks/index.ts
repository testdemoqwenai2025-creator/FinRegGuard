/**
 * Custom Hooks - TrialGPTBot Enterprise
 * 
 * This module exports all custom React hooks for the AI-powered
 * clinical trial management platform.
 * 
 * @module hooks
 * @description
 * Comprehensive set of hooks providing:
 * - Real-time WebSocket connectivity
 * - Task queue management
 * - Reviewer performance statistics
 */

// WebSocket hook
export { useWebSocket, default as useWebSocketDefault } from './useWebSocket';
export type {
  WebSocketMessage,
  WebSocketConfig,
  WebSocketState,
  ConnectionEvent,
  QueuedMessage,
} from './useWebSocket';

/**
 * @hook useWebSocket
 * @description Provides real-time WebSocket connectivity with:
 * - Automatic reconnection with exponential backoff
 * - Message queuing during disconnection
 * - Heartbeat/ping-pong keepalive
 * - Connection health monitoring
 * - Authentication token management
 * 
 * @example
 * ```tsx
 * const { isConnected, lastMessage, sendMessage } = useWebSocket(
 *   'wss://api.example.com/ws',
 *   { authToken: 'your-token', enableHeartbeat: true }
 * );
 * ```
 */

// Review Queue hook
export { useReviewQueue, default as useReviewQueueDefault } from './useReviewQueue';
export type {
  ReviewQueueConfig,
  QueueState,
  QueueFilters,
  QueueStats,
  QueueOperationResult,
} from './useReviewQueue';

/**
 * @hook useReviewQueue
 * @description Manages the review task queue with:
 * - Task retrieval and caching
 * - Priority-based sorting
 * - Status tracking
 * - Bulk operations (approve, reject, escalate)
 * - Optimistic updates
 * - Real-time synchronization via WebSocket
 * - Statistics calculation
 * 
 * @example
 * ```tsx
 * const {
 *   tasks,
 *   loading,
 *   approveTask,
 *   rejectTask,
 *   bulkApprove,
 *   getFilteredTasks,
 *   getQueueStats,
 * } = useReviewQueue({
 *   reviewerId: 'reviewer_001',
 *   autoRefreshInterval: 30000,
 * });
 * ```
 */

// Reviewer Stats hook
export { useReviewerStats, default as useReviewerStatsDefault } from './useReviewerStats';
export type {
  ReviewerStatsConfig,
  ReviewerStatsState,
  TrendData,
  TrendDataPoint,
  TeamComparison,
  Achievement,
  GoalProgress,
} from './useReviewerStats';

/**
 * @hook useReviewerStats
 * @description Tracks and displays reviewer performance metrics:
 * - Real-time performance tracking
 * - Historical trend analysis
 * - Team ranking and percentile calculations
 * - Goal progress monitoring
 * - Productivity analytics
 * - Quality metrics (accuracy, precision, recall)
 * - Streak and achievement tracking
 * 
 * @example
 * ```tsx
 * const {
 *   stats,
 *   teamComparison,
 *   achievements,
 *   goals,
 *   getProductivityTrend,
 *   getPerformanceRating,
 * } = useReviewerStats({
 *   reviewerId: 'reviewer_001',
 *   period: 'week',
 *   includeTeamComparison: true,
 * });
 * ```
 */
