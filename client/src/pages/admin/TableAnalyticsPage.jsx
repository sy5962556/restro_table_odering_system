import React, { useState, useEffect, useCallback } from 'react';
import { BarChart2, TrendingUp, Clock, Users, Flame } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import api from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopNav from '../../components/admin/AdminTopNav';

const HEAT_COLORS = ['#f0fdf4', '#bbf7d0', '#4ade80', '#22c55e', '#15803d', '#14532d'];

function getHeatColor(value, max) {
  if (!value || max === 0) return HEAT_COLORS[0];
  const idx = Math.min(Math.floor((value / max) * (HEAT_COLORS.length - 1)), HEAT_COLORS.length - 1);
  return HEAT_COLORS[idx];
}

export const TableAnalyticsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tableStats, setTableStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/tables');
      if (res.data.success) setTableStats(res.data.tables || []);
    } catch (err) {
      console.error('Error fetching table analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const maxOrders = Math.max(...tableStats.map(t => t.totalOrders || 0), 1);
  const maxRevenue = Math.max(...tableStats.map(t => t.totalRevenue || 0), 1);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AdminTopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Table Analytics & Heatmap" />

        <div className="px-4 sm:px-6 py-5 space-y-6 max-w-7xl mx-auto w-full">
          {/* Revenue Heatmap */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Table Revenue Heatmap</h3>
                <p className="text-[10px] text-slate-400">Darker = higher revenue-generating table</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Low</span>
                <div className="flex gap-0.5">
                  {HEAT_COLORS.map((c, i) => (
                    <span key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400">High</span>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2">
                {[...Array(20)].map((_, i) => <div key={i} className="aspect-square rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2">
                {tableStats.map(table => (
                  <div
                    key={table.tableId}
                    className="aspect-square rounded-xl flex flex-col items-center justify-center text-center p-1 border border-black/10"
                    style={{ backgroundColor: getHeatColor(table.totalRevenue, maxRevenue) }}
                    title={`Table ${table.tableNumber}: ₹${table.totalRevenue?.toLocaleString()} revenue, ${table.totalOrders} orders`}
                  >
                    <span className="font-black text-xs text-slate-800">T{table.tableNumber}</span>
                    <span className="text-[8px] font-bold text-slate-600">₹{table.totalRevenue >= 1000 ? `${(table.totalRevenue / 1000).toFixed(1)}k` : table.totalRevenue}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bar Chart - Orders per Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">Orders per Table (All Time)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tableStats.slice(0, 20)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="tableNumber" tick={{ fontSize: 10 }} tickFormatter={(v) => `T${v}`} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(v) => [v, 'Orders']}
                    labelFormatter={(l) => `Table ${l}`}
                  />
                  <Bar dataKey="totalOrders" radius={[6, 6, 0, 0]}>
                    {tableStats.slice(0, 20).map((entry, i) => (
                      <Cell key={i} fill={getHeatColor(entry.totalOrders, maxOrders)} stroke="#22c55e" strokeWidth={0.5} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Tables Leaderboard */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">Top Performing Tables</h3>
            <div className="space-y-2">
              {[...tableStats]
                .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
                .slice(0, 10)
                .map((table, idx) => (
                  <div key={table.tableId} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0 ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-amber-700' : 'bg-slate-300 dark:bg-slate-600'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-extrabold text-xs text-slate-900 dark:text-white">Table {table.tableNumber}</p>
                      <p className="text-[10px] text-slate-400">{table.totalOrders} orders • Avg ₹{table.avgOrderValue?.toFixed(0) || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-sm text-emerald-600 dark:text-emerald-400">₹{table.totalRevenue?.toLocaleString() || 0}</p>
                      {table.topDish && (
                        <p className="text-[9px] text-slate-400">🏆 {table.topDish}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableAnalyticsPage;
