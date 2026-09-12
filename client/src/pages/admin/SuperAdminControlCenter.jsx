import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Users, 
  ShoppingBag, 
  BarChart3, 
  ShieldCheck, 
  MapPin, 
  MousePointerClick, 
  RefreshCw, 
  Plus, 
  Search, 
  Lock, 
  Unlock, 
  Key, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Grid,
  ChefHat,
  Utensils,
  Boxes,
  Tag,
  Settings,
  Activity,
  FileText
} from 'lucide-react';

import api from '../../services/api';
import RestaurantTree from '../../components/superadmin/RestaurantTree';
import ControlModeBanner from '../../components/superadmin/ControlModeBanner';
import PasswordResetModal from '../../components/superadmin/PasswordResetModal';
import LocationMonitor from '../../components/superadmin/LocationMonitor';
import ClickLoggerView from '../../components/superadmin/ClickLoggerView';
import AuditLoggerView from '../../components/superadmin/AuditLoggerView';

export default function SuperAdminControlCenter() {
  const [treeData, setTreeData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation & Control Mode State
  const [activeTab, setActiveTab] = useState('global-dashboard');
  const [activeRestaurant, setActiveRestaurant] = useState(null);
  const [controlData, setControlData] = useState(null);
  const [controlLoading, setControlLoading] = useState(false);

  // Password Reset Modal State
  const [resetModalRestaurant, setResetModalRestaurant] = useState(null);

  // Global filters
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalStatusFilter, setGlobalStatusFilter] = useState('ALL');
  const [globalPlanFilter, setGlobalPlanFilter] = useState('ALL');

  // Fetch Tree & Global Platform Stats
  const fetchPlatformData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, treeRes] = await Promise.all([
        api.get('/platform/dashboard'),
        api.get('/platform/tree')
      ]);

      if (dashRes.data.success) setStats(dashRes.data.stats);
      if (treeRes.data.success) setTreeData(treeRes.data.tree);
    } catch (err) {
      console.error('Error fetching platform control center data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlatformData();
  }, [fetchPlatformData]);

  // Log Administrative Click Event
  const logAdminAction = async (action, page, entity, entityId, restaurantId) => {
    try {
      await api.post('/platform/click-log', {
        action,
        page,
        entity,
        entityId,
        restaurantId
      });
    } catch (e) {
      // Ignore click logging errors
    }
  };

  // Enter Control Mode for a target tenant
  const handleEnterControlMode = async (restaurant, targetSubTab = 'dashboard') => {
    setActiveRestaurant(restaurant);
    setActiveTab(targetSubTab);
    setControlLoading(true);
    
    logAdminAction(`ENTER_CONTROL_MODE_${targetSubTab.toUpperCase()}`, targetSubTab, 'Restaurant', restaurant._id, restaurant._id);

    try {
      const res = await api.get(`/platform/restaurants/${restaurant._id}/control-data`);
      if (res.data.success) {
        setControlData(res.data);
      }
    } catch (err) {
      console.error('Error loading restaurant control workspace:', err);
    } finally {
      setControlLoading(false);
    }
  };

  const handleExitControlMode = () => {
    logAdminAction('EXIT_CONTROL_MODE', 'global-dashboard', 'Restaurant', activeRestaurant?._id);
    setActiveRestaurant(null);
    setControlData(null);
    setActiveTab('global-dashboard');
  };

  const handleStatusChange = async (restaurantId, newStatus) => {
    try {
      const res = await api.patch(`/platform/restaurants/${restaurantId}/status`, { status: newStatus });
      if (res.data.success) {
        await fetchPlatformData();
        if (activeRestaurant && activeRestaurant._id === restaurantId) {
          setActiveRestaurant(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const handlePlanChange = async (restaurantId, newPlan) => {
    try {
      const res = await api.patch(`/platform/restaurants/${restaurantId}/plan`, { plan: newPlan });
      if (res.data.success) {
        await fetchPlatformData();
        if (activeRestaurant && activeRestaurant._id === restaurantId) {
          setActiveRestaurant(prev => ({ ...prev, plan: newPlan }));
        }
      }
    } catch (err) {
      alert(err.message || 'Plan update failed');
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* ─── LEFT PANEL: RESTAURANT TREE CONTROL CENTER ─── */}
      <RestaurantTree
        treeData={treeData}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveRestaurant(null);
          setActiveTab(tab);
          logAdminAction(`NAVIGATE_${tab.toUpperCase()}`, tab, 'Global');
        }}
        activeRestaurant={activeRestaurant}
        onEnterControlMode={handleEnterControlMode}
        onResetPassword={(rest) => setResetModalRestaurant(rest)}
        onStatusChange={handleStatusChange}
      />

      {/* ─── RIGHT MAIN WORKSPACE ─── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-950">
        
        {/* Persistent Control Mode Banner when managing a specific restaurant */}
        {activeRestaurant && (
          <ControlModeBanner
            targetRestaurant={activeRestaurant}
            onExitControlMode={handleExitControlMode}
          />
        )}

        {/* Scrollable Main Content Workspace */}
        <div className="flex-1 overflow-y-auto">
          
          {/* ──────────────────────────────────────────────────────── */}
          {/* A. TENANT CONTROL MODE WORKSPACE                         */}
          {/* ──────────────────────────────────────────────────────── */}
          {activeRestaurant ? (
            controlLoading ? (
              <div className="flex flex-col items-center justify-center h-96 gap-3 text-slate-500">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold animate-pulse">Loading {activeRestaurant.name} workspace…</p>
              </div>
            ) : controlData ? (
              <div className="p-6 space-y-6">
                
                {/* 1. Tenant Dashboard */}
                {activeTab === 'dashboard' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-black text-white">{controlData.restaurant.name} Workspace</h2>
                        <p className="text-xs text-slate-400">Tenant Control Center Dashboard overview & live operational metrics.</p>
                      </div>
                      <button 
                        onClick={() => handleEnterControlMode(activeRestaurant, 'dashboard')}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold border border-slate-800"
                      >
                        🔄 Refresh Workspace
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                        <span className="text-xs text-slate-400">Total Tenant Revenue</span>
                        <div className="text-2xl font-black text-emerald-400 mt-1">₹{controlData.metrics.totalRevenue?.toLocaleString()}</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                        <span className="text-xs text-slate-400">Total Customer Orders</span>
                        <div className="text-2xl font-black text-brand-400 mt-1">{controlData.metrics.totalOrders}</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                        <span className="text-xs text-slate-400">Active Dining Tables</span>
                        <div className="text-2xl font-black text-purple-400 mt-1">{controlData.metrics.totalTables}</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                        <span className="text-xs text-slate-400">Registered Staff Accounts</span>
                        <div className="text-2xl font-black text-amber-400 mt-1">{controlData.metrics.totalStaff}</div>
                      </div>
                    </div>

                    {/* Recent Orders Preview */}
                    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <h3 className="font-extrabold text-sm text-white">Recent Customer Orders</h3>
                      <div className="divide-y divide-slate-800 text-xs">
                        {controlData.recentOrders?.map(order => (
                          <div key={order._id} className="py-2.5 flex items-center justify-between">
                            <div>
                              <span className="font-bold text-white">#{order.orderNumber}</span>
                              <span className="text-slate-400 ml-2">Table #{order.table?.tableNumber || order.tableNumber}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-emerald-400">₹{order.grandTotal?.toFixed(2)}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">{order.orderStatus}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Tenant Account & Security */}
                {activeTab === 'account' && (
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 max-w-2xl">
                    <h2 className="text-lg font-black text-white">Account & Subscription Security</h2>

                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Restaurant Code:</span>
                        <span className="font-mono font-bold text-purple-400">{controlData.restaurant.restaurantCode || controlData.restaurant._id}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Owner Login Email:</span>
                        <span className="font-bold text-white">{controlData.restaurant.owner?.email || controlData.restaurant.email}</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Subscription Tier:</span>
                        <span className="font-bold text-amber-400">{controlData.restaurant.plan} PLAN</span>
                      </div>
                      <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-slate-400">Account Status:</span>
                        <span className="font-bold text-emerald-400">{controlData.restaurant.status}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 space-y-3">
                      <button
                        onClick={() => setResetModalRestaurant(controlData.restaurant)}
                        className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-2"
                      >
                        <Key className="w-4 h-4" />
                        <span>Generate Temporary Credentials</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Tenant Users */}
                {activeTab === 'users' && (
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                    <h2 className="text-lg font-black text-white">Tenant Staff Users ({controlData.staffList?.length})</h2>
                    <div className="divide-y divide-slate-800 text-xs">
                      {controlData.staffList?.map(staff => (
                        <div key={staff._id} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white">{staff.name}</div>
                            <div className="text-slate-400 text-[11px]">{staff.email} • {staff.mobile || 'No mobile'}</div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-purple-300">
                            {staff.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Tenant Menu */}
                {activeTab === 'menu' && (
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                    <h2 className="text-lg font-black text-white">Menu & Dishes ({controlData.menuItems?.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {controlData.menuItems?.map(item => (
                        <div key={item._id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-slate-800" />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-white text-xs truncate">{item.name}</div>
                            <div className="text-xs text-emerald-400 font-bold">₹{item.price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Tenant Tables */}
                {activeTab === 'tables' && (
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                    <h2 className="text-lg font-black text-white">Tables & QR Tokens ({controlData.tables?.length})</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {controlData.tables?.map(t => (
                        <div key={t._id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                          <div className="text-xl font-black text-white">T#{t.tableNumber}</div>
                          <div className="text-[11px] text-slate-400">{t.section} • {t.capacity} Seats</div>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Generic Fallback for other sub-tabs */}
                {['qr-codes', 'orders', 'kitchen', 'reports', 'settings', 'activity'].includes(activeTab) && (
                  <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <h3 className="font-extrabold text-sm text-white uppercase">Tenant {activeTab} Control</h3>
                    <p className="text-xs text-slate-400">Managing live tenant data for {controlData.restaurant.name}.</p>
                  </div>
                )}

              </div>
            ) : null
          ) : (

            /* ──────────────────────────────────────────────────────── */
            /* B. GLOBAL SUPER ADMIN PLATFORM WORKSPACE                 */
            /* ──────────────────────────────────────────────────────── */
            <div>
              {/* 1. Global Dashboard */}
              {activeTab === 'global-dashboard' && (
                <div className="p-6 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          👑 SUPER ADMIN COMMAND CENTER
                        </span>
                      </div>
                      <h1 className="text-3xl font-black text-white mt-1.5">Platform Administration</h1>
                      <p className="text-xs text-slate-400">Centralized control center for all multi-tenant restaurant workspaces.</p>
                    </div>

                    <button
                      onClick={fetchPlatformData}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition flex items-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                      <span>Refresh Global Platform</span>
                    </button>
                  </div>

                  {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                        <span className="text-xs text-slate-400">Total Restaurants</span>
                        <div className="text-3xl font-black text-white mt-1">{stats.totalRestaurants}</div>
                        <div className="text-[11px] text-slate-500 mt-2 flex gap-3">
                          <span className="text-emerald-400">✓ {stats.approvedRestaurants} Active</span>
                          <span className="text-amber-400">⏳ {stats.pendingRestaurants} Pending</span>
                          <span className="text-rose-400">🚫 {stats.suspendedRestaurants} Suspended</span>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                        <span className="text-xs text-slate-400">Global Platform Revenue</span>
                        <div className="text-3xl font-black text-emerald-400 mt-1">₹{stats.totalRevenue?.toLocaleString()}</div>
                        <div className="text-[11px] text-slate-500 mt-2">Aggregated customer sales</div>
                      </div>

                      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                        <span className="text-xs text-slate-400">Global Table Orders</span>
                        <div className="text-3xl font-black text-brand-400 mt-1">{stats.totalOrders}</div>
                        <div className="text-[11px] text-slate-500 mt-2">Live QR orders placed</div>
                      </div>

                      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                        <span className="text-xs text-slate-400">Total Registered Users</span>
                        <div className="text-3xl font-black text-purple-400 mt-1">{stats.totalUsers}</div>
                        <div className="text-[11px] text-slate-500 mt-2">Platform user accounts</div>
                      </div>
                    </div>
                  )}

                  {/* Recent Platform Activity */}
                  <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                    <h3 className="font-extrabold text-sm text-white">Recent Security Audit Logs</h3>
                    <div className="divide-y divide-slate-800 text-xs">
                      {stats?.recentAuditLogs?.map(log => (
                        <div key={log._id} className="py-2.5 flex items-center justify-between font-mono">
                          <div>
                            <span className="font-bold text-white">{log.userName}</span>
                            <span className="text-purple-400 ml-2 font-bold">{log.action}</span>
                          </div>
                          <span className="text-slate-500 text-[11px]">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Global Restaurants List */}
              {activeTab === 'global-restaurants' && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-white">All Platform Restaurants</h2>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <input
                      type="text"
                      placeholder="Search restaurant name, email, owner..."
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      className="w-full md:w-1/3 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />

                    <div className="flex gap-2">
                      <select
                        value={globalStatusFilter}
                        onChange={(e) => setGlobalStatusFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="PENDING">PENDING</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>

                      <select
                        value={globalPlanFilter}
                        onChange={(e) => setGlobalPlanFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300"
                      >
                        <option value="ALL">All SaaS Plans</option>
                        <option value="FREE">FREE</option>
                        <option value="BASIC">BASIC</option>
                        <option value="PRO">PRO</option>
                        <option value="PREMIUM">PREMIUM</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                          <tr>
                            <th className="px-5 py-4">Restaurant</th>
                            <th className="px-5 py-4">Owner</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4">Plan</th>
                            <th className="px-5 py-4">Orders</th>
                            <th className="px-5 py-4">Revenue</th>
                            <th className="px-5 py-4 text-right">Control Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {treeData.map(rest => (
                            <tr key={rest._id} className="hover:bg-slate-800/50 transition">
                              <td className="px-5 py-3.5 font-bold text-white flex items-center gap-2.5">
                                <img src={rest.logo} alt={rest.name} className="w-8 h-8 rounded-lg object-cover border border-slate-800" />
                                <div>
                                  <div>{rest.name}</div>
                                  <div className="text-[10px] text-purple-400 font-mono">{rest.restaurantCode}</div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-slate-400">{rest.ownerName} ({rest.email})</td>
                              <td className="px-5 py-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  rest.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                }`}>
                                  {rest.status}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 font-bold text-brand-400">{rest.plan}</td>
                              <td className="px-5 py-3.5">{rest.metrics.ordersCount}</td>
                              <td className="px-5 py-3.5 text-emerald-400 font-bold">₹{rest.metrics.revenue?.toLocaleString()}</td>
                              <td className="px-5 py-3.5 text-right">
                                <button
                                  onClick={() => handleEnterControlMode(rest, 'dashboard')}
                                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                                >
                                  Manage Workspace →
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Location Monitor */}
              {activeTab === 'location-monitor' && (
                <LocationMonitor onControlRestaurant={handleEnterControlMode} />
              )}

              {/* 4. Click Logger */}
              {activeTab === 'click-logger' && (
                <ClickLoggerView />
              )}

              {/* 5. Audit Logs */}
              {activeTab === 'audit-logs' && (
                <AuditLoggerView />
              )}

              {/* 6. Generic Fallbacks for other Global Tabs */}
              {['global-users', 'global-orders', 'global-reports'].includes(activeTab) && (
                <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 m-6 space-y-3">
                  <h3 className="font-extrabold text-sm text-white uppercase">{activeTab} View</h3>
                  <p className="text-xs text-slate-400">Platform-wide multi-tenant aggregation.</p>
                </div>
              )}

            </div>
          )}

        </div>
      </div>

      {/* Password Reset Modal */}
      {resetModalRestaurant && (
        <PasswordResetModal
          restaurant={resetModalRestaurant}
          onClose={() => setResetModalRestaurant(null)}
        />
      )}
    </div>
  );
}
