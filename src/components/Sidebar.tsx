import React from 'react';
import { LayoutDashboard, ReceiptText, Users, Package, CreditCard, MessageSquare, ShieldAlert, Settings, LogOut, Activity } from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, user, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'entries', name: 'Entries', icon: ReceiptText },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'inventory', name: 'Inventory', icon: Package },
    { id: 'udhaar', name: 'Udhaar Ledger', icon: CreditCard },
    { id: 'coach', name: 'AI Business Coach', icon: MessageSquare },
    { id: 'audit', name: 'Audit Logs', icon: Activity },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const allowedMenuItems = menuItems.filter(item => {
    if (user?.role === 'Employee') {
      return item.id !== 'audit' && item.id !== 'settings';
    }
    return true;
  });

  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col justify-between sticky top-0 transition-colors" id="leadgerx-sidebar">
      <div>
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center shrink-0">
            <div className="w-4 h-4 border-2 border-emerald-400 dark:border-emerald-600 rotate-45"></div>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-black dark:text-white leading-none">
              LeadgerX<span className="text-emerald-500 underline decoration-2 underline-offset-4">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Business OS</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white dark:text-black' : 'text-slate-400'}`} />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-3xs">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'LX'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate tracking-tight">{user?.storeName || 'My Store'}</h4>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              {user?.plan ? `${user.plan} Account` : 'Pro Plan'}
            </p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          id="btn-sidebar-logout"
          className="w-full border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          Log Out
        </button>
      </div>
    </div>
  );
}
