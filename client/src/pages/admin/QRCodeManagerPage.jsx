import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QrCode, Download, Printer, RefreshCw } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import api from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopNav from '../../components/admin/AdminTopNav';
import PrintableQRStandee from '../../components/print/PrintableQRStandee';

export const QRCodeManagerPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTables, setSelectedTables] = useState([]);
  const [restaurantId, setRestaurantId] = useState('');
  const [printing, setPrinting] = useState(false);
  const batchPrintRef = useRef();

  const batchPrint = useReactToPrint({ contentRef: batchPrintRef, documentTitle: 'QR Table Standees' });

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const [tablesRes, restaurantRes] = await Promise.all([
        api.get('/tables'),
        api.get('/restaurants/mine'),
      ]);
      if (tablesRes.data.success) setTables(tablesRes.data.tables || []);
      if (restaurantRes.data.success) setRestaurantId(restaurantRes.data.restaurant?._id || '');
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const getQRValue = (table) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/order/${restaurantId}/${table._id}`;
  };

  const handleDownloadQR = (table) => {
    const canvas = document.getElementById(`qr-canvas-${table._id}`);
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-${table.tableNumber}-qr.png`;
    a.click();
  };

  const handleRegenerateQR = async (tableId) => {
    try {
      await api.post(`/qr/${tableId}/regenerate`);
      fetchTables();
    } catch (err) {
      console.error('Error regenerating QR:', err);
    }
  };

  const toggleTableSelect = (id) => {
    setSelectedTables(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedTables(prev =>
      prev.length === tables.length ? [] : tables.map(t => t._id)
    );
  };

  const selectedTableObjects = tables.filter(t => selectedTables.includes(t._id));

  const handleBatchPrint = () => {
    if (selectedTables.length === 0) {
      alert('Please select at least one table to print.');
      return;
    }
    batchPrint();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Hidden batch print */}
      <div className="hidden">
        <div ref={batchPrintRef} className="p-4 space-y-8">
          {selectedTableObjects.map(table => (
            <PrintableQRStandee
              key={table._id}
              table={table}
              qrValue={getQRValue(table)}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <AdminTopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="QR Code Manager" />

        <div className="px-4 sm:px-6 py-5 space-y-5 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSelectAll}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            >
              {selectedTables.length === tables.length ? 'Deselect All' : 'Select All'}
            </button>
            {selectedTables.length > 0 && (
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                {selectedTables.length} selected
              </span>
            )}
            <button
              onClick={handleBatchPrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black uppercase tracking-wide transition-colors ml-auto"
            >
              <Printer className="w-3.5 h-3.5" /> Print Selected QR Standees
            </button>
          </div>

          {/* QR Code Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => <div key={i} className="h-52 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tables.map(table => (
                <div
                  key={table._id}
                  className={`p-3 bg-white dark:bg-slate-900 rounded-2xl border-2 cursor-pointer transition-all space-y-3 ${
                    selectedTables.includes(table._id)
                      ? 'border-brand-500 ring-2 ring-brand-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                  onClick={() => toggleTableSelect(table._id)}
                >
                  {/* Selection indicator */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white">Table {table.tableNumber}</span>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${selectedTables.includes(table._id) ? 'border-brand-500 bg-brand-500' : 'border-slate-300 dark:border-slate-600'}`}>
                      {selectedTables.includes(table._id) && <span className="text-[9px] text-white font-black">✓</span>}
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center">
                    {restaurantId ? (
                      <QRCodeCanvas
                        id={`qr-canvas-${table._id}`}
                        value={getQRValue(table)}
                        size={100}
                        level="H"
                        includeMargin
                        style={{ borderRadius: '8px' }}
                      />
                    ) : (
                      <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                        <QrCode className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                  </div>

                  <p className="text-[9px] text-slate-400 text-center break-all leading-tight">
                    Floor {table.floor || 1} • {table.section || 'Main'} • Cap: {table.capacity}
                  </p>

                  <div className="flex gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownloadQR(table); }}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase hover:bg-emerald-100 transition-colors"
                    >
                      <Download className="w-3 h-3 mx-auto" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRegenerateQR(table._id); }}
                      className="flex-1 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-black uppercase hover:bg-slate-200 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeManagerPage;
