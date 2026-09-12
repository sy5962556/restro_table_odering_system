import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Building2,
  Users,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Key,
  RotateCcw,
  ExternalLink,
  Wifi,
  WifiOff,
  Crown,
  ChefHat,
  Coffee,
  Zap,
  GlassWater,
  Store
} from 'lucide-react';

// ─── Cuisine Type Detector ───────────────────────────────────────────────────
function detectCuisineType(restaurant) {
  const text = `${restaurant.name} ${restaurant.tagline || ''} ${restaurant.description || ''}`.toLowerCase();
  if (/bar|lounge|pub|brewery|cocktail|wine|whisky/.test(text)) {
    return { label: 'Bar & Lounge', color: 'bg-rose-500/15 text-rose-400 border border-rose-500/25', icon: GlassWater };
  }
  if (/cafe|bakery|coffee|brew|patisserie|biscuit|tea/.test(text)) {
    return { label: 'Cafe & Bakery', color: 'bg-sky-500/15 text-sky-400 border border-sky-500/25', icon: Coffee };
  }
  if (/qsr|fast|quick|burger|pizza|wrap|sandwich|taco|fry/.test(text)) {
    return { label: 'QSR / Quick Service', color: 'bg-amber-500/15 text-amber-400 border border-amber-500/25', icon: Zap };
  }
  if (/dhaba|street|biryani|thali|punjabi|south|udupi/.test(text)) {
    return { label: 'Local & Casual', color: 'bg-orange-500/15 text-orange-400 border border-orange-500/25', icon: Store };
  }
  return { label: 'Fine Dining', color: 'bg-purple-500/15 text-purple-400 border border-purple-500/25', icon: ChefHat };
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, accent, icon: Icon }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${accent}`} />}
      </div>
      <div className={`text-3xl font-black ${accent}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-400 font-semibold">{sub}</div>}
    </div>
  );
}

