import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function OnboardingWizardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const steps = [
    { title: 'Restaurant Profile', desc: 'Set logo, banner, and contact details', path: '/admin/settings', status: 'completed', icon: '🏛️' },
    { title: 'Dining Tables', desc: 'Configure dining tables and seat capacities', path: '/admin/tables', status: 'completed', icon: '🪑' },
    { title: 'Menu Categories', desc: 'Create Starters, Main Course & Drinks sections', path: '/admin/menu', status: 'pending', icon: '📂' },
    { title: 'Menu Items', desc: 'Add dishes, prices, photos, and spice levels', path: '/admin/menu', status: 'pending', icon: '🍛' },
    { title: 'QR Standees', desc: 'Preview and print table QR code standees', path: '/admin/qr-codes', status: 'pending', icon: '📱' },
    { title: 'Tax & Billing', desc: 'Set GST rate, service charge %, and UPI ID', path: '/admin/settings', status: 'completed', icon: '💰' },
    { title: 'Staff Invites', desc: 'Add accounts for Kitchen Chef & Waiters', path: '/admin/staff', status: 'pending', icon: '👥' }
  ];

  return (
    <div className="p-6 bg-slate-950 text-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-brand-600 to-amber-500 text-white shadow-2xl mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <span className="px-3 py-1 text-xs font-extrabold rounded-full bg-white/20 backdrop-blur-md uppercase tracking-wider">
              🚀 Quick Onboarding Guide
            </span>
            <h1 className="text-3xl font-extrabold mt-3">Welcome to {user?.restaurant?.name || 'Your Restaurant'}!</h1>
            <p className="text-white/80 mt-1 max-w-xl text-sm">
              Complete these steps to launch your digital QR table ordering system in minutes.
            </p>
          </div>
          <div className="absolute right-4 bottom-0 text-9xl opacity-15 pointer-events-none">
            🍽️
          </div>
        </div>

        {/* Setup Progress */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white">Setup Progress</h3>
            <span className="text-xs font-extrabold text-brand-400">3 of 7 Completed (42%)</span>
          </div>
          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div className="h-full bg-gradient-to-r from-brand-500 to-amber-400 w-5/12 rounded-full" />
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {steps.map((st, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-4 hover:border-slate-700 transition">
              <div className="text-3xl p-3 rounded-2xl bg-slate-950 border border-slate-800 shrink-0">
                {st.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-base">{idx + 1}. {st.title}</h4>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    st.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {st.status === 'completed' ? '✓ Ready' : 'Pending'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{st.desc}</p>
                <Link
                  to={st.path}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-brand-300 mt-3"
                >
                  Configure Now →
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-8 py-3.5 bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-xl shadow-brand-500/20"
          >
            Go to Admin Dashboard Overview →
          </button>
        </div>

      </div>
    </div>
  );
}
