import React, { useState, useMemo } from 'react';
import { Search, ArrowDownLeft, ArrowUpRight, ShieldCheck, ShieldAlert, AlertTriangle, Filter, Check, Eye } from 'lucide-react';

export default function RuleExplorer({ rules = [], onSelectRule }) {
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      // Direction
      if (directionFilter !== 'ALL' && rule.direction !== directionFilter) return false;

      // Action
      if (actionFilter !== 'ALL' && rule.action !== actionFilter) return false;

      // Risk
      if (riskFilter === 'RISK_ONLY' && (rule.risk_level === 'Info' || !rule.is_critical_risk)) return false;
      if (riskFilter === 'CRITICAL' && rule.risk_level !== 'Critical') return false;

      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = rule.name.toLowerCase().includes(query) || rule.display_name.toLowerCase().includes(query);
        const matchesPort = rule.local_ports.some((p) => p.toLowerCase().includes(query));
        const matchesProto = rule.protocol.toLowerCase().includes(query);
        const matchesProgram = (rule.program || '').toLowerCase().includes(query);
        const matchesService = (rule.service || '').toLowerCase().includes(query);
        return matchesName || matchesPort || matchesProto || matchesProgram || matchesService;
      }

      return true;
    });
  }, [rules, directionFilter, actionFilter, riskFilter, search]);

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Firewall Rules Inspector</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
              {filteredRules.length} of {rules.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400">Search, audit, and analyze individual Windows Firewall policy definitions.</p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search port, rule, app, protocol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
          />
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
        <div className="flex items-center space-x-1">
          <span className="text-slate-400 font-medium px-1">Direction:</span>
          {['ALL', 'Inbound', 'Outbound'].map((dir) => (
            <button
              key={dir}
              onClick={() => setDirectionFilter(dir)}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                directionFilter === dir
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {dir}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-slate-800 hidden md:block"></div>

        <div className="flex items-center space-x-1">
          <span className="text-slate-400 font-medium px-1">Action:</span>
          {['ALL', 'Allow', 'Block'].map((act) => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                actionFilter === act
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {act}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-slate-800 hidden md:block"></div>

        <div className="flex items-center space-x-1">
          <span className="text-slate-400 font-medium px-1">Risk:</span>
          <button
            onClick={() => setRiskFilter('ALL')}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              riskFilter === 'ALL'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setRiskFilter('CRITICAL')}
            className={`px-2.5 py-1 rounded-md font-semibold transition ${
              riskFilter === 'CRITICAL'
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            Critical Only
          </button>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden shadow-lg backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase text-[10px] font-bold text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Direction</th>
                <th className="py-3 px-4">Rule Name</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Protocol & Port</th>
                <th className="py-3 px-4">Remote Subnet</th>
                <th className="py-3 px-4">Profiles</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No firewall rules match current filters.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => {
                  const isInbound = rule.direction === 'Inbound';
                  const isAllow = rule.action === 'Allow';
                  const isCrit = rule.risk_level === 'Critical';
                  const isHigh = rule.risk_level === 'High';

                  return (
                    <tr
                      key={rule.id}
                      onClick={() => onSelectRule(rule)}
                      className="hover:bg-slate-800/50 cursor-pointer transition"
                    >
                      {/* Direction */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 font-mono font-semibold ${
                            isInbound ? 'text-amber-400' : 'text-blue-400'
                          }`}
                        >
                          {isInbound ? (
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                          <span>{rule.direction}</span>
                        </span>
                      </td>

                      {/* Display Name */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-white truncate">{rule.display_name}</div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">{rule.name}</div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                            isAllow
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                              : 'bg-rose-950/80 text-rose-300 border-rose-800'
                          }`}
                        >
                          {rule.action}
                        </span>
                      </td>

                      {/* Protocol & Port */}
                      <td className="py-3 px-4 font-mono">
                        <div className="text-white font-semibold">
                          {rule.protocol} : {rule.local_ports.join(', ')}
                        </div>
                      </td>

                      {/* Remote Subnet */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <span
                          className={
                            rule.remote_addresses.some((a) =>
                              ['any', '0.0.0.0/0', '*'].includes(a.toLowerCase())
                            ) && isInbound && isAllow
                              ? 'text-rose-400 font-bold'
                              : 'text-slate-300'
                          }
                        >
                          {rule.remote_addresses.join(', ')}
                        </span>
                      </td>

                      {/* Profiles */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {rule.profiles.map((p) => (
                            <span
                              key={p}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Risk Level */}
                      <td className="py-3 px-4">
                        {isCrit ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-950 text-rose-400 border border-rose-800 flex items-center w-fit gap-1">
                            <ShieldAlert className="h-3 w-3" /> Critical
                          </span>
                        ) : isHigh ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 flex items-center w-fit gap-1">
                            <AlertTriangle className="h-3 w-3" /> High
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            Safe / Normal
                          </span>
                        )}
                      </td>

                      {/* Inspect */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRule(rule);
                          }}
                          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                          title="Inspect rule details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
