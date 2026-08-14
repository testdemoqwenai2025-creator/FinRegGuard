/**
 * Review Components - TrialGPTBot Enterprise
 * 
 * This module exports all review dashboard components for the AI-powered
 * clinical trial management platform.
 * 
 * @module components/review
 * @description
 * Comprehensive review interface for Boolean Confirmation workflow,
 * featuring card-based task review, bulk actions, real-time updates,
 * and performance analytics.
 * 
 * @example
 * ```tsx
 * import { BooleanConfirmationPanel, TaskCard, StatisticsSidebar } from '@/components/review';
 * 
 * function ReviewDashboard() {
 *   return (
 *     <BooleanConfirmationPanel 
 *       reviewerId="reviewer_001"
 *       trialId="TRIAL-456"
 *       permissions={['approve', 'reject', 'escalate']}
 *     />
 *   );
 * }
 * ```
 */

// Main component
export { BooleanConfirmationPanel, default } from './BooleanConfirmationPanel';

// Sub-components (can be used standalone)
export {
  ConfidenceBadge,
  PriorityBadge,
  StatusBadge,
  EDCSourceBadge,
  RiskIndicator,
  TaskCard,
  StatisticsSidebar,
  BulkActionBar,
  FilterBar,
  WebSocketStatusIndicator,
} from './BooleanConfirmationPanel';

// Types
export type {
  BooleanConfirmationPanelProps,
  FilterState,
  BulkAction,
  DashboardWidgetConfig,
} from './BooleanConfirmationPanel';

/**
 * @component BooleanConfirmationPanel
 * @description Main review dashboard with full feature set including:
 * - Card-based task review interface
 * - Bulk action controls (approve, reject, escalate)
 * - Real-time WebSocket integration
 * - Advanced filtering and search
 * - Performance statistics sidebar
 * - EDC system status monitoring
 * - Regulatory compliance indicators
 */

/**
 * @component TaskCard
 * @description Individual task card displaying:
 * - Confidence level and score
 * - Priority and status badges
 * - Original vs AI-suggested values
 * - Risk assessment indicator
 * - EDC source information
 * - Action buttons (Approve/Reject/Escalate)
 */

/**
 * @component StatisticsSidebar
 * @description Reviewer performance sidebar showing:
 * - Daily/weekly/monthly task counts
 * - Average review time metrics
 * - Approval rate statistics
 * - Accuracy scores (precision, recall, F1)
 * - Queue depth and clearance estimates
 * - Team ranking and percentile
 * - Achievement tracking
 * - Certification status
 */
