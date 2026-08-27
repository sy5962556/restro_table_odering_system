import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Copy } from 'lucide-react';
import api from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopNav from '../../components/admin/AdminTopNav';

function OfferCard({ offer, onEdit, onDelete, onToggle }) {
  const isExpired = offer.validUntil && new Date(offer.validUntil) < new Date();

  return (
    <div className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border ${isExpired ? 'border-slate-200 dark:border-slate-700 opacity-60' : offer.isActive ? 'border-emerald-300 dark:border-emerald-800' : 'border-slate-200 dark:border-slate-800'} shadow-xs space-y-3`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-brand-600 dark:text-brand-400">{offer.code}</span>
            <button
              onClick={() => navigator.clipboard.writeText(offer.code)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Copy className="w-3 h-3 text-slate-400" />
            </button>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mt-0.5">{offer.title}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-black text-lg text-emerald-600">
            {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
          </p>
          {isExpired && <span className="text-[10px] text-rose-500 font-bold">EXPIRED</span>}
        </div>
      </div>

      <div className="space-y-1 text-[10px] text-slate-500 dark:text-slate-400">
        {offer.minimumOrderValue > 0 && <p>Min. order: ₹{offer.minimumOrderValue}</p>}
        {offer.maxDiscount > 0 && <p>Max discount: ₹{offer.maxDiscount}</p>}
        {offer.usageLimit > 0 && <p>Used {offer.usageCount || 0} / {offer.usageLimit} times</p>}
        {offer.validFrom && <p>Valid: {new Date(offer.validFrom).toLocaleDateString()} – {offer.validUntil ? new Date(offer.validUntil).toLocaleDateString() : 'No expiry'}</p>}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onToggle(offer._id, !offer.isActive)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-colors ${offer.isActive ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
        >
          {offer.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
          {offer.isActive ? 'Active' : 'Inactive'}
        </button>
        <button onClick={() => onEdit(offer)} className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 transition-colors">
          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
        </button>
        <button onClick={() => onDelete(offer._id)} className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
        </button>
      </div>
    </div>
  );
}

function OfferFormModal({ offer, onClose, onSave }) {
  const isEdit = !!offer?._id;
  const [form, setForm] = useState({
    code: offer?.code || '',
    title: offer?.title || '',
    description: offer?.description || '',
    discountType: offer?.discountType || 'percentage',
    discountValue: offer?.discountValue || '',
    minimumOrderValue: offer?.minimumOrderValue || 0,
    maxDiscount: offer?.maxDiscount || 0,
    usageLimit: offer?.usageLimit || 0,
    validFrom: offer?.validFrom ? offer.validFrom.split('T')[0] : '',
    validUntil: offer?.validUntil ? offer.validUntil.split('T')[0] : '',
    isActive: offer?.isActive !== false,
  });

  const generateCode = () => {
    const code = `ROYAL${Math.random().toString(36).toUpperCase().slice(2, 7)}`;
    setForm(p => ({ ...p, code }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-black text-sm text-slate-900 dark:text-white">{isEdit ? 'Edit Offer' : 'Create Offer'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Coupon Code</label>
            <div className="flex gap-2">
              <input required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <button type="button" onClick={generateCode} className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors whitespace-nowrap">Auto Generate</button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Title</label>
            <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Weekend Special Discount" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Discount Type</label>
              <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Discount Value</label>
              <input required type="number" min="0" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))} placeholder={form.discountType === 'percentage' ? '20' : '100'} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Min Order (₹)</label>
              <input type="number" min="0" value={form.minimumOrderValue} onChange={e => setForm(p => ({ ...p, minimumOrderValue: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Max Cap (₹)</label>
              <input type="number" min="0" value={form.maxDiscount} onChange={e => setForm(p => ({ ...p, maxDiscount: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Valid From</label>
              <input type="date" value={form.validFrom} onChange={e => setForm(p => ({ ...p, validFrom: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Valid Until</label>
              <input type="date" value={form.validUntil} onChange={e => setForm(p => ({ ...p, validUntil: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Usage Limit (0 = unlimited)</label>
            <input type="number" min="0" value={form.usageLimit} onChange={e => setForm(p => ({ ...p, usageLimit: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 rounded accent-emerald-500" />
            Active immediately
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black uppercase tracking-wide transition-colors">{isEdit ? 'Save Changes' : 'Create Offer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const OffersPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOffer, setEditingOffer] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/offers');
      if (res.data.success) setOffers(res.data.offers || []);
    } catch (err) {
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const handleSave = async (data) => {
    try {
      if (editingOffer?._id) {
        await api.put(`/offers/${editingOffer._id}`, data);
      } else {
        await api.post('/offers', data);
      }
      setShowForm(false);
      setEditingOffer(null);
      fetchOffers();
    } catch (err) {
      alert(err?.response?.data?.message || 'Error saving offer');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this offer?')) return;
    await api.delete(`/offers/${id}`);
    fetchOffers();
  };

  const handleToggle = async (id, val) => {
    await api.patch(`/offers/${id}`, { isActive: val });
    fetchOffers();
  };

  const activeCount = offers.filter(o => o.isActive && (!o.validUntil || new Date(o.validUntil) > new Date())).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {showForm && (
        <OfferFormModal
          offer={editingOffer}
          onClose={() => { setShowForm(false); setEditingOffer(null); }}
          onSave={handleSave}
        />
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AdminTopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Offers & Coupons" />

        <div className="px-4 sm:px-6 py-5 space-y-5 flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2 rounded-xl">
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">{activeCount} active offers running</span>
            </div>
            <button
              onClick={() => { setEditingOffer(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black uppercase tracking-wide transition-colors ml-auto"
            >
              <Plus className="w-4 h-4" /> Create Offer
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {offers.map(offer => (
                <OfferCard
                  key={offer._id}
                  offer={offer}
                  onEdit={(o) => { setEditingOffer(o); setShowForm(true); }}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
              {offers.length === 0 && (
                <p className="col-span-full text-center py-12 text-slate-400 text-xs">No offers or coupons yet. Create your first one!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OffersPage;
