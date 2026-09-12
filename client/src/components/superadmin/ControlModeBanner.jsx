import React from 'react';
import { ShieldCheck, ArrowLeft, XCircle, ExternalLink, Activity } from 'lucide-react';

export default function ControlModeBanner({ targetRestaurant, onExitControlMode }) {
  if (!targetRestaurant) return null;

  return (
    <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-brand-950 border-b border-purple-500/40 px-4 py-3 shadow-lg flex flex-wrap items-center justify-between gap-3 text-white sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-lg shadow-glow">
          👑
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-400" /> SUPER ADMIN CONTROL MODE
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              targetRestaurant.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
              targetRestaurant.status === 'SUSPENDED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
              'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {targetRestaurant.status}
            </span>
            <span className="text-[10px] font-extrabold uppercase bg-brand-500/20 text-brand-300 border border-brand-500/40 px-2 py-0.5 rounded-md">
              {targetRestaurant.plan || 'PRO'} PLAN
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="font-extrabold text-sm text-white tracking-tight">
              Managing: {targetRestaurant.name}
            </h2>
            <span className="text-xs text-purple-300/80 font-mono font-bold">
              [{targetRestaurant.restaurantCode || targetRestaurant._id}]
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onExitControlMode}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Control Mode</span>
        </button>

        <button
          onClick={onExitControlMode}
          className="p-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-500/30 transition"
          title="Return to Super Admin Portal"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
