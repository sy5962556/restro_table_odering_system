import React from 'react';
import { useAuth } from '../../context/AuthContext';

export function PendingReviewScreen() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-4xl mb-6 animate-pulse">
        ⏳
      </div>
      <h1 className="text-3xl font-extrabold text-white">Registration Under Review</h1>
      <p className="text-slate-400 mt-2 max-w-md text-sm">
        Your restaurant account <strong className="text-white">{user?.restaurant?.name || 'Workspace'}</strong> has been registered successfully and is currently under review by platform administration.
      </p>
      <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 max-w-md">
        Once approved by Super Admin, you will gain immediate access to your restaurant dashboard, KDS, tables, and QR ordering.
      </div>
      <button
        onClick={logout}
        className="mt-8 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl"
      >
        Sign Out & Return Later
      </button>
    </div>
  );
}

export function SuspendedAccountScreen() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center text-4xl mb-6">
        🚫
      </div>
      <h1 className="text-3xl font-extrabold text-white">Account Suspended</h1>
      <p className="text-slate-400 mt-2 max-w-md text-sm">
        The workspace for <strong className="text-white">{user?.restaurant?.name || 'Your Restaurant'}</strong> has been suspended by platform administration.
      </p>
      <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 max-w-md">
        Please contact platform support to resolve any compliance or subscription issues. Your restaurant data remains securely preserved.
      </div>
      <button
        onClick={logout}
        className="mt-8 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl"
      >
        Sign Out
      </button>
    </div>
  );
}
