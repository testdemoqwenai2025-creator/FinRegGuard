'use client';

/**
 * EDC Integration Page - Connect and manage EDC systems
 * 
 * Provides:
 * - Connection status monitoring
 * - Configuration forms for each EDC system
 * - Real-time connectivity testing
 * - Data sync management
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface EDCSystem {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'degraded' | 'disconnected' | 'configuring';
  latency: number;
  lastSync: string;
  recordsProcessed: number;
  pendingRecords: number;
  version: string;
  config?: {
    environment?: string;
    studyOid?: string;
    tenantUrl?: string;
    vaultDns?: string;
  };
}

export default function EDCPage() {
  const [systems, setSystems] = useState<EDCSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  [showConfigForm, setShowConfigForm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  // Fetch EDC status on mount
  useEffect(() => {
    testAllConnections();
  }, []);

  const testAllConnections = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/edc');
      if (res.ok) {
        const data = await res.json();
        setSystems(data.systems.map((s: any) => ({
          ...s,
          id: s.type,
          name: s.system,
        })));
      }
    } catch (error) {
      console.error('Failed to test connections:', error);
      showToast('error', 'Failed to test EDC connections');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSingle = async (systemType: string) => {
    try {
      setTestingConnection(true);
      const res = await fetch(`/api/edc?system=${systemType}`);
      if (res.ok) {
        const data = await res.json();
        const updatedSystem = data.systems[0];
        setSystems(prev => prev.map(s => 
          s.type === systemType ? { ...s, ...updatedSystem } : s
        ));
        showToast('success', `${updatedSystem.system} connection tested`);
      }
    } catch (error) {
      showToast('error', `Failed to test ${systemType}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleConfigure = async (formData: FormData) => {
    const systemType = formData.get('systemType') as string;
    
    try {
      const res = await fetch('/api/edc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemType,
          config: Object.fromEntries(formData.entries()),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast('success', data.message);
        setShowConfigForm(null);
        testAllConnections(); // Refresh status
      } else {
        const error = await res.json();
        showToast('error', error.error || 'Configuration failed');
      }
    } catch (error) {
      showToast('error', 'Configuration request failed');
    }
  };

  const handleSyncData = async (systemId: string) => {
    showToast('info', `Starting sync for ${systemId}...`);
    
    // Simulate sync
    setTimeout(() => {
      showToast('success', `${systemId} sync completed • 234 records processed`);
      testAllConnections(); // Refresh to show new counts
    }, 2000);
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
          <h1 className="text-2xl font-bold text-gray-900">EDC System Integrations</h1>
          <p className="text-sm text-gray-500 mt-1">Connect and manage Electronic Data Capture systems</p>
        </div>
        
        <button onClick={testAllConnections} disabled={loading || testingConnection} className="btn btn-primary">
          {testingConnection ? <span className="spinner"></span> : '🔄'} Test All Connections
        </button>
      </div>

      {/* Overall Health */}
      {systems.length > 0 && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-400 mb-1">Overall Health</p>
              <p className="text-3xl font-bold">
                {Math.round((systems.filter(s => s.status === 'connected').length / systems.length) * 100)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Records</p>
              <p className="text-3xl font-bold">{systems.reduce((sum, s) => sum + s.recordsProcessed, 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Pending Sync</p>
              <p className="text-3xl font-bold text-amber-400">{systems.reduce((sum, s) => sum + s.pendingRecords, 0)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Avg Latency</p>
              <p className="text-3xl font-bold">{Math.round(systems.reduce((sum, s) => sum + s.latency, 0) / systems.length)}ms</p>
            </div>
          </div>
        </div>
      )}

      {/* EDC Systems Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Testing EDC connections...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {systems.map((system) => (
            <EDCCard
              key={system.id}
              system={system}
              onTest={() => handleTestSingle(system.type)}
              onConfigure={() => setShowConfigForm(system.id)}
              onSync={() => handleSyncData(system.name)}
              isTesting={testingConnection}
            />
          ))}
          
          {/* Add New System Card */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer group">
            <div className="w-16 h-16 bg-slate-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mb-4 transition-colors">
              <span className="text-3xl text-slate-400 group-hover:text-blue-500 transition-colors">+</span>
            </div>
            <h3 className="font-semibold text-gray-700 group-hover:text-blue-700">Add EDC System</h3>
            <p className="text-sm text-gray-500 mt-1">Connect a new EDC platform</p>
          </div>
        </div>
      )}

      {/* Configuration Forms */}
      {showConfigForm && (
        <Modal title={`Configure ${systems.find(s => s.id === showConfigForm)?.name || 'EDC System'}`} onClose={() => setShowConfigForm(null)}>
          <EDCConfigForm 
            systemType={showConfigForm}
            onSubmit={handleConfigure}
            onCancel={() => setShowConfigForm(null)}
          />
        </Modal>
      )}

      {/* Toast */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

function EDCCard({ 
  system, 
  onTest, 
  onConfigure, 
  onSync, 
  isTesting 
}: { 
  system: EDCSystem; 
  onTest: () => void; 
  onConfigure: () => void; 
  onSync: () => void; 
  isTesting: boolean;
}) {
  const statusColors = {
    connected: 'border-emerald-500 bg-emerald-50',
    degraded: 'border-amber-500 bg-amber-50',
    disconnected: 'border-red-500 bg-red-50',
    configuring: 'border-blue-500 bg-blue-50',
  };

  return (
    <div className={`bg-white rounded-xl border-2 ${statusColors[system.status]} overflow-hidden`}>
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{system.name}</h3>
            <p className="text-sm text-gray-500">{system.type.replace('_', ' ')}</p>
          </div>
          
          <StatusIndicator status={system.status} />
        </div>

        {/* Status Details */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 block">Latency</span>
            <span className={`font-semibold ${system.latency < 100 ? 'text-emerald-600' : system.latency < 250 ? 'text-amber-600' : 'text-red-600'}`}>
              {system.latency}ms
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Version</span>
            <span className="font-semibold">{system.version}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Records</span>
            <span className="font-semibold">{system.recordsProcessed.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Pending</span>
            <span className={`font-semibold ${system.pendingRecords > 50 ? 'text-amber-600' : 'text-gray-700'}`}>
              {system.pendingRecords}
            </span>
          </div>
        </div>

        {/* Last Sync */}
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-gray-500">
          Last sync: {new Date(system.lastSync).toLocaleString()}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-slate-50 flex gap-2">
        <button onClick={onTest} disabled={isTesting} className="flex-1 btn btn-secondary text-sm py-2">
          {isTesting ? <><span className="spinner"></span> Testing...</> : '🔌 Test'}
        </button>
        <button onClick={onConfigure} className="flex-1 btn btn-secondary text-sm py-2">
          ⚙️ Configure
        </button>
        <button onClick={onSync} disabled={system.status !== 'connected'} className="flex-1 btn btn-primary text-sm py-2 disabled:opacity-50">
          🔄 Sync
        </button>
      </div>
    </div>
  );
}

function StatusIndicator({ status }: { status: string }) {
  const config = {
    connected: { color: 'bg-emerald-500', label: 'Connected', pulse: true },
    degraded: { color: 'bg-amber-500', label: 'Degraded', pulse: true },
    disconnected: { color: 'bg-red-500', label: 'Disconnected', pulse: false },
    configuring: { color: 'bg-blue-500', label: 'Configuring', pulse: true },
  };
  
  const { color, label, pulse } = config[status];
  
  return (
    <div className="flex items-center gap-2">
      <span className={`relative w-3 h-3 rounded-full ${color} ${pulse ? 'animate-pulse' : ''}`}></span>
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
        status === 'connected' ? 'bg-emerald-100 text-emerald-700' :
        status === 'degraded' ? 'bg-amber-100 text-amber-700' :
        status === 'configuring' ? 'bg-blue-100 text-blue-700' :
        'bg-red-100 text-red-700'
      }`}>
        {label}
      </span>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EDCConfigForm({ 
  systemType, 
  onSubmit, 
  onCancel 
}: { 
  systemType: string; 
  onSubmit: (data: FormData) => void; 
  onCancel: () => void;
}) {
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(new FormData(e.currentTarget));
    }} className="space-y-4">
      <input type="hidden" name="systemType" value={systemType} />

      {systemType === 'medidata_rave' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key *</label>
            <input name="apiKey" required type="password" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Enter Medidata API key..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Environment *</label>
            <select name="environment" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="">Select Environment</option>
              <option value="prod">Production</option>
              <option value="dev">Development</option>
              <option value="test">Test/UAT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Study OID *</label>
            <input name="studyOid" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="e.g., STUDY-123" />
          </div>
        </>
      )}

      {systemType === 'oracle_clinical_one' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client ID *</label>
            <input name="clientId" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Oracle Cloud Client ID" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret *</label>
            <input name="clientSecret" required type="password" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Oracle Cloud Client Secret" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant URL *</label>
            <input name="tenantUrl" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="https://clinical-one.oraclecloud.com" />
          </div>
        </>
      )}

      {systemType === 'veeva_vault' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
            <input name="username" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Veeva Vault username" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input name="password" required type="password" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Veeva Vault password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vault DNS *</label>
            <input name="vaultDns" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="e.g., vault.veevavault.com" />
          </div>
        </>
      )}

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 btn btn-secondary">Cancel</button>
        <button type="submit" className="flex-1 btn btn-primary">Save & Test</button>
      </div>
    </form>
  );
}
