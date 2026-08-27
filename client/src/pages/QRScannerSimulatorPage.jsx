import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, QrCode, ChevronRight, Users } from 'lucide-react';
import api from '../services/api';

export const QRScannerSimulatorPage = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [restaurantId, setRestaurantId] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [scanning, setScanning] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tablesRes, restaurantRes] = await Promise.all([
        api.get('/tables'),
        api.get('/restaurants/mine'),
      ]);
      if (tablesRes.data.success) setTables(tablesRes.data.tables || []);
      if (restaurantRes.data.success) setRestaurantId(restaurantRes.data.restaurant?._id || '');
    } catch (err) {
      // Tables route doesn't need auth in some cases, try public
      try {
        const res = await api.get('/restaurants/public');
        if (res.data.success) {
          setRestaurantId(res.data.restaurantId || '');
          setTables(res.data.tables || []);
        }
      } catch (e) {
        console.error('Error fetching data:', e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSimulateScan = (table) => {
    setSelectedTable(table);
    setScanning(true);
    setTimeout(() => {
      navigate(`/order/${restaurantId}/${table._id}`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-brand-950 flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-2xl font-black text-white">QR Scanner Simulator</h1>
          <p className="text-sm text-slate-400">
            Simulates a customer scanning a table's QR code.<br/>
            Select a table to launch the mobile ordering experience.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-4 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">How It Works</h3>
          <div className="space-y-2">
            {[
              { step: '1', text: 'Customer sits at a table and scans the QR code' },
              { step: '2', text: 'Mobile browser opens the digital menu for that table' },
              { step: '3', text: 'Customer browses menu, adds to cart, and places order' },
              { step: '4', text: 'Order appears live on the admin Kanban board and KDS' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                  {item.step}
                </span>
                <p className="text-xs text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Select Table */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-4 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            {loading ? 'Loading tables…' : `Select a Table (${tables.length} available)`}
          </h3>

          {loading ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {[...Array(10)].map((_, i) => <div key={i} className="aspect-square rounded-xl bg-white/10 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-72 overflow-y-auto">
              {tables.map(table => (
                <button
                  key={table._id}
                  onClick={() => handleSimulateScan(table)}
                  disabled={scanning}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 text-center transition-all ${
                    selectedTable?._id === table._id
                      ? 'bg-brand-500 text-white scale-95'
                      : 'bg-white/10 text-white hover:bg-white/20 hover:scale-105'
                  } ${scanning && selectedTable?._id !== table._id ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  <span className="font-black text-sm">T{table.tableNumber}</span>
                  <span className="text-[8px] font-bold text-slate-400 mt-0.5">F{table.floor || 1}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scanning Animation */}
        {scanning && selectedTable && (
          <div className="bg-white/10 backdrop-blur border border-brand-500/40 rounded-3xl p-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto relative">
              <QrCode className="w-16 h-16 text-brand-400" />
              <div className="absolute inset-0 rounded-xl border-2 border-brand-400 animate-ping opacity-60" />
            </div>
            <div>
              <p className="font-black text-white">Scanning QR Code…</p>
              <p className="text-xs text-slate-400 mt-1">Opening customer view for Table {selectedTable.tableNumber}</p>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full animate-[width_1.5s_ease-in-out_forwards]" style={{ width: '100%', animation: 'grow 1.5s ease-in-out forwards' }} />
            </div>
          </div>
        )}

        {/* Navigation links */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate('/admin/login')}
            className="text-xs text-slate-400 hover:text-white transition-colors font-bold"
          >
            ← Go to Admin Login
          </button>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-xs text-brand-400 hover:text-brand-300 transition-colors font-bold"
          >
            Admin Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerSimulatorPage;
