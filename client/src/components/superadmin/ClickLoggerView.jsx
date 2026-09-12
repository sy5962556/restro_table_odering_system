import React, { useState, useEffect } from 'react';
import { MousePointerClick, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

export default function ClickLoggerView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClickLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/click-logs');
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch click logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClickLogs();
  }, []);

  const filtered = logs.filter(l => {
    if (!searchTerm) return true;
    return (
      l.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.page?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.restaurant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="p-6 space-y-6 text-slate-100 min-h-screen bg-slate-950">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase text-purple-400 bg-purple-950/60 border border-purple-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <MousePointerClick className="w-3.5 h-3.5" /> Administrative Click Logger
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1.5">Super Admin Interaction Trail</h1>
          <p className="text-xs text-slate-400">Track key navigation, control mode activations, and administrative actions.</p>
        </div>

        <button
          onClick={fetchClickLogs}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
          <span>Refresh Click Logs</span>
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search action, user, or page..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor</th>
                <th className="px-5 py-3.5">Action Event</th>
                <th className="px-5 py-3.5">Page / Module</th>
                <th className="px-5 py-3.5">Target Tenant</th>
                <th className="px-5 py-3.5">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500 font-sans font-bold">
                    Loading click logs…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500 font-sans font-bold">
                    No click log records found.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/50 transition">
                    <td className="px-5 py-3 text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-bold text-white font-sans">
                      {log.userName} ({log.userRole})
                    </td>
                    <td className="px-5 py-3 font-bold text-purple-400">
                      {log.action}
                    </td>
                    <td className="px-5 py-3 text-slate-300">
                      {log.page || 'System'}
                    </td>
                    <td className="px-5 py-3 font-sans font-semibold text-slate-200">
                      {log.restaurant?.name || '-'}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
