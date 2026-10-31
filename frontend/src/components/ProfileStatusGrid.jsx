import React from 'react';
import { ShieldCheck, ShieldAlert, Check, X, FileText, AlertOctagon, Network, Home, Globe } from 'lucide-react';

export default function ProfileStatusGrid({ profiles }) {
  if (!profiles) return null;

  const profileConfigs = [
    {
      key: 'Domain',
      title: 'Domain Profile',
      desc: 'Applied when connected to an Active Directory domain.',
      icon: Network,
      color: 'cyan',
    },
    {
      key: 'Private',
      title: 'Private Profile',
      desc: 'Applied when connected to trusted home/work networks.',
      icon: Home,
      color: 'blue',
    },
    {
      key: 'Public',
      title: 'Public Profile',
      desc: 'Applied on untrusted public Wi-Fi & direct Internet links.',
      icon: Globe,
      color: 'emerald',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <span>Firewall Network Profiles</span>
        </h2>
        <span className="text-xs text-slate-400">Windows Defender Advanced Security</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profileConfigs.map(({ key, title, desc, icon: Icon, color }) => {
          const profile = profiles[key];
          if (!profile) return null;

          const isEnabled = profile.enabled;
          const isInboundBlocked = profile.default_inbound_action === 'Block';
          const isLoggingDropped = profile.logging_dropped;

          return (
            <div
              key={key}
              className={`rounded-xl border p-4.5 transition-all bg-slate-900/90 backdrop-blur-sm relative overflow-hidden ${
                !isEnabled
                  ? 'border-rose-800/80 shadow-lg shadow-rose-950/20'
                  : !isInboundBlocked
                  ? 'border-amber-700/80'
                  : 'border-slate-800'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`p-2 rounded-lg ${
                      isEnabled ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{title}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{desc}</p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    isEnabled
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                      : 'bg-rose-950/80 text-rose-400 border-rose-800'
                  }`}
                >
                  {isEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>

              {/* Status properties */}
              <div className="space-y-2 text-xs bg-slate-950/60 rounded-lg p-3 border border-slate-800/70">
                {/* Default Inbound */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Default Inbound:</span>
                  <span
                    className={`font-mono font-semibold flex items-center gap-1 ${
                      isInboundBlocked ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isInboundBlocked ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Block (Recommended)
                      </>
                    ) : (
                      <>
                        <AlertOctagon className="h-3.5 w-3.5" /> Allow (Vulnerable!)
                      </>
                    )}
                  </span>
                </div>

                {/* Default Outbound */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Default Outbound:</span>
                  <span className="font-mono text-slate-300 font-semibold">
                    {profile.default_outbound_action}
                  </span>
                </div>

                {/* Dropped Log */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Log Dropped Packets:</span>
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      isLoggingDropped ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {isLoggingDropped ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    {isLoggingDropped ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                {/* Allowed Log */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Log Allowed Packets:</span>
                  <span className="font-semibold text-slate-400">
                    {profile.logging_allowed ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              {/* Log file indicator */}
              <div className="mt-3 text-[10px] text-slate-400 truncate flex items-center gap-1.5 font-mono">
                <FileText className="h-3 w-3 text-slate-400 flex-shrink-0" />
                <span className="truncate">{profile.log_file_path || '%SystemRoot%\\System32\\LogFiles\\Firewall\\pfirewall.log'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
