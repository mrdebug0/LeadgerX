import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Search, ArrowRight, AlertTriangle, Calendar, CheckSquare, RefreshCw, X, Receipt } from 'lucide-react';
import { UdhaarRecord, Customer } from '../types';

interface UdhaarProps {
  udhaarRecords: UdhaarRecord[];
  onCollectUdhaar: (id: string, amount: number) => Promise<void>;
}

export default function UdhaarLedgerView({ udhaarRecords, onCollectUdhaar }: UdhaarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<UdhaarRecord | null>(null);
  const [collectAmount, setCollectAmount] = useState(0);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startPaymentCollection = (record: UdhaarRecord) => {
    setSelectedRecord(record);
    setCollectAmount(record.amount); // Default full settle
    setShowCollectModal(true);
  };

  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || collectAmount <= 0) return;
    setIsSubmitting(true);
    try {
      await onCollectUdhaar(selectedRecord.id, collectAmount);
      setShowCollectModal(false);
      setSelectedRecord(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecords = udhaarRecords.filter(r => 
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6" id="udhaar-ledger-view-container">
      {/* Upper Module header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 border border-slate-200 shadow-sm rounded-3xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5 font-display">
            Udhaar Credit Ledger <span className="text-[10px] bg-red-50 border border-red-100 text-red-650 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-sans">Payments</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium font-sans">Verify outstanding client debts, log partial clearances, and check payment collections history.</p>
        </div>

        <button
          onClick={() => {
            const token = localStorage.getItem('leadgerx_token');
            window.location.href = `/api/reports/pdf?type=udhaar&token=${token || ''}`;
          }}
          id="btn-export-udhaar-pdf"
          className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-full flex items-center gap-2 transition-all cursor-pointer shadow-sm w-fit shrink-0 font-sans"
        >
          <Receipt className="h-4 w-4 text-red-500" />
          Export Ledger PDF
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex items-center relative gap-4">
        <span className="absolute left-7 text-slate-400">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          id="udhaar-ledger-search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search debtor names..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-black rounded-full text-xs focus:outline-none font-medium text-slate-705"
        />
      </div>

      {/* Main Ledger grid */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4">Borrowing Customer</th>
              <th className="px-6 py-4">Credit Date Created</th>
              <th className="px-6 py-4">Settle Due Date</th>
              <th className="px-6 py-4 text-right">Debit Balance</th>
              <th className="px-6 py-4">Collector Status</th>
              <th className="px-6 py-4 text-center">Action Settle</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-xs text-slate-700">
                <td className="px-6 py-4 font-bold text-slate-900">
                  <div className="font-bold text-slate-950">{r.customerName}</div>
                </td>
                <td className="px-6 py-4 font-mono font-medium text-slate-500">
                  {new Date(r.dateCreated).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 font-mono font-medium text-slate-500">
                  {new Date(r.dueDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right font-black text-red-650 font-mono text-base">
                  ₹{r.amount}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                    r.status === 'settled' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-750' 
                      : r.status === 'partially_paid'
                      ? 'bg-amber-50 border-amber-250 text-amber-700'
                      : 'bg-red-50 border-red-250 text-red-600'
                  }`}>
                    {r.status === 'partially_paid' ? 'Partial' : r.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {r.status !== 'settled' ? (
                    <button
                      onClick={() => startPaymentCollection(r)}
                      id={`btn-collect-udhaar-${r.id}`}
                      className="bg-black hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-full flex items-center gap-1.5 mx-auto transition-all cursor-pointer shadow-sm"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      Collect Cash
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                      Cleared
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-16 space-y-2 text-slate-400">
                  <AlertTriangle className="h-8 w-8 text-slate-350 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">No pending client udhaar records registered.</p>
                  <p className="text-[10px]">Create entries with 'udhaar' payment settings to log credit logs.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* COLLECTION MODAL DIALOG */}
      {showCollectModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-sm w-full p-6 space-y-5"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Receipt className="h-4.5 w-4.5 text-slate-800" /> Settle Udhaar Debt
              </span>
              <button onClick={() => setShowCollectModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleCollectionSubmit} className="space-y-4">
              <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Active Outstanding Debt balance</p>
                <p className="text-xl font-bold font-mono text-slate-950 mt-1">₹{selectedRecord.amount}</p>
                <p className="text-[10px] text-slate-450 mt-1 font-medium font-sans">Debtor Customer: {selectedRecord.customerName}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cash Collected (₹)</label>
                <input
                  id="input-collect-amount"
                  type="number"
                  required
                  min={1}
                  max={selectedRecord.amount}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  placeholder="Enter collected amount"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium text-slate-800"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-750 font-semibold rounded-xl text-xs hover:bg-slate-50 text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-settle"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-black text-white font-bold rounded-xl text-xs hover:bg-slate-800 text-center cursor-pointer shadow-xs"
                >
                  Confirm Settle
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
