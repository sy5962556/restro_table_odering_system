import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  Grid, 
  Activity, 
  Utensils, 
  Boxes, 
  Tag, 
  Users, 
  BarChart3, 
  MessageSquareHeart, 
  QrCode, 
  ShieldCheck, 
  Settings, 
  LogOut,
  Moon,
  Sun,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const AdminSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/orders', icon: ShoppingBag, label: 'Live Orders' },
    { to: '/admin/kitchen', icon: ChefHat, label: 'Kitchen KDS' },
    { to: '/admin/tables', icon: Grid, label: 'Table Floor Plan' },
    { to: '/admin/table-analytics', icon: Activity, label: 'Table Heatmap' },
    { to: '/admin/menu', icon: Utensils, label: 'Menu & Dishes' },
    { to: '/admin/inventory', icon: Boxes, label: 'Inventory Stock' },
    { to: '/admin/offers', icon: Tag, label: 'Offers & Coupons' },
    { to: '/admin/customers', icon: Users, label: 'Customer Loyalty' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Reports & Forecasts' },
    { to: '/admin/feedback', icon: MessageSquareHeart, label: 'Guest Feedback' },
    { to: '/admin/qr-codes', icon: QrCode, label: 'QR Code Standees' },
    { to: '/admin/staff', icon: ShieldCheck, label: 'Staff Management' },
    { to: '/admin/settings', icon: Settings, label: 'Restaurant Settings' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-xl font-black shadow-glow">
              🍽️
            </div>
            <div>
              <h2 className="font-black text-sm text-slate-900 dark:text-white tracking-tight leading-tight">
                Royal Spice POS
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Management System
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-glow'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Bottom User & System Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          {/* User profile capsule */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[100px]">{user?.name || 'Staff'}</p>
                <span className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400">{user?.role || 'Manager'}</span>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl font-bold text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
