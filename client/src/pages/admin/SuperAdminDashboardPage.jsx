import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPlan, setFilterPlan] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRest, setSelectedRest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPlatformData = async () => {
    try {
      setLoading(true);
      const [dashRes, listRes] = await Promise.all([
        api.get('/platform/dashboard'),
        api.get('/platform/restaurants')
      ]);

      if (dashRes.data.success) {
        setStats(dashRes.data.stats);
      }
      if (listRes.data.success) {
        setRestaurants(listRes.data.restaurants);
      }
    } catch (err) {
      console.error('Failed to fetch platform admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const handleStatusChange = async (restaurantId, newStatus) => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/platform/restaurants/${restaurantId}/status`, { status: newStatus });
      if (res.data.success) {
        await fetchPlatformData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePlanChange = async (restaurantId, newPlan) => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/platform/restaurants/${restaurantId}/plan`, { plan: newPlan });
      if (res.data.success) {
        await fetchPlatformData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update subscription plan');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(r => {
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const matchesPlan = filterPlan === 'ALL' || r.plan === filterPlan;
    const matchesSearch = !searchTerm || 
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPlan && matchesSearch;
  });

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
              👑 SUPER ADMIN CONTROL CENTER
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-2">Platform Administration</h1>
          <p className="text-sm text-slate-400">Manage multi-tenant restaurants, approvals, subscriptions, and platform analytics.</p>
        </div>
        <button
          onClick={fetchPlatformData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition"
        >
          🔄 Refresh Platform Data
        </button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Platform Restaurants</span>
              <span className="text-xl">🏛️</span>
            </div>
            <div className="text-3xl font-extrabold text-white">{stats.totalRestaurants}</div>
            <div className="text-xs text-slate-500 mt-2 flex gap-3">
              <span className="text-emerald-400">✓ {stats.approvedRestaurants} Active</span>
              <span className="text-amber-400">⏳ {stats.pendingRestaurants} Pending</span>
              <span className="text-red-400">🚫 {stats.suspendedRestaurants} Suspended</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Platform Revenue (All Time)</span>
              <span className="text-xl">💰</span>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400">₹{stats.totalRevenue?.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-2">Aggregated across all active tenants</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Customer Orders</span>
              <span className="text-xl">🧾</span>
            </div>
            <div className="text-3xl font-extrabold text-brand-400">{stats.totalOrders}</div>
            <div className="text-xs text-slate-500 mt-2">Real-time table QR orders</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Registered Users</span>
              <span className="text-xl">👥</span>
            </div>
            <div className="text-3xl font-extrabold text-purple-400">{stats.totalUsers}</div>
            <div className="text-xs text-slate-500 mt-2">Owners, Managers & Kitchen Staff</div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="🔍 Search restaurant name, email, owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PENDING">PENDING</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          {/* Plan filter */}
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300"
          >
            <option value="ALL">All Plans</option>
            <option value="FREE">FREE</option>
            <option value="BASIC">BASIC</option>
            <option value="PRO">PRO</option>
            <option value="PREMIUM">PREMIUM</option>
          </select>
        </div>
      </div>

      {/* Restaurants Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Restaurant</th>
                <th className="px-6 py-4">Owner Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">SaaS Plan</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4">Revenue</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500">
                    Loading platform restaurants…
                  </td>
                </tr>
              ) : filteredRestaurants.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500">
                    No restaurants match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredRestaurants.map((rest) => (
                  <tr key={rest._id} className="hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={rest.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100'}
                          alt={rest.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-white">{rest.name}</div>
                          <div className="text-xs text-slate-400">{rest.address?.city || 'India'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-slate-200">{rest.owner?.name || 'Owner'}</div>
                      <div className="text-xs text-slate-500">{rest.email || rest.owner?.email}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                        rest.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        rest.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                        rest.status === 'SUSPENDED' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                        'bg-slate-700 text-slate-400 border-slate-600'
                      }`}>
                        {rest.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={rest.plan || 'PRO'}
                        disabled={actionLoading}
                        onChange={(e) => handlePlanChange(rest._id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-brand-400 focus:outline-none"
                      >
                        <option value="FREE">FREE</option>
                        <option value="BASIC">BASIC</option>
                        <option value="PRO">PRO</option>
                        <option value="PREMIUM">PREMIUM</option>
                      </select>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-200">
                      {rest.totalOrders || 0}
                    </td>

                    <td className="px-6 py-4 font-semibold text-emerald-400">
                      ₹{(rest.totalSales || 0).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rest.status === 'PENDING' && (
                          <button
                            onClick={() => handleStatusChange(rest._id, 'APPROVED')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-md shadow-emerald-500/20"
                          >
                            ✓ APPROVE
                          </button>
                        )}

                        {rest.status === 'APPROVED' && (
                          <button
                            onClick={() => handleStatusChange(rest._id, 'SUSPENDED')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold rounded-lg border border-red-500/30"
                          >
                            🚫 SUSPEND
                          </button>
                        )}

                        {rest.status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleStatusChange(rest._id, 'APPROVED')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/30"
                          >
                            ⚡ ACTIVATE
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
