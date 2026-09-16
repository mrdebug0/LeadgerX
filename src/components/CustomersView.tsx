import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Search, PlusCircle, CreditCard, ChevronRight, AlertTriangle, ShieldCheck, Mail, Phone, Calendar, RefreshCw, Smile } from 'lucide-react';
import { Customer } from '../types';

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (customer: { name: string; phone: string; email?: string }) => Promise<void>;
  onSendReminder: (phone: string, text: string) => void;
  onReassessRisk?: (customerId: string) => Promise<Customer | undefined>;
  storeName?: string;
}

export default function CustomersView({ customers, onAddCustomer, onSendReminder, onReassessRisk, storeName }: CustomersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [reassessing, setReassessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await onAddCustomer({ name, phone, email });
    setName('');
    setPhone('');
    setEmail('');
    setShowAddCustomer(false);
  };

  const handleTriggerReassessment = async () => {
    if (!selectedCustomer || !onReassessRisk) return;
    setReassessing(true);
    try {
      const updatedCust = await onReassessRisk(selectedCustomer.id);
      if (updatedCust) {
        setSelectedCustomer(updatedCust);
      }
    } catch (e) {
      console.warn("Failed AI reassessment:", e);
    } finally {
      setReassessing(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  // Sync selected customer state with possible updates from props
  const currentCustomer = selectedCustomer 
    ? (customers.find(c => c.id === selectedCustomer.id) || selectedCustomer)
    : null;

  return (
    <div className="p-4 md:p-8 space-y-6" id="customers-module-container">
      {/* Top Banner section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 border border-slate-200 shadow-sm rounded-3xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5 font-display">
            Customer Udhaar Accounts <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">CRM</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium font-sans">Track customer repeat counts, active credit book ledgers, and secure recoveries with proactive AI Risk assessment.</p>
        </div>

        <button
          id="btn-customer-add-modal"
          onClick={() => setShowAddCustomer(true)}
          className="bg-black hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-full flex items-center gap-2 transition-all shadow-md cursor-pointer whitespace-nowrap"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          Add Store Customer
        </button>
      </div>

      {/* Main CRM Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List of Customers */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex items-center relative">
            <span className="absolute left-7 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              id="cust-local-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers by name, phone or record..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-black rounded-full text-xs focus:outline-none font-medium text-slate-700"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-slate-400">
              <span>Customer Name</span>
              <div className="flex gap-20 mr-12">
                <span>Purchase count</span>
                <span>Active credit list</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-120 overflow-y-auto">
              {filteredCustomers.map(c => (
                <div
                  key={c.id}
                  id={`cust-row-${c.id}`}
                  onClick={() => setSelectedCustomer(c)}
                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors duration-150 ${
                    currentCustomer?.id === c.id ? 'bg-slate-50' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-slate-100 font-bold text-slate-800 rounded-lg flex items-center justify-center border border-slate-200 text-xs">
                      {c.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 leading-none">{c.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium font-mono">{c.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-16 mr-6">
                    <span className="text-xs font-semibold text-slate-600 font-mono text-center">{c.purchaseCount || 0} visits</span>
                    <span className={`text-xs font-bold font-mono text-right w-20 ${
                      c.outstandingBalance > 0 ? 'text-red-650' : 'text-emerald-700'
                    }`}>
                      ₹{c.outstandingBalance > 0 ? c.outstandingBalance.toLocaleString() : 'Settled'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              ))}

              {filteredCustomers.length === 0 && (
                <div className="p-12 text-center space-y-1.5 text-slate-400">
                  <Smile className="h-6 w-6 text-slate-350 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">No customers registered yet.</p>
                  <p className="text-[10px]">Add your regular shop buyers and log udhaar lines safely.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Active Analytics Details Profile split */}
        <div className="space-y-4">
          {currentCustomer ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm" id="customer-risk-profile-panel">
              <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
                <div className="h-11 w-11 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center text-sm shadow-inner">
                  {currentCustomer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-sm text-slate-950 tracking-tight leading-none truncate">{currentCustomer.name}</h3>
                  <p className="text-[10px] text-slate-400 font-medium font-mono mt-1 flex items-center gap-1.5">
                    <Phone className="h-3 w-3 shrink-0" /> {currentCustomer.phone}
                  </p>
                </div>
              </div>

              {/* Stats overview card */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50/50 border border-slate-200/50 p-4 rounded-xl shadow-inner">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Repayment Risk</p>
                  <p className={`text-sm font-black mt-0.5 capitalize ${
                    currentCustomer.aiRiskStatus === 'Low' ? 'text-emerald-700' : currentCustomer.aiRiskStatus === 'Medium' ? 'text-amber-700' : 'text-red-650'
                  }`}>
                    {currentCustomer.aiRiskStatus} ({currentCustomer.aiRiskScore}%)
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Outstanding Limit</p>
                  <p className="text-xs font-bold text-slate-900 font-mono mt-0.5">₹{currentCustomer.outstandingBalance.toLocaleString()}</p>
                </div>
              </div>

              {/* Real-time assessment trigger button */}
              {onReassessRisk && (
                <button
                  type="button"
                  id="btn-reassess-risk-trigger"
                  onClick={handleTriggerReassessment}
                  disabled={reassessing}
                  className="w-full border border-slate-200 hover:border-black text-slate-850 hover:bg-slate-55 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`h-4 w-4 text-slate-500 ${reassessing ? 'animate-spin' : ''}`} />
                  {reassessing ? 'Evaluating Balance Sheets...' : 'Assess Credit Risk with Gemini'}
                </button>
              )}

              {/* Recoveries suggestions from Gemini API */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-slate-800" /> AI Recovery playbook
                </h4>
                <div className="space-y-2">
                  {(currentCustomer.aiRecoverySuggestions || []).map((sug, id) => (
                    <div key={id} className="text-[11px] leading-relaxed text-slate-700 bg-slate-100/65 border border-slate-200/80 p-2.5 rounded-lg font-medium">
                      {sug}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action alert reminder collection buttons */}
              {currentCustomer.outstandingBalance > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Bookkeeping Reminders</span>
                  <button
                    onClick={() => {
                      const sName = storeName || 'Our store';
                      const msg = `Dear ${currentCustomer.name}, ${sName} kindly requests settlement of pending udhaar amount of ₹${currentCustomer.outstandingBalance}. Thank you for your continued trade!`;
                      onSendReminder(currentCustomer.phone, msg);
                    }}
                    id="btn-customer-reminder-prompt"
                    className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Mail className="h-4 w-4" />
                    Send Payment Reminder Limit
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 flex flex-col justify-center h-80 shadow-xs">
              <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">Select customer profile</p>
              <p className="text-[10px] mt-1.5">Click any active customer row on the left to see purchase history, AI Risk, outstanding collection limits, and repayment recommendations.</p>
            </div>
          )}
        </div>
      </div>

      {/* DIALOG SHEET: ADD CUSTOMER */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-sm w-full p-6 space-y-5"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="font-bold text-sm text-slate-900">Add Customer details</span>
              <button onClick={() => setShowAddCustomer(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Client Full Name</label>
                <input
                  id="input-customer-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium text-slate-850"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Contact Phone No</label>
                <input
                  id="input-customer-phone"
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 99912 34567"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium text-slate-850"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email Id (Optional)</label>
                <input
                  id="input-customer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. customer@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium text-slate-850"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-750 font-semibold rounded-xl text-xs hover:bg-slate-50 text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-customer-submit"
                  type="submit"
                  className="flex-1 py-2.5 bg-black text-white font-bold rounded-xl text-xs hover:bg-slate-800 text-center cursor-pointer shadow-xs"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
