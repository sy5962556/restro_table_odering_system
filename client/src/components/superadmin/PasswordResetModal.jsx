import React, { useState } from 'react';
import { ShieldCheck, Key, Copy, Check, AlertTriangle, X } from 'lucide-react';
import api from '../../services/api';

export default function PasswordResetModal({ restaurant, onClose }) {
  const [loading, setLoading] = useState(false);
  const [tempData, setTempData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleGeneratePassword = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.post(`/platform/restaurants/${restaurant._id}/reset-password`);
      if (res.data.success) {
        setTempData(res.data.tempCredentials);
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (tempData?.tempPassword) {
      navigator.clipboard.writeText(`Email: ${tempData.email}\nTemporary Password: ${tempData.tempPassword}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Reset Admin Password</h3>
              <p className="text-xs text-slate-400">{restaurant.name} [{restaurant.restaurantCode || restaurant._id}]</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-300">
            {error}
          </div>
        )}

        {!tempData ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-bold">Security Notice:</p>
                <p className="mt-1 text-slate-300">
                  This operation generates a new random temporary password for the restaurant administrator. Existing plaintext passwords are never displayed. An audit log will be created.
                </p>
              </div>
            </div>

            <button
              onClick={handleGeneratePassword}
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'GENERATING TEMP CREDENTIALS...' : 'GENERATE TEMPORARY PASSWORD'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 space-y-2">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                ✓ Temporary Credentials Generated
              </span>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1 font-mono">
                <div><span className="text-slate-500">Email:</span> <span className="text-white font-bold">{tempData.email}</span></div>
                <div><span className="text-slate-500">Temp Pass:</span> <span className="text-amber-400 font-extrabold text-sm">{tempData.tempPassword}</span></div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                {tempData.expiresNotice}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white transition flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY CREDENTIALS'}</span>
              </button>

              <button
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white transition"
              >
                DONE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
