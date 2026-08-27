import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Edit2, Trash2, Shield } from 'lucide-react';
import api from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopNav from '../../components/admin/AdminTopNav';

const ROLES = ['owner', 'manager', 'kitchen', 'waiter', 'cashier'];

const ROLE_COLORS = {
  owner:   { bg: 'bg-amber-100 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', icon: '👑' },
  manager: { bg: 'bg-blue-100 dark:bg-blue-950/30',   text: 'text-blue-700 dark:text-blue-400',   icon: '👔' },
  kitchen: { bg: 'bg-orange-100 dark:bg-orange-950/30',text: 'text-orange-700 dark:text-orange-400',icon: '🍳' },
  waiter:  { bg: 'bg-emerald-100 dark:bg-emerald-950/30',text: 'text-emerald-700 dark:text-emerald-400',icon: '🛎️' },
  cashier: { bg: 'bg-purple-100 dark:bg-purple-950/30',text: 'text-purple-700 dark:text-purple-400',icon: '💰' },
};

function StaffCard({ staff, onEdit, onDelete }) {
  const role = ROLE_COLORS[staff.role] || ROLE_COLORS.waiter;
  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
            {role.icon}
          </div>
          <div>
            <p className="font-extrabold text-xs text-slate-900 dark:text-white">{staff.name}</p>
            <p className="text-[10px] text-slate-500">{staff.email}</p>
          </div>
        </div>
        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${role.bg} ${role.text}`}>
          {staff.role}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold ${staff.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {staff.isActive ? '● Active' : '● Inactive'}
        </span>
        <div className="flex gap-2">
          <button onClick={() => onEdit(staff)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Edit2 className="w-3.5 h-3.5 text-blue-500" />
          </button>
          <button onClick={() => onDelete(staff._id)} className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StaffFormModal({ staff, onClose, onSave }) {
  const isEdit = !!staff?._id;
  const [form, setForm] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    password: '',
    role: staff?.role || 'waiter',
    phone: staff?.phone || '',
    isActive: staff?.isActive !== false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form };
    if (!data.password) delete data.password; // Don't update password if empty
    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-black text-sm text-slate-900 dark:text-white">{isEdit ? 'Edit Staff Member' : 'Add Staff Member'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Full Name*</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="John Smith" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Email*</label>
              <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="john@restaurant.com" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 9876543210" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Role*</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">{isEdit ? 'New Password (optional)' : 'Password*'}</label>
              <input type="password" required={!isEdit} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Min 8 characters" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 rounded accent-emerald-500" />
            Account is Active
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black uppercase tracking-wide transition-colors">{isEdit ? 'Save Changes' : 'Create Account'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const StaffManagementPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStaff, setEditingStaff] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/staff');
      if (res.data.success) setStaff(res.data.staff || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleSave = async (data) => {
    try {
      if (editingStaff?._id) {
        await api.put(`/auth/staff/${editingStaff._id}`, data);
      } else {
        await api.post('/auth/staff', data);
      }
      setShowForm(false);
      setEditingStaff(null);
      fetchStaff();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error saving staff member');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff account?')) return;
    try {
      await api.delete(`/auth/staff/${id}`);
      fetchStaff();
    } catch (err) {
      alert('Error deleting staff member');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {showForm && (
        <StaffFormModal
          staff={editingStaff}
          onClose={() => { setShowForm(false); setEditingStaff(null); }}
          onSave={handleSave}
        />
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AdminTopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Staff Management" />

        <div className="px-4 sm:px-6 py-5 space-y-5 flex-1 overflow-y-auto">
          {/* Role summary */}
          <div className="flex items-center gap-2 flex-wrap">
            {ROLES.map(role => {
              const col = ROLE_COLORS[role];
              const count = staff.filter(s => s.role === role).length;
              return (
                <div key={role} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${col.bg} border border-current/20`}>
                  <span>{col.icon}</span>
                  <span className={`text-[10px] font-black ${col.text}`}>{role}: {count}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => { setEditingStaff(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black uppercase tracking-wide transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Staff Member
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {staff.map(s => (
                <StaffCard
                  key={s._id}
                  staff={s}
                  onEdit={(m) => { setEditingStaff(m); setShowForm(true); }}
                  onDelete={handleDelete}
                />
              ))}
              {staff.length === 0 && <p className="col-span-full text-center py-12 text-slate-400 text-xs">No staff accounts found.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffManagementPage;
