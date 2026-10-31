import React from 'react';
import { Shield, Server, Terminal, FileText, Upload, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Navbar({
  currentPreset,
  onSelectPreset,
  onRefresh,
  loading,
  onOpenUpload,
  onOpenRemediation,
  onOpenExport,
  health,
}) {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Windows Firewall <span className="text-cyan-400">Security Check</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  SecOps v1.0
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Server className="h-3 w-3 text-emerald-400" />
                <span>Backend:</span>
                <span className="font-mono text-emerald-300 font-medium">
                  WSL2 Ubuntu 22.04 Docker (Port 8090)
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            </div>
          </div>

          {/* Center: Benchmark Preset Selector */}
          <div className="hidden lg:flex items-center bg-slate-950/70 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="px-2 text-slate-400 font-medium">Profile Preset:</span>
            <button
              onClick={() => onSelectPreset('standard')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                currentPreset?.toLowerCase().includes('standard')
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Standard Workstation
            </button>
            <button
              onClick={() => onSelectPreset('vulnerable')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                currentPreset?.toLowerCase().includes('vulnerable')
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Vulnerable Server
            </button>
            <button
              onClick={() => onSelectPreset('hardened')}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                currentPreset?.toLowerCase().includes('cis') || currentPreset?.toLowerCase().includes('hardened')
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              CIS Hardened
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenUpload}
              title="Upload Windows Host Firewall Export"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Upload className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden md:inline">Import Windows JSON</span>
            </button>

            <button
              onClick={onOpenRemediation}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Remediation Script</span>
            </button>

            <button
              onClick={onOpenExport}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <FileText className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Report</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={loading}
              title="Refresh Assessment"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
