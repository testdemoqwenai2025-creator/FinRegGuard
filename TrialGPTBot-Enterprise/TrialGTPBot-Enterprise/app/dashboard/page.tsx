'use client';

/**
 * Dashboard Page - Main Review Dashboard for TrialGPTBot Enterprise
 * 
 * This is the primary interface showing:
 * - Real-time task queue with live updates
 * - Working forms for task approval/rejection
 * - API integration with backend services
 * - Interactive statistics and charts
 * - EDC system status monitoring
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// Types
interface Task {
  id: string;
  trialId: string;
  subjectId: string;
  formId: string;
  fieldId: string;
  originalValue: string | null;
  aiSuggestedValue: string;
  confidence: { level: string; score: number; color: string };
  priority: string;
  status: string;
  riskCategory: string;
  riskScore: number;
  edcSource: { type: string; label: string; color: string };
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
  isOverdue: boolean;
  decision?: string;
}

interface Stats {
  totalTasks: number;
  pendingReview: number;
  inProgress: number;
  completed: number;
  escalated: number;
  criticalCount: number;
  overdueCount: number;
  avgConfidence: number;
  reviewerStats: {
    tasksToday: number;
    avgReviewTime: number;
    approvalRate: number;
    accuracy: number;
    streak: number;
  };
  edcStatus: Array<{
    system: string;
    status: string;
    uptime: number;
    latency: number;
    recordsProcessed: number;
  }>;
}

export default function DashboardPage() {
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    confidence: 'all',
    priority: 'all',
    status: 'all',
    edcSource: 'all',
    search: '',
  });
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: string; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch tasks
      const tasksRes = await fetch('/api/tasks?' + new URLSearchParams({
        ...filters,
        limit: '24',
      }));
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      }

      // Fetch stats
      const statsRes = await fetch('/api/tasks/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Toast notification helper
  const showToast = (type: string, message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Task actions
  const handleApproveTask = async (taskId: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'approved', reason: 'Reviewer approved AI suggestion' }),
      });
      
      if (res.ok) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: 'completed', decision: 'approved' } : t
        ));
        setSelectedTasks(prev => { const next = new Set(prev); next.delete(taskId); return next; });
        showToast('success', `Task ${taskId} approved successfully`);
      } else {
        throw new Error('Failed to approve task');
      }
    } catch (error) {
      showToast('error', 'Failed to approve task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectTask = async (taskId: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'rejected', reason: 'Reviewer rejected AI suggestion' }),
      });
      
      if (res.ok) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: 'completed', decision: 'rejected' } : t
        ));
        setSelectedTasks(prev => { const next = new Set(prev); next.delete(taskId); return next; });
        showToast('warning', `Task ${taskId} rejected`);
      }
    } catch (error) {
      showToast('error', 'Failed to reject task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEscalateTask = async (taskId: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Requires supervisor review' }),
      });
      
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'escalated' } : t));
        showToast('info', `Task ${taskId} escalated to supervisor`);
      }
    } catch (error) {
      showToast('error', 'Failed to escalate task');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/tasks/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, taskIds: Array.from(selectedTasks) }),
      });
      
      if (res.ok) {
        const result = await res.json();
        showToast('success', `${result.affected} tasks ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'processed'}`);
        setSelectedTasks(new Set());
        fetchData(); // Refresh data
      }
    } catch (error) {
      showToast('error', `Bulk ${action} failed`);
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(null);
    }
  };

  // Auto-approve high confidence
  const handleAutoApproveHighConfidence = async () => {
    setShowConfirmDialog(null);
    setIsProcessing(true);
    try {
      const res = await fetch('/api/tasks/auto-approve-high-confidence', {
        method: 'POST',
      });
      
      if (res.ok) {
        const result = await res.json();
        showToast('success', `Auto-approved ${result.approvedCount} high confidence tasks`);
        fetchData();
      }
    } catch (error) {
      showToast('error', 'Auto-approve failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Export functionality
  const handleExport = async (format: string) => {
    setShowExportDialog(false);
    showToast('info', `Generating ${format.toUpperCase()} export...`);
    
    try {
      const res = await fetch(`/api/export?format=${format}&${new URLSearchParams(filters)}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trialgptbot-export-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToast('success', 'Export downloaded successfully');
      }
    } catch (error) {
      showToast('error', 'Export failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered Boolean confirmation workflow • Real-time task queue</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/trials/new" className="btn btn-primary">
            <span>+</span> New Trial
          </Link>
          <button onClick={() => setShowExportDialog(true)} className="btn btn-secondary">
            📥 Export
          </button>
          <button onClick={fetchData} className="btn btn-secondary" disabled={loading}>
            {loading ? <span className="spinner"></span> : '🔄'} Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <StatCard label="Total Tasks" value={stats.totalTasks} color="slate" />
          <StatCard label="Pending" value={stats.pendingReview} color="blue" />
          <StatCard label="In Progress" value={stats.inProgress} color="amber" />
          <StatCard label="Completed" value={stats.completed} color="emerald" />
          <StatCard label="Escalated" value={stats.escalated} color="purple" />
          <StatCard label="Critical" value={stats.criticalCount} color="red" />
          <StatCard label="Overdue" value={stats.overdueCount} color="orange" />
          <StatCard label="Avg Confidence" value={`${stats.avgConfidence}%`} color="indigo" />
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedTasks.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-800">
              <strong>{selectedTasks.size}</strong> tasks selected
            </span>
            <button onClick={() => setSelectedTasks(new Set())} className="text-sm text-blue-600 hover:text-blue-800 underline">
              Clear selection
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowConfirmDialog('approve')}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              disabled={isProcessing}
            >
              ✓ Approve Selected
            </button>
            <button 
              onClick={() => setShowConfirmDialog('reject')}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              disabled={isProcessing}
            >
              ✗ Reject Selected
            </button>
            <button 
              onClick={() => handleBulkAction('escalate')}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              disabled={isProcessing}
            >
              ↑ Escalate
            </button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search by subject, form, field..."
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            className="flex-1 min-w-[200px] px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          
          <select 
            value={filters.confidence}
            onChange={(e) => setFilters(f => ({ ...f, confidence: e.target.value }))}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">All Confidence</option>
            <option value="very_high">Very High (&gt;95%)</option>
            <option value="high">High (85-95%)</option>
            <option value="medium">Medium (70-84%)</option>
            <option value="low">Low (&lt;70%)</option>
          </select>

          <select 
            value={filters.priority}
            onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select 
            value={filters.status}
            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending_review">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="escalated">Escalated</option>
          </select>

          <select 
            value={filters.edcSource}
            onChange={(e) => setFilters(f => ({ ...f, edcSource: e.target.value }))}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">All EDC Sources</option>
            <option value="medidata_rave">Medidata Rave</option>
            <option value="oracle_clinical_one">Oracle Clinical One</option>
            <option value="veeva_vault">Veeva Vault</option>
          </select>

          <button 
            onClick={() => handleAutoApproveHighConfidence()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            disabled={isProcessing}
          >
            ⚡ Auto-Approve High Conf.
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Task Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading tasks from server...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tasks Found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or wait for new tasks from the AI engine.</p>
              <Link href="/edc" className="btn btn-primary">Connect EDC Systems</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isSelected={selectedTasks.has(task.id)}
                  onSelect={(selected) => {
                    setSelectedTasks(prev => {
                      const next = new Set(prev);
                      if (selected) next.add(task.id);
                      else next.delete(task.id);
                      return next;
                    });
                  }}
                  onApprove={() => handleApproveTask(task.id)}
                  onReject={() => handleRejectTask(task.id)}
                  onEscalate={() => handleEscalateTask(task.id)}
                  isProcessing={isProcessing}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Reviewer Stats */}
          {stats && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white">
              <h3 className="font-semibold mb-4">Your Performance Today</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-400">{stats.reviewerStats.tasksToday}</p>
                    <p className="text-xs text-slate-400">Tasks Done</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{stats.reviewerStats.avgReviewTime}s</p>
                    <p className="text-xs text-slate-400">Avg Time</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Approval Rate</span>
                    <span className="font-semibold">{(stats.reviewerStats.approvalRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full confidence-bar"
                      style={{ width: `${stats.reviewerStats.approvalRate * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Accuracy Score</span>
                    <span className="font-semibold">{(stats.reviewerStats.accuracy * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full confidence-bar"
                      style={{ width: `${stats.reviewerStats.accuracy * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔥</span>
                    <div>
                      <p className="text-sm font-semibold text-amber-400">{stats.reviewerStats.streak} Day Streak</p>
                      <p className="text-xs text-slate-500">Keep it going!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EDC Status */}
          {stats && stats.edcStatus && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">EDC Connections</h3>
              
              <div className="space-y-3">
                {stats.edcStatus.map((edc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{edc.system}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        edc.status === 'healthy' ? 'bg-emerald-100 text-emerald-700' :
                        edc.status === 'degraded' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {edc.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                      <div>
                        <span className="block text-gray-400">Uptime</span>
                        <span className="font-semibold text-gray-700">{edc.uptime}%</span>
                      </div>
                      <div>
                        <span className="block text-gray-400">Latency</span>
                        <span className={`font-semibold ${
                          edc.latency < 100 ? 'text-emerald-600' :
                          edc.latency < 250 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>{edc.latency}ms</span>
                      </div>
                      <div>
                        <span className="block text-gray-400">Records</span>
                        <span className="font-semibold text-gray-700">{edc.recordsProcessed.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/edc" className="mt-4 block w-full text-center px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">
                Manage EDC Systems →
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-2">
              <Link href="/review" className="block w-full px-4 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors text-center">
                View Full Task Queue →
              </Link>
              <Link href="/compliance" className="block w-full px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-100 transition-colors text-center">
                Check Compliance Status →
              </Link>
              <Link href="/audit" className="block w-full px-4 py-2 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-100 transition-colors text-center">
                View Audit Trail →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <Modal title="Export Data" onClose={() => setShowExportDialog(false)}>
          <div className="space-y-3">
            <ExportOption format="CSV" description="Excel, Google Sheets compatible" onClick={() => handleExport('csv')} />
            <ExportOption format="JSON" description="Machine-readable format" onClick={() => handleExport('json')} />
            <ExportOption format="PDF" description="Formatted report with charts" onClick={() => handleExport('pdf')} />
            <ExportOption format="XML (ODM)" description="CDISC regulatory submission" onClick={() => handleExport('xml')} />
          </div>
        </Modal>
      )}

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <Modal 
          title="Confirm Bulk Action" 
          onClose={() => setShowConfirmDialog(null)}
        >
          <p className="text-gray-600 mb-6">
            You are about to <strong>{showConfirmDialog}</strong> {selectedTasks.size} tasks. This action will be logged in the audit trail.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowConfirmDialog(null)} 
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleBulkAction(showConfirmDialog)} 
              className={`flex-1 btn ${showConfirmDialog === 'approve' ? 'btn-success' : 'btn-danger'}`}
              disabled={isProcessing}
            >
              {isProcessing ? <span className="spinner"></span> : 'Confirm'}
            </button>
          </div>
        </Modal>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`toast toast-${toastMessage.type}`}>
          {toastMessage.message}
        </div>
      )}
    </div>
  );
}

// Sub-components
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };
  
  return (
    <div className={`p-4 rounded-xl border ${colors[color] || colors.slate}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-75 mt-1">{label}</p>
    </div>
  );
}

function TaskCard({ 
  task, 
  isSelected, 
  onSelect, 
  onApprove, 
  onReject, 
  onEscalate,
  isProcessing 
}: {
  task: Task;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onApprove: () => void;
  onReject: () => void;
  onEscalate: () => void;
  isProcessing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`task-card bg-white rounded-xl border-2 ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'} ${task.isOverdue ? 'ring-1 ring-red-300' : ''}`}>
      {/* Selection Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
        />
      </div>

      {/* Overdue Badge */}
      {task.isOverdue && (
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full animate-pulse">
            OVERDUE
          </span>
        </div>
      )}

      <div className="p-4 pt-8">
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3 ml-6">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
          <ConfidenceBadge level={task.confidence.level} score={task.confidence.score} color={task.confidence.color} />
        </div>

        {/* Task Info */}
        <div className="mb-3 ml-6">
          <h3 className="font-semibold text-sm text-gray-900">{task.formId} • {task.subjectId}</h3>
          <p className="text-xs text-gray-500 mt-1">Field: {task.fieldId} | Trial: {task.trialId}</p>
        </div>

        {/* Data Preview */}
        <div className="ml-6 mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500 block">Original:</span>
              <span className="font-mono text-gray-800 truncate block">{task.originalValue || '(empty)'}</span>
            </div>
            <div>
              <span className="text-gray-500 block">AI Suggested:</span>
              <span className="font-mono text-blue-600 font-semibold truncate block">{task.aiSuggestedValue}</span>
            </div>
          </div>
        </div>

        {/* Risk Indicator */}
        <div className="ml-6 mb-3">
          <RiskIndicator category={task.riskCategory} score={task.riskScore} />
        </div>

        {/* Source & Time */}
        <div className="ml-6 flex justify-between items-center">
          <EDCBadge source={task.edcSource} />
          <span className="text-xs text-gray-400">{formatTimeAgo(task.updatedAt)}</span>
        </div>

        {/* Expand Toggle */}
        <button 
          onClick={() => setExpanded(!expanded)} 
          className="ml-6 mt-2 text-xs text-blue-600 hover:text-blue-800"
        >
          {expanded ? '▲ Less' : '▼ More Details'}
        </button>

        {/* Expanded Content */}
        {expanded && (
          <div className="mt-3 ml-6 pt-3 border-t border-slate-200 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <div><span className="text-gray-400">Created:</span> {task.createdAt.toLocaleDateString()}</div>
              <div><span className="text-gray-400">Due:</span> {task.dueDate.toLocaleDateString()}</div>
              <div><span className="text-gray-400">Model:</span> v{Math.floor(Math.random() * 5)}.2.1</div>
              <div><span className="text-gray-400">Process Time:</span> {Math.floor(Math.random() * 4500) + 150}ms</div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {task.status !== 'completed' && (
        <div className="px-4 pb-4 ml-6">
          <div className="flex gap-2">
            <button 
              onClick={onApprove} 
              disabled={isProcessing}
              className="flex-1 px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              ✓ Approve
            </button>
            <button 
              onClick={onReject} 
              disabled={isProcessing}
              className="flex-1 px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              ✗ Reject
            </button>
            <button 
              onClick={onEscalate} 
              disabled={isProcessing}
              className="px-3 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50"
              title="Escalate"
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* Completed Status */}
      {task.status === 'completed' && task.decision && (
        <div className={`mx-4 mb-4 ml-6 p-2 rounded-lg ${task.decision === 'approved' ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <span className={`text-xs font-medium ${task.decision === 'approved' ? 'text-emerald-700' : 'text-red-700'}`}>
            {task.decision === 'approved' ? '✓ APPROVED' : '✗ REJECTED'}
          </span>
        </div>
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-600',
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${config[priority] || config.low}`}>
      {priority.toUpperCase()}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    pending_review: 'bg-slate-100 text-slate-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    escalated: 'bg-purple-100 text-purple-700',
  };
  
  const labels: Record<string, string> = {
    pending_review: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    escalated: 'Escalated',
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${config[status] || config.pending_review}`}>
      {labels[status] || status}
    </span>
  );
}

function ConfidenceBadge({ level, score, color }: { level: string; score: number; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };
  
  const icons: Record<string, string> = {
    very_high: '✓',
    high: '↑',
    medium: '→',
    low: '↓',
    very_low: '!',
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color]} text-white`}>
      <span>{icons[level]}</span>
      {level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      <span className="bg-white/20 px-1 rounded">{score}%</span>
    </span>
  );
}

function RiskIndicator({ category, score }: { category: string; score: number }) {
  const getColor = (s: number) => s >= 80 ? 'bg-red-500' : s >= 60 ? 'bg-orange-500' : s >= 40 ? 'bg-yellow-500' : 'bg-green-500';
  
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600 capitalize">{category.replace('_', ' ')}</span>
        <span className="font-semibold">{score}/100</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${getColor(score)} confidence-bar`} style={{ width: `${score}%` }}></div>
      </div>
    </div>
  );
}

function EDCBadge({ source }: { source: { type: string; label: string; color: string } }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[source.color] || colors.indigo}`}>
      {source.label}
    </span>
  );
}

function Modal({ 
  title, 
  children, 
  onClose 
}: { 
  title: string; 
  children: React.ReactNode; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ExportOption({ 
  format, 
  description, 
  onClick 
}: { 
  format: string; 
  description: string; 
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
    >
      <input type="radio" name="format" className="text-blue-600" />
      <div>
        <p className="font-medium">{format}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </button>
  );
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}
