import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Hash,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Crown,
  Key,
  RotateCcw,
  Copy,
  Check,
  ShoppingBag,
  Utensils,
  Users,
  LayoutGrid,
  QrCode,
  Tag,
  TrendingUp,
  Activity,
  Database,
  Settings,
  Globe,
  Wifi,
  WifiOff,
  AlertTriangle,
  Edit3,
  Shield,
  CalendarDays,
  Timer,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

function CopyableField({ value, label }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <div className="min-w-0">
        {label && <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">{label}</div>}
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate font-mono">{value || '—'}</div>
      </div>
      <button
        onClick={handleCopy}
        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function MetricCard({ label, value, color = 'text-slate-800 dark:text-white', bg = 'bg-white dark:bg-slate-900', icon: Icon }) {
  return (
    <div className={`${bg} rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-1.5`}>
      {Icon && <Icon className={`w-4 h-4 ${color} mb-1`} />}
      <div className={`text-[10px] font-extrabold uppercase tracking-wider text-slate-400`}>{label}</div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
    </div>
  );
}

// ─── Plan & Status Badges ─────────────────────────────────────────────────────
const PLAN_STYLE = {
  FREE:    'bg-slate-100 dark:bg-slate-800 text-slate-500',
  BASIC:   'bg-sky-100 dark:bg-sky-900/30 text-sky-600',
  PRO:     'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  PREMIUM: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
};
const STATUS_STYLE = {
  APPROVED:  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
  PENDING:   'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
  SUSPENDED: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600',
  REJECTED:  'bg-red-100 dark:bg-red-900/30 text-red-600',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TenantWorkspaceView({
  controlData,
  activeRestaurant,
  onBack,
  onEditCredentials,
  onResetPassword,
  onStatusChange,
  onPlanChange,
}) {
  const [activeSection, setActiveSection] = useState('overview');
  const [tempCreds, setTempCreds] = useState(null);

  if (!controlData) return null;

  const { restaurant, metrics, footprint = [], staffList = [], menuItems = [], tables = [], recentOrders = [] } = controlData;
  const owner = restaurant.owner || {};
  const isOnline = restaurant.isAcceptingOrders;
  const planKey = restaurant.plan || 'PRO';
  const statusKey = restaurant.status || 'APPROVED';
  const subStatus = restaurant.subscriptionStatus || 'ACTIVE';
  const subIsActive = ['ACTIVE', 'TRIAL'].includes(subStatus);

  const navItems = [
    { key: 'overview', label: 'Overview', icon: Activity },
    { key: 'credentials', label: 'Credentials', icon: Key },
    { key: 'footprint', label: 'DB Footprint', icon: Database },
    { key: 'staff', label: 'Staff', icon: Users },
    { key: 'menu', label: 'Menu', icon: Utensils },
    { key: 'tables', label: 'Tables', icon: LayoutGrid },
    { key: 'orders', label: 'Orders', icon: ShoppingBag },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">

      {/* ── TOP BREADCRUMB BAR ── */}
      <div className="shrink-0 px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Admin Dashboard
          </button>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-700 dark:text-slate-200 font-bold truncate max-w-[200px]">{restaurant.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditCredentials && onEditCredentials({
              _id: owner._id,
              restaurantId: restaurant._id,
              name: owner.name,
              email: owner.email,
              mobile: owner.mobile,
              role: 'owner'
            }, 'owner')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-[11px] font-bold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition"
          >
            <Key className="w-3.5 h-3.5" />
            Edit Credentials
          </button>
          <button
            onClick={() => onResetPassword && onResetPassword(restaurant)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Password
          </button>
        </div>
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── RESTAURANT PROFILE HERO CARD ── */}
        <div className="m-5 rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 shadow-2xl shadow-purple-900/30 border border-purple-800/30">
          {/* Banner strip */}
          {restaurant.banner && (
            <div className="relative h-24 overflow-hidden opacity-25">
              <img src={restaurant.banner} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
            </div>
          )}

          <div className="px-6 py-5 space-y-5">
            {/* Badge Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                🍽️ Restaurant Portal
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                Role: OWNER
              </span>
              {isOnline ? (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Online
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-700 text-slate-400 border border-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
                  Offline
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                subIsActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {subIsActive ? '✓ Active Subscription' : `⚠ ${subStatus}`}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${PLAN_STYLE[planKey]}`}>
                {planKey} Plan
              </span>
            </div>

            {/* Name Row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {restaurant.logo ? (
                  <img src={restaurant.logo} alt={restaurant.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500/30 shadow-lg" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-black text-2xl border-2 border-purple-500/30">
                    {restaurant.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-black text-white">{restaurant.name}</h2>
                  {restaurant.tagline && <p className="text-xs text-slate-400 mt-0.5">{restaurant.tagline}</p>}
                </div>
              </div>
            </div>

            {/* Info Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-400" />
                {owner.email || restaurant.email || '—'}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-purple-400" />
                {owner.mobile || restaurant.phone || '—'}
              </span>
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-mono text-purple-300">{restaurant.restaurantCode || restaurant._id}</span>
              </span>
              {restaurant.address?.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  {restaurant.address.city}, {restaurant.address.state}
                </span>
              )}
            </div>

            {/* Bottom metric chips */}
            <div className="flex flex-wrap gap-3 pt-1">
              <div className="px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center min-w-[100px]">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Total Orders</div>
                <div className="text-xl font-black text-white mt-0.5">{metrics.totalOrders}</div>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center min-w-[100px]">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Revenue</div>
                <div className="text-xl font-black text-emerald-400 mt-0.5">₹{metrics.totalRevenue?.toLocaleString()}</div>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center min-w-[100px]">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Last Active</div>
                <div className="text-sm font-black text-white mt-0.5">{timeAgo(owner.lastLogin)}</div>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center min-w-[100px]">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Registered</div>
                <div className="text-sm font-black text-white mt-0.5">{timeAgo(restaurant.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION NAV ── */}
        <div className="px-5 -mt-1">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition ${
                    activeSection === item.key
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 space-y-4">

          {/* ══ OVERVIEW ══ */}
          {activeSection === 'overview' && (
            <div className="space-y-4">

              {/* Business Records Grid */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  Business Records Overview
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'Orders', value: metrics.totalOrders, color: 'text-purple-600', icon: ShoppingBag },
                    { label: 'Menu Items', value: metrics.totalMenuItems, color: 'text-sky-600', icon: Utensils },
                    { label: 'Categories', value: metrics.totalCategories || 0, color: 'text-amber-600', icon: Tag },
                    { label: 'Tables', value: metrics.totalTables, color: 'text-emerald-600', icon: LayoutGrid },
                    { label: 'Staff', value: metrics.totalStaff, color: 'text-rose-600', icon: Users },
                    { label: 'Active Now', value: metrics.activeOrders, color: 'text-orange-600', icon: Activity },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-center border border-slate-100 dark:border-slate-700">
                      <item.icon className={`w-4 h-4 mx-auto mb-1 ${item.color}`} />
                      <div className={`text-xl font-black ${item.color}`}>{item.value ?? 0}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity & Subscription Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Activity & Session Status */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-500" />
                    Activity & Session Status
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 font-semibold">Last Login</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{formatDate(owner.lastLogin)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 font-semibold">Status</span>
                      <span className={`font-bold ${subIsActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {timeAgo(owner.lastLogin)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 font-semibold">Plan Expires</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {restaurant.subscriptionEnd
                          ? formatDate(restaurant.subscriptionEnd)
                          : 'No expiry set'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-400 font-semibold">Account Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${STATUS_STYLE[statusKey]}`}>
                        {statusKey}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Restaurant Settings */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-orange-500" />
                    Restaurant Settings & Profile
                  </h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: 'Restaurant Name', value: restaurant.name },
                      { label: 'Owner Name', value: owner.name || '—' },
                      { label: 'Owner Mobile', value: owner.mobile || restaurant.phone || '—' },
                      { label: 'Lab/Admin Email', value: owner.email || restaurant.email || '—' },
                      { label: 'GST Number', value: restaurant.gstNumber || 'N/A' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <span className="text-slate-400 font-semibold">{row.label}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-right max-w-[180px] truncate">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Plan/Status Controls */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-500" />
                  Account Controls
                </h3>
                <div className="flex flex-wrap gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Account Status</label>
                    <select
                      defaultValue={statusKey}
                      onChange={e => onStatusChange && onStatusChange(restaurant._id, e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="APPROVED">✓ Approved / Active</option>
                      <option value="PENDING">⏳ Pending Review</option>
                      <option value="SUSPENDED">🚫 Suspended</option>
                      <option value="REJECTED">✗ Rejected</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">SaaS Plan</label>
                    <select
                      defaultValue={planKey}
                      onChange={e => onPlanChange && onPlanChange(restaurant._id, e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="FREE">Free</option>
                      <option value="BASIC">Basic</option>
                      <option value="PRO">Pro</option>
                      <option value="PREMIUM">Premium</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Subscription</label>
                    <select
                      defaultValue={subStatus}
                      onChange={e => onPlanChange && onPlanChange(restaurant._id, planKey, e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="TRIAL">Trial</option>
                      <option value="EXPIRED">Expired</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              {recentOrders.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-500" />
                    Recent Customer Orders
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {recentOrders.slice(0, 8).map(order => (
                      <div key={order._id} className="flex items-center justify-between py-2.5">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-white">#{order.orderNumber}</span>
                          <span className="text-slate-400 ml-2">Table #{order.table?.tableNumber || order.tableNumber}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-emerald-600">₹{order.grandTotal?.toFixed(2)}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{order.orderStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ CREDENTIALS ══ */}
          {activeSection === 'credentials' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Account Password (Login ID) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-500" />
                    Account Password
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <CopyableField value={owner.email} label="Login Email (ID)" />
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">Password</div>
                    <div className="text-xs font-semibold text-slate-500 font-mono tracking-widest">••••••••••••</div>
                  </div>
                  <button
                    onClick={() => onResetPassword && onResetPassword(restaurant)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-[10px] font-bold hover:bg-amber-100 dark:hover:bg-amber-900/30 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Main login credentials for this business server.</p>
              </div>

              {/* Owner Mobile */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-sky-500" />
                  Contact Details
                </h3>
                <CopyableField value={owner.mobile || restaurant.phone} label="Owner Mobile" />
                <CopyableField value={restaurant.gstNumber} label="GST Number" />
                <CopyableField value={restaurant.restaurantCode || restaurant._id} label="Restaurant Code / ID" />
              </div>

              {/* Edit Credentials CTA */}
              <div className="md:col-span-2">
                <button
                  onClick={() => onEditCredentials && onEditCredentials({
                    _id: owner._id,
                    restaurantId: restaurant._id,
                    name: owner.name,
                    email: owner.email,
                    mobile: owner.mobile,
                    role: 'owner'
                  }, 'owner')}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Owner Credentials (Email + Password + Mobile)
                </button>
              </div>

              {/* Staff Credentials */}
              <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  Staff Credentials ({staffList.length})
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {staffList.map(s => (
                    <div key={s._id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {s.name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-800 dark:text-white truncate">{s.name}</div>
                          <div className="text-[11px] text-slate-400">{s.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {s.role}
                        </span>
                        <button
                          onClick={() => onEditCredentials && onEditCredentials(s, 'staff')}
                          className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition"
                        >
                          <Key className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ DATABASE FOOTPRINT ══ */}
          {activeSection === 'footprint' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-sky-500" />
                  Database Footprint
                </h3>
                <span className="text-[11px] font-bold text-slate-400">Per collection breakdown</span>
              </div>

              <div className="space-y-2">
                {footprint.map(item => {
                  const maxVal = Math.max(...footprint.map(f => f.count), 1);
                  const pct = Math.round((item.count / maxVal) * 100);
                  return (
                    <div key={item.collection} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{item.collection}</span>
                        <span className="font-bold text-slate-800 dark:text-white">{item.count} items</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-sky-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total count summary */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4">
                {footprint.map(item => (
                  <div key={item.collection} className="text-center">
                    <div className="text-lg font-black text-purple-600 dark:text-purple-400">{item.count}</div>
                    <div className="text-[10px] font-bold text-slate-400">{item.collection}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ STAFF ══ */}
          {activeSection === 'staff' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                All Staff ({staffList.length})
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {staffList.map(s => (
                  <div key={s._id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {s.name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-800 dark:text-white">{s.name}</div>
                        <div className="text-xs text-slate-400">{s.email} {s.mobile ? `• ${s.mobile}` : ''}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800">{s.role}</span>
                      <span className={`w-2 h-2 rounded-full ${s.isActive !== false ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                      <button onClick={() => onEditCredentials && onEditCredentials(s, 'staff')}
                        className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition">
                        <Key className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ MENU ══ */}
          {activeSection === 'menu' && (
            <div className="space-y-3">
              <div className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-orange-500" />
                Menu Items ({menuItems.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {menuItems.map(item => (
                  <div key={item._id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-slate-800 dark:text-white truncate">{item.name}</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">₹{item.price}</div>
                      <div className="text-[10px] text-slate-400">{item.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ TABLES ══ */}
          {activeSection === 'tables' && (
            <div className="space-y-3">
              <div className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-emerald-500" />
                Tables & QR Tokens ({tables.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {tables.map(t => (
                  <div key={t._id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center space-y-1">
                    <div className="text-xl font-black text-slate-800 dark:text-white">T{t.tableNumber}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{t.section}</div>
                    <div className="text-[10px] text-slate-400">{t.capacity} seats</div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold ${
                      t.status === 'Available' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                    }`}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ ORDERS ══ */}
          {activeSection === 'orders' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-purple-500" />
                Recent Orders ({recentOrders.length})
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {recentOrders.map(order => (
                  <div key={order._id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-white">#{order.orderNumber}</div>
                      <div className="text-slate-400 text-[11px]">
                        Table #{order.table?.tableNumber || order.tableNumber} •{' '}
                        {new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-emerald-600">₹{order.grandTotal?.toFixed(2)}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{order.orderStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
