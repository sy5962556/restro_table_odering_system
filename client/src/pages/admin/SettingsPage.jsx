import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Save, Upload, Globe, DollarSign, Smartphone, Bell } from 'lucide-react';
import api from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopNav from '../../components/admin/AdminTopNav';

const SECTION_TABS = [
  { id: 'general', label: '🏢 General', icon: Globe },
  { id: 'billing', label: '💳 Billing & Tax', icon: DollarSign },
  { id: 'upi', label: '📱 UPI / Payments', icon: Smartphone },
  { id: 'notifications', label: '🔔 Notifications', icon: Bell },
];

export const SettingsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/restaurants/mine');
      if (res.data.success) setSettings(res.data.restaurant || {});
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/restaurants/mine', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err?.response?.data?.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const update = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));
  const updateNested = (parent, key, val) => setSettings(prev => ({ ...prev, [parent]: { ...(prev[parent] || {}), [key]: val } }));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AdminTopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Restaurant Settings" />

        <div className="px-4 sm:px-6 py-5 space-y-5 flex-1 overflow-y-auto max-w-3xl mx-auto w-full">
          {/* Section Tabs */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1">
            {SECTION_TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-colors text-center ${
                  tab === t.id ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* General Settings */}
          {tab === 'general' && (
            <div className="space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Restaurant Information</h3>

              {settings?.logoUrl && (
                <div className="flex items-center gap-4">
                  <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700" />
                  <p className="text-xs text-slate-500">Current logo</p>
                </div>
              )}

              {[
                { key: 'name', label: 'Restaurant Name', placeholder: 'The Royal Spice Lounge' },
                { key: 'logoUrl', label: 'Logo URL', placeholder: 'https://…' },
                { key: 'address', label: 'Address', placeholder: '123 MG Road, Bangalore' },
                { key: 'phone', label: 'Phone', placeholder: '+91 9876543210' },
                { key: 'email', label: 'Email', placeholder: 'contact@restaurant.com' },
                { key: 'website', label: 'Website', placeholder: 'https://restaurant.com' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">{field.label}</label>
                  <input
                    value={settings?.[field.key] || ''}
                    onChange={e => update(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              ))}

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Description / Tagline</label>
                <textarea
                  value={settings?.description || ''}
                  onChange={e => update('description', e.target.value)}
                  rows={2}
                  placeholder="Premium fine dining experience…"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Billing & Tax */}
          {tab === 'billing' && (
            <div className="space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Tax & Service Charges</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">CGST Rate (%)</label>
                  <input type="number" min="0" max="30" step="0.5" value={settings?.cgstRate || 2.5} onChange={e => update('cgstRate', parseFloat(e.target.value))} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">SGST Rate (%)</label>
                  <input type="number" min="0" max="30" step="0.5" value={settings?.sgstRate || 2.5} onChange={e => update('sgstRate', parseFloat(e.target.value))} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Service Charge (%)</label>
                  <input type="number" min="0" max="20" step="0.5" value={settings?.serviceChargeRate || 2.5} onChange={e => update('serviceChargeRate', parseFloat(e.target.value))} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">GSTIN</label>
                  <input value={settings?.gstin || ''} onChange={e => update('gstin', e.target.value)} placeholder="27AAAPL1234C1Z5" className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                ⚠️ GST rates affect the automatic billing calculation for all new orders. Changing mid-day may cause inconsistencies in today's bills.
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-xs text-slate-900 dark:text-white">Loyalty Program</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Points per ₹100</label>
                    <input type="number" min="0" value={settings?.loyaltySettings?.pointsPerRupee * 100 || 5} onChange={e => updateNested('loyaltySettings', 'pointsPerRupee', parseFloat(e.target.value) / 100)} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Min Points to Redeem</label>
                    <input type="number" min="0" value={settings?.loyaltySettings?.minimumRedemption || 100} onChange={e => updateNested('loyaltySettings', 'minimumRedemption', parseInt(e.target.value))} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* UPI Settings */}
          {tab === 'upi' && (
            <div className="space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">UPI & Payment Settings</h3>
              {[
                { key: 'upiId', label: 'UPI ID / VPA', placeholder: 'restaurant@paytm' },
                { key: 'upiName', label: 'UPI Display Name', placeholder: 'The Royal Spice Lounge' },
                { key: 'merchantCode', label: 'Merchant Code (optional)', placeholder: 'MERCHANT001' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">{field.label}</label>
                  <input
                    value={settings?.paymentSettings?.[field.key] || ''}
                    onChange={e => updateNested('paymentSettings', field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              ))}

              <div className="space-y-3">
                <h4 className="font-black text-xs text-slate-900 dark:text-white">Accepted Payment Methods</h4>
                {['Cash', 'UPI', 'Card', 'Online'].map(method => (
                  <label key={method} className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings?.acceptedPaymentMethods?.includes(method) ?? true}
                      onChange={(e) => {
                        const methods = settings?.acceptedPaymentMethods || ['Cash', 'UPI', 'Card', 'Online'];
                        if (e.target.checked) {
                          update('acceptedPaymentMethods', [...methods, method]);
                        } else {
                          update('acceptedPaymentMethods', methods.filter(m => m !== method));
                        }
                      }}
                      className="w-4 h-4 rounded accent-brand-500"
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <div className="space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Notification Preferences</h3>
              <p className="text-xs text-slate-500">Configure which events trigger audio alerts and notifications for your staff.</p>

              {[
                { key: 'newOrderChime', label: '🔔 New Order Received', desc: 'Plays audio alert when a customer places an order' },
                { key: 'waiterCallAlert', label: '🛎️ Waiter Call', desc: 'Audio alert when a customer requests service' },
                { key: 'billRequestAlert', label: '🧾 Bill Request', desc: 'Alert when a customer requests their bill' },
                { key: 'lowStockAlert', label: '⚠️ Low Stock Warning', desc: 'Alert when inventory falls below minimum threshold' },
                { key: 'paymentAlert', label: '💳 Payment Completed', desc: 'Notification when a payment is settled' },
              ].map(pref => (
                <label key={pref.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">{pref.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{pref.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings?.notificationPrefs?.[pref.key] !== false}
                    onChange={(e) => updateNested('notificationPrefs', pref.key, e.target.checked)}
                    className="w-4 h-4 rounded accent-brand-500 shrink-0 ml-3"
                  />
                </label>
              ))}
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end sticky bottom-0 pb-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wide transition-all ${
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-brand-500 hover:bg-brand-600 text-white shadow-glow'
              }`}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : saved ? '✓ Saved Successfully!' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
