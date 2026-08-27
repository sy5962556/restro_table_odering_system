import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { TrendingUp, Download, RefreshCw, Calendar } from 'lucide-react';
import api from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopNav from '../../components/admin/AdminTopNav';

const COLORS = ['#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#ef4444'];

const RANGES = [
  { label: '7 Days', value: '7days' },
  { label: '30 Days', value: '30days' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
];

export const AnalyticsReportsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [range, setRange] = useState('7days');
  const [data, setData] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, forecastRes] = await Promise.all([
        api.get(`/analytics/sales-charts?range=${range}`),
        api.get('/analytics/forecast'),
      ]);
      if (analyticsRes.data.success) setData(analyticsRes.data);
      if (forecastRes.data.success) setForecast(forecastRes.data);
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const exportCSV = () => {
    if (!data?.dailySales) return;
    const rows = [['Date', 'Revenue', 'Orders']];
    data.dailySales.forEach(d => rows.push([d.date, d.revenue, d.orders]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AdminTopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Analytics & Reports" />

        <div className="px-4 sm:px-6 py-5 space-y-6 max-w-7xl mx-auto w-full">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1">
              {RANGES.map(r => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide transition-colors ${
                    range === r.value ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wide transition-colors ml-auto"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>

          {/* KPI Stats */}
          {data?.summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: `₹${data.summary.totalRevenue?.toLocaleString() || 0}`, icon: '💰', color: 'text-emerald-600' },
                { label: 'Total Orders', value: data.summary.totalOrders || 0, icon: '📋', color: 'text-blue-600' },
                { label: 'Avg Ticket Size', value: `₹${data.summary.avgOrderValue?.toFixed(0) || 0}`, icon: '🎫', color: 'text-amber-600' },
                { label: 'Unique Customers', value: data.summary.uniqueCustomers || 0, icon: '👥', color: 'text-purple-600' },
              ].map(stat => (
                <div key={stat.label} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-2xl">{stat.icon}</div>
                  <p className={`font-black text-xl mt-1.5 ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Revenue Trend */}
          <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">Revenue & Orders Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.dailySales || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
                  <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown + Peak Hours Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Revenue Pie */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Revenue by Category</h3>
              <div className="flex items-center gap-4">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data?.categoryBreakdown || []} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                        {(data?.categoryBreakdown || []).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} formatter={(v) => [`₹${v}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1">
                  {(data?.categoryBreakdown || []).map((cat, i) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{cat.category}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-900 dark:text-white shrink-0 ml-2">₹{cat.revenue?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Peak Hours */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Peak Hours Distribution</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.hourlySales || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                    <Bar dataKey="orders" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Sales Forecast */}
          {forecast && (
            <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-brand-950 rounded-3xl border border-brand-800/50 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-400" />
                <h3 className="font-black text-sm text-white">AI Sales Forecast (Next 7 Days)</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold uppercase tracking-wide">Statistical Model</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecast.nextWeek || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} formatter={(v) => [`₹${v}`, 'Forecasted Revenue']} />
                    <Area type="monotone" dataKey="predictedRevenue" stroke="#f97316" strokeWidth={2.5} fill="url(#fcGrad)" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {forecast.insights && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {forecast.insights.map((insight, i) => (
                    <div key={i} className="bg-white/5 rounded-2xl p-3 border border-white/10">
                      <p className="text-xs font-extrabold text-white">{insight.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{insight.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReportsPage;
