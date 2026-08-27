import React, { useState, useEffect, useCallback } from 'react';
import { Grid, Users, Info, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopNav from '../../components/admin/AdminTopNav';

const STATUS_COLORS = {
  AVAILABLE:       { bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', light: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-300 dark:border-emerald-800' },
  OCCUPIED:        { bg: 'bg-blue-500',    text: 'text-blue-700 dark:text-blue-300',       light: 'bg-blue-50 dark:bg-blue-950/30',       border: 'border-blue-300 dark:border-blue-800' },
  ORDERING:        { bg: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-300',     light: 'bg-amber-50 dark:bg-amber-950/30',     border: 'border-amber-300 dark:border-amber-800' },
  FOOD_READY:      { bg: 'bg-orange-500',  text: 'text-orange-700 dark:text-orange-300',   light: 'bg-orange-50 dark:bg-orange-950/30',   border: 'border-orange-300 dark:border-orange-800' },
  BILL_REQUESTED:  { bg: 'bg-purple-500',  text: 'text-purple-700 dark:text-purple-300',   light: 'bg-purple-50 dark:bg-purple-950/30',   border: 'border-purple-300 dark:border-purple-800' },
  PAYMENT_PENDING: { bg: 'bg-rose-500',    text: 'text-rose-700 dark:text-rose-300',       light: 'bg-rose-50 dark:bg-rose-950/30',       border: 'border-rose-300 dark:border-rose-800' },
  CLEANING:        { bg: 'bg-slate-400',   text: 'text-slate-600 dark:text-slate-400',     light: 'bg-slate-100 dark:bg-slate-800/50',    border: 'border-slate-300 dark:border-slate-700' },
};

function TableTile({ table, onReset }) {
  const [tooltip, setTooltip] = useState(false);
  const col = STATUS_COLORS[table.status] || STATUS_COLORS.AVAILABLE;

  return (
    <div
      className={`relative rounded-2xl border-2 ${col.border} ${col.light} p-3.5 cursor-pointer select-none transition-all hover:shadow-md`}
      onClick={() => setTooltip(!tooltip)}
    >
      {/* Status dot */}
      <span className={`absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full ${col.bg} ${table.status !== 'AVAILABLE' ? 'animate-pulse' : ''}`} />

      <div className="text-center space-y-1">
        <span className="text-2xl font-black text-slate-900 dark:text-white block">T{table.tableNumber}</span>
        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${col.light} ${col.text}`}>
          {table.status.replace('_', ' ')}
        </span>
        {table.currentGuests > 0 && (
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-bold">
            <Users className="w-3 h-3" />
            <span>{table.currentGuests}</span>
          </div>
        )}
      </div>

      {tooltip && (
        <div className="absolute z-20 top-full left-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-3 space-y-2">
          <p className="font-black text-xs text-slate-900 dark:text-white">Table {table.tableNumber}</p>
          <p className="text-[10px] text-slate-500">Floor: {table.floor || 1} | Section: {table.section || 'Main'}</p>
          <p className="text-[10px] text-slate-500">Capacity: {table.capacity} | Guests: {table.currentGuests}</p>
          {table.activeOrderId && (
            <p className="text-[10px] text-brand-600 dark:text-brand-400 font-bold">📋 Active Order</p>
          )}
          {table.status !== 'AVAILABLE' && (
            <button
              onClick={(e) => { e.stopPropagation(); onReset(table._id); setTooltip(false); }}
              className="w-full py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase hover:bg-rose-200 transition-colors"
            >
              Reset to Available
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setTooltip(false); }}
            className="w-full text-[10px] text-slate-400 hover:text-slate-600 py-1"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export const TableManagementPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterFloor, setFilterFloor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tables');
      if (res.data.success) setTables(res.data.tables || []);
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const handleReset = async (tableId) => {
    if (!window.confirm('Reset this table to AVAILABLE? Any active orders must be settled first.')) return;
    try {
      await api.patch(`/tables/${tableId}/status`, { status: 'AVAILABLE' });
      fetchTables();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error resetting table');
    }
  };

  const floors = [...new Set(tables.map(t => t.floor || 1))].sort();

  const filtered = tables.filter(t => {
    const floorMatch = filterFloor === 'all' || String(t.floor || 1) === filterFloor;
    const statusMatch = filterStatus === 'all' || t.status === filterStatus;
    return floorMatch && statusMatch;
  });

  const statCounts = Object.keys(STATUS_COLORS).reduce((acc, s) => {
    acc[s] = tables.filter(t => t.status === s).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AdminTopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Table Floor Plan" />

        <div className="px-4 sm:px-6 py-5 space-y-5 flex-1 overflow-y-auto">
          {/* Status summary pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(STATUS_COLORS).map(([status, col]) => (
              <div key={status} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ${col.light} border ${col.border} cursor-pointer ${filterStatus === status ? 'ring-2 ring-brand-500' : ''}`}
                onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}>
                <span className={`w-2 h-2 rounded-full ${col.bg}`} />
                <span className={`text-[10px] font-bold ${col.text}`}>{status.replace('_', ' ')} ({statCounts[status] || 0})</span>
              </div>
            ))}
            <button onClick={() => setFilterStatus('all')} className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 hover:bg-slate-200 transition-colors ml-auto">
              Show All
            </button>
          </div>

          {/* Filters + Refresh */}
          <div className="flex items-center gap-3 flex-wrap">
            <select value={filterFloor} onChange={e => setFilterFloor(e.target.value)} className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="all">All Floors</option>
              {floors.map(f => <option key={f} value={String(f)}>Floor {f}</option>)}
            </select>
            <button onClick={fetchTables} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <div className="ml-auto text-xs font-bold text-slate-400">
              {tables.filter(t => t.status !== 'AVAILABLE').length} / {tables.length} tables occupied
            </div>
          </div>

          {/* Floor Plan Grid */}
          {floors.filter(f => filterFloor === 'all' || String(f) === filterFloor).map(floor => (
            <div key={floor} className="space-y-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-500">
                🏢 Floor {floor}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-3">
                {filtered
                  .filter(t => (t.floor || 1) === floor)
                  .sort((a, b) => a.tableNumber - b.tableNumber)
                  .map(table => (
                    <TableTile key={table._id} table={table} onReset={handleReset} />
                  ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-400 text-xs">No tables match the current filters.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableManagementPage;
