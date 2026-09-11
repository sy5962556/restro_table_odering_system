import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  ChefHat, 
  UserCheck, 
  CreditCard, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'superadmin') {
        navigate('/admin/platform');
      } else if (user.role === 'kitchen') {
        navigate('/admin/kitchen');
      } else if (user.role === 'waiter' || user.role === 'cashier') {
        navigate('/admin/orders');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-brand-950 flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-500 text-white flex items-center justify-center text-3xl shadow-glow">
            🍽️
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Smart QR Restaurant Platform
          </h1>
          <p className="text-xs text-slate-400">
            Multi-Tenant SaaS Platform & Management Portal
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@restaurant.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-brand-500 to-amber-600 shadow-glow hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN TO PORTAL'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Quick Demo Login Pill Buttons */}
        <div className="pt-4 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>⚡ Test Staff Logins:</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => fillQuickCredentials('admin@restaurant.com', 'Admin@123')}
              className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/80 hover:bg-slate-800 hover:border-amber-500 transition-all text-left text-xs space-y-0.5"
            >
              <div className="font-bold text-white text-[11px]">🏛️ Owner</div>
              <p className="text-[9px] text-slate-400">Full Access</p>
            </button>

            <button
              type="button"
              onClick={() => fillQuickCredentials('manager@restaurant.com', 'Manager@123')}
              className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/80 hover:bg-slate-800 hover:border-emerald-500 transition-all text-left text-xs space-y-0.5"
            >
              <div className="font-bold text-white text-[11px]">👔 Manager</div>
              <p className="text-[9px] text-slate-400">Ops & Staff</p>
            </button>

            <button
              type="button"
              onClick={() => fillQuickCredentials('kitchen@restaurant.com', 'Kitchen@123')}
              className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/80 hover:bg-slate-800 hover:border-orange-500 transition-all text-left text-xs space-y-0.5"
            >
              <div className="font-bold text-white text-[11px]">🍳 Chef</div>
              <p className="text-[9px] text-slate-400">KDS & Menu</p>
            </button>

            <button
              type="button"
              onClick={() => fillQuickCredentials('waiter@restaurant.com', 'Waiter@123')}
              className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/80 hover:bg-slate-800 hover:border-blue-500 transition-all text-left text-xs space-y-0.5"
            >
              <div className="font-bold text-white text-[11px]">🤵 Waiter</div>
              <p className="text-[9px] text-slate-400">Orders & Floor</p>
            </button>

            <button
              type="button"
              onClick={() => fillQuickCredentials('cashier@restaurant.com', 'Cashier@123')}
              className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/80 hover:bg-slate-800 hover:border-purple-500 transition-all text-left text-xs space-y-0.5"
            >
              <div className="font-bold text-white text-[11px]">💰 Cashier</div>
              <p className="text-[9px] text-slate-400">Bills & Offers</p>
            </button>

            <button
              type="button"
              onClick={() => fillQuickCredentials('superadmin@platform.com', 'Admin@123')}
              className="p-2 rounded-xl bg-purple-950/60 border border-purple-800/80 hover:bg-purple-900 transition-all text-left text-xs space-y-0.5"
            >
              <div className="font-bold text-purple-300 text-[11px]">👑 Super Admin</div>
              <p className="text-[9px] text-purple-400">Platform</p>
            </button>
          </div>
        </div>

        <div className="pt-2 text-center space-y-2">
          <button
            onClick={() => navigate('/register')}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-brand-400 border border-slate-700 transition"
          >
            ➕ Register New Restaurant Workspace
          </button>

          <button
            onClick={() => navigate('/simulator')}
            className="text-xs text-slate-400 font-bold hover:underline block mx-auto"
          >
            Launch Customer QR Simulator →
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
