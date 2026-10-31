import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SecurityScoreCard from './components/SecurityScoreCard';
import ProfileStatusGrid from './components/ProfileStatusGrid';
import VulnerabilityAlerts from './components/VulnerabilityAlerts';
import RuleExplorer from './components/RuleExplorer';
import RuleDetailModal from './components/RuleDetailModal';
import RemediationModal from './components/RemediationModal';
import AuditUploadModal from './components/AuditUploadModal';
import ExportReportModal from './components/ExportReportModal';
import { fetchAuditReport, loadAuditPreset, fetchHealth } from './services/api';
import { Shield, Server, Terminal, ExternalLink, Cpu } from 'lucide-react';

export default function App() {
  const [audit, setAudit] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [selectedRule, setSelectedRule] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showRemediation, setShowRemediation] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [auditData, healthData] = await Promise.all([
        fetchAuditReport().catch((e) => null),
        fetchHealth().catch((e) => null),
      ]);
      if (auditData) setAudit(auditData);
      if (healthData) setHealth(healthData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectPreset = async (presetId) => {
    try {
      setLoading(true);
      const data = await loadAuditPreset(presetId);
      setAudit(data);
    } catch (err) {
      console.error('Failed to change preset:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentPreset={audit?.preset_name}
        onSelectPreset={handleSelectPreset}
        onRefresh={loadData}
        loading={loading}
        onOpenUpload={() => setShowUpload(true)}
        onOpenRemediation={() => setShowRemediation(true)}
        onOpenExport={() => setShowExport(true)}
        health={health}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading && !audit ? (
          <div className="py-24 text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
            <p className="text-slate-400 text-sm font-medium">
              Connecting to Windows Firewall Security Service on WSL 2 (Port 8080)...
            </p>
          </div>
        ) : error && !audit ? (
          <div className="bg-rose-950/40 border border-rose-800 rounded-2xl p-8 text-center space-y-3 max-w-xl mx-auto">
            <h3 className="text-rose-400 font-bold text-lg">Backend Communication Error</h3>
            <p className="text-slate-300 text-xs">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* 1. Overall Security Score & Category Breakdown */}
            <SecurityScoreCard
              score={audit?.score}
              summary={audit?.summary}
              presetName={audit?.preset_name}
              hostName={audit?.host_name}
              osVersion={audit?.os_version}
            />

            {/* 2. Three Network Profiles Grid */}
            <ProfileStatusGrid profiles={audit?.profiles} />

            {/* 3. Vulnerability Alerts & Remediations */}
            <VulnerabilityAlerts vulnerabilities={audit?.vulnerabilities || []} />

            {/* 4. Complete Rules Inspector */}
            <RuleExplorer
              rules={audit?.rules || []}
              onSelectRule={(rule) => setSelectedRule(rule)}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-400 font-semibold">Windows Firewall Security Check</span>
            <span>&bull;</span>
            <span>WSL 2 Ubuntu 22.04 Dockerized SecOps Tool</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-mono text-slate-400">Fixed Port: :8080</span>
            <span className="font-mono text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Container Active
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedRule && (
        <RuleDetailModal
          rule={selectedRule}
          onClose={() => setSelectedRule(null)}
        />
      )}

      {showRemediation && (
        <RemediationModal
          onClose={() => setShowRemediation(false)}
        />
      )}

      {showUpload && (
        <AuditUploadModal
          onClose={() => setShowUpload(false)}
          onAuditSuccess={(newAudit) => setAudit(newAudit)}
        />
      )}

      {showExport && (
        <ExportReportModal
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
