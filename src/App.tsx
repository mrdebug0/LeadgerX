import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import EntriesView from './components/EntriesView';
import CustomersView from './components/CustomersView';
import InventoryView from './components/InventoryView';
import UdhaarLedgerView from './components/UdhaarLedgerView';
import CoachView from './components/CoachView';
import SettingsView from './components/SettingsView';
import AuditLogsView from './components/AuditLogsView';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';

import { useDevice } from './hooks/useDevice';
import { LayoutDashboard, ReceiptText, Package, CreditCard, Menu } from 'lucide-react';

import { User, Entry, Customer, InventoryItem, UdhaarRecord, ChatMessage, BusinessSummary } from './types';
import { saveOfflineEntry, getOfflineEntries, clearOfflineEntries } from './utils/offlineDb';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { apiClient } from './api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary componentName="LeadgerX Application">
          <MainApp />
        </ErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function MainApp() {
  const device = useDevice();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLanding, setIsLanding] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // App primary states
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [udhaar, setUdhaar] = useState<UdhaarRecord[]>([]);
  const [chatLogs, setChatLogs] = useState<ChatMessage[]>([]);
  const [summary, setSummary] = useState<BusinessSummary>(() => {
    try {
      const cached = localStorage.getItem('leadgerx_cached_summary');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.todaySales === 'number') {
          return parsed;
        }
      }
    } catch {}
    return {
      todaySales: 0,
      todaySalesCount: 0,
      pendingUdhaar: 0,
      activeCustomers: 0,
      lowStockCount: 0,
      weeklyProgress: { current: 0, goal: 50000 },
      recentActivity: []
    };
  });

  // Enterprise additions properties state
  const [stores, setStores] = useState<any[]>([]);
  const [activeStoreId, setActiveStoreIdState] = useState<string>(() => {
    return localStorage.getItem('leadgerx_active_store_id') || localStorage.getItem('leadgerx_active_store') || '';
  });

  const setActiveStoreId = (id: string) => {
    setActiveStoreIdState(id);
    if (id) {
      localStorage.setItem('leadgerx_active_store_id', id);
      localStorage.setItem('leadgerx_active_store', id);
    } else {
      localStorage.removeItem('leadgerx_active_store_id');
      localStorage.removeItem('leadgerx_active_store');
    }
  };

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
  const [invoiceTemplate, setInvoiceTemplate] = useState<any>(null);

  const [coachLoading, setCoachLoading] = useState(false);
  const qClient = useQueryClient();

  // Retrieve authentication headers context
  const getAuthHeaders = () => {
    const token = localStorage.getItem('leadgerx_token');
    const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
    if (activeStoreId) {
      headers['x-store-id'] = activeStoreId;
    }
    return headers;
  };

  // --- TANSTACK REACT QUERY CACHING LAYER ---
  const { data: qSummary } = useQuery({
    queryKey: ['summary', activeStoreId, user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('leadgerx_token');
      if (!token) return null;
      try {
        const data = await apiClient.get('/api/summary');
        if (data) {
          try {
            localStorage.setItem('leadgerx_cached_summary', JSON.stringify(data));
          } catch {}
        }
        return data;
      } catch (e) {
        return null;
      }
    },
    initialData: () => {
      try {
        const cached = localStorage.getItem('leadgerx_cached_summary');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed.todaySales === 'number') return parsed;
        }
      } catch {}
      return undefined;
    },
    enabled: isAuth && !!user,
  });

  const { data: qEntries } = useQuery({
    queryKey: ['entries', activeStoreId, user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('leadgerx_token');
      if (!token) return [];
      try {
        const data = await apiClient.get('/api/entries');
        return Array.isArray(data) ? data : [];
      } catch (e) {
        return [];
      }
    },
    enabled: isAuth && !!user,
  });

  const { data: qCustomers } = useQuery({
    queryKey: ['customers', activeStoreId, user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('leadgerx_token');
      if (!token) return [];
      try {
        const data = await apiClient.get('/api/customers');
        return Array.isArray(data) ? data : [];
      } catch (e) {
        return [];
      }
    },
    enabled: isAuth && !!user,
  });

  const { data: qInventory } = useQuery({
    queryKey: ['inventory', activeStoreId, user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('leadgerx_token');
      if (!token) return [];
      try {
        const data = await apiClient.get('/api/inventory');
        return Array.isArray(data) ? data : [];
      } catch (e) {
        return [];
      }
    },
    enabled: isAuth && !!user,
  });

  const { data: qUdhaar } = useQuery({
    queryKey: ['udhaar', activeStoreId, user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('leadgerx_token');
      if (!token) return [];
      try {
        const data = await apiClient.get('/api/udhaar');
        return Array.isArray(data) ? data : [];
      } catch (e) {
        return [];
      }
    },
    enabled: isAuth && !!user,
  });

  // Synchronize state setters with React Query data
  useEffect(() => {
    if (qSummary) {
      setSummary(qSummary);
      try {
        localStorage.setItem('leadgerx_cached_summary', JSON.stringify(qSummary));
      } catch {}
    }
  }, [qSummary]);

  useEffect(() => {
    if (qEntries) setEntries(qEntries);
  }, [qEntries]);

  useEffect(() => {
    if (qCustomers) setCustomers(qCustomers);
  }, [qCustomers]);

  useEffect(() => {
    if (qInventory) setInventory(qInventory);
  }, [qInventory]);

  useEffect(() => {
    if (qUdhaar) setUdhaar(qUdhaar);
  }, [qUdhaar]);

  // Fetch full data stack (clears caching triggers)
  const fetchAllData = async () => {
    try {
      await qClient.invalidateQueries();
    } catch (e) {
      console.warn("Failed invalidating live query pools.", e);
    }
  };

  // Enterprise setup loading calls
  const fetchStores = async () => {
    try {
      const data = await apiClient.get('/api/stores');
      if (Array.isArray(data)) {
        setStores(data);
        if (data.length > 0 && !activeStoreId) {
          setActiveStoreId(data[0].id);
        }
      }
    } catch (e) {
      console.warn("Error loading stores list:", e);
    }
  };

  const handleAddStoreHandler = async (name: string, type: string) => {
    try {
      await apiClient.post('/api/stores', { name, type });
      await fetchStores();
    } catch (e) {
      console.error("Error creating new store entity:", e);
    }
  };

  const fetchAuditLogs = async () => {
    setIsRefreshingLogs(true);
    try {
      const data = await apiClient.get('/api/admin/audit-logs');
      if (Array.isArray(data)) {
        setAuditLogs(data);
      }
    } catch (e) {
      console.warn("Compliance log reader error:", e);
    } finally {
      setIsRefreshingLogs(false);
    }
  };

  const fetchInvoiceTemplate = async () => {
    try {
      const data = await apiClient.get('/api/invoice-template');
      if (data) {
        setInvoiceTemplate(data);
      }
    } catch (e) {
      console.warn("Template reader error:", e);
    }
  };

  const handleSaveInvoiceTemplate = async (templateConfigs: any) => {
    try {
      const data = await apiClient.post('/api/invoice-template', templateConfigs);
      if (data && data.template) {
        setInvoiceTemplate(data.template);
      }
    } catch (e) {
      console.error("Template writer error:", e);
    }
  };

  // Sync background queued offline entries safely back to our cloud database
  const syncOfflineEntriesToServer = async () => {
    if (!navigator.onLine) return;
    try {
      const offlineItems = await getOfflineEntries();
      if (offlineItems.length === 0) return;

      await apiClient.post('/api/offline-sync', { entries: offlineItems.map(item => item.data) });
      await clearOfflineEntries();
      setOfflineCount(0);
      await fetchAllData();
      await fetchAuditLogs();
    } catch (e) {
      console.error("Back online offline sync failure:", e);
    }
  };

  // React state watcher for connection changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineEntriesToServer();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    getOfflineEntries().then(items => {
      setOfflineCount(items.length);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [activeStoreId]);

  // Sync full application stack on active switches
  useEffect(() => {
    if (isAuth) {
      fetchStores();
      fetchInvoiceTemplate();
      fetchAuditLogs();
      fetchAllData();
    }
  }, [isAuth, activeStoreId]);

  // Check auth session on load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('leadgerx_token');
        if (!token) {
          setIsAuth(false);
          return;
        }

        const data = await apiClient.get('/api/auth/me');
        const userData = data?.user || data;
        if (userData && userData.id) {
          setUser(userData);
          setIsAuth(true);
          setIsLanding(false);
          const storeId = userData.activeStoreId || (userData.stores && userData.stores[0]?.id) || localStorage.getItem('leadgerx_active_store_id') || '';
          if (storeId) {
            setActiveStoreId(storeId);
          }
        } else {
          setIsAuth(false);
        }
      } catch (err: any) {
        if (err.status === 401) {
          localStorage.removeItem('leadgerx_token');
          setIsAuth(false);
        }
        console.warn("Session validation skipped:", err);
      }
    };
    checkAuthStatus();

    const handleUnauthorizedEvent = () => {
      handleLogout();
    };
    window.addEventListener('leadgerx:unauthorized', handleUnauthorizedEvent);
    
    // Seed initial assistant greeting
    setChatLogs([
      {
        id: "greet-1",
        sender: "assistant",
        text: "Hello! Welcome to your LeadgerX AI Business Coach. How can I assist you with credit risk, inventory restocking, expense tracking, or margin optimization today?",
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  const handleStartFree = () => {
    setIsLanding(false);
  };

  const handleAuthSuccess = (authenticatedUser: User, token?: string) => {
    if (token) {
      localStorage.setItem('leadgerx_token', token);
    }
    const storeId = authenticatedUser.activeStoreId || (authenticatedUser.stores && authenticatedUser.stores[0]?.id) || localStorage.getItem('leadgerx_active_store_id') || '';
    if (storeId) {
      setActiveStoreId(storeId);
    }
    setUser(authenticatedUser);
    setIsAuth(true);
    setIsLanding(false);
    fetchAllData();
  };

  const handleLogout = async () => {
    localStorage.removeItem('leadgerx_token');
    localStorage.removeItem('leadgerx_cached_summary');
    setUser(null);
    setIsAuth(false);
    setIsLanding(true);
    setActiveTab('dashboard');
  };

  const handleSaveSettings = async (configs: any) => {
    try {
      const data = await apiClient.post('/api/auth/save-settings', configs);
      if (data && data.success) {
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAccount = () => {
    alert("This prototype store data has been reset to defaults!");
    handleLogout();
  };

  // --- CRUD API TRIGGER ACTIONS (Durable & React state synced) ---
  const handleAddEntry = async (entryData: any) => {
    const richEntry = { ...entryData, storeId: activeStoreId };

    if (!isOnline) {
      // 1. Buffering entry safely offline
      await saveOfflineEntry(richEntry);
      
      // 2. Incrementing pending offline count
      const items = await getOfflineEntries();
      setOfflineCount(items.length);

      // 3. Immediately display on screen for instant feedback
      const localOffId = `temp-off-${Date.now()}`;
      const tempEntry: Entry = {
        id: localOffId,
        customerName: entryData.customerName || "Self",
        productName: entryData.productName || "Miscellaneous",
        quantity: Number(entryData.quantity) || 1,
        price: Number(entryData.price) || 0,
        amount: (Number(entryData.quantity) || 1) * (Number(entryData.price) || 0),
        type: entryData.type || "sale",
        status: entryData.status || "paid",
        date: entryData.date || new Date().toISOString(),
        userId: user?.id || 'offline-user',
        storeId: activeStoreId
      };
      setEntries([tempEntry, ...entries]);
      
      // Update local quick stats summary
      setSummary(prev => ({
        ...prev,
        todaySales: prev.todaySales + tempEntry.amount,
        todaySalesCount: prev.todaySalesCount + 1
      }));
      return;
    }

    try {
      await apiClient.post('/api/entries', richEntry);
      if (richEntry.type === 'sale' || !richEntry.type) {
        const addedAmount = (Number(richEntry.quantity) || 1) * (Number(richEntry.price) || 0);
        if (addedAmount > 0) {
          setSummary(prev => {
            const updated = {
              ...prev,
              todaySales: prev.todaySales + addedAmount,
              todaySalesCount: prev.todaySalesCount + 1
            };
            try {
              localStorage.setItem('leadgerx_cached_summary', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      }
      await fetchAllData();
      await fetchAuditLogs();
    } catch (e) {
      console.error("Add Entry Error:", e);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await apiClient.delete(`/api/entries/${id}`);
      await fetchAllData();
    } catch (e) {
      console.error("Delete Entry Error:", e);
    }
  };

  const handleAddCustomer = async (custData: any) => {
    try {
      await apiClient.post('/api/customers', custData);
      await fetchAllData();
    } catch (e) {
      console.error("Add customer Error:", e);
    }
  };

  const handleAddInventoryItem = async (itemData: any) => {
    try {
      await apiClient.post('/api/inventory', itemData);
      await fetchAllData();
    } catch (e) {
      console.error("Add inventory item Error:", e);
    }
  };

  const handleBulkAddInventoryItems = async (items: any[]) => {
    try {
      await apiClient.post('/api/inventory/bulk', { items });
      await fetchAllData();
    } catch (e) {
      console.error("Bulk add error:", e);
    }
  };

  const handleBulkDeleteInventory = async (ids: string[]) => {
    try {
      await apiClient.post('/api/inventory/bulk-delete', { ids });
      await fetchAllData();
    } catch (e) {
      console.error("Bulk delete error:", e);
    }
  };

  const handleBulkUpdateCategory = async (ids: string[], category: string) => {
    try {
      await apiClient.post('/api/inventory/bulk-update-category', { ids, category });
      await fetchAllData();
    } catch (e) {
      console.error("Bulk category update error:", e);
    }
  };

  const handleBulkPriceUpdate = async (ids: string[], field: string, changeType: string, value: number) => {
    try {
      await apiClient.post('/api/inventory/bulk-price-update', { ids, field, changeType, value });
      await fetchAllData();
    } catch (e) {
      console.error("Bulk price update error:", e);
    }
  };

  const handleCollectUdhaar = async (udhaarId: string, amt: number) => {
    try {
      await apiClient.post('/api/udhaar/collect', { udhaarId, amountCollected: amt });
      const collectedAmount = Number(amt) || 0;
      if (collectedAmount > 0) {
        setSummary(prev => {
          const updated = {
            ...prev,
            todaySales: prev.todaySales + collectedAmount,
            todaySalesCount: prev.todaySalesCount + 1,
            pendingUdhaar: Math.max(0, prev.pendingUdhaar - collectedAmount)
          };
          try {
            localStorage.setItem('leadgerx_cached_summary', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
      await fetchAllData();
    } catch (e) {
      console.error("Collect Udhaar clearance Error:", e);
    }
  };

  const handleSendCoachMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };
    
    const updatedChats = [...chatLogs, userMsg];
    setChatLogs(updatedChats);
    setCoachLoading(true);

    try {
      const data = await apiClient.post('/api/ai/coach', { messages: updatedChats });
      if (data && data.reply) {
        setChatLogs([...updatedChats, data.reply]);
      }
    } catch (e) {
      console.error("Gemini coach connection error:", e);
    } finally {
      setCoachLoading(false);
    }
  };

  const handleSendManualWhatsAppReminder = (phone: string, textMessage: string) => {
    const escapedMsg = encodeURIComponent(textMessage);
    const mockWhatsAppUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${escapedMsg}`;
    window.open(mockWhatsAppUrl, '_blank');
  };

  // Navigation callbacks for quick dashboard CTA shortcuts
  const triggerQuickVoiceModal = () => {
    setActiveTab('entries');
    setTimeout(() => {
      const triggerBtn = document.getElementById('btn-voice-dictate-trigger');
      triggerBtn?.click();
    }, 150);
  };

  const triggerQuickBillModal = () => {
    setActiveTab('entries');
    setTimeout(() => {
      const triggerBtn = document.getElementById('btn-bill-scanner-trigger');
      triggerBtn?.click();
    }, 150);
  };

  const triggerQuickAddEntryModal = () => {
    setActiveTab('entries');
    setTimeout(() => {
      const triggerBtn = document.getElementById('btn-manual-add-trigger');
      triggerBtn?.click();
    }, 150);
  };

  // --- RENDERING ROUTER SYSTEM ---
  if (isLanding) {
    return <LandingPage onStartFree={handleStartFree} onLogin={() => setIsLanding(false)} />;
  }

  if (!isAuth) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} onBack={() => setIsLanding(true)} />;
  }

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 font-sans transition-colors" id="applet-viewport-root">
      {/* 1. Overlay backdrop for mobile/tablet sidebar drawer */}
      {device.isMobile && isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* 2. Responsive Collapsible finance navigation sidebar */}
      <div className={`
        ${device.isMobile 
          ? `fixed inset-y-0 left-0 z-50 transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out w-64 shadow-2xl` 
          : 'hidden md:block w-64 shrink-0'
        }
      `}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (device.isMobile) {
              setIsMobileSidebarOpen(false);
            }
          }} 
          user={user} 
          onLogout={handleLogout} 
        />
      </div>

      {/* 3. Operations visual viewport split */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          storeName={stores.find(s => s.id === activeStoreId)?.name || user?.storeName || "My Store"} 
          lowStockCount={summary.lowStockCount} 
          pendingUdhaar={summary.pendingUdhaar} 
          isOnline={isOnline}
          offlineCount={offlineCount}
          stores={stores}
          activeStoreId={activeStoreId}
          onStoreSwitch={setActiveStoreId}
          onAddStore={handleAddStoreHandler}
          userName={user?.name}
          userPlan={user?.plan}
          isMobile={device.isMobile}
          deviceType={device.deviceType}
          isTouch={device.isTouch}
          onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />

        <div className={`flex-1 overflow-y-auto ${device.isMobile ? 'pb-20' : ''}`}>
          <ErrorBoundary componentName="Main View" onReset={() => setActiveTab('dashboard')}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeTab === 'dashboard' && (
                  <DashboardView 
                    summary={summary} 
                    inventory={inventory} 
                    customers={customers} 
                    entries={entries}
                    setActiveTab={setActiveTab}
                    onQuickVoiceLog={triggerQuickVoiceModal}
                    onQuickBillScanner={triggerQuickBillModal}
                    onQuickAddEntry={triggerQuickAddEntryModal}
                    user={user}
                  />
                )}

                {activeTab === 'entries' && (
                  <EntriesView 
                    entries={entries} 
                    inventory={inventory}
                    onAddEntry={handleAddEntry} 
                    onDeleteEntry={handleDeleteEntry} 
                  />
                )}

                {activeTab === 'customers' && (
                  <CustomersView 
                    customers={customers} 
                    onAddCustomer={handleAddCustomer} 
                    onSendReminder={handleSendManualWhatsAppReminder} 
                    storeName={stores.find(s => s.id === activeStoreId)?.name || user?.storeName}
                    onReassessRisk={async (id) => {
                      try {
                        const data = await apiClient.post(`/api/ai/customer-risk/${id}`);
                        if (data && data.customer) {
                          await fetchAllData();
                          return data.customer;
                        }
                      } catch (err) {
                        console.error("Failed requesting AI risk reassessment:", err);
                      }
                    }}
                  />
                )}

                {activeTab === 'inventory' && (
                  <InventoryView 
                    inventory={inventory} 
                    onAddItem={handleAddInventoryItem} 
                    onBulkAddItems={handleBulkAddInventoryItems}
                    onBulkDelete={handleBulkDeleteInventory}
                    onBulkUpdateCategory={handleBulkUpdateCategory}
                    onBulkPriceUpdate={handleBulkPriceUpdate}
                    storeName={stores.find(s => s.id === activeStoreId)?.name || user?.storeName}
                    userName={user?.name}
                  />
                )}

                {activeTab === 'udhaar' && (
                  <UdhaarLedgerView 
                    udhaarRecords={udhaar} 
                    onCollectUdhaar={handleCollectUdhaar} 
                  />
                )}

                {activeTab === 'coach' && (
                  <CoachView 
                    chatLogs={chatLogs} 
                    onSendMessage={handleSendCoachMessage} 
                    loading={coachLoading} 
                  />
                )}

                {activeTab === 'settings' && (
                  <SettingsView 
                    user={user} 
                    onSaveSettings={handleSaveSettings} 
                    onDeleteAccount={handleDeleteAccount} 
                    template={invoiceTemplate}
                    onSaveTemplate={handleSaveInvoiceTemplate}
                  />
                )}

                {activeTab === 'audit' && (
                  <AuditLogsView
                    logs={auditLogs}
                    onRefreshLogs={fetchAuditLogs}
                    isRefreshing={isRefreshingLogs}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </div>
      </div>

      {/* 4. Elegant Sticky Mobile Bottom Navigation Dock */}
      {device.isMobile && (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 pb-safe z-30 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]" id="mobile-bottom-dock">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'dashboard' ? 'text-black scale-105' : 'text-slate-450 hover:text-black'
            }`}
          >
            <LayoutDashboard className={`h-5 w-5 mb-0.5 ${activeTab === 'dashboard' ? 'text-emerald-500 stroke-[2.5px]' : 'text-slate-400'}`} />
            <span className={`text-[9px] tracking-tight leading-none ${activeTab === 'dashboard' ? 'font-bold text-slate-900' : 'text-slate-500 font-medium'}`}>Home</span>
          </button>

          <button
            onClick={() => setActiveTab('entries')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'entries' ? 'text-black scale-105' : 'text-slate-450 hover:text-black'
            }`}
          >
            <ReceiptText className={`h-5 w-5 mb-0.5 ${activeTab === 'entries' ? 'text-emerald-500 stroke-[2.5px]' : 'text-slate-400'}`} />
            <span className={`text-[9px] tracking-tight leading-none ${activeTab === 'entries' ? 'font-bold text-slate-900' : 'text-slate-500 font-medium'}`}>Entries</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'inventory' ? 'text-black scale-105' : 'text-slate-450 hover:text-black'
            }`}
          >
            <Package className={`h-5 w-5 mb-0.5 ${activeTab === 'inventory' ? 'text-emerald-500 stroke-[2.5px]' : 'text-slate-400'}`} />
            <span className={`text-[9px] tracking-tight leading-none ${activeTab === 'inventory' ? 'font-bold text-slate-900' : 'text-slate-500 font-medium'}`}>Store</span>
          </button>

          <button
            onClick={() => setActiveTab('udhaar')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === 'udhaar' ? 'text-black scale-105' : 'text-slate-450 hover:text-black'
            }`}
          >
            <CreditCard className={`h-5 w-5 mb-0.5 ${activeTab === 'udhaar' ? 'text-emerald-500 stroke-[2.5px]' : 'text-slate-400'}`} />
            <span className={`text-[9px] tracking-tight leading-none ${activeTab === 'udhaar' ? 'font-bold text-slate-900' : 'text-slate-500 font-medium'}`}>Udhaar</span>
          </button>

          <button
            onClick={() => setIsMobileSidebarOpen(prev => !prev)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isMobileSidebarOpen ? 'text-black scale-105' : 'text-slate-450 hover:text-black'
            }`}
          >
            <Menu className={`h-5 w-5 mb-0.5 ${isMobileSidebarOpen ? 'text-emerald-500 stroke-[2.5px]' : 'text-slate-400'}`} />
            <span className={`text-[9px] tracking-tight leading-none ${isMobileSidebarOpen ? 'font-bold text-slate-900' : 'text-slate-500 font-medium'}`}>Menu</span>
          </button>
        </div>
      )}
    </div>
  );
}
