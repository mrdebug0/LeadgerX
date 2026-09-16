import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  ShieldCheck, 
  Mail, 
  Store, 
  Key, 
  CircleAlert, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  Palette, 
  FileText, 
  Check, 
  Upload, 
  Receipt,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Download,
  FileJson,
  Database
} from 'lucide-react';
import { User } from '../types';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../api/client';

interface SettingsProps {
  user: User | null;
  onSaveSettings: (settings: { name: string; storeName: string; email: string; plan: 'Free' | 'Pro'; role: 'Owner' | 'Employee' }) => Promise<void>;
  onDeleteAccount: () => void;
  // Invoice template settings props
  template: {
    themeColor: string;
    logoUrl: string;
    layout: string;
    footerText: string;
    gstEnabled: boolean;
    termsEnabled: boolean;
  } | null;
  onSaveTemplate: (data: {
    themeColor: string;
    logoUrl: string;
    layout: string;
    footerText: string;
    gstEnabled: boolean;
    termsEnabled: boolean;
  }) => Promise<void>;
}

export default function SettingsView({ 
  user, 
  onSaveSettings, 
  onDeleteAccount,
  template,
  onSaveTemplate
}: SettingsProps) {
  const { theme, setTheme, isDark, toggleTheme } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'invoice' | 'appearance'>('profile');

  // Profile forms state
  const [name, setName] = useState(user?.name || '');
  const [storeName, setStoreName] = useState(user?.storeName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [plan, setPlan] = useState<'Free' | 'Pro'>(user?.plan || 'Pro');
  const [role, setRole] = useState<'Owner' | 'Employee'>(user?.role === 'Employee' ? 'Employee' : 'Owner');
  const [notifSound, setNotifSound] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Export transaction history JSON state
  const [exportingJson, setExportingJson] = useState(false);
  const [exportDownloadUrl, setExportDownloadUrl] = useState<string | null>(null);
  const [exportRecordCount, setExportRecordCount] = useState<number | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [themeSaving, setThemeSaving] = useState(false);

  // Invoice Template form state
  const [themeColor, setThemeColor] = useState(template?.themeColor || '#0f766e');
  const [layout, setLayout] = useState(template?.layout || 'standard');
  const [footerText, setFooterText] = useState(template?.footerText || 'Thank you for shopping with us! Visit again.');
  const [gstEnabled, setGstEnabled] = useState(template?.gstEnabled ?? true);
  const [termsEnabled, setTermsEnabled] = useState(template?.termsEnabled ?? true);
  const [logoUrl, setLogoUrl] = useState(template?.logoUrl || '');
  const [uploading, setUploading] = useState(false);

  // Debounced Auto-Save State
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'changed' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const isInitialMount = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');

  // Update states whenever template or user changes
  useEffect(() => {
    if (template) {
      setThemeColor(template.themeColor || '#0f766e');
      setLayout(template.layout || 'standard');
      setFooterText(template.footerText || 'Thank you for shopping with us! Visit again.');
      setGstEnabled(template.gstEnabled ?? true);
      setTermsEnabled(template.termsEnabled ?? true);
      setLogoUrl(template.logoUrl || '');
      
      // Update baseline without triggering auto-save
      lastSavedDataRef.current = JSON.stringify({
        themeColor: template.themeColor || '#0f766e',
        layout: template.layout || 'standard',
        footerText: template.footerText || 'Thank you for shopping with us! Visit again.',
        gstEnabled: template.gstEnabled ?? true,
        termsEnabled: template.termsEnabled ?? true,
        logoUrl: template.logoUrl || ''
      });
    }
  }, [template]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setStoreName(user.storeName);
      setEmail(user.email);
      setPlan(user.plan);
      setRole(user.role === 'Employee' ? 'Employee' : 'Owner');
    }
  }, [user]);

  // --- DEBOUNCED AUTO-SAVE EFFECT FOR INVOICE TEMPLATE ---
  useEffect(() => {
    // Skip auto-save on first mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentPayload = {
      themeColor,
      logoUrl,
      layout,
      footerText,
      gstEnabled,
      termsEnabled
    };
    const currentPayloadStr = JSON.stringify(currentPayload);

    // If identical to last saved state, don't trigger
    if (currentPayloadStr === lastSavedDataRef.current) {
      return;
    }

    // Set status to pending changes
    setAutoSaveStatus('changed');

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Setup 1-second (1000ms) debounce for invoice template settings
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving');
        const token = localStorage.getItem('leadgerx_token');
        const storeId = localStorage.getItem('leadgerx_active_store') || '';
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (storeId) headers['x-store-id'] = storeId;

        // Trigger automatic POST request to /api/invoice-template after 1-second delay
        await apiClient.post('/api/invoice-template', currentPayload);

        await onSaveTemplate(currentPayload);
        lastSavedDataRef.current = currentPayloadStr;
        setAutoSaveStatus('saved');
        const now = new Date();
        setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.error('Debounced template auto-save error:', err);
        setAutoSaveStatus('idle');
      }
    }, 1000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [themeColor, logoUrl, layout, footerText, gstEnabled, termsEnabled, onSaveTemplate]);

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings({ name, storeName, email, plan, role });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setAutoSaveStatus('saving');
    const payload = {
      themeColor,
      logoUrl,
      layout,
      footerText,
      gstEnabled,
      termsEnabled
    };
    await onSaveTemplate(payload);
    lastSavedDataRef.current = JSON.stringify(payload);
    setAutoSaveStatus('saved');
    const now = new Date();
    setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Persistent dark mode toggle synchronized with ThemeContext and backend
  const handleSelectTheme = async (mode: 'light' | 'dark' | 'system') => {
    setTheme(mode);
    setThemeSaving(true);
    try {
      const token = localStorage.getItem('leadgerx_token');
      if (token) {
        await apiClient.post('/api/auth/theme', { theme: mode });
      }
    } catch (err) {
      console.warn('Backend theme sync warning:', err);
    } finally {
      setThemeSaving(false);
    }
  };

  const handleToggleDarkMode = async () => {
    const nextTheme = isDark ? 'light' : 'dark';
    await handleSelectTheme(nextTheme);
  };

  // Export transaction history as JSON with download link
  const handleExportTransactionsJson = async () => {
    try {
      setExportingJson(true);
      setExportError(null);

      const data = await apiClient.get('/api/reports/download/json');
      const count = Array.isArray(data?.transactions) ? data.transactions.length : 0;
      setExportRecordCount(count);

      const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(jsonBlob);
      setExportDownloadUrl(url);

      // Auto-trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = `leadgerx_transactions_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Error exporting transactions JSON:', err);
      setExportError(err.message || 'Could not export transaction history');
    } finally {
      setExportingJson(false);
    }
  };

  const handleLogoUploadSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setTimeout(() => {
        setLogoUrl(reader.result as string);
        setUploading(false);
      }, 800);
    };
    reader.readAsDataURL(file);
  };

  const presetColors = [
    { name: 'Teal Green', value: '#0f766e' },
    { name: 'Classic Blue', value: '#1d4ed8' },
    { name: 'Emerald Green', value: '#047857' },
    { name: 'Cosmic Indigo', value: '#4338ca' },
    { name: 'Warm Crimson', value: '#be123c' },
    { name: 'Sleek Slate', value: '#334155' }
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl transition-colors" id="settings-module-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 font-display">
            Settings & Branding <span className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold px-2.5 py-0.5 rounded-full uppercase font-sans">Configs</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-sans">Adjust checkout configurations, account plans, business profiles and PDF invoice themes.</p>
        </div>

        {/* Sub-tabs header switches */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            onClick={() => setActiveSubTab('profile')}
            id="subtab-profile"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'profile' 
                ? 'bg-white dark:bg-slate-900 text-black dark:text-white shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Store Profile
          </button>
          <button
            onClick={() => setActiveSubTab('invoice')}
            id="subtab-invoice"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'invoice' 
                ? 'bg-white dark:bg-slate-900 text-black dark:text-white shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Invoice Templates
            {autoSaveStatus === 'saving' && <RefreshCw className="h-3 w-3 text-amber-500 animate-spin" />}
            {autoSaveStatus === 'saved' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          </button>
          <button
            onClick={() => setActiveSubTab('appearance')}
            id="subtab-appearance"
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'appearance' 
                ? 'bg-white dark:bg-slate-900 text-black dark:text-white shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Appearance
            {isDark ? <Moon className="h-3 w-3 text-indigo-400" /> : <Sun className="h-3 w-3 text-amber-500" />}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold p-3.5 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2" id="settings-save-alert">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          Settings successfully saved and synchronized with LeadgerX servers!
        </div>
      )}

      {/* Profile Section Tab */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Primary store properties card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-6 transition-colors">
              <form onSubmit={handleSaveSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Owner Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-black dark:focus:ring-white focus:outline-none font-medium text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Store Trade Title</label>
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-black dark:focus:ring-white focus:outline-none font-medium text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Primary Contact email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-black dark:focus:ring-white focus:outline-none font-medium text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Subscription Account Plan</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-black dark:focus:ring-white focus:outline-none font-medium text-slate-700 dark:text-slate-200"
                  >
                    <option value="Pro">Pro Access (₹499/Mo automatic billing)</option>
                    <option value="Free">Free Basic (Limits Voice Logs / Vision Scanner)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">System Authorization Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-black dark:focus:ring-white focus:outline-none font-medium text-slate-700 dark:text-slate-200"
                  >
                    <option value="Owner">Owner (Full administrative rights)</option>
                    <option value="Employee">Employee (Restricted financial metrics, locked logs/customization)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  id="btn-save-settings"
                  className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 rounded-full text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  Save configurations
                </button>
              </form>
            </div>

            {/* Notification triggers preference layout */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-6 space-y-4 transition-colors">
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Business automation rules</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-none">Instant WhatsApp Alerts</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Automatically alert udhaar credit accounts upon payment dates passing.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setNotifSound(!notifSound)}
                  className="text-slate-700 dark:text-slate-300 cursor-pointer text-lg leading-none shrink-0"
                >
                  {notifSound ? <ToggleRight className="h-9 w-9 text-slate-900 dark:text-emerald-400 animate-pulse" /> : <ToggleLeft className="h-9 w-9 text-slate-400" />}
                </button>
              </div>
            </div>

            {/* Export Transaction History Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-6 space-y-4 transition-colors" id="export-transactions-container">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <FileJson className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider leading-none">
                      Export Transaction History
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Download your store data in JSON format</p>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 font-mono">
                  JSON Export
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                Export all sales transactions, expenses, credit entries, and payment records as a downloadable JSON file for offline backup and accounting.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleExportTransactionsJson}
                  disabled={exportingJson}
                  id="btn-export-json"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  {exportingJson ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Exporting Data...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      <span>Export History as JSON</span>
                    </>
                  )}
                </button>

                {exportDownloadUrl ? (
                  <a
                    href={exportDownloadUrl}
                    download={`leadgerx_transactions_${Date.now()}.json`}
                    id="link-download-transactions-json"
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Download JSON File {exportRecordCount !== null ? `(${exportRecordCount} records)` : ''}</span>
                  </a>
                ) : (
                  <a
                    href="/api/reports/download/json"
                    onClick={(e) => {
                      e.preventDefault();
                      handleExportTransactionsJson();
                    }}
                    id="link-direct-download-transactions"
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 py-2 px-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Direct Download Link</span>
                  </a>
                )}
              </div>

              {exportError && (
                <div className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl border border-red-200 dark:border-red-900/40">
                  {exportError}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Quick Theme Toggle Card in Store Profile */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-emerald-500" />
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-none">Application Theme</h4>
                </div>
                <div className="flex items-center gap-2">
                  {themeSaving && <RefreshCw className="h-3 w-3 text-slate-400 animate-spin" />}
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 font-bold px-2 py-0.5 rounded-full text-slate-700 dark:text-slate-300 capitalize">
                    {theme}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Choose your preferred visual theme for the LeadgerX console. Persisted across browser sessions and saved to your account.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectTheme('light')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    theme === 'light' 
                      ? 'border-black dark:border-white bg-slate-50 dark:bg-slate-800 text-black dark:text-white font-bold shadow-xs' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Sun className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                  <span className="text-[10px] block">Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTheme('dark')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    theme === 'dark' 
                      ? 'border-black dark:border-white bg-slate-50 dark:bg-slate-800 text-black dark:text-white font-bold shadow-xs' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Moon className="h-4 w-4 mx-auto mb-1 text-indigo-400" />
                  <span className="text-[10px] block">Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTheme('system')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    theme === 'system' 
                      ? 'border-black dark:border-white bg-slate-50 dark:bg-slate-800 text-black dark:text-white font-bold shadow-xs' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Monitor className="h-4 w-4 mx-auto mb-1 text-slate-400" />
                  <span className="text-[10px] block">System</span>
                </button>
              </div>
            </div>

            {/* Account Deletion warning card */}
            <div className="bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-3xl p-6 space-y-4">
              <div className="flex gap-2.5">
                <CircleAlert className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-red-950 dark:text-red-200 leading-none">Purge Store Records</h4>
                  <p className="text-[10px] text-red-700 dark:text-red-400 leading-relaxed font-sans">Clearing store databases purges transactions, CRM records and credit ledgers permanently.</p>
                </div>
              </div>

              <button
                onClick={onDeleteAccount}
                id="btn-purge-settings"
                className="border border-red-200 dark:border-red-800 hover:border-red-400 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold px-4 py-2 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm w-full justify-center"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Purge all records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appearance Dedicated Tab */}
      {activeSubTab === 'appearance' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-6 md:p-8 space-y-6 transition-colors" id="settings-appearance-panel">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="h-4 w-4 text-emerald-500" />
                Display & Theme Preferences
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Personalize the visual look of LeadgerX for night shifts and low-light shop counters.
              </p>
            </div>
            <button
              id="dark-mode-toggle"
              onClick={handleToggleDarkMode}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
            >
              {themeSaving ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : isDark ? (
                <Sun className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-indigo-500" />
              )}
              <span>Switch to {isDark ? 'Light' : 'Dark'} Mode</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Light Mode Card */}
            <div 
              id="theme-card-light"
              onClick={() => handleSelectTheme('light')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                theme === 'light' 
                  ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                    <Sun className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">Light Mode</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Crisp daylight contrast</p>
                  </div>
                </div>
                {theme === 'light' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              </div>
              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="h-2 w-16 bg-slate-300 rounded-full"></div>
                <div className="h-3 w-full bg-white rounded-md border border-slate-200"></div>
              </div>
            </div>

            {/* Dark Mode Card */}
            <div 
              id="theme-card-dark"
              onClick={() => handleSelectTheme('dark')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                theme === 'dark' 
                  ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-800 text-indigo-400 border border-slate-700">
                    <Moon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">Dark Mode</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Low-glare Kirana view</p>
                  </div>
                </div>
                {theme === 'dark' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="h-2 w-16 bg-slate-700 rounded-full"></div>
                <div className="h-3 w-full bg-slate-900 rounded-md border border-slate-800"></div>
              </div>
            </div>

            {/* System Mode Card */}
            <div 
              id="theme-card-system"
              onClick={() => handleSelectTheme('system')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                theme === 'system' 
                  ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">System Synchronized</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Follows OS theme</p>
                  </div>
                </div>
                {theme === 'system' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              </div>
              <div className="bg-gradient-to-r from-slate-100 to-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="h-2 w-16 bg-slate-400 rounded-full"></div>
                <div className="h-3 w-full bg-slate-300/40 rounded-md"></div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Current Active Mode: <strong className="text-slate-900 dark:text-white capitalize">{isDark ? 'Dark Mode' : 'Light Mode'} ({theme} preference)</strong>
            </span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              ✓ Local Storage Persisted
            </span>
          </div>
        </div>
      )}

      {/* Invoice Template styling Section */}
      {activeSubTab === 'invoice' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Settings inputs column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-6 space-y-5 transition-colors">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  Layout Customization
                </h3>

                {/* Live Debounced Auto-Save Status Badge */}
                <div className="flex items-center gap-1.5" id="autosave-status-badge">
                  {autoSaveStatus === 'saving' && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Auto-saving...
                    </span>
                  )}
                  {autoSaveStatus === 'changed' && (
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping"></span>
                      Unsaved changes
                    </span>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Auto-saved {lastSavedTime ? `@ ${lastSavedTime}` : ''}
                    </span>
                  )}
                  {autoSaveStatus === 'idle' && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      Auto-save active
                    </span>
                  )}
                </div>
              </div>

              <form onSubmit={handleSaveTemplateSubmit} className="space-y-5">
                {/* Logo uploader */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Store Business Logo</span>
                  <div className="flex items-center gap-4">
                    {logoUrl ? (
                      <div className="relative">
                        <img src={logoUrl} alt="Store logo" referrerPolicy="no-referrer" className="h-14 w-14 object-contain border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 p-1" />
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 text-[8px] h-4 w-4 flex items-center justify-center font-bold cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="h-14 w-14 border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-500 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-800/60 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all select-none">
                        <Upload className="h-4 w-4" />
                        <span className="text-[8px] font-bold mt-1">Logo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUploadSim} />
                      </label>
                    )}
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">
                        {uploading ? 'Processing file upload...' : 'Upload PNG or JPEG'}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal">Logo automatically stores and prints on PDF receipts.</p>
                    </div>
                  </div>
                </div>

                {/* Theme Palette */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Receipt Color Accent</span>
                  <div className="grid grid-cols-3 gap-2">
                    {presetColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setThemeColor(color.value)}
                        style={{ borderColor: themeColor === color.value ? (isDark ? '#ffffff' : '#000000') : undefined }}
                        className={`p-1 px-2 border dark:border-slate-700 rounded-lg text-left flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all ${
                          themeColor === color.value ? 'bg-slate-100 dark:bg-slate-800' : ''
                        }`}
                      >
                        <span className="h-3 w-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: color.value }} />
                        <span className="text-[9px] font-semibold text-slate-700 dark:text-slate-300 truncate">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Invoice Layout structures */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Invoice Print Layout</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['standard', 'minimal', 'compact'].map((lay) => (
                      <button
                        key={lay}
                        type="button"
                        onClick={() => setLayout(lay)}
                        className={`p-2.5 border rounded-xl text-center capitalize cursor-pointer transition-all ${
                          layout === lay 
                            ? 'border-black dark:border-white bg-slate-50 dark:bg-slate-800 font-bold text-black dark:text-white' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <FileText className="h-4 w-4 mx-auto mb-1 opacity-70" />
                        <p className="text-[10px]">{lay}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle details */}
                <div className="div-toggle-settings border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Include GSTIN Tax Invoice formatting</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500">Append state tax percentages and GST/HSN ledger column fields</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGstEnabled(!gstEnabled)}
                      className="cursor-pointer shrink-0"
                    >
                      {gstEnabled ? <ToggleRight className="h-8 w-8 text-slate-900 dark:text-emerald-400" /> : <ToggleLeft className="h-8 w-8 text-slate-400" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Print Standard Terms & Conditions</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500">Include "No return policy" or standard offline bookkeeping regulations.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTermsEnabled(!termsEnabled)}
                      className="cursor-pointer shrink-0"
                    >
                      {termsEnabled ? <ToggleRight className="h-8 w-8 text-slate-900 dark:text-emerald-400" /> : <ToggleLeft className="h-8 w-8 text-slate-400" />}
                    </button>
                  </div>
                </div>

                {/* Footer text input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Invoice Custom Footer Note</label>
                  <input
                    type="text"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="E.g. Visit again! For returns contact shop owner."
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-black dark:focus:ring-white focus:outline-none font-semibold text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-black dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-black rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    Save Template Layout
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                  💡 Changes auto-save automatically in real-time as you adjust settings.
                </p>
              </form>
            </div>
          </div>

          {/* Interactive invoice live preview column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">A4 Invoice Paper Live Preview</span>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Print PDF / Share
              </button>
            </div>

            {/* Dynamic visual invoice paper sheets mock */}
            <div className={`bg-white border select-none border-slate-200 rounded-2xl shadow-md p-8 min-h-[580px] text-slate-800 font-sans relative ${layout === 'compact' ? 'max-w-md mx-auto p-4' : ''}`}>
              {/* Header border theme strip */}
              <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-2xl" style={{ backgroundColor: themeColor }} />

              {/* Dynamic store titles */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                <div className="space-y-1">
                  {logoUrl ? (
                    <img src={logoUrl} alt="logo" referrerPolicy="no-referrer" className="h-10 object-contain max-w-32 mb-1" />
                  ) : (
                    <div className="h-8 w-8 rounded-lg text-white font-bold text-xs flex items-center justify-center" style={{ backgroundColor: themeColor }}>
                      {storeName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <h4 className="font-extrabold text-[#111] text-base leading-none mt-1">{storeName}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Main Market Street, Block B, Landmark Hub</p>
                  <p className="text-[9px] text-slate-400 font-medium">Contact: {user?.email || 'admin@leadgerx.co'}</p>
                </div>
                
                <div className="text-right space-y-1">
                  <h3 className="font-extrabold text-xs tracking-wider uppercase" style={{ color: themeColor }}>TAX INVOICE</h3>
                  <p className="text-[10px] font-bold text-slate-700">Invoice: <span className="font-mono">#LX-2026-8923</span></p>
                  <p className="text-[9px] text-slate-400">Date: {new Date().toLocaleDateString()}</p>
                  {gstEnabled && (
                    <p className="text-[9px] bg-slate-50 font-mono text-slate-500 px-1.5 py-0.5 rounded-sm inline-block">
                      GSTIN: 08AAAAA1111A1Z1
                    </p>
                  )}
                </div>
              </div>

              {/* Billed To coordinates */}
              <div className="py-5 grid grid-cols-2 gap-4 border-b border-slate-100 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Billed To</span>
                  <p className="font-bold text-slate-900">Amit Singh</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">+91 98765 43210</p>
                  <p className="text-[10px] text-slate-500">Sector 12, Block C, Resident Apts</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Billing Account</span>
                  <p className="font-bold text-slate-800">LeadgerX Ledger Record</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Payment Status: <span className="text-emerald-700 font-bold">PAID (CASH)</span></p>
                </div>
              </div>

              {/* Items ledger list table */}
              <div className="py-4 space-y-3">
                <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                  <div className="col-span-6">Product Description</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                <div className="grid grid-cols-12 text-xs font-semibold text-slate-700 items-center">
                  <div className="col-span-6 space-y-0.5">
                    <p className="font-bold text-slate-900 leading-none">Aashirvaad Shudh Chakki Atta 5kg</p>
                    {gstEnabled && <p className="text-[9px] font-mono text-slate-400">HSN: 110100 • SGST 2.5% • CGST 2.5%</p>}
                  </div>
                  <div className="col-span-2 text-right font-mono">2</div>
                  <div className="col-span-2 text-right font-mono">₹240.00</div>
                  <div className="col-span-2 text-right font-bold text-slate-900 font-mono">₹480.00</div>
                </div>

                <div className="grid grid-cols-12 text-xs font-semibold text-slate-700 items-center">
                  <div className="col-span-6 space-y-0.5">
                    <p className="font-bold text-slate-900 leading-none">Amul Premium Salted Butter 100g</p>
                    {gstEnabled && <p className="text-[9px] font-mono text-slate-400">HSN: 040510 • SGST 6% • CGST 6%</p>}
                  </div>
                  <div className="col-span-2 text-right font-mono">1</div>
                  <div className="col-span-2 text-right font-mono">₹55.00</div>
                  <div className="col-span-2 text-right font-bold text-slate-900 font-mono">₹55.00</div>
                </div>
              </div>

              {/* Total calculations */}
              <div className="border-t border-slate-100 pt-3 flex justify-end">
                <div className="w-56 text-xs space-y-1.5">
                  <div className="flex justify-between font-semibold text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹535.00</span>
                  </div>
                  {gstEnabled && (
                    <div className="flex justify-between text-[10px] font-medium text-slate-400">
                      <span>SGST + CGST Taxes:</span>
                      <span className="font-mono">₹28.75</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-100 pt-1.5" style={{ color: themeColor }}>
                    <span>Grand Total:</span>
                    <span className="font-mono">₹{gstEnabled ? '563.75' : '535.00'}</span>
                  </div>
                </div>
              </div>

              {/* Note and standard terms */}
              <div className="absolute bottom-6 left-8 right-8 border-t border-slate-100 pt-4 flex justify-between items-end">
                <div className="max-w-xs space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Footer Memo</p>
                  <p className="text-[10px] text-slate-600 font-semibold leading-normal italic">
                    "{footerText}"
                  </p>
                </div>
                {termsEnabled && (
                  <div className="text-right max-w-xxs">
                    <p className="text-[8px] font-bold text-slate-400">Terms &amp; Conditions</p>
                    <p className="text-[8px] text-slate-400 leading-snug mt-0.5">Computer-generated billing. Goods once sold cannot be returned.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
