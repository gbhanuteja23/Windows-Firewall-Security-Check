import React, { useState } from 'react';
import { X, Upload, Terminal, Copy, Check, FileCode, Play, AlertCircle } from 'lucide-react';
import { scanFirewallData } from '../services/api';

export default function AuditUploadModal({ onClose, onAuditSuccess }) {
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const exportScript = `# Run this in Windows PowerShell (Administrator) to export your live firewall:
$p = @{}
Get-NetFirewallProfile | ForEach-Object {
    $p[$_.Name] = @{
        name = $_.Name
        enabled = [bool]$_.Enabled
        default_inbound_action = $_.DefaultInboundAction
        default_outbound_action = $_.DefaultOutboundAction
        logging_dropped = [bool]$_.LogDroppedPackets
        logging_allowed = [bool]$_.LogAllowedConnections
    }
}
$r = Get-NetFirewallRule -PolicyStore ActiveStore | Select-Object -First 150 Name, DisplayName, Direction, Action, Enabled, Profile, Description
@{ host_name = $env:COMPUTERNAME; os_version = (Get-CimInstance Win32_OperatingSystem).Caption; profiles = $p; rules = $r } | ConvertTo-Json -Depth 4 | Out-File -Encoding utf8 firewall_export.json
`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(exportScript);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText(event.target.result);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleScan = async () => {
    if (!jsonText.trim()) {
      setError('Please upload a JSON file or paste exported firewall JSON.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const parsed = JSON.parse(jsonText);
      const result = await scanFirewallData(parsed);
      onAuditSuccess(result);
      onClose();
    } catch (err) {
      setError(`Invalid JSON or Scan Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Import Windows Firewall Policy</h3>
              <p className="text-xs text-slate-400">Scan and audit live rules from your physical or virtual Windows host.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Instructions */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5" /> Step 1: Export from Windows Host
              </span>
              <button
                onClick={handleCopyCmd}
                className="inline-flex items-center space-x-1 text-[11px] font-semibold text-slate-300 hover:text-white"
              >
                {copiedCmd ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedCmd ? 'Script Copied!' : 'Copy PowerShell Export Snippet'}</span>
              </button>
            </div>
            <pre className="text-[10px] font-mono text-slate-400 bg-slate-900/90 p-2.5 rounded border border-slate-800 overflow-x-auto select-all max-h-24">
              {exportScript}
            </pre>
          </div>

          {/* File Upload & Paste */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5 text-blue-400" /> Step 2: Select JSON File or Paste Payload
            </label>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-cyan-300 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>
            <textarea
              rows="6"
              placeholder="Paste exported firewall JSON here..."
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            ></textarea>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleScan}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" />
            <span>{loading ? 'Analyzing Rules...' : 'Run Security Audit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
