'use client';

/**
 * Review Queue Page - Full task review interface
 * Extended version of dashboard with more detailed controls
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function ReviewPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    fetchTasks();
    
    // Simulate real-time updates
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks?limit=50&status=pending_review,in_progress');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      showToast('error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (taskId: string, decision: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });

      if (res.ok) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status: 'completed', decision } : t
        ));
        showToast('success', `Task ${taskId} ${decision}`);
        if (selectedTask?.id === taskId) setSelectedTask(null);
      }
    } catch (error) {
      showToast('error', 'Failed to process decision');
    }
  };

  const handleBulkDecision = async (action: string) => {
    try {
      const res = await fetch('/api/tasks/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, taskIds: Array.from(selectedIds) }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast('success', `${data.affected} tasks ${action}ed`);
        setSelectedIds(new Set());
        fetchTasks();
      }
    } catch (error) {
      showToast('error', 'Bulk action failed');
    }
  };

  const toggleSelection = (taskId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const pendingCount = tasks.filter(t => t.status !== 'completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Review Queue</h1>
          <p className="text-sm text-gray-500 mt-1">{pendingCount} tasks awaiting Boolean confirmation</p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setBatchMode(!batchMode)} 
            className={`btn ${batchMode ? 'btn-primary' : 'btn-secondary'}`}
          >
            {batchMode ? '✓ Batch Mode On' : 'Batch Mode'}
          </button>
          <Link href="/dashboard" className="btn btn-secondary">← Dashboard</Link>
        </div>
      </div>

      {/* Batch Mode Bar */}
      {batchMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-blue-800">
              {selectedIds.size} tasks selected
            </span>
            <div className="flex gap-2">
              <button onClick={() => setSelectedIds(new Set(tasks.map(t => t.id)))} className="px-3 py-1.5 bg-white text-blue-700 text-sm rounded-lg border border-blue-200 hover:bg-blue-50">
                Select All ({pendingCount})
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 bg-white text-red-600 text-sm rounded-lg border border-red-200 hover:bg-red-50">
                Clear
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => handleBulkDecision('approve')}
              disabled={selectedIds.size === 0}
              className="flex-1 btn btn-success disabled:opacity-50"
            >
              ✓ Approve Selected ({selectedIds.size})
            </button>
            <button 
              onClick={() => handleBulkDecision('reject')}
              disabled={selectedIds.size === 0}
              className="flex-1 btn btn-danger disabled:opacity-50"
            >
              ✗ Reject Selected ({selectedIds.size})
            </button>
            <button 
              onClick={() => handleBulkDecision('escalate')}
              disabled={selectedIds.size === 0}
              className="flex-1 btn btn-warning disabled:opacity-50"
            >
              ↑ Escalate ({selectedIds.size})
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading review queue...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div 
              key={task.id}
              className={`bg-white rounded-xl border-2 p-5 transition-all ${
                selectedTask?.id === task.id ? 'border-blue-500 ring-2 ring-blue-200' :
                batchMode && selectedIds.has(task.id) ? 'border-blue-400 bg-blue-50' :
                'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Selection Checkbox (Batch Mode) */}
                {batchMode && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(task.id)}
                    onChange={() => toggleSelection(task.id)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                )}

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono font-semibold text-gray-900">{task.id}</span>
                    <PriorityBadge priority={task.priority} />
                    <ConfidenceBadge level={task.confidence.level} score={task.confidence.score} />
                    {task.isOverdue && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded animate-pulse">OVERDUE</span>}
                  </div>

                  <p className="text-sm text-gray-700 mb-2">
                    <strong>{task.formId}</strong> • Subject: {task.subjectId} • Trial: {task.trialId}
                  </p>

                  {/* Data Comparison */}
                  <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg mb-3">
                    <div>
                      <span className="text-xs text-gray-500 block">Original Value</span>
                      <span className="font-mono text-sm text-gray-800">{task.originalValue || '(empty/null)'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">AI Suggestion</span>
                      <span className="font-mono text-sm text-blue-600 font-semibold">{task.aiSuggestedValue}</span>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <EDCBadge source={task.edcSource} />
                    <span>Risk: {task.riskScore}/100</span>
                    <span>Due: {task.dueDate.toLocaleDateString()}</span>
                    <span>Updated: {formatTimeAgo(task.updatedAt)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {task.status !== 'completed' && (
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => handleDecision(task.id, 'approved')}
                      className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button 
                      onClick={() => handleDecision(task.id, 'rejected')}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                    >
                      ✗ Reject
                    </button>
                    <button 
                      onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      👁 Details
                    </button>
                  </div>
                )}

                {/* Completed Status */}
                {task.status === 'completed' && (
                  <div className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                    task.decision === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {task.decision === 'approved' ? '✓ Approved' : '✗ Rejected'}
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {selectedTask?.id === task.id && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                  <h4 className="font-semibold text-gray-900">Task Details</h4>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="text-gray-500">Field ID:</span> <span className="font-mono">{task.fieldId}</span></div>
                    <div><span className="text-gray-500">Risk Category:</span> {task.riskCategory.replace('_', ' ')}</div>
                    <div><span className="text-gray-500">Confidence:</span> {task.confidence.score}% ({task.confidence.level})</div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-amber-800 mb-1">⚠️ Reviewer Guidance</p>
                    <p className="text-sm text-amber-700">
                      This task has {task.confidence.level.replace('_', ' ')} confidence. 
                      {task.confidence.score >= 85 ? 'AI suggestion can be accepted with minimal review.' :
                       task.confidence.score >= 70 ? 'Review suggested values carefully before deciding.' :
                       'Manual verification strongly recommended.'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleDecision(task.id, 'approved')} className="btn btn-success flex-1">Confirm Approval</button>
                    <button onClick={() => handleDecision(task.id, 'rejected')} className="btn btn-danger flex-1">Confirm Rejection</button>
                    <button onClick={() => setSelectedTask(null)} className="btn btn-secondary flex-1">Close</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-600',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[priority]}`}>{priority.toUpperCase()}</span>;
}

function ConfidenceBadge({ level, score }: { level: string; score: number }) {
  const colors: Record<string, string> = {
    very_high: 'bg-emerald-500 text-white',
    high: 'bg-blue-500 text-white',
    medium: 'bg-amber-500 text-white',
    low: 'bg-orange-500 text-white',
    very_low: 'bg-red-500 text-white',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[level]}`}>{level.replace('_', ' ').toUpperCase()} {score}%</span>;
}

function EDCBadge({ source }: { source: { type: string; label: string; color: string } }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
  };
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${colors[source.color] || colors.indigo}`}>{source.label}</span>;
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}