// ─── Status & Expiry Cell ────────────────────────────────────────────────────
function StatusExpiry({ restaurant }) {
  const isOnline = restaurant.isOnline || restaurant.isAcceptingOrders;
  const isActive = restaurant.subscriptionStatus === 'ACTIVE' || restaurant.subscriptionStatus === 'TRIAL';
  const endDate = restaurant.subscriptionEnd
    ? new Date(restaurant.subscriptionEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="flex flex-col gap-1.5">
      {/* Online / Offline dot + subscription active badge */}
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-emerald-400 ring-2 ring-emerald-400/30 animate-pulse' : 'bg-slate-500'}`} />
        <span className={`text-[10px] font-extrabold ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
          isActive
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-rose-500/15 text-rose-400'
        }`}>
          {isActive ? 'Active' : restaurant.subscriptionStatus}
        </span>
      </div>
      {/* Expiry date */}
      <span className="text-[10px] text-slate-500 font-medium">
        {endDate ? `Expires: ${endDate}` : 'No Expiry Set'}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminMasterControlView({
  treeData = [],
  stats,
  loading,
  onRefresh,
  onRegister,
  onEnterControlMode,
  onEditCredentials,
  onResetPassword
}) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  // ── Derived counts for KPI cards ──
  const totalAccounts = treeData.length;
  const paidPlanCount = treeData.filter(r => ['PRO', 'PREMIUM'].includes(r.plan)).length;
  const freePlanCount = treeData.filter(r => ['FREE', 'BASIC'].includes(r.plan)).length;
  const activeCount = treeData.filter(r => r.subscriptionStatus === 'ACTIVE' || r.subscriptionStatus === 'TRIAL').length;
  const expiredCount = treeData.filter(r => r.status === 'SUSPENDED' || r.subscriptionStatus === 'EXPIRED' || r.subscriptionStatus === 'CANCELLED').length;
  const activeRate = totalAccounts > 0 ? Math.round((activeCount / totalAccounts) * 100) : 0;
  const expiredRate = totalAccounts > 0 ? Math.round((expiredCount / totalAccounts) * 100) : 0;

  const proCount = treeData.filter(r => r.plan === 'PRO').length;
  const premiumCount = treeData.filter(r => r.plan === 'PREMIUM').length;
  const basicCount = treeData.filter(r => r.plan === 'BASIC').length;
  const freeCount = treeData.filter(r => r.plan === 'FREE').length;
  const suspendedCount = treeData.filter(r => r.status === 'SUSPENDED').length;

  // ── Filter tabs config ──
  const tabs = [
    { key: 'ALL', label: `All Accounts (${totalAccounts})` },
    { key: 'PAID', label: `PRO / PREMIUM (${proCount + premiumCount})` },
    { key: 'FREE', label: `FREE / BASIC (${freeCount + basicCount})` },
    { key: 'SUSPENDED', label: `Suspended (${suspendedCount})` },
  ];

  // ── Filtered + searched data ──
  const filteredData = useMemo(() => {
    let data = treeData;

    // Tab filter
    if (activeFilter === 'PAID') data = data.filter(r => ['PRO', 'PREMIUM'].includes(r.plan));
    else if (activeFilter === 'FREE') data = data.filter(r => ['FREE', 'BASIC'].includes(r.plan));
    else if (activeFilter === 'SUSPENDED') data = data.filter(r => r.status === 'SUSPENDED');

    // Search filter
    if (search.trim()) {
      const s = search.toLowerCase();
      data = data.filter(r =>
        r.name?.toLowerCase().includes(s) ||
        r.email?.toLowerCase().includes(s) ||
        r.restaurantCode?.toLowerCase().includes(s) ||
        r.city?.toLowerCase().includes(s) ||
        r.phone?.toLowerCase().includes(s) ||
        r.ownerName?.toLowerCase().includes(s)
      );
    }

    return data;
  }, [treeData, activeFilter, search]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">

      {/* ── HEADER ── */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col gap-3 shrink-0">
        {/* Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-purple-500" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                SUPER ADMIN
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              Admin Master Control
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Manage registered restaurants, inspect passwords, activity, and subscription usage.
            </p>
          </div>

          {/* Action buttons + Search */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search business or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 w-52"
              />
            </div>

            <button
              onClick={onRefresh}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onRegister}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-700 hover:to-brand-700 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Register Restaurant</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5">

          {/* ── KPI CARDS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KPICard
              label="Total Accounts"
              value={totalAccounts}
              sub={`${activeCount} active · ${expiredCount} expired`}
              accent="text-slate-800 dark:text-white"
              icon={Building2}
            />
            <KPICard
              label="PRO / PREMIUM Plans"
              value={paidPlanCount}
              sub={`${proCount} Pro · ${premiumCount} Premium`}
              accent="text-purple-500"
              icon={Crown}
            />
            <KPICard
              label="FREE / BASIC Plans"
              value={freePlanCount}
              sub={`${basicCount} Basic · ${freeCount} Free`}
              accent="text-sky-500"
              icon={Users}
            />
            <KPICard
              label="Active Plans"
              value={activeCount}
              sub={`${activeRate}% active rate`}
              accent="text-emerald-500"
              icon={TrendingUp}
            />
            <KPICard
              label="Expired Plans"
              value={expiredCount}
              sub={expiredCount === 0 ? '0% expired 🎉' : `${expiredRate}% expired`}
              accent={expiredCount > 0 ? 'text-rose-500' : 'text-emerald-500'}
              icon={AlertCircle}
            />
          </div>

          {/* ── FILTER SEGMENT TABS ── */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1 w-fit">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeFilter === tab.key
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── MASTER ACCOUNTS TABLE ── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                {/* Table Head */}
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                    <th className="px-5 py-3.5 font-extrabold text-[10px] uppercase tracking-wider text-slate-400 w-56">Business Name</th>
                    <th className="px-4 py-3.5 font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Type</th>
                    <th className="px-4 py-3.5 font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Contact</th>
                    <th className="px-4 py-3.5 font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Role</th>
                    <th className="px-4 py-3.5 font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Status & Expiry</th>
                    <th className="px-4 py-3.5 font-extrabold text-[10px] uppercase tracking-wider text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    // Loading skeleton rows
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-5 py-4"><div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-36 mb-1.5" /><div className="h-2 bg-slate-100 dark:bg-slate-700 rounded w-20" /></td>
                        <td className="px-4 py-4"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-20" /></td>
                        <td className="px-4 py-4"><div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-32 mb-1.5" /><div className="h-2 bg-slate-100 dark:bg-slate-700 rounded w-24" /></td>
                        <td className="px-4 py-4"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-14" /></td>
                        <td className="px-4 py-4"><div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-28 mb-1.5" /><div className="h-2 bg-slate-100 dark:bg-slate-700 rounded w-24" /></td>
                        <td className="px-4 py-4 text-right"><div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-xl w-24 ml-auto" /></td>
                      </tr>
                    ))
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-400 text-sm font-bold">
                        <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                        No restaurants found
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((rest) => {
                      const cuisine = detectCuisineType(rest);
                      const CuisineIcon = cuisine.icon;
                      const isActive = rest.status === 'APPROVED';

                      return (
                        <tr
                          key={rest._id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* ── Business Name ── */}
                          <td className="px-5 py-3.5">
                            <div
                              className="flex items-center gap-2.5 cursor-pointer"
                              onClick={() => onEditCredentials && onEditCredentials({
                                _id: rest._id,
                                restaurantId: rest._id,
                                name: rest.ownerName,
                                email: rest.email,
                                mobile: rest.phone,
                                role: 'owner'
                              }, 'owner')}
                            >
                              {rest.logo ? (
                                <img
                                  src={rest.logo}
                                  alt={rest.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 font-black text-sm">
                                  {rest.name?.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[130px] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                  {rest.name}
                                </div>
                                <div className="text-[10px] font-mono text-purple-500 dark:text-purple-400 font-bold">
                                  {rest.restaurantCode || rest.id}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* ── Type Badge ── */}
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${cuisine.color}`}>
                              <CuisineIcon className="w-3 h-3" />
                              {cuisine.label}
                            </span>
                          </td>

                          {/* ── Contact Stack ── */}
                          <td className="px-4 py-3.5">
                            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[160px]">
                              {rest.email}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {rest.phone || '—'}
                            </div>
                          </td>

                          {/* ── Role Badge ── */}
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              owner
                            </span>
                          </td>

                          {/* ── Status & Expiry ── */}
                          <td className="px-4 py-3.5">
                            <StatusExpiry restaurant={rest} />
                          </td>

                          {/* ── Action Buttons ── */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Inspect / Edit Credentials */}
                              <button
                                onClick={() => onEditCredentials && onEditCredentials({
                                  _id: rest._id,
                                  restaurantId: rest._id,
                                  name: rest.ownerName,
                                  email: rest.email,
                                  mobile: rest.phone,
                                  role: 'owner'
                                }, 'owner')}
                                title="Inspect & Edit Credentials"
                                className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/20 transition"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() => onResetPassword && onResetPassword(rest)}
                                title="Reset Admin Password"
                                className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>

                              {/* Manage Workspace */}
                              <button
                                onClick={() => onEnterControlMode && onEnterControlMode(rest, 'dashboard')}
                                title="Manage Restaurant Workspace"
                                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-extrabold transition shadow-sm shadow-purple-500/20 flex items-center gap-1"
                              >
                                <span>Manage</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            {filteredData.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
                <span className="text-[11px] text-slate-400 font-semibold">
                  Showing {filteredData.length} of {totalAccounts} restaurants
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  {activeCount} active · {expiredCount} expired
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
