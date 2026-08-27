import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, Star, Phone, ShoppingBag, Gift } from 'lucide-react';
import api from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopNav from '../../components/admin/AdminTopNav';

function CustomerCard({ customer }) {
  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-extrabold text-xs text-slate-900 dark:text-white">{customer.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Phone className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-slate-500">{customer.phone}</span>
          </div>
        </div>
        <div className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${
          customer.loyaltyTier === 'Gold' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' :
          customer.loyaltyTier === 'Silver' ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
          'bg-slate-100 dark:bg-slate-800 text-slate-500'
        }`}>
          {customer.loyaltyTier || 'Bronze'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
          <ShoppingBag className="w-3 h-3 text-brand-500 mx-auto mb-1" />
          <p className="font-black text-xs text-slate-900 dark:text-white">{customer.visitCount || 0}</p>
          <p className="text-[9px] text-slate-400">Visits</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block">₹{customer.totalSpent?.toLocaleString() || 0}</span>
          <p className="text-[9px] text-slate-400">Total Spent</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
          <Gift className="w-3 h-3 text-purple-500 mx-auto mb-1" />
          <p className="font-black text-xs text-purple-600 dark:text-purple-400">{customer.loyaltyPoints || 0}</p>
          <p className="text-[9px] text-slate-400">Points</p>
        </div>
      </div>

      {customer.favoriteItems?.length > 0 && (
        <div>
          <p className="text-[9px] font-bold uppercase text-slate-400 mb-1.5">Favourite Dishes:</p>
          <div className="flex flex-wrap gap-1">
            {customer.favoriteItems.slice(0, 3).map((item, i) => (
              <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400 font-bold">{item}</span>
            ))}
          </div>
        </div>
      )}

      <p className="text-[9px] text-slate-400">
        Last visit: {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never'}
      </p>
    </div>
  );
}

export const CustomersPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState('all');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers');
      if (res.data.success) setCustomers(res.data.customers || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filtered = customers.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search);
    const matchTier = filterTier === 'all' || c.loyaltyTier === filterTier;
    return matchSearch && matchTier;
  });

  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AdminTopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Customer CRM" />

        <div className="px-4 sm:px-6 py-5 space-y-5 flex-1 overflow-y-auto">
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Guests', value: customers.length, icon: '👥' },
              { label: 'Total Spent', value: `₹${customers.reduce((s, c) => s + (c.totalSpent || 0), 0).toLocaleString()}`, icon: '💰' },
              { label: 'Loyalty Points', value: totalLoyaltyPoints.toLocaleString(), icon: '🎁' },
            ].map(s => (
              <div key={s.label} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="font-black text-base text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or phone…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <select value={filterTier} onChange={e => setFilterTier(e.target.value)} className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="all">All Tiers</option>
              <option value="Bronze">Bronze</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
            </select>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(c => <CustomerCard key={c._id} customer={c} />)}
              {filtered.length === 0 && <p className="col-span-full text-center py-12 text-slate-400 text-xs">No customers found.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomersPage;
