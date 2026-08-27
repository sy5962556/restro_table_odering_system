import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Grid, 
  ChefHat, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopNav from '../../components/admin/AdminTopNav';

export const DashboardOverview = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, chartsRes, ordersRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/sales-charts?range=7days'),
        api.get('/orders?limit=6')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (chartsRes.data.success) setChartData(chartsRes.data);
      if (ordersRes.data.success) setRecentOrders(ordersRes.data.orders);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen for real-time order events
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchDashboardData();
    };

    socket.on('newOrder', handleUpdate);
    socket.on('paymentCompleted', handleUpdate);
    socket.on('orderStatusUpdated', handleUpdate);

    return () => {
      socket.off('newOrder', handleUpdate);
      socket.off('paymentCompleted', handleUpdate);
      socket.off('orderStatusUpdated', handleUpdate);
    };
  }, [socket]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AdminTopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Dashboard Overview" />

        <main className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {/* Sales Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Today's Sales</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-base">
                  ₹
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  ₹{stats?.todaySales ? stats.todaySales.toLocaleString() : '0'}
                </h3>
                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                  <TrendingUp className="w-3 h-3" /> +14.2% vs yesterday
                </p>
              </div>
            </div>

            {/* Orders Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Today's Orders</span>
                <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {stats?.todayOrderCount || 0}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {stats?.todayCompletedCount || 0} completed • {stats?.todayCancelledCount || 0} cancelled
                </p>
              </div>
            </div>

            {/* Active Tables Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Active Tables</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                  <Grid className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {stats?.occupiedTables || 0} <span className="text-sm font-bold text-slate-400">/ {stats?.totalTables || 20}</span>
                </h3>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                  {stats?.availableTables || 0} tables free for seating
                </p>
              </div>
            </div>

            {/* Average Order Value */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Avg Ticket Size</span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  ₹{stats?.avgOrderValue || 0}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {stats?.uniqueCustomersToday || 0} guests served today
                </p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 7-Day Revenue Trend (2 cols) */}
            <div className="lg:col-span-2 p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Sales & Revenue Trend</h3>
                  <p className="text-xs text-slate-400">Daily gross turnover for the last 7 days</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
                  Live Sync
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData?.dailySales || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                      formatter={(val) => [`₹${val}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Peak Hours Hourly Chart (1 col) */}
            <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Peak Hours Rush</h3>
                  <p className="text-xs text-slate-400">Hourly order distribution</p>
                </div>
                <Clock className="w-4 h-4 text-brand-500" />
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData?.hourlySales?.slice(11, 23) || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                      formatter={(val) => [val, 'Orders']}
                    />
                    <Bar dataKey="orders" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Live Orders Feed & Top Selling Dishes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Orders Feed (2 cols) */}
            <div className="lg:col-span-2 p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Recent Active Orders</h3>
                  <p className="text-xs text-slate-400">Incoming QR orders across all tables</p>
                </div>
                <button
                  onClick={() => navigate('/admin/orders')}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  View Kanban Board →
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No orders placed today yet.</p>
                ) : (
                  recentOrders.map((ord) => (
                    <div key={ord._id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-black text-xs shrink-0">
                          #{ord.tableNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">{ord.orderNumber}</span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              ord.orderStatus === 'Ready' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              ord.orderStatus === 'Preparing' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' :
                              ord.orderStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}>
                              {ord.orderStatus}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {ord.customer?.name} • {ord.items?.length} items ({new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          ₹{ord.grandTotal?.toFixed(2)}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 capitalize">{ord.paymentStatus} ({ord.paymentMethod || 'UPI'})</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Products Leaderboard (1 col) */}
            <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base text-slate-900 dark:text-white">Top Ordered Dishes</h3>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>

              <div className="space-y-3">
                {chartData?.topProducts?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-1">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-brand-600 dark:text-brand-400 shrink-0">{item.quantity} sold</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardOverview;
