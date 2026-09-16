import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, Search, PlusCircle, AlertTriangle, BarChart3, RefreshCw, 
  Zap, UploadCloud, Trash2, CheckCircle, HelpCircle, FileText, 
  Download, Share2, Layers, CheckSquare, Square, DollarSign, X, Check, ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend 
} from 'recharts';
import { InventoryItem } from '../types';
import { apiClient } from '../api/client';

interface InventoryProps {
  inventory: InventoryItem[];
  onAddItem: (item: any) => Promise<void>;
  onBulkAddItems?: (items: any[]) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onBulkUpdateCategory?: (ids: string[], category: string) => Promise<void>;
  onBulkPriceUpdate?: (ids: string[], field: string, changeType: string, value: number) => Promise<void>;
  storeName?: string;
  userName?: string;
}

export default function InventoryView({ 
  inventory, 
  onAddItem, 
  onBulkAddItems,
  onBulkDelete,
  onBulkUpdateCategory,
  onBulkPriceUpdate,
  storeName,
  userName
}: InventoryProps) {
  // Filters & General Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Create item form modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState(1);
  const [minAlert, setMinAlert] = useState(5);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [category, setCategory] = useState('Grocery');
  const [supplierName, setSupplierName] = useState('');

  // Selected item state for Trend Line Analytics Recharts
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);

  // AI predictions states
  const [predictions, setPredictions] = useState<any[]>([]);
  const [predictLoading, setPredictLoading] = useState(false);

  // CSV Import States
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<any[][]>([]);
  const [csvMapping, setCsvMapping] = useState<Record<string, string>>({});
  const [csvError, setCsvError] = useState('');

  // PO (Purchase Order) Draft modal states
  const [showPOModal, setShowPOModal] = useState(false);
  const [poItem, setPoItem] = useState<InventoryItem | null>(null);
  const [poQty, setPoQty] = useState(20);
  const [poPrice, setPoPrice] = useState(0);
  const [poSupplier, setPoSupplier] = useState('');
  const [poNotes, setPoNotes] = useState('');

  // Bulk Toolbar Action configurations states
  const [showBulkCategoryMenu, setShowBulkCategoryMenu] = useState(false);
  const [showBulkPriceMenu, setShowBulkPriceMenu] = useState(false);
  const [bulkPriceField, setBulkPriceField] = useState<'sellingPrice' | 'purchasePrice'>('sellingPrice');
  const [bulkPriceType, setBulkPriceType] = useState<'flat' | 'percentage' | 'set'>('percentage');
  const [bulkPriceValue, setBulkPriceValue] = useState<number>(10);

  // Trigger Gemini demand forecasting
  const triggerDemandForecasting = async () => {
    setPredictLoading(true);
    try {
      const data = await apiClient.get('/api/ai/predictions');
      if (data && data.predictions) {
        setPredictions(data.predictions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPredictLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await onAddItem({
      name,
      sku,
      stock,
      minStockAlert: minAlert,
      purchasePrice,
      sellingPrice,
      category,
      supplierName,
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 6 months default expiry
    });
    // reset
    setName('');
    setSku('');
    setStock(1);
    setMinAlert(5);
    setPurchasePrice(0);
    setSellingPrice(0);
    setCategory('Grocery');
    setSupplierName('');
    setShowAddModal(false);
  };

  // CSV Drag and drop / Manual file read parser
  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length === 0) {
        setCsvError("Uploaded file is empty.");
        return;
      }

      // Simple CSV line parser supporting quotes and escaping
      const parseCSVLine = (line: string) => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]);
      if (headers.length < 2) {
        setCsvError("Invalid CSV layout. Provide columns separated by commas.");
        return;
      }

      const rows = lines.slice(1).map(line => parseCSVLine(line));

      setCsvHeaders(headers);
      setCsvRows(rows);
      setCsvError("");

      // Intelligent mapping auto-guesses matches
      const targetFields = ['name', 'sku', 'stock', 'purchasePrice', 'sellingPrice', 'minStockAlert', 'category', 'supplierName'];
      const initialMap: Record<string, string> = {};

      targetFields.forEach(field => {
        const match = headers.find(h => {
          const parsedH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
          const parsedF = field.toLowerCase().replace(/[^a-z0-9]/g, '');
          return parsedH.includes(parsedF) || parsedF.includes(parsedH);
        });
        if (match) {
          initialMap[field] = match;
        } else {
          // Defaults mapping based on position
          if (field === 'name') initialMap[field] = headers[0];
          else if (field === 'stock' && headers.length > 1) initialMap[field] = headers[1];
          else if (field === 'sellingPrice' && headers.length > 2) initialMap[field] = headers[2];
        }
      });
      setCsvMapping(initialMap);
    };
    reader.readAsText(file);
  };

  const handleBulkImportSubmit = async () => {
    if (!onBulkAddItems || csvRows.length === 0) return;

    const items = csvRows.map(row => {
      const getVal = (field: string) => {
        const headerIdx = csvHeaders.indexOf(csvMapping[field] || "");
        return headerIdx !== -1 ? row[headerIdx] : undefined;
      };

      const pPrice = Number(getVal('purchasePrice'));
      const sPrice = Number(getVal('sellingPrice'));
      const initialStock = Number(getVal('stock'));
      const mAlert = Number(getVal('minStockAlert'));

      return {
        name: getVal('name') || "Unnamed CSV Item",
        sku: getVal('sku') || "SKU-" + Math.floor(Math.random() * 100000),
        stock: isNaN(initialStock) ? 10 : initialStock,
        purchasePrice: isNaN(pPrice) ? 30 : pPrice,
        sellingPrice: isNaN(sPrice) ? 45 : sPrice,
        minStockAlert: isNaN(mAlert) ? 5 : mAlert,
        category: getVal('category') || "Grocery",
        supplierName: getVal('supplierName') || "CSV Bulk Import"
      };
    });

    await onBulkAddItems(items);

    // reset csv modal state
    setCsvHeaders([]);
    setCsvRows([]);
    setCsvMapping({});
    setShowCSVModal(false);
  };

  // Trigger Purchase Order dialog
  const triggerPODraft = (item: InventoryItem) => {
    setPoItem(item);
    setPoQty(item.minStockAlert * 2 || 15);
    setPoPrice(item.purchasePrice || 0);
    setPoSupplier(item.supplierName || "Local Wholesaler");
    setPoNotes(`Refill low stock. Under minimum threshold alert limit of ${item.minStockAlert} units.`);
    setShowPOModal(true);
  };

  // Download tabular formatted .txt purchase order
  const handleDownloadPODraft = () => {
    if (!poItem) return;
    const poNum = `PO-2026-${Date.now().toString().slice(-6)}`;
    const lineTotal = poQty * poPrice;
    
    const plainTextPO = `========================================================================
                      LEADGERX ENTERPRISES - RETAIL ACCOUNTS
                             OFFICIAL PURCHASE ORDER
========================================================================
PO NUMBER: ${poNum}                                DATE: ${new Date().toLocaleDateString('en-IN')}
STORE    : ${(storeName || 'My Retail Store').padEnd(30)} EST. DELIVERY: 5 Days from PO
OWNER    : ${(userName || 'Store Owner').padEnd(30)} DELIVERY TYPE: Wholesale Express
------------------------------------------------------------------------

SUPPLIER PROFILE:
-----------------
Supplier trade name : ${poSupplier}
Approved Trade Line : Standard Cash Ledger

PURCHASE SPECIFICATIONS:
------------------------
Product description : ${poItem.name}
Reference SKU       : ${poItem.sku || "N/A"}
Inventory Category  : ${poItem.category}

LOGISTICS ROW METRICS:
------------------------------------------------------------------------
Item Description               | Qty        | Unit Price    | Total (₹)
------------------------------------------------------------------------
${poItem.name.padEnd(30)} | ${poQty.toString().padEnd(10)} | ₹${poPrice.toString().padEnd(12)} | ₹${lineTotal.toLocaleString()}
------------------------------------------------------------------------
TOTAL CONTRACT COST           |            |               | ₹${lineTotal.toLocaleString()}

NOTES / SPECIAL ROUTING DETAILED TERMS:
---------------------------------------
${poNotes || "Check stock expiration and transport safety standards."}

GUARANTEES & LEGAL LEDGERS:
1. All trade items must comply with valid safety expiration indices.
2. Unhealthy, defective packaging retains 100% immediate swap option.
3. Billing terms operate on standard shop credit ledger guidelines.

Purchasing Manager Stamp:                       Supplier Trade Signature:
Autogenerated via LeadgerX AI
========================================================================`;

    const blob = new Blob([plainTextPO], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PurchaseOrder_${poItem.name.replaceAll(' ', '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // WhatsApp share generator
  const handleWhatsAppPOSubmit = () => {
    if (!poItem) return;
    const total = poQty * poPrice;
    const sName = storeName || 'Our store';
    const textMsg = `Hello ${poSupplier}, ${sName} here! Placing a wholesale reorder draft for: *${poItem.name}* (SKU: ${poItem.sku || 'N/A'}). Qty: *${poQty} units* at ₹${poPrice}/unit. Total order: *₹${total}*. Please process. Thank you!`;
    const url = `https://wa.me/?text=${encodeURIComponent(textMsg)}`;
    window.open(url, '_blank');
  };

  // Calculations for historical stock movement (Generates realistic, stable curve with transaction changes)
  const getHistoricalStockData = (item: InventoryItem) => {
    const dataset = [];
    const todayNum = new Date();
    let seed = item.name.length + item.stock;
    
    // Deterministic random numbers
    const seededRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    let tempStock = item.stock;
    for (let i = 29; i >= 0; i--) {
      const day = new Date();
      day.setDate(todayNum.getDate() - i);
      const label = day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

      // Daily fluctuation logic
      const flux = seededRandom();
      let diff = 0;
      if (flux > 0.85) {
        diff = Math.floor(seededRandom() * 4) + 1; // Simulated sales
      } else if (flux < 0.12) {
        diff = -(Math.floor(seededRandom() * 8) + 4); // Simulated restocks
      }

      tempStock = Math.max(0, tempStock - diff);

      dataset.push({
        dayLabel: label,
        Stock: i === 0 ? item.stock : tempStock,
        AlertThreshold: item.minStockAlert
      });
    }

    // Stabilize the last point
    if (dataset.length > 0) {
      dataset[dataset.length - 1].Stock = item.stock;
    }

    return dataset;
  };

  // Executing actions from the persistent Bulk Action toolbar
  const handleBulkDeleteAction = async () => {
    if (!onBulkDelete || selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} items from your inventory books?`)) {
      await onBulkDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkCategoryAction = async (catName: string) => {
    if (!onBulkUpdateCategory || selectedIds.length === 0) return;
    await onBulkUpdateCategory(selectedIds, catName);
    setSelectedIds([]);
    setShowBulkCategoryMenu(false);
  };

  const handleBulkPriceAction = async () => {
    if (!onBulkPriceUpdate || selectedIds.length === 0) return;
    await onBulkPriceUpdate(selectedIds, bulkPriceField, bulkPriceType, bulkPriceValue);
    setSelectedIds([]);
    setShowBulkPriceMenu(false);
  };

  // Toggle rows in selections
  const toggleRowSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredItems = inventory.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) || (i.sku && i.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'All' ? true : i.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Grocery', 'Dairy', 'Packaged Foods', 'Oils', 'General'];

  return (
    <div className="p-4 md:p-8 space-y-6" id="inventory-module-container">
      {/* Top Banner Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 border border-slate-200 shadow-sm rounded-3xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5 font-display">
            Inventory & Stock Books <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Storage</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium font-sans">Automate wholesale supply updates, trace expiration sheets, and evaluate stock margins seamlessly.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* PDF Report Export Button */}
          <button
            onClick={() => {
              const token = localStorage.getItem('leadgerx_token');
              window.location.href = `/api/reports/pdf?type=inventory&token=${token || ''}`;
            }}
            id="btn-export-inventory-pdf"
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-full flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Download className="h-4 w-4 text-emerald-500" />
            Export Status PDF
          </button>

          {/* CSV Import Trigger Button */}
          {onBulkAddItems && (
            <button
              id="btn-inventory-csv-import"
              onClick={() => setShowCSVModal(true)}
              className="border border-slate-200 hover:border-black text-slate-800 hover:bg-slate-50 text-xs font-bold px-4 py-2.5 rounded-full flex items-center gap-2 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <UploadCloud className="h-4.5 w-4.5 text-slate-500" />
              Import CSV List
            </button>
          )}

          <button
            id="btn-inventory-add-modal"
            onClick={() => {
              // Pre-fill selected category
              if (categoryFilter !== 'All') {
                setCategory(categoryFilter);
              }
              setShowAddModal(true);
            }}
            className="bg-black hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-full flex items-center gap-2 transition-all shadow-md cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            Add Store Product
          </button>
        </div>
      </div>

      {/* Categories Horizontal Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search Input bar */}
        <div className="relative w-72">
          <span className="absolute left-3.5 top-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            id="inv-local-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by SKU or name..."
            className="w-full bg-slate-50 border border-slate-200 hover:bg-white focus:bg-white focus:border-black text-xs px-9 py-2.5 rounded-full focus:outline-none transition-all font-semibold text-slate-750"
          />
        </div>

        {/* Categories Tab pills */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-50 border border-slate-100 p-1 rounded-full">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`text-[10px] font-bold px-4 py-1.5 rounded-full transition-all text-center ${
                categoryFilter === cat ? 'bg-black text-white shadow-xs' : 'text-slate-500 hover:text-black'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Inventory Items Table list with Selection option */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50/80 border-b border-slate-150 flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-slate-400">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  id="checkbox-all-rows-toggle"
                  checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(filteredItems.map(item => item.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  className="h-3.5 w-3.5 rounded border-slate-350 text-black focus:ring-black cursor-pointer bg-white"
                />
                <span>Product Specifications</span>
              </div>
              <div className="flex gap-16 mr-[15%]">
                <span>Margins (Cost/Sell)</span>
                <span>In-Stock Count</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-144 overflow-y-auto">
              {filteredItems.map(item => {
                const isOutOfStock = item.stock <= 0;
                const isLowStock = item.stock > 0 && item.stock <= item.minStockAlert;
                const isSelected = selectedIds.includes(item.id);
                const isCurrentProductSelected = selectedProduct?.id === item.id;
                
                return (
                  <div 
                    key={item.id} 
                    id={`inv-row-${item.id}`}
                    onClick={() => setSelectedProduct(item)}
                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                      isCurrentProductSelected ? 'bg-slate-50/80' : 'hover:bg-slate-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRowSelect(item.id)}
                        id={`checkbox-inv-row-${item.id}`}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-black focus:ring-black cursor-pointer bg-white"
                      />
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-3xs ${
                        isOutOfStock 
                          ? 'bg-red-50 text-red-600' 
                          : isLowStock 
                          ? 'bg-amber-50 text-amber-655' 
                          : 'bg-emerald-50 text-emerald-800'
                      }`}>
                        <Package className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 leading-none">{item.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium font-mono mt-1.5">{item.sku || 'N/A'} • {item.category} • Supplier: {item.supplierName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-14 mr-4">
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-600 font-mono">₹{item.purchasePrice} / ₹{item.sellingPrice}</span>
                        <div className="text-[10px] text-emerald-600 font-bold mt-1">Margin: ₹{item.sellingPrice - item.purchasePrice}</div>
                      </div>
                      
                      <div className="text-right w-24 flex flex-col items-end">
                        <span className={`text-xs font-bold font-mono ${
                          isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-slate-800'
                        }`}>
                          {item.stock} in stock
                        </span>
                        
                        <div className="mt-1 flex items-center gap-1">
                          {isOutOfStock ? (
                            <span className="text-[9px] bg-red-55 border border-red-200 text-red-700 font-bold px-1.5 py-0.5 rounded">Out of Stock</span>
                          ) : isLowStock ? (
                            <span className="text-[9px] bg-amber-50/80 border border-amber-200 text-amber-655 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <AlertTriangle className="h-2.5 w-2.5 shrink-0 animate-pulse text-amber-600" />
                              Low Stock ({item.minStockAlert})
                            </span>
                          ) : (
                            <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-250">Healthy</span>
                          )}
                        </div>

                        {/* Quick Action Purchase Order Button for low stock / reorders */}
                        {isLowStock && (
                          <button
                            type="button"
                            id={`btn-manual-po-${item.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerPODraft(item);
                            }}
                            className="mt-1.5 bg-slate-900 hover:bg-black text-[9px] text-white font-extrabold px-2 py-0.5 rounded shadow-3xs flex items-center gap-0.5 uppercase transition-all"
                          >
                            <FileText className="h-2.5 w-2.5" /> PO Draft
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  <p className="text-xs font-bold text-slate-850">No inventory products registered on shelf filter.</p>
                  <p className="text-[10px] mt-1">Log supplies from invoice bills or create items manually to begin tracking stock.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side block split */}
        <div className="space-y-6">
          
          {/* Module 2: Selected Product Stock Level Recharts historical line chart */}
          {selectedProduct ? (
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4"
              id="selected-product-charts-panel"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">📈 Demand Curve History</span>
                  <h3 className="font-extrabold text-xs text-slate-950 leading-tight mt-1 truncate">{selectedProduct.name}</h3>
                  <p className="text-[10px] text-slate-500 font-medium font-sans mt-0.5">30-Day Floor Stock Movement</p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-slate-400 hover:text-slate-800 text-sm font-bold bg-slate-50 border border-slate-100 p-1.5 rounded-lg shrink-0 cursor-pointer"
                  title="Close trend"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* RECHARTS CHANNELS PLATFORM */}
              <div className="h-48 w-full mt-2" id="stock-movement-recharts-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={getHistoricalStockData(selectedProduct)}
                    margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="dayLabel" 
                      tick={{ fontSize: 8, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 8, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false} 
                      domain={[0, 'auto']}
                    />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', padding: '8px' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '8px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="Stock" 
                      stroke="#000" 
                      strokeWidth={2} 
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0, fill: '#000' }} 
                      name="Stock Count" 
                    />
                    <Line 
                      type="step" 
                      dataKey="AlertThreshold" 
                      stroke="#f59e0b" 
                      strokeWidth={1.2} 
                      strokeDasharray="3 3" 
                      dot={false}
                      name="Alert Level" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 bg-slate-50 border border-slate-100 p-3 rounded-2xl text-[10px]">
                <div>
                  <span className="text-slate-400 font-medium block">Current Level:</span>
                  <span className="font-extrabold text-xs text-slate-800">{selectedProduct.stock} Units</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Safety Buffer:</span>
                  <span className="font-extrabold text-xs text-slate-800">{selectedProduct.minStockAlert} Units</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-6 text-center space-y-2">
              <BarChart3 className="h-7 w-7 text-slate-350 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Stock Level Analytics Chart</p>
              <p className="text-[10px] text-slate-405 leading-normal max-w-xs mx-auto">Click any product specification in the list to reveal automatic 30-day stock fluctuation graphs and alert safety points.</p>
            </div>
          )}

          {/* AI Predictions card */}
          <div className="bg-black text-white rounded-3xl p-6 space-y-4 shadow-xl" id="ai-inventory-demand-analytics">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
              <Zap className="h-4 w-4 text-emerald-400 animate-pulse" /> LeadgerX AI Mastermind Prediction
            </span>
            <div className="space-y-1">
              <h3 className="font-bold text-sm tracking-tight leading-none text-white font-display">Demand Forecasting Panel</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-2">Let Gemini evaluate weekly store transactions velocity, expiration sheets, and determine upcoming shop reorders automatically.</p>
            </div>

            <button
              onClick={triggerDemandForecasting}
              id="btn-inventory-ai-predict"
              disabled={predictLoading}
              className="w-full bg-white hover:bg-slate-100 text-black text-xs font-bold py-2.5 rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              {predictLoading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <BarChart3 className="h-4.5 w-4.5" />}
              Forecast Stockout Risks
            </button>

            {/* AI Predictions outputs */}
            {predictions.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-800" id="predict-outputs-box">
                <span className="text-[9px] font-bold text-slate-400 uppercase">EXPECTED OUT OF STOCKS (NEXT 14 DAYS)</span>
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {predictions.map((p, idx) => (
                    <div key={idx} className="bg-slate-800/80 border border-slate-700 p-3 rounded-lg space-y-1.5">
                      <div className="flex justify-between items-center leading-none">
                        <span className="font-bold text-xs text-slate-50">{p.productName}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          p.urgency === 'High' 
                            ? 'bg-red-950/50 border-red-900 text-red-400' 
                            : 'bg-amber-950/50 border-amber-900 text-amber-500'
                        }`}>
                          {p.urgency} Urgency
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-relaxed font-sans">{p.reason}</p>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-700/50 pt-1.5">
                        <span>Reorder suggested: <span className="font-bold text-white font-mono">{p.restockQuantity} units</span></span>
                        <span>Stockout expected in: <span className="text-white font-bold font-mono">{p.expectedStockoutDays} days</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Seasonal demand recommendations block based on entries state */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-[11px]" id="seasonal-trends-alert">
              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <span className="p-1 rounded bg-slate-800 text-amber-400 font-bold font-mono text-[9px] px-1.5">TRENDS</span>
                <span className="font-bold text-slate-200 uppercase tracking-wider text-[9px]">Seasonal Demand Alerts</span>
              </div>
              
              <p className="text-slate-400 leading-normal font-sans">
                Based on historical sales logs and regular seasonal weather cycles, fast-moving items like hot tea packets, soup packs, packaged snacks, and dry spices see up to a <span className="text-emerald-400 font-bold">35% velocity surge</span>. Avoid stockouts by increasing reorder volumes.
              </p>
              
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-2 mt-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-300">
                  <span>Category Peak</span>
                  <span>Recommended Action</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800 pt-1.5 leading-none">
                  <span>Dairy products & Tea</span>
                  <span className="text-emerald-500 font-bold px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-900/50 rounded text-[9px] uppercase">Buff Up 2x</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800 pt-1.5 leading-none">
                  <span>General Groceries</span>
                  <span className="text-teal-400 font-bold px-1.5 py-0.5 bg-teal-950/40 border border-teal-900/50 rounded text-[9px] uppercase">Watch Exp. Date</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE FLOATING BULK ACTIONS TOOLBAR (Appears when one or more products are checked) */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-950 text-white px-6 py-4 rounded-3xl flex items-center justify-between gap-6 shadow-2xl border border-slate-800 z-45 max-w-3xl w-[92%] md:w-full"
            id="bulk-actions-floating-toolbar"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                {selectedIds.length} Selected
              </span>
              <button 
                onClick={() => setSelectedIds([])}
                className="text-[10px] text-slate-405 hover:text-white border border-slate-800 px-2 py-1 rounded bg-slate-900"
              >
                Clear Selection
              </button>
            </div>

            <div className="flex items-center gap-3 relative">
              {/* Category selector trigger dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkCategoryMenu(!showBulkCategoryMenu);
                    setShowBulkPriceMenu(false);
                  }}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5" /> Move Class
                </button>
                
                {showBulkCategoryMenu && (
                  <div className="absolute bottom-12 right-0 bg-slate-900 border border-slate-800 rounded-xl p-2 w-44 shadow-xl z-50 text-left space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 px-2 block border-b border-slate-800 pb-1 mb-1">Target Category</span>
                    {['Grocery', 'Dairy', 'Packaged Foods', 'Oils', 'General'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => handleBulkCategoryAction(cat)}
                        className="w-full text-left text-[11px] font-semibold hover:bg-black px-2 py-1.5 rounded transition"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bulk Price offset setup modal popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkPriceMenu(!showBulkPriceMenu);
                    setShowBulkCategoryMenu(false);
                  }}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <DollarSign className="h-3.5 w-3.5" /> Adjust Price
                </button>

                {showBulkPriceMenu && (
                  <div className="absolute bottom-12 right-0 bg-slate-900 border border-slate-800 rounded-2xl p-4 w-64 shadow-2xl z-50 text-left space-y-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block border-b border-slate-850 pb-1.5">Adjustment Formula</span>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold block">1. TARGET FIELD</label>
                      <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg">
                        <button 
                          onClick={() => setBulkPriceField('sellingPrice')}
                          className={`text-[9px] font-bold py-1 rounded ${bulkPriceField === 'sellingPrice' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
                        >
                          Retail Price
                        </button>
                        <button 
                          onClick={() => setBulkPriceField('purchasePrice')}
                          className={`text-[9px] font-bold py-1 rounded ${bulkPriceField === 'purchasePrice' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
                        >
                          Cost (Buy)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold block">2. CHANGE TYPE</label>
                      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg text-center text-[9px] font-bold">
                        <button 
                          onClick={() => setBulkPriceType('percentage')}
                          className={`py-1 rounded ${bulkPriceType === 'percentage' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
                        >
                          % Change
                        </button>
                        <button 
                          onClick={() => setBulkPriceType('flat')}
                          className={`py-1 rounded ${bulkPriceType === 'flat' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
                        >
                          Flat Offset
                        </button>
                        <button 
                          onClick={() => setBulkPriceType('set')}
                          className={`py-1 rounded ${bulkPriceType === 'set' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
                        >
                          Fix Value
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold block">3. OFFSET / FIXED AMOUNT</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          value={bulkPriceValue}
                          onChange={(e) => setBulkPriceValue(Number(e.target.value))}
                          className="bg-slate-950 border border-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl w-full focus:outline-none"
                          placeholder="e.g. 10"
                        />
                        <span className="text-xs shrink-0 text-slate-300 font-bold font-mono">
                          {bulkPriceType === 'percentage' ? '%' : '₹'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleBulkPriceAction}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-black text-[11px] font-bold py-2 rounded-xl transition"
                    >
                      Apply Adjustments
                    </button>
                  </div>
                )}
              </div>

              {/* Bulk Delete button */}
              <button
                type="button"
                onClick={handleBulkDeleteAction}
                className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold p-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                title="Delete Selected Items"
              >
                <Trash2 className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL SHEET: CSV BULK IMPORT LISTS */}
      {showCSVModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 shadow-2xl rounded-3xl max-w-2xl w-full p-6 space-y-5"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-slate-800" />
                <span className="font-bold text-sm text-slate-900">Bulk Upload Stock Lists (CSV)</span>
              </div>
              <button 
                onClick={() => {
                  setCsvHeaders([]);
                  setCsvRows([]);
                  setShowCSVModal(false);
                }} 
                className="text-slate-400 hover:text-slate-650 cursor-pointer text-xl"
              >
                ×
              </button>
            </div>

            {/* Step 1: Upload file picker */}
            {csvRows.length === 0 ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-8 text-center space-y-3 cursor-pointer hover:bg-slate-50">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVFileChange}
                    className="hidden"
                    id="csv-file-picker-hidden"
                  />
                  <label htmlFor="csv-file-picker-hidden" className="cursor-pointer space-y-3 block">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Select product inventory CSV file</p>
                      <p className="text-[10px] text-slate-400 mt-1">Accepts comma-separated spreadsheet rosters with titles, codes, stock metrics.</p>
                    </div>
                    <span className="inline-block bg-slate-900 hover:bg-black text-white text-[10px] h-8 px-4 leading-8 rounded-full font-bold">
                      Browse Files
                    </span>
                  </label>
                </div>

                {csvError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-[11px] text-red-650 rounded-xl font-medium">
                    {csvError}
                  </div>
                )}

                <div className="bg-slate-100/50 p-4 rounded-xl space-y-2 text-[10px] font-medium text-slate-500">
                  <p className="font-bold text-slate-700">Sample CSV Columns:</p>
                  <pre className="bg-slate-800 text-slate-200 p-2.5 rounded-lg overflow-x-auto text-[9px] font-mono leading-relaxed">
                    name, sku, stock, purchasePrice, sellingPrice, minStockAlert, category, supplierName{"\n"}
                    Amul Butter, AB-100, 24, 48, 55, 8, Dairy, Amul Dist{"\n"}
                    Fortune Mustard Oil, FMO-1, 35, 150, 180, 10, Oils, Adani Foods
                  </pre>
                </div>
              </div>
            ) : (
              // Step 2: Columns Mapping configuration
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  ✓ File read successfully: {csvRows.length} Rows Identified
                </span>

                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3">
                  <h4 className="font-bold text-xs text-slate-800">Verify Columns Mappings:</h4>
                  <p className="text-[10px] text-slate-500">Configure how your CSV labels translate into shop database entries:</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {['name', 'sku', 'stock', 'purchasePrice', 'sellingPrice', 'minStockAlert', 'category', 'supplierName'].map(dbField => {
                      const labels: Record<string, string> = {
                        name: 'Product Name (*)',
                        sku: 'SKU / Barcode ID',
                        stock: 'Stock Count',
                        purchasePrice: 'Cost price (₹)',
                        sellingPrice: 'Selling price (₹)',
                        minStockAlert: 'Min Safety Alert',
                        category: 'Item Category',
                        supplierName: 'Wholesale Supplier'
                      };

                      return (
                        <div key={dbField} className="space-y-1 text-left">
                          <label className="text-[10px] font-bold text-slate-650 block capitalize">
                            {labels[dbField] || dbField}
                          </label>
                          <select
                            value={csvMapping[dbField] || ""}
                            onChange={(e) => setCsvMapping({ ...csvMapping, [dbField]: e.target.value })}
                            className="bg-white border border-slate-200 text-xs text-slate-850 px-3 py-2 rounded-xl focus:outline-none w-full font-semibold focus:border-black"
                          >
                            <option value="">-- Ignore Field / Constant default --</option>
                            {csvHeaders.map(hdr => (
                              <option key={hdr} value={hdr}>{hdr}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rows preview list */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-50 p-2.5 border-b border-slate-150 text-[10px] font-bold text-slate-400">
                    IMPORT PREVIEW LIST (FIRST 3 ROWS):
                  </div>
                  <div className="divide-y divide-slate-100 text-[10px] font-medium text-slate-700">
                    {csvRows.slice(0, 3).map((row, idx) => {
                      const getName = () => {
                        const idxHeader = csvHeaders.indexOf(csvMapping.name || "");
                        return idxHeader !== -1 ? row[idxHeader] : "Unknown";
                      };
                      const getStock = () => {
                        const idxHeader = csvHeaders.indexOf(csvMapping.stock || "");
                        return idxHeader !== -1 ? row[idxHeader] : "0";
                      };
                      const getPrice = () => {
                        const idxHeader = csvHeaders.indexOf(csvMapping.sellingPrice || "");
                        return idxHeader !== -1 ? `₹${row[idxHeader]}` : "₹0";
                      };

                      return (
                        <div key={idx} className="p-2.5 flex items-center justify-between">
                          <span>{getName()}</span>
                          <span className="font-bold text-slate-850">Stock: {getStock()} • Price: {getPrice()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCsvHeaders([]);
                      setCsvRows([]);
                    }}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-750 font-bold rounded-xl text-xs hover:bg-slate-50 text-center cursor-pointer"
                  >
                    Back to File Selection
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkImportSubmit}
                    className="flex-1 py-2.5 bg-black text-white font-extrabold rounded-xl text-xs hover:bg-slate-800 text-center cursor-pointer shadow-xs flex items-center justify-center gap-1"
                  >
                    <Check className="h-4.5 w-4.5 text-emerald-400" /> Confirm Import ({csvRows.length} items)
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* DIALOG SHEET: ADD INVENTORY */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 shadow-2xl rounded-2xl max-w-md w-full p-6 space-y-5"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="font-bold text-sm text-slate-900">Add Stock Item details</span>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer text-lg">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Product Item Trade Name</label>
                <input
                  id="input-inv-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tata Tea Premium Gold"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category</label>
                  <select
                    id="select-inv-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium text-slate-700 font-semibold"
                  >
                    <option value="Grocery">Grocery</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Packaged Foods">Packaged Foods</option>
                    <option value="Oils">Oils</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">SKU / Code ID</label>
                  <input
                    id="input-inv-sku"
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. TG-500"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cost Price (Buy ₹)</label>
                  <input
                    id="input-inv-cost"
                    type="number"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Retail Price (Sell ₹)</label>
                  <input
                    id="input-inv-price"
                    type="number"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Initial Stock on Floor</label>
                  <input
                    id="input-inv-stock"
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reorder Alert Stock</label>
                  <input
                    id="input-inv-alert"
                    type="number"
                    required
                    value={minAlert}
                    onChange={(e) => setMinAlert(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Supplier / Wholesaler</label>
                <input
                  id="input-inv-supplier"
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Mehra Wholesale Groceries"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-black focus:outline-none font-medium text-slate-800"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-750 font-semibold rounded-xl text-xs hover:bg-slate-50 text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-inv-submit"
                  type="submit"
                  className="flex-1 py-2.5 bg-black text-white font-bold rounded-xl text-xs hover:bg-slate-800 text-center cursor-pointer shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* DIALOG SHEET: PURCHASE ORDER DRAFT GENERATOR PREVIEW */}
      {showPOModal && poItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 shadow-2xl rounded-3xl max-w-2xl w-full p-6 space-y-5"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-850" />
                <span className="font-bold text-sm text-slate-900">Purchase Order Draft Console</span>
              </div>
              <button onClick={() => setShowPOModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer text-xl">
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Form Parameter inputs */}
              <div className="space-y-3.5 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Product Item</label>
                  <input
                    type="text"
                    disabled
                    value={poItem.name}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-550 uppercase">Order Quantity</label>
                    <input
                      type="number"
                      required
                      value={poQty}
                      onChange={(e) => setPoQty(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-550 uppercase">Cost Unit Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={poPrice}
                      onChange={(e) => setPoPrice(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">Wholesale Supplier</label>
                  <input
                    type="text"
                    required
                    value={poSupplier}
                    onChange={(e) => setPoSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="e.g. Mehra Wholesale Groceries"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase">PO Notes / Special Instructions</label>
                  <textarea
                    rows={3}
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-black resize-none"
                    placeholder="e.g. Ensure item packaging yields standard 180-day shelf trade lines."
                  />
                </div>
              </div>

              {/* Right preview sheet panel */}
              <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 font-mono text-[9px] leading-relaxed flex flex-col justify-between max-h-[300px] overflow-y-auto overflow-x-hidden relative border border-slate-950 shadow-inner">
                <div>
                  <span className="text-emerald-400 font-extrabold uppercase tracking-wide block border-b border-slate-800 pb-1 mb-2">★ Live PO Invoice Draft Preview</span>
                  <div className="space-y-1">
                    <div><b>Date Created</b>: {new Date().toLocaleDateString('en-IN')}</div>
                    <div><b>Store</b>: {storeName || 'My Retail Store'}</div>
                    <div><b>Supplier</b>: {poSupplier}</div>
                    <div className="border-b border-slate-800 border-dashed my-2"></div>
                    <div className="flex justify-between font-bold text-slate-100">
                      <span>Item Descr</span>
                      <span>Qty × Price</span>
                      <span>Total</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="truncate max-w-[124px]">{poItem.name}</span>
                      <span>{poQty} @ ₹{poPrice}</span>
                      <span className="text-slate-100 font-bold">₹{(poQty * poPrice).toLocaleString()}</span>
                    </div>
                    <div className="border-b border-slate-800 border-dashed my-2"></div>
                    <div className="flex justify-between font-bold text-emerald-400 uppercase">
                      <span>EST. TOTAL</span>
                      <span>₹{(poQty * poPrice).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[8px] text-slate-500 border-t border-slate-800 pt-2 mt-4">
                  Terms: 100% replacement warranties on transit damages.
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowPOModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-750 font-bold rounded-xl text-xs hover:bg-slate-50 text-center cursor-pointer"
              >
                Cancel Draft
              </button>
              
              <button
                type="button"
                onClick={handleWhatsAppPOSubmit}
                className="flex-1 py-2.5 bg-emerald-55 hover:bg-emerald-60 px-4 text-emerald-800 font-extrabold rounded-xl text-xs text-center cursor-pointer flex items-center justify-center gap-1 border border-emerald-200"
              >
                <Share2 className="h-4 w-4 shrink-0" /> Push to WhatsApp
              </button>

              <button
                type="button"
                onClick={handleDownloadPODraft}
                className="flex-1 py-2.5 bg-black text-white font-extrabold rounded-xl text-xs hover:bg-slate-800 text-center cursor-pointer shadow-md flex items-center justify-center gap-1"
              >
                <Download className="h-4.5 w-4.5 text-emerald-400" /> Save Tabular PO (.txt)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
