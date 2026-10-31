import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Activity, Sliders, CheckCircle2, Lock, Radio } from 'lucide-react';

export default function SecurityScoreCard({ score, summary, presetName, hostName, osVersion }) {
  if (!score) return null;

  const overall = score.overall ?? 0;
  const grade = score.grade ?? 'C';

  // Determine score color theme
  let ringColor = 'stroke-rose-500';
  let textColor = 'text-rose-400';
  let bgBadge = 'bg-rose-950/80 text-rose-300 border-rose-800';
  let statusText = 'Critical Vulnerabilities Detected';

  if (overall >= 90) {
    ringColor = 'stroke-emerald-400';
    textColor = 'text-emerald-400';
    bgBadge = 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
    statusText = 'Secure & Hardened';
  } else if (overall >= 80) {
    ringColor = 'stroke-cyan-400';
    textColor = 'text-cyan-400';
    bgBadge = 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
    statusText = 'Good Security Posture';
  } else if (overall >= 70) {
    ringColor = 'stroke-amber-400';
    textColor = 'text-amber-400';
    bgBadge = 'bg-amber-950/80 text-amber-300 border-amber-800';
    statusText = 'Action Recommended';
  } else if (overall >= 60) {
    ringColor = 'stroke-orange-500';
    textColor = 'text-orange-400';
    bgBadge = 'bg-orange-950/80 text-orange-300 border-orange-800';
    statusText = 'High Risk Exposure';
  }

  // SVG circular gauge parameters
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overall / 100) * circumference;

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Background cyber accent glow */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left: Circular Score Gauge */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                className={`${ringColor} transition-all duration-1000 ease-out`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-extrabold ${textColor} tracking-tight`}>
                {overall}
              </span>
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                out of 100
              </span>
            </div>
          </div>

          <div className="text-center sm:text-left space-y-2">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <span className="text-2xl font-bold text-white tracking-tight">Security Score</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${bgBadge}`}>
                Grade {grade}
              </span>
            </div>
            <p className="text-sm text-slate-300 font-medium">
              {statusText}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                <Sliders className="h-3 w-3 text-cyan-400" />
                {presetName || 'Live Inspection'}
              </span>
              <span className="inline-flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                <Radio className="h-3 w-3 text-emerald-400" />
                {hostName}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Category Progress Breakdown */}
        <div className="w-full lg:w-80 space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800 flex justify-between">
            <span>Audit Dimension</span>
            <span>Rating</span>
          </div>

          {/* Profile Hardening */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Profile Hardening</span>
              <span className="font-mono font-semibold text-slate-200">{score.profile_hardening}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ${
                  score.profile_hardening >= 80 ? 'bg-cyan-500' : score.profile_hardening >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${score.profile_hardening}%` }}
              ></div>
            </div>
          </div>

          {/* Port Exposure */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Port Exposure & Risk</span>
              <span className="font-mono font-semibold text-slate-200">{score.port_exposure}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ${
                  score.port_exposure >= 80 ? 'bg-emerald-500' : score.port_exposure >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${score.port_exposure}%` }}
              ></div>
            </div>
          </div>

          {/* Rule Hygiene */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Rule Hygiene & Specificity</span>
              <span className="font-mono font-semibold text-slate-200">{score.rule_hygiene}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ${
                  score.rule_hygiene >= 80 ? 'bg-indigo-500' : score.rule_hygiene >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${score.rule_hygiene}%` }}
              ></div>
            </div>
          </div>

          {/* Logging & Telemetry */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Logging & Telemetry</span>
              <span className="font-mono font-semibold text-slate-200">{score.logging_telemetry}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ${
                  score.logging_telemetry >= 80 ? 'bg-teal-500' : score.logging_telemetry >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${score.logging_telemetry}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Right: Key Stats Counters */}
        <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 min-w-[130px]">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Rules</div>
            <div className="text-2xl font-mono font-bold text-white mt-1">{summary.total_rules}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{summary.enabled_rules} Active</div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 min-w-[130px]">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Inbound Allow</div>
            <div className="text-2xl font-mono font-bold text-amber-400 mt-1">{summary.inbound_allow_rules}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Listening Vectors</div>
          </div>

          <div className="bg-rose-950/30 p-3.5 rounded-xl border border-rose-900/40 min-w-[130px]">
            <div className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider">Critical Vulns</div>
            <div className="text-2xl font-mono font-bold text-rose-400 mt-1">{summary.critical_findings_count}</div>
            <div className="text-[11px] text-rose-300/70 mt-0.5">Requires Fix</div>
          </div>

          <div className="bg-amber-950/30 p-3.5 rounded-xl border border-amber-900/40 min-w-[130px]">
            <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">High / Med</div>
            <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
              {summary.high_findings_count + summary.medium_findings_count}
            </div>
            <div className="text-[11px] text-amber-300/70 mt-0.5">Security Warnings</div>
          </div>
        </div>
      </div>
    </div>
  );
}
