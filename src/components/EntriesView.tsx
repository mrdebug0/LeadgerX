import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Plus, Calendar, AlertCircle, Trash2, Edit3, Mic, FileText, Check, Upload, ArrowRight, RefreshCw, X } from 'lucide-react';
import { Entry, InventoryItem } from '../types';
import { apiClient } from '../api/client';

interface EntriesProps {
  entries: Entry[];
  inventory: InventoryItem[];
  onAddEntry: (entry: any) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
}

export default function EntriesView({ entries, inventory, onAddEntry, onDeleteEntry }: EntriesProps) {
  // Manual record form
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [type, setType] = useState<'sale' | 'expense'>('sale');
  const [status, setStatus] = useState<'paid' | 'pending' | 'udhaar'>('paid');

  // Voice dictation modal
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const [voiceParseResult, setVoiceParseResult] = useState<any>(null);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);

  // Bill scan modal
  const [showBillModal, setShowBillModal] = useState(false);
  const [billImageBase64, setBillImageBase64] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedBillResult, setScannedBillResult] = useState<any>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'udhaar'>('all');

  // Speech integration in-browser!
  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech Recognition API is not supported in this browser. Type in the simulator box instead!");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsDictating(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceText(transcript);
      setIsDictating(false);
    };

    recognition.onerror = () => {
      setIsDictating(false);
    };

    recognition.onend = () => {
      setIsDictating(false);
    };
  };

  const handleVoiceParseSubmit = async () => {
    setIsVoiceLoading(true);
    setVoiceParseResult(null);
    try {
      const data = await apiClient.post('/api/ai/voice-entry', { voiceTranscript: voiceText });
      if (data.parsed) {
        setVoiceParseResult(data.parsed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsVoiceLoading(false);
    }
  };

  const handleAcceptVoiceResult = async () => {
    if (voiceParseResult) {
      await onAddEntry(voiceParseResult);
      setShowVoiceModal(false);
      setVoiceParseResult(null);
    }
  };

  // Simulated Bill Vision scanner file select
  const handleBillUploadAndScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScannedBillResult(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setBillImageBase64(base64);

      try {
        const data = await apiClient.post('/api/ai/bill-scanner', {
          imageBase64: base64,
          mimeType: file.type
        });
        if (data.scanned) {
          setScannedBillResult(data.scanned);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Convert vision items into sales log automatically!
  const createEntriesFromBill = async () => {
    if (!scannedBillResult) return;
    for (const item of scannedBillResult.items) {
      await onAddEntry({
        customerName: scannedBillResult.vendorName || "Bill Supplier",
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        type: 'expense', // Supplies purchase
        status: 'paid',
        date: new Date().toISOString()
      });
    }
    setShowBillModal(false);
    setScannedBillResult(null);
    setBillImageBase64(null);
  };

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName) return;
    await onAddEntry({
      customerName: customerName || "Self",
      productName,
      quantity,
      price,
      type,
      status,
      date: new Date().toISOString()
    });
    // reset form
    setCustomerName('');
    setProductName('');
    setQuantity(1);
    setPrice(0);
    setType('sale');
    setStatus('paid');
    setShowAddModal(false);
  };

  // Filters logic
  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' ? true : e.type === filterType;
    const matchesStatus = filterStatus === 'all' ? true : e.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8 space-y-6" id="entries-module-container">
      {/* Top Banner Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 border border-slate-200 shadow-sm rounded-3xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5 font-display">
            Bookkeeping Ledger <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Entries</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">Record receipts, expenses, sales, and supplies. Power automated inventory integration.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* PDF Report Export Button */}
          <button
            onClick={() => {
              const token = localStorage.getItem('leadgerx_token');
              window.location.href = `/api/reports/pdf?type=sales&token=${token || ''}`;
            }}
            id="btn-export-sales-pdf"
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-full flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <FileText className="h-4 w-4 text-emerald-500" />
            Export Sales PDF
          </button>

          {/* Voice Prompt Action */}
          <button
            id="btn-voice-dictate-trigger"
            onClick={() => setShowVoiceModal(true)}
            className="border border-slate-200 hover:bg-slate-50 text-black text-xs font-bold px-4 py-2.5 rounded-full flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Mic className="h-4 w-4 text-emerald-500 animate-pulse" />
            Voice LOG
          </button>

          {/* Scanner Prompt Action */}
          <button
            id="btn-bill-scanner-trigger"
            onClick={() => setShowBillModal(true)}
            className="border border-slate-200 hover:bg-slate-50 text-black text-xs font-bold px-4 py-2.5 rounded-full flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <FileText className="h-4 w-4 text-emerald-400" />
            Scan Bill
          </button>

          {/* Primary Manual Add Action */}
          <button
            id="btn-manual-add-trigger"
            onClick={() => setShowAddModal(true)}
            className="bg-black hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-full flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Log Entry
          </button>
        </div>
      </div>

      {/* Grid Filter Bar controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
        <div className="relative w-80">
          <span className="absolute left-3.5 top-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            id="entry-search-box"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer, item, specific product..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-black rounded-full text-xs focus:ring-0 focus:outline-none font-medium"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-slate-100 bg-slate-50/50 rounded-full p-1">
            <button
              onClick={() => setFilterType('all')}
              className={`text-[10px] font-bold px-3 py-1 rounded-full text-center transition-all ${filterType === 'all' ? 'bg-black text-white shadow-xs' : 'text-slate-500 hover:text-black'}`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType('sale')}
              className={`text-[10px] font-bold px-3 py-1 rounded-full text-center transition-all ${filterType === 'sale' ? 'bg-black text-white shadow-xs' : 'text-slate-500 hover:text-black'}`}
            >
              Sales
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`text-[10px] font-bold px-3 py-1 rounded-full text-center transition-all ${filterType === 'expense' ? 'bg-black text-white shadow-xs' : 'text-slate-500 hover:text-black'}`}
            >
              Expenses
            </button>
          </div>

          <div className="flex items-center gap-1 border border-slate-100 bg-slate-50/50 rounded-full p-1">
            <button
              onClick={() => setFilterStatus('all')}
              className={`text-[10px] font-bold px-3 py-1 rounded-full text-center transition-all ${filterStatus === 'all' ? 'bg-black text-white shadow-xs' : 'text-slate-500 hover:text-black'}`}
            >
              All Status
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`text-[10px] font-bold px-3 py-1 rounded-full text-center transition-all ${filterStatus === 'paid' ? 'bg-black text-white shadow-xs' : 'text-slate-500 hover:text-black'}`}
            >
              Paid
            </button>
            <button
              onClick={() => setFilterStatus('udhaar')}
              className={`text-[10px] font-bold px-3 py-1 rounded-full text-center transition-all ${filterStatus === 'udhaar' ? 'bg-black text-white shadow-xs' : 'text-slate-500 hover:text-black'}`}
            >
              Udhaar
            </button>
          </div>
        </div>
      </div>

      {/* Spreadsheet List Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4">Transaction / Date</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Product Name</th>
              <th className="px-6 py-4 text-right">Qty × Price</th>
              <th className="px-6 py-4 text-right">Total Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((e) => (
              <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-xs text-slate-700">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{e.type === 'sale' ? '🟢 Business Sale' : '🔴 Store Expense'}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(e.date).toLocaleDateString()} • {new Date(e.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </td>
                <td className="px-6 py-4 font-semibold text-slate-800">{e.customerName}</td>
                <td className="px-6 py-4 font-medium text-slate-800">{e.productName}</td>
                <td className="px-6 py-4 text-right font-mono text-slate-500">{e.quantity} × ₹{e.price}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-900 font-mono">₹{e.amount}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                    e.status === 'paid' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                      : e.status === 'udhaar' 
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onDeleteEntry(e.id)}
                    className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 duration-150 transition-all rounded-lg flex items-center justify-center mx-auto cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredEntries.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-16 space-y-2">
                  <AlertCircle className="h-8 w-8 text-slate-350 mx-auto" />
                  <p className="text-slate-800 font-bold text-xs">No matching ledger entries found.</p>
                  <p className="text-slate-400 text-[11px]">Refine your terms or dictate entries with voice instantly.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: ADD ENTRY MANUAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-md w-full p-6 space-y-6"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="font-bold text-sm text-slate-900">Add Bookkeeping Transaction</span>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setType('sale')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border uppercase text-center cursor-pointer transition-all ${
                    type === 'sale' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-slate-50/50 border-slate-200 text-slate-500'
                  }`}
                >
                  Sale Output
                </button>
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border uppercase text-center cursor-pointer transition-all ${
                    type === 'expense' ? 'bg-orange-50 border-orange-300 text-orange-850' : 'bg-slate-50/50 border-slate-200 text-slate-500'
                  }`}
                >
                  Store Expense
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Customer Name</label>
                <input
                  id="input-entry-customer"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Amit Singh or Walk-in"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Product / Stock Item</label>
                <input
                  id="input-entry-product"
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Tata Salt 1kg"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Quantity</label>
                  <input
                    id="input-entry-quantity"
                    type="number"
                    required
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Unit Base Price (₹)</label>
                  <input
                    id="input-entry-price"
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Status Setting</label>
                <select
                  id="select-entry-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium text-slate-700"
                >
                  <option value="paid">Paid (Cash / UPI)</option>
                  <option value="udhaar">Udhaar Credit</option>
                  <option value="pending">Pending Settlement</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-entry-submit"
                  type="submit"
                  className="flex-1 py-2.5 bg-black text-white font-bold rounded-xl text-xs hover:bg-slate-800 text-center cursor-pointer shadow-xs"
                >
                  Record Entry
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: VOICE DICCATION LOG */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-lg w-full p-6 space-y-5"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5"><Mic className="h-4 w-4 text-emerald-500" /> Natural Voice Logging Terminal</span>
              <button onClick={() => setShowVoiceModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Say or write natural expressions. E.g., <span className="italic font-bold text-slate-700">"Sold 12 packets of biscuits to Rahul Kumar for 120 rupees as credit."</span> Gemini extracts the transaction metrics instantly!</p>

            <div className="space-y-3.5">
              <div className="relative">
                <textarea
                  value={voiceText}
                  onChange={(e) => setVoiceText(e.target.value)}
                  placeholder="Record or write shop activities in natural English..."
                  className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium text-slate-800 resize-none"
                />
                <button
                  type="button"
                  onClick={startSpeechRecognition}
                  id="btn-voice-record-capture"
                  className={`absolute right-3.5 bottom-3.5 h-10 w-10 rounded-full flex items-center justify-center cursor-pointer text-white shadow-md transition-all duration-150 ${
                    isDictating ? 'bg-red-500 animate-pulse' : 'bg-slate-900 hover:bg-black'
                  }`}
                >
                  <Mic className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleVoiceParseSubmit}
                  id="btn-voice-parse-trigger"
                  disabled={isVoiceLoading || !voiceText}
                  className="w-full py-2.5 bg-black hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:bg-slate-350"
                >
                  {isVoiceLoading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : "Run AI Voice Parse"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Parsed Result Display */}
              {voiceParseResult && (
                <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-xl space-y-4" id="voice-parsed-result">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-500" /> Extracted Variables</span>
                    <span className="text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold uppercase tracking-wider px-1 rounded">GEMINI READY</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Customer Name</p>
                      <p className="font-semibold text-slate-800">{voiceParseResult.customerName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Product/Item</p>
                      <p className="font-semibold text-slate-800">{voiceParseResult.productName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Qty & Price</p>
                      <p className="font-semibold text-slate-800">{voiceParseResult.quantity} × ₹{voiceParseResult.price}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total Amount</p>
                      <p className="font-bold text-slate-900">₹{voiceParseResult.amount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Log Type</p>
                      <p className="font-semibold text-slate-800 capitalize">{voiceParseResult.type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Account Status</p>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 capitalize tracking-wider">{voiceParseResult.status}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleAcceptVoiceResult}
                    id="btn-voice-save-acceptance"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm"
                  >
                    Confirm & Save to Ledger
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL 3: INVOICE BILL SCANNER */}
      {showBillModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-xl w-full p-6 space-y-5"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5"><FileText className="h-4 w-4 text-indigo-500" /> Wholesale Invoice Scanner Terminal</span>
              <button onClick={() => setShowBillModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Select a photo or PDF of a supplier invoice (Tata Salt / Nestle bills). Gemini will parse each line-item automatically and log stock supplies restock instantly.</p>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center relative cursor-pointer hover:border-slate-400 transition-colors bg-slate-50/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBillUploadAndScan}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="h-8 w-8 text-slate-400 mb-2.5" />
                <p className="text-xs font-bold text-slate-700 text-center">Click or Drag invoice image file</p>
                <p className="text-[10px] text-slate-400 text-center mt-1">Supports PNG, JPG, JPEG (Max 5MB)</p>
              </div>

              {isScanning && (
                <div className="text-center py-6 space-y-2" id="bill-scanning-wait">
                  <RefreshCw className="h-7 w-7 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-800">Gemini vision is reading bills...</p>
                  <p className="text-[10px] text-slate-400">Extracting products, quantities, tax (GST) and total totals...</p>
                </div>
              )}

              {billImageBase64 && !isScanning && !scannedBillResult && (
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-medium">Image uploaded. Processing completed.</p>
                </div>
              )}

              {scannedBillResult && (
                <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-xl space-y-4 max-h-80 overflow-y-auto" id="scanned-bill-result">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <div>
                      <p className="text-[10px] text-indigo-700 font-bold uppercase">SUPPLIER BILL</p>
                      <h4 className="font-bold text-sm text-slate-900">{scannedBillResult.vendorName}</h4>
                    </div>
                    <span className="text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold uppercase tracking-wider px-1 rounded">SCAN COMPLETE</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Scanned Line Items</p>
                    <div className="space-y-1">
                      {scannedBillResult.items.map((item: any, id: number) => (
                        <div key={id} className="flex justify-between items-center text-xs text-slate-755 py-1 border-b border-slate-100/60 leading-none">
                          <span className="font-semibold text-slate-800">{item.productName} ({item.quantity} units)</span>
                          <span className="font-mono text-slate-800">₹{item.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-2 pt-1.5 border-t border-slate-200 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">Total GST Tax</p>
                      <p className="font-semibold text-slate-800">₹{scannedBillResult.gstAmount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">Total Net Invoice</p>
                      <p className="font-black text-slate-900">₹{scannedBillResult.totalAmount}</p>
                    </div>
                  </div>

                  <button
                    onClick={createEntriesFromBill}
                    id="btn-scanned-bill-accept"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                  >
                    Load Bill Items & Update Stocks
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
