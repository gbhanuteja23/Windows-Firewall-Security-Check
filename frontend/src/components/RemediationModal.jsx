import React, { useState, useEffect } from 'react';
import { X, Terminal, Copy, Check, Download, ShieldCheck, AlertTriangle } from 'lucide-react';
import { fetchPowerShellRemediation, fetchNetshRemediation } from '../services/api';

export default function RemediationModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('powershell');
  const [psScript, setPsScript] = useState('');
  const [netshScript, setNetshScript] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadScripts() {
      try {
        setLoading(true);
        const [ps, netsh] = await Promise.all([
          fetchPowerShellRemediation(),
          fetchNetshRemediation(),
        ]);
        setPsScript(ps);
        setNetshScript(netsh);
      } catch (err) {
        console.error('Failed to load remediation scripts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadScripts();
  }, []);

  const currentCode = activeTab === 'powershell' ? psScript : netshScript;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = activeTab === 'powershell' ? 'Remediate-WindowsFirewall.ps1' : 'Remediate-WindowsFirewall.bat';
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Automated Firewall Remediation Script</h3>
              <p className="text-xs text-slate-400">Targeted hardening script tailored to identified vulnerabilities.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning Alert */}
        <div className="bg-amber-950/40 border-b border-amber-900/50 px-5 py-2.5 flex items-center space-x-2 text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <span>Must be executed in an <strong>Elevated Administrator Console</strong> on the target Windows host.</span>
        </div>

        {/* Tab & Action Toolbar */}
        <div className="px-5 py-3 bg-slate-950 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('powershell')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'powershell'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              PowerShell (.ps1) [Recommended]
            </button>
            <button
              onClick={() => setActiveTab('netsh')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'netsh'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Batch / Netsh (.bat)
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Script</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Code Box */}
        <div className="p-5 flex-1 overflow-y-auto bg-[#070b12]">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Generating script...</div>
          ) : (
            <pre className="font-mono text-xs text-slate-300 leading-relaxed select-all whitespace-pre-wrap">
              {currentCode}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
