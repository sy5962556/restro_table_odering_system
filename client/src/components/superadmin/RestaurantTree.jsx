import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Globe, 
  Building2, 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  ShoppingBag, 
  MapPin, 
  MousePointerClick, 
  ShieldCheck, 
  MoreVertical, 
  Key, 
  Lock, 
  Unlock, 
  ExternalLink,
  ChefHat,
  Grid,
  Utensils,
  Boxes,
  Tag,
  MessageSquareHeart,
  QrCode,
  Settings,
  Activity,
  FileText
} from 'lucide-react';

export default function RestaurantTree({ 
  treeData, 
  activeTab, 
  setActiveTab, 
  activeRestaurant, 
  onEnterControlMode, 
  onResetPassword, 
  onStatusChange 
}) {
  const [platformExpanded, setPlatformExpanded] = useState(true);
  const [restaurantsExpanded, setRestaurantsExpanded] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [menuOpenId, setMenuOpenId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const toggleNodeExpand = (id, e) => {
    e?.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allExpanded = {};
    treeData.forEach(r => { allExpanded[r._id] = true; });
    setExpandedNodes(allExpanded);
    setRestaurantsExpanded(true);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const filteredTree = treeData.filter(r => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch = !searchTerm ||
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.restaurantCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-300 select-none shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-glow">
            👑
          </div>
          <div>
            <h2 className="font-extrabold text-xs uppercase tracking-wider text-white">Super Admin Center</h2>
            <span className="text-[10px] text-purple-400 font-bold">Restaurant Tree Control</span>
          </div>
        </div>

        {/* Tree Search & Filters */}
        <div className="mt-3 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search ID, name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-between gap-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">APPROVED</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="PENDING">PENDING</option>
              <option value="REJECTED">REJECTED</option>
            </select>

            <button
              onClick={expandAll}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition"
              title="Expand All Nodes"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition"
              title="Collapse All Nodes"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Tree Content Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs">
        
        {/* ─── PLATFORM SECTION ─── */}
        <div>
          <div 
            onClick={() => setPlatformExpanded(!platformExpanded)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer text-slate-400 hover:text-white font-bold"
          >
            {platformExpanded ? <ChevronDown className="w-4 h-4 text-purple-400" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
            <Globe className="w-4 h-4 text-purple-400" />
            <span className="uppercase tracking-wider text-[11px]">GLOBAL PLATFORM</span>
          </div>

          {platformExpanded && (
            <div className="pl-6 space-y-0.5 mt-1 border-l border-slate-800 ml-3">
              {[
                { id: 'global-dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'global-restaurants', label: 'All Restaurants', icon: Building2 },
                { id: 'global-users', label: 'All Users', icon: Users },
                { id: 'global-orders', label: 'All Orders', icon: ShoppingBag },
                { id: 'global-reports', label: 'Global Revenue', icon: BarChart3 },
                { id: 'location-monitor', label: 'Location Monitor', icon: MapPin },
                { id: 'click-logger', label: 'Click Logger', icon: MousePointerClick },
                { id: 'audit-logs', label: 'System Audit Logs', icon: ShieldCheck }
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id && !activeRestaurant;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition text-left font-semibold ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-glow'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── RESTAURANTS SECTION ─── */}
        <div>
          <div 
            onClick={() => setRestaurantsExpanded(!restaurantsExpanded)}
            className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer text-slate-400 hover:text-white font-bold"
          >
            <div className="flex items-center gap-1.5">
              {restaurantsExpanded ? <ChevronDown className="w-4 h-4 text-brand-400" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
              <Building2 className="w-4 h-4 text-brand-400" />
              <span className="uppercase tracking-wider text-[11px]">RESTAURANTS ({filteredTree.length})</span>
            </div>
          </div>

          {restaurantsExpanded && (
            <div className="pl-3 space-y-1.5 mt-1 border-l border-slate-800/80 ml-3">
              {filteredTree.length === 0 ? (
                <div className="p-3 text-center text-slate-500 text-[11px] italic">
                  No matching restaurants found.
                </div>
              ) : (
                filteredTree.map(rest => {
                  const isNodeExpanded = !!expandedNodes[rest._id];
                  const isTargetSelected = activeRestaurant?._id === rest._id;

                  return (
                    <div key={rest._id} className="space-y-0.5">
                      {/* Restaurant Parent Node */}
                      <div className={`relative flex items-center justify-between p-2 rounded-xl border transition ${
                        isTargetSelected
                          ? 'bg-purple-950/60 border-purple-500/60 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/80 text-slate-300'
                      }`}>
                        
                        <div 
                          onClick={() => onEnterControlMode(rest, 'dashboard')}
                          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                        >
                          <button
                            onClick={(e) => toggleNodeExpand(rest._id, e)}
                            className="p-0.5 text-slate-400 hover:text-white"
                          >
                            {isNodeExpanded ? <ChevronDown className="w-3.5 h-3.5 text-purple-400" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>

                          {/* Status Dot */}
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            rest.status === 'APPROVED' ? 'bg-emerald-400 ring-2 ring-emerald-400/20' :
                            rest.status === 'SUSPENDED' ? 'bg-rose-500 ring-2 ring-rose-500/20' : 'bg-amber-400'
                          }`} />

                          <div className="min-w-0 leading-tight">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-white text-xs truncate max-w-[120px]">{rest.name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-purple-300/80 font-bold block">{rest.restaurantCode}</span>
                          </div>
                        </div>

                        {/* 3-Dot Action Menu Button */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === rest._id ? null : rest._id);
                            }}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* Action Dropdown Menu */}
                          {menuOpenId === rest._id && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-6 z-50 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 text-[11px] space-y-0.5 font-semibold text-slate-200"
                            >
                              <button
                                onClick={() => {
                                  setMenuOpenId(null);
                                  onEnterControlMode(rest, 'dashboard');
                                }}
                                className="w-full px-3 py-1.5 hover:bg-purple-600 hover:text-white text-left flex items-center gap-2"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                                <span>Manage Restaurant (Control)</span>
                              </button>

                              <button
                                onClick={() => {
                                  setMenuOpenId(null);
                                  onResetPassword(rest);
                                }}
                                className="w-full px-3 py-1.5 hover:bg-slate-800 text-left flex items-center gap-2 text-amber-300"
                              >
                                <Key className="w-3.5 h-3.5 text-amber-400" />
                                <span>Reset Admin Password</span>
                              </button>

                              {rest.status === 'APPROVED' ? (
                                <button
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    onStatusChange(rest._id, 'SUSPENDED');
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-rose-600 hover:text-white text-left flex items-center gap-2 text-rose-400"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Suspend Restaurant</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    onStatusChange(rest._id, 'APPROVED');
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-emerald-600 hover:text-white text-left flex items-center gap-2 text-emerald-400"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                  <span>Activate Restaurant</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded Child Sub-Tree Nodes */}
                      {isNodeExpanded && (
                        <div className="pl-5 border-l border-purple-500/30 ml-2 space-y-0.5">
                          {[
                            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                            { id: 'account', label: 'Account & Plan', icon: FileText },
                            { id: 'users', label: 'Users & Staff', icon: Users },
                            { id: 'menu', label: 'Menu & Dishes', icon: Utensils },
                            { id: 'tables', label: 'Tables & Floor', icon: Grid },
                            { id: 'qr-codes', label: 'QR Codes', icon: QrCode },
                            { id: 'orders', label: 'Live Orders', icon: ShoppingBag },
                            { id: 'kitchen', label: 'Kitchen KDS', icon: ChefHat },
                            { id: 'reports', label: 'Financial Reports', icon: BarChart3 },
                            { id: 'settings', label: 'Settings', icon: Settings },
                            { id: 'activity', label: 'Activity Logs', icon: Activity }
                          ].map(sub => {
                            const SubIcon = sub.icon;
                            const isSubActive = isTargetSelected && activeTab === sub.id;

                            return (
                              <button
                                key={sub.id}
                                onClick={() => onEnterControlMode(rest, sub.id)}
                                className={`w-full flex items-center gap-2 px-2.5 py-1 rounded-lg text-left transition font-medium text-[11px] ${
                                  isSubActive
                                    ? 'bg-purple-600 text-white font-bold shadow-sm'
                                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                                }`}
                              >
                                <SubIcon className="w-3 h-3 shrink-0" />
                                <span>{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
