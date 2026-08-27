import React, { useState, useEffect, useCallback } from 'react';
import { Package, AlertTriangle, Plus, Edit2, RefreshCw, TrendingDown } from 'lucide-react';
import api from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopNav from '../../components/admin/AdminTopNav';

function InventoryRow({ item, onAdjust }) {
  const pct = Math.min(100, Math.round((item.currentStock / (item.minimumStock * 3 || 1)) * 100));
  const isLow = item.currentStock <= item.minimumStock;
  const isOut = item.currentStock === 0;

  return (
    <div className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border ${isOut ? 'border-rose-400 dark:border-rose-800' : isLow ? 'border-amber-400 dark:border-amber-800' : 'border-slate-200 dark:border-slate-800'} shadow-xs space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {(isOut || isLow) && <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isOut ? 'text-rose-500' : 'text-amber-500'}`} />}
            <p className="font-extrabold text-xs text-slate-900 dark:text-white">{item.name}</p>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">{item.unit} • {item.category || 'General'}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-black text-sm ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
            {item.currentStock} {item.unit}
          </p>
          <p className="text-[10px] text-slate-400">Min: {item.minimumStock}</p>
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <button
        onClick={() => onAdjust(item)}
        className="w-full py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
      >
        + Adjust Stock
      </button>
    </div>
  );
}

function AdjustModal({ item, onClose, onSave }) {
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState('restock');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ itemId: item._id, type, quantity: parseFloat(qty), note });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <h2 className="font-black text-sm text-slate-900 dark:text-white">Adjust: {item.name}</h2>
        <p className="text-xs text-slate-500">Current stock: <strong>{item.currentStock} {item.unit}</strong></p>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Adjustment Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="restock">Restock / Add</option>
              <option value="consume">Consume / Deduct</option>
              <option value="waste">Write Off (Waste)</option>
              <option value="correction">Stock Correction</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Quantity ({item.unit})</label>
            <input required type="number" min="0.01" step="0.01" value={qty} onChange={e => setQty(e.target.value)} placeholder={`e.g. 5 ${item.unit}`} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Morning supplier delivery" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black uppercase transition-colors">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const InventoryPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [filterLow, setFilterLow] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory');
      if (res.data.success) setItems(res.data.items || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAdjust = async (data) => {
    try {
      await api.post('/inventory/adjust', data);
      setAdjustingItem(null);
      fetchItems();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error adjusting stock');
    }
  };

  const lowStockCount = items.filter(i => i.currentStock <= i.minimumStock).length;
  const displayed = filterLow ? items.filter(i => i.currentStock <= i.minimumStock) : items;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {adjustingItem && (
        <AdjustModal item={adjustingItem} onClose={() => setAdjustingItem(null)} onSave={handleAdjust} />
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AdminTopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Inventory Management" />

        <div className="px-4 sm:px-6 py-5 space-y-5 flex-1 overflow-y-auto">
          {/* Summary Banner */}
          {lowStockCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300">{lowStockCount} items are running low or out of stock!</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400">Consider restocking before the next service.</p>
              </div>
              <button
                onClick={() => setFilterLow(!filterLow)}
                className="ml-auto px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-amber-600 text-white hover:bg-amber-700 transition-colors shrink-0"
              >
                {filterLow ? 'Show All' : 'Filter Low Stock'}
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={fetchItems} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <span className="ml-auto text-xs font-bold text-slate-400">{items.length} items in inventory</span>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayed.map(item => (
                <InventoryRow key={item._id} item={item} onAdjust={setAdjustingItem} />
              ))}
              {displayed.length === 0 && (
                <p className="col-span-full text-center py-12 text-slate-400 text-xs">No inventory items found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
