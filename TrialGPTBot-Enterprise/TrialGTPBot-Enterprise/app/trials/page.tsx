'use client';

/**
 * Clinical Trials Page - Manage and view clinical trials
 * Integrates with ClinicalTrials.gov API for real data
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Trial {
  nctId: string;
  title: string;
  status: string;
  phase: string[];
  conditions: string[];
  interventions?: Array<{ type: string; name: string }>;
  locations?: Array<{ facility: string; city: string; country: string; status: string }>;
  hasResults: boolean;
}

export default function TrialsPage() {
  const [trials, setTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [showNewTrialForm, setShowNewTrialForm] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState<Trial | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  // Fetch trials from API
  useEffect(() => {
    fetchTrials();
  }, [statusFilter, phaseFilter]);

  const fetchTrials = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        query: searchQuery,
        status: statusFilter,
        phase: phaseFilter,
        limit: '20',
      });
      
      const res = await fetch(`/api/clinicaltrials?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTrials(data.studies || []);
      }
    } catch (error) {
      console.error('Failed to fetch trials:', error);
      showToast('error', 'Failed to load clinical trials');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrials();
  };

  const handleCreateTrial = async (formData: FormData) => {
    try {
      // In production, this would POST to /api/trials
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setShowNewTrialForm(false);
      showToast('success', `Trial "${formData.get('title')}" created successfully!`);
      
      // Refresh trials list
      fetchTrials();
    } catch (error) {
      showToast('error', 'Failed to create trial');
    }
  };

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinical Trials</h1>
          <p className="text-sm text-gray-500 mt-1">Browse and manage clinical trial protocols • Data from ClinicalTrials.gov</p>
        </div>
        
        <button 
          onClick={() => setShowNewTrialForm(true)}
          className="btn btn-primary"
        >
          <span>+</span> New Trial
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by condition, drug name, or NCT ID..."
            className="flex-1 min-w-[250px] px-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-400"
          />
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="RECRUITING">Recruiting</option>
            <option value="COMPLETED">Completed</option>
            <option value="TERMINATED">Terminated</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>

          <select 
            value={phaseFilter} 
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
          >
            <option value="all">All Phases</option>
            <option value="PHASE1">Phase 1</option>
            <option value="PHASE2">Phase 2</option>
            <option value="PHASE3">Phase 3</option>
            <option value="PHASE4">Phase 4</option>
          </select>

          <button type="submit" className="btn btn-primary">
            🔍 Search
          </button>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Fetching trials from ClinicalTrials.gov...</p>
        </div>
      ) : trials.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="text-6xl mb-4">🔬</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Trials Found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filters.</p>
          <Link href="/edc" className="btn btn-secondary">Connect EDC for Trial Data</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {trials.map((trial) => (
            <div 
              key={trial.nctId} 
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedTrial(trial)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                      {trial.nctId}
                    </span>
                    <StatusBadge status={trial.status} />
                    {trial.phase.map(p => (
                      <span key={p} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                        {p.replace('PHASE', 'Phase ')}
                      </span>
                    ))}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">{trial.title}</h3>
                  
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                    {trial.conditions?.slice(0, 3).map(condition => (
                      <span key={condition} className="px-2 py-0.5 bg-gray-100 rounded">
                        {condition}
                      </span>
                    ))}
                  </div>

                  {trial.interventions && trial.interventions.length > 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                      Interventions: {trial.interventions.slice(0, 2).map(i => i.name).join(', ')}
                      {trial.interventions.length > 2 && ` +${trial.interventions.length - 2} more`}
                    </div>
                  )}
                </div>

                <div className="ml-4 text-right">
                  <p className="text-xs text-gray-400">{trial.locations?.length || 0} sites</p>
                  {trial.hasResults && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                      Has Results
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trial Detail Modal */}
      {selectedTrial && (
        <Modal title={`Trial Details - ${selectedTrial.nctId}`} onClose={() => setSelectedTrial(null)}>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900">{selectedTrial.title}</h4>
              <p className="text-sm text-gray-600 mt-1">Official Title: {selectedTrial.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <StatusBadge status={selectedTrial.status} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Phases</p>
                <p className="text-sm font-medium">{selectedTrial.phase.join(', ')}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Conditions</p>
              <div className="flex flex-wrap gap-2">
                {selectedTrial.conditions?.map(c => (
                  <span key={c} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">{c}</span>
                ))}
              </div>
            </div>

            {selectedTrial.locations && selectedTrial.locations.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Locations ({selectedTrial.locations.length})</p>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {selectedTrial.locations.slice(0, 5).map((loc, i) => (
                    <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                      <span className="font-medium">{loc.facility}</span>
                      <span className="text-gray-500 ml-2">{loc.city}, {loc.country}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <button onClick={() => {
                showToast('info', `Importing ${selectedTrial.nctId} into system...`);
                setSelectedTrial(null);
              }} className="btn btn-primary flex-1">
                Import Trial
              </button>
              <a 
                href={`https://clinicaltrials.gov/study/${selectedTrial.nctId}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-secondary flex-1"
              >
                View on CTG →
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* New Trial Form Modal */}
      {showNewTrialForm && (
        <Modal title="Create New Trial Protocol" onClose={() => setShowNewTrialForm(false)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleCreateTrial(new FormData(e.currentTarget));
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trial Title *</label>
              <input name="title" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Enter trial title..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Protocol Number *</label>
                <input name="protocolNumber" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="PROT-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phase *</label>
                <select name="phase" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="">Select Phase</option>
                  <option value="PHASE1">Phase 1</option>
                  <option value="PHASE2">Phase 2</option>
                  <option value="PHASE3">Phase 3</option>
                  <option value="PHASE4">Phase 4</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conditions Studied</label>
              <input name="conditions" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="e.g., Breast Cancer, Diabetes Type 2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Brief description of the trial..."></textarea>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setShowNewTrialForm(false)} className="btn btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn btn-primary flex-1">Create Trial</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Toast */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    RECRUITING: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-gray-100 text-gray-700',
    TERMINATED: 'bg-red-100 text-red-700',
    WITHDRAWN: 'bg-yellow-100 text-yellow-700',
    RECRUITING_BY_INVITATION: 'bg-blue-100 text-blue-700',
    NOT_YET_RECRUITING: 'bg-slate-100 text-slate-700',
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded ${colors[status] || colors.RECRUITING}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
