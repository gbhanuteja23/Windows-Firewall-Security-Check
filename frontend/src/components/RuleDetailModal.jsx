import React from 'react';
import { X, ShieldAlert, ShieldCheck, Terminal, Copy, Check, ArrowRight } from 'lucide-react';

export default function RuleDetailModal({ rule, onClose }) {
  if (!rule) return null;

  const [copied, setCopied] = React.useState(false);

  const psCmd = `Get-NetFirewallRule -Name "${rule.name}" | Get-NetFirewallPortFilter`;

  const handleCopy = () => {
    navigator.clipboard.writeText(psCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60 sticky top-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{rule.display_name}</h3>
              <p className="text-xs font-mono text-slate-400">{rule.name}</p>
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
        <div className="p-6 space-y-5 text-xs text-slate-300">
          {/* Security Risk Banner if flagged */}
          {rule.risk_reasons && rule.risk_reasons.length > 0 && (
            <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-rose-400 font-bold mb-1.5">
                <ShieldAlert className="h-4 w-4" />
                <span>Security Risk Assessment: {rule.risk_level.toUpperCase()}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                {rule.risk_reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Properties Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block mb-0.5">Direction:</span>
              <span className="font-bold text-white text-sm">{rule.direction}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Action:</span>
              <span
                className={`font-bold text-sm ${
                  rule.action === 'Allow' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {rule.action}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">State:</span>
              <span className="font-bold text-white text-sm">
                {rule.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Protocol:</span>
              <span className="font-mono text-white font-semibold">{rule.protocol}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Local Port(s):</span>
              <span className="font-mono text-white font-semibold">{rule.local_ports.join(', ')}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Remote Port(s):</span>
              <span className="font-mono text-white font-semibold">{rule.remote_ports.join(', ')}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Remote Address:</span>
              <span className="font-mono text-white font-semibold">{rule.remote_addresses.join(', ')}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Edge Traversal:</span>
              <span className="font-semibold text-white">{rule.edge_traversal ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Profiles:</span>
              <span className="font-mono text-cyan-300">{rule.profiles.join(', ')}</span>
            </div>
          </div>

          {/* Program & Service associations */}
          <div className="space-y-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 font-sans block mb-1">Application Program:</span>
              <code className="text-slate-200 select-all block bg-slate-900 p-2 rounded border border-slate-800">
                {rule.program || 'Any / Not Specified'}
              </code>
            </div>
            <div>
              <span className="text-slate-400 font-sans block mb-1">Windows Service Binding:</span>
              <code className="text-slate-200 select-all block bg-slate-900 p-2 rounded border border-slate-800">
                {rule.service || 'Any / Not Specified'}
              </code>
            </div>
          </div>

          {/* PowerShell verification snippet */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-400">PowerShell Inspection Command:</span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center space-x-1 text-slate-300 hover:text-white"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto select-all">
              {psCmd}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
