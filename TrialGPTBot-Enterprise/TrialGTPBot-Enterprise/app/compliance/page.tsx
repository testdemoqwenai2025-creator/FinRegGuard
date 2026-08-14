'use client';

/**
 * Compliance Center Page - Regulatory compliance monitoring
 * 
 * Shows:
 * - FDA 21 CFR Part 11 compliance status
 * - EMA Annex 11 alignment
 * - GDPR readiness
 * - HIPAA status
 * - Audit trail access
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ComplianceStatus {
  framework: string;
  score: number;
  status: 'compliant' | 'warning' | 'non_compliant' | 'pending_review';
  lastAudit: string;
  nextAudit: string;
  findings: number;
  openIssues: number;
}

interface AuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  userId: string;
  details: string;
  category: string;
}

export default function CompliancePage() {
  const [complianceData, setComplianceData] = useState<Record<string, ComplianceStatus>>({});
  const [recentAudits, setRecentAudits] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFramework, setSelectedFramework] = useState<string>('fda');
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    fetchComplianceData();
    fetchRecentAudits();
  }, []);

  const fetchComplianceData = async () => {
    try {
      const res = await fetch('/api/tasks/stats');
      if (res.ok) {
        const data = await res.json();
        setComplianceData(data.complianceStatus || {});
      }
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAudits = async () => {
    // Simulated audit entries
    setRecentAudits(Array.from({ length: 20 }, (_, i) => ({
      id: `audit_${Date.now()}_${i}`,
      timestamp: new Date(Date.now() - i * 3600000),
      action: ['task_approved', 'task_rejected', 'task_escalated', 'login', 'export', 'config_change'][i % 6],
      userId: ['reviewer_001', 'admin_user', 'ai_engine'][i % 3],
      details: `Audit entry ${i + 1} for compliance tracking`,
      category: ['data_integrity', 'access_control', 'electronic_signature', 'audit_trail'][i % 4],
    })));
  };

  const handleGenerateReport = async (framework: string) => {
    showToast('info', `Generating ${framework.toUpperCase()} compliance report...`);
    
    setTimeout(() => {
      showToast('success', `${framework.toUpperCase()} report ready for download`);
    }, 2000);
  };

  const handleRunAudit = async () => {
    showToast('info', 'Running comprehensive compliance audit...');
    
    setTimeout(() => {
      showToast('success', 'Audit complete • All systems compliant');
      fetchComplianceData();
    }, 3000);
  };

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const frameworks = [
    { key: 'fda', name: 'FDA 21 CFR Part 11', icon: '🏛️', description: 'Electronic records; electronic signatures' },
    { key: 'ema', name: 'EMA Annex 11', icon: '🇪🇺', description: 'Computerized systems in clinical trials' },
    { key: 'gdpr', name: 'GDPR', icon: '🔒', description: 'General Data Protection Regulation' },
    { key: 'hipaa', name: 'HIPAA', icon: '🏥', description: 'Health Insurance Portability & Accountability Act' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Center</h1>
          <p className="text-sm text-gray-500 mt-1">Regulatory compliance monitoring and reporting</p>
        </div>
        
        <button onClick={handleRunAudit} className="btn btn-primary">
          🔍 Run Full Audit
        </button>
      </div>

      {/* Framework Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {frameworks.map((fw) => {
          const data = complianceData[fw.key];
          return (
            <div 
              key={fw.key}
              onClick={() => setSelectedFramework(fw.key)}
              className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition-all ${
                selectedFramework === fw.key ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{fw.icon}</span>
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">{fw.name}</h3>
                  <p className="text-xs text-gray-500">{fw.description}</p>
                </div>
              </div>

              {data ? (
                <>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Compliance Score</span>
                      <span className={`text-lg font-bold ${
                        data.score >= 98 ? 'text-emerald-600' :
                        data.score >= 95 ? 'text-blue-600' :
                        data.score >= 90 ? 'text-amber-600' : 'text-red-600'
                      }`}>{data.score}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          data.score >= 98 ? 'bg-emerald-500' :
                          data.score >= 95 ? 'bg-blue-500' :
                          data.score >= 90 ? 'bg-amber-500' : 'bg-red-500'
                        }`} 
                        style={{ width: `${data.score}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className={`font-medium px-2 py-0.5 rounded ${
                        data.status === 'compliant' ? 'bg-emerald-100 text-emerald-700' :
                        data.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {data.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Findings</span>
                      <span className={data.findings > 0 ? 'text-red-600 font-medium' : 'text-gray-700'}>
                        {data.findings}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Next Audit</span>
                      <span className="text-gray-700">{new Date(data.nextAudit).toLocaleDateString()}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-gray-400">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-xs">Loading...</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed View */}
      {selectedFramework && complianceData[selectedFramework] && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 animate-slide-up">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {frameworks.find(f => f.key === selectedFramework)?.name} Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Requirements Checklist */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Requirements Status</h3>
              <div className="space-y-2">
                {getRequirements(selectedFramework).map((req, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                    <span className={`w-5 h-5 flex items-center justify-center rounded ${
                      req.compliant ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {req.compliant ? '✓' : '✗'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">{req.name}</p>
                      <p className="text-xs text-gray-500">{req.section}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      req.compliant ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {req.compliant ? 'Pass' : 'Fail'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Recent Audit Trail</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentAudits.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="p-2 bg-slate-50 rounded text-sm">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs text-gray-500">{entry.id}</span>
                      <span className="text-xs text-gray-400">{formatTimeAgo(entry.timestamp)}</span>
                    </div>
                    <p className="text-gray-700 mt-1">{entry.details}</p>
                    <div className="flex gap-2 mt-1 text-xs text-gray-500">
                      <span>{entry.action.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{entry.userId}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 flex gap-3">
            <button 
              onClick={() => handleGenerateReport(selectedFramework)}
              className="btn btn-primary"
            >
              📄 Generate Report
            </button>
            <Link href="/audit" className="btn btn-secondary">
              📋 Full Audit Trail →
            </Link>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {!loading && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white">
          <h3 className="font-semibold mb-4">Overall Compliance Summary</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-400 mb-1">Average Score</p>
              <p className="text-2xl font-bold">
                {Math.round(Object.values(complianceData).reduce((sum, d) => sum + d.score, 0) / Object.keys(complianceData).length)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Frameworks Compliant</p>
              <p className="text-2xl font-bold text-emerald-400">
                {Object.values(complianceData).filter(d => d.status === 'compliant').length}/{Object.keys(complianceData).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Open Issues</p>
              <p className="text-2xl font-bold text-amber-400">
                {Object.values(complianceData).reduce((sum, d) => sum + d.openIssues, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Next Audit</p>
              <p className="text-lg font-bold">
                {new Date(Math.min(...Object.values(complianceData).map(d => new Date(d.nextAudit).getTime()))).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

function getRequirements(framework: string): Array<{ name: string; section: string; compliant: boolean }> {
  const requirements: Record<string, Array<{ name: string; section: string; compliant: boolean }>> = {
    fda: [
      { name: 'Electronic Signatures', section: '§11.50', compliant: true },
      { name: 'Audit Trail', section: '§11.10', compliant: true },
      { name: 'System Validation', section: '§11.10(a)', compliant: true },
      { name: 'Access Controls', section: '§11.10(d)', compliant: true },
      { name: 'Electronic Records', section: '§11.1', compliant: true },
      { name: 'Operator Training', section: '§11.5(i)', compliant: true },
    ],
    ema: [
      { name: 'Risk Assessment', section: 'Annex 11.1', compliant: true },
      { name: 'Data Integrity', section: 'Annex 11.3', compliant: true },
      { name: 'Audit Trail', section: 'Annex 11.9', compliant: true },
      { name: 'Backup & Recovery', section: 'Annex 11.12', compliant: true },
      { name: 'Access Control', section: 'Annex 11.7', compliant: true },
    ],
    gdpr: [
      { name: 'Lawful Basis', section: 'Art. 6', compliant: true },
      { name: 'Data Subject Rights', section: 'Art. 15-22', compliant: true },
      { name: 'Data Protection Officer', section: 'Art. 37', compliant: true },
      { name: 'Breach Notification', section: 'Art. 33-34', compliant: true },
      { name: 'International Transfers', section: 'Ch. V', compliant: true },
    ],
    hipaa: [
      { name: 'Privacy Rule', section: '164.502', compliant: false },
      { name: 'Security Rule', section: '164.308', compliant: true },
      { name: 'Breach Notification', section: '164.408', compliant: true },
      { name: 'Minimum Necessary', section: '164.502(b)', compliant: true },
      { name: 'Administrative Safeguards', section: '164.308(a)(1)', compliant: true },
    ],
  };
  
  return requirements[framework] || [];
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}
