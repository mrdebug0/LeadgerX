import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Search, Calendar, RefreshCw, Filter, FileSpreadsheet } from 'lucide-react';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  storeId?: string;
  timestamp: string;
}

interface AuditLogsViewProps {
  logs: AuditLog[];
  onRefreshLogs: () => void;
  isRefreshing?: boolean;
}

export default function AuditLogsView({ logs = [], onRefreshLogs, isRefreshing = false }: AuditLogsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');

  // Filter logs based on search string and selected action category
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
    
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    const base = "text-[10px] font-bold px-2 py-0.5 rounded-full inline-block uppercase tracking-wider";
    switch (action) {
      case 'CREATE_ENTRY':
      case 'OFFLINE_SYNC':
        return `${base} bg-emerald-50 text-emerald-700 border border-emerald-200`;
      case 'UPDATE_ENTRY':
        return `${base} bg-blue-50 text-blue-700 border border-blue-200`;
      case 'DELETE_ENTRY':
        return `${base} bg-rose-50 text-rose-700 border border-rose-200`;
      default:
        return `${base} bg-slate-50 text-slate-700 border border-slate-200`;
    }
  };

  // Count active stats
  const totalOps = logs.length;
  const criticalDeletes = logs.filter(l => l.action === 'DELETE_ENTRY').length;
  const uniqueOperators = new Set(logs.map(l => l.userId)).size;

  return (
    <div className="p-4 md:p-8 space-y-6" id="audit-view-container">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5 font-display">
            Compliance Audit Trails <span className="text-[10px] bg-slate-900 text-white font-bold px-2.5 py-0.5 rounded-full uppercase font-sans">Enterprise</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium font-sans">Monitor CRUD logs, cashier action sequences, offline sync events, and compliance triggers.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRefreshLogs}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-50 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Logs
          </button>
        </div>
      </div>

      {/* Audit Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 shadow-3xs p-4 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logged System Actions</span>
            <p className="font-extrabold text-lg text-slate-900 font-mono mt-0.5">{totalOps} events</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-3xs p-4 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 shrink-0">
            <ShieldCheck className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Destructive Actions</span>
            <p className="font-extrabold text-lg text-red-700 font-mono mt-0.5">{criticalDeletes} deletes</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-3xs p-4 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 shrink-0">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Operational Accounts</span>
            <p className="font-extrabold text-lg text-slate-900 font-mono mt-0.5">{uniqueOperators} authorized</p>
          </div>
        </div>
      </div>

      {/* Main ledger search and lists card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        {/* Search & filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-3 text-slate-400 font-bold">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search cashier name, specific items or operation logs..."
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-black text-xs px-10 py-2.5 rounded-xl focus:outline-none transition-all font-medium text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1.5 px-1">
              <Filter className="h-3.5 w-3.5" /> Filter Action:
            </span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="border border-slate-200 rounded-xl bg-slate-5 w-44 p-2 text-xs focus:outline-none focus:border-black font-semibold text-slate-700"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE_ENTRY">CREATE_ENTRY</option>
              <option value="UPDATE_ENTRY">UPDATE_ENTRY</option>
              <option value="DELETE_ENTRY">DELETE_ENTRY</option>
              <option value="OFFLINE_SYNC">OFFLINE_SYNC</option>
            </select>
          </div>
        </div>

        {/* Audit Log database output table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider font-extrabold border-b border-slate-100">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Authorized Operator</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Operation Details</th>
                <th className="py-3 px-4 text-right">Target Store ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-medium bg-slate-50/50">
                    No matching compliance logs discovered in system memory.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 text-xs font-medium text-slate-800 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("en-GB", {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-lg bg-slate-150 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                          {log.userName.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-extrabold text-slate-900 leading-none">{log.userName}</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-mono">{log.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-650 max-w-sm">
                      <p className="leading-tight font-medium break-words">{log.details}</p>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[10px] text-slate-400">
                      {log.storeId || 'store-primary'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
