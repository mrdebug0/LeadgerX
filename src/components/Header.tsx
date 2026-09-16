import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Menu, 
  Laptop, 
  Smartphone, 
  Tablet,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  storeName: string;
  lowStockCount: number;
  pendingUdhaar: number;
  isOnline: boolean;
  offlineCount: number;
  stores: any[];
  activeStoreId: string;
  onStoreSwitch: (id: string) => void;
  onAddStore: (name: string, type: string) => void;
  userName?: string;
  userPlan?: string;
  isMobile?: boolean;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  isTouch?: boolean;
  onToggleSidebar?: () => void;
}

export default function Header({ 
  storeName, 
  lowStockCount, 
  pendingUdhaar,
  isOnline,
  offlineCount,
  stores,
  activeStoreId,
  onStoreSwitch,
  onAddStore,
  userName = "User",
  userPlan = "Pro",
  isMobile = false,
  deviceType = "desktop",
  isTouch = false,
  onToggleSidebar
}: HeaderProps) {
  const { isDark, toggleTheme, theme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date();
    const dayName = days[d.getDay()];
    const dateNum = d.getDate();
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    setCurrentDateStr(`${dayName}, ${dateNum} ${monthName} ${year}`);
  }, []);

  return (
    <div className="h-18 px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between sticky top-0 z-20 transition-colors" id="header-container">
      {/* Greetings & Date */}
      <div className="flex items-center gap-3">
        {isMobile && onToggleSidebar && (
          <button
            id="btn-sidebar-mobile-toggle"
            onClick={onToggleSidebar}
            className="p-2 -ml-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-700 transition-all cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="h-4.5 w-4.5 text-black dark:text-white" />
          </button>
        )}
        <div>
          <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
            {!isMobile && "Good morning, "}{userName} <span className="animate-bounce">👋</span>
          </h2>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium">{currentDateStr || "Wed, 10 Jun 2026"}</p>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Device Environment Badge */}
        <div className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full select-none cursor-default shrink-0" title={`System detected active ${deviceType} mode`}>
          {deviceType === 'desktop' && <Laptop className="h-3 w-3 text-emerald-500" />}
          {deviceType === 'tablet' && <Tablet className="h-3 w-3 text-sky-500" />}
          {deviceType === 'mobile' && <Smartphone className="h-3 w-3 text-amber-500" />}
          <span className="text-[8px] md:text-[9px] font-extrabold text-slate-700 dark:text-slate-300 tracking-wider uppercase font-mono">
            {isMobile ? 'Mobile' : deviceType}
          </span>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full select-none cursor-help shrink-0" title={isOnline ? "LeadgerX sync engine connected" : "You are working offline. Entries are buffered safely in IndexedDB"}>
          <span className={`h-1.5 w-1.5 md:h-2 md:w-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
          <span className="text-[8px] md:text-[10px] font-bold text-slate-600 dark:text-slate-300 tracking-tight">
            {isOnline ? 'ONLINE' : `OFFLINE (${offlineCount})`}
          </span>
        </div>

        {/* Search Input bar */}
        <div className="relative w-64 hidden xl:block">
          <span className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            id="global-sc-bar"
            placeholder="Search entries, items, customers..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:border-black dark:focus:border-white text-xs px-9 py-2.5 rounded-full focus:outline-none transition-all font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Dark Mode Quick Toggle Button */}
        <button
          id="btn-header-theme-toggle"
          onClick={toggleTheme}
          className="h-9 w-9 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full flex items-center justify-center transition-all cursor-pointer text-slate-600 dark:text-slate-300"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode (currently ${theme})`}
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
        </button>

        {/* Notifications Tray */}
        <div className="relative">
          <button
            id="btn-header-bell"
            onClick={() => setShowNotifications(!showNotifications)}
            className="h-9 w-9 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full flex items-center justify-center relative transition-all cursor-pointer text-slate-600 dark:text-slate-300"
          >
            <Bell className="h-4 w-4" />
            {(lowStockCount > 0 || pendingUdhaar > 0) && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 border border-white dark:border-slate-900 animate-pulse"></span>
            )}
          </button>

          {/* Tray Box dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-4 space-y-3 z-30" id="notification-bell-tray">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="font-bold text-xs text-slate-900 dark:text-white tracking-tight">Active Alerts</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Realtime System</span>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {lowStockCount > 0 && (
                  <div className="flex gap-2.5 bg-red-50/50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-100 dark:border-red-900/50">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs text-red-950 dark:text-red-200">Low Inventory levels</p>
                      <p className="text-[10px] text-red-700 dark:text-red-300 leading-relaxed">You have {lowStockCount} item(s) approaching/at critical zero stock volumes.</p>
                    </div>
                  </div>
                )}

                {pendingUdhaar > 0 && (
                  <div className="flex gap-2.5 bg-amber-50/50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/50">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs text-amber-950 dark:text-amber-200">Outstanding Credit</p>
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-relaxed">₹{pendingUdhaar.toLocaleString()} credit collection awaiting payment recovery.</p>
                    </div>
                  </div>
                )}

                {lowStockCount === 0 && pendingUdhaar === 0 && (
                  <div className="text-center py-6 space-y-1.5">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No active shop alerts!</p>
                    <p className="text-[10px] text-slate-400">All inventory and ledger records healthy.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Store Selector dropdown */}
        <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4">
          <div className="h-8 w-8 rounded-lg bg-teal-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {storeName ? storeName.slice(0, 2).toUpperCase() : 'SK'}
          </div>
          <div className="text-left select-none">
            <select
              value={activeStoreId}
              onChange={(e) => onStoreSwitch(e.target.value)}
              className="font-bold text-xs text-slate-900 dark:text-white bg-transparent border-none pr-1.5 focus:outline-none focus:ring-0 cursor-pointer outline-none hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id} className="dark:bg-slate-900 dark:text-white">
                  {s.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 mt-0.5 leading-none">
              <span className="text-[9px] bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-bold uppercase tracking-wider px-1 rounded-sm">
                {userPlan} Tier
              </span>
              <button
                onClick={() => {
                  const name = prompt("Enter new business / store name:");
                  if (name) onAddStore(name, "kirana");
                }}
                className="text-[9px] text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold transition-all underline cursor-pointer"
              >
                + New Entity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
