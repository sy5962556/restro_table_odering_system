import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Bell, BellOff, Volume2, VolumeX, RefreshCw, Filter } from 'lucide-react';

import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { soundService } from '../../services/soundService';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopNav from '../../components/admin/AdminTopNav';
import PrintableKOT from '../../components/print/PrintableKOT';
import PrintableBill from '../../components/print/PrintableBill';

const COLUMNS = [
  { key: 'New',       label: 'New Orders',  color: 'bg-blue-500',    light: 'bg-blue-50 dark:bg-blue-950/30',    text: 'text-blue-700 dark:text-blue-300',    border: 'border-blue-200 dark:border-blue-800' },
  { key: 'Accepted',  label: 'Accepted',    color: 'bg-indigo-500',  light: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-300',  border: 'border-indigo-200 dark:border-indigo-800' },
  { key: 'Preparing', label: 'Preparing',   color: 'bg-amber-500',   light: 'bg-amber-50 dark:bg-amber-950/30',  text: 'text-amber-700 dark:text-amber-300',   border: 'border-amber-200 dark:border-amber-800' },
  { key: 'Ready',     label: 'Food Ready',  color: 'bg-orange-500',  light: 'bg-orange-50 dark:bg-orange-950/30',text: 'text-orange-700 dark:text-orange-300',  border: 'border-orange-200 dark:border-orange-800' },
  { key: 'Served',    label: 'Served',      color: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  { key: 'Completed', label: 'Completed',   color: 'bg-slate-400',   light: 'bg-slate-50 dark:bg-slate-800/40',  text: 'text-slate-600 dark:text-slate-300',   border: 'border-slate-200 dark:border-slate-700' },
];

const NEXT_STATUS = {
  'New':      'Accepted',
  'Accepted': 'Preparing',
  'Preparing':'Ready',
  'Ready':    'Served',
  'Served':   'Completed',
};

function OrderCard({ order, onStatusChange, onPrintKOT, onPrintBill }) {
  const elapsed = Math.floor((Date.now() - new Date(order.createdAt)) / 60000);
  const urgency = elapsed > 20 ? 'border-rose-400' : elapsed > 10 ? 'border-amber-400' : '';

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border ${urgency || 'border-slate-200 dark:border-slate-800'} shadow-xs p-3.5 space-y-2.5 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-black text-xs text-slate-900 dark:text-white">{order.orderNumber || `ORD-${order._id?.slice(-4)}`}</span>
          <p className="text-[10px] text-slate-400 mt-0.5">Table {order.tableNumber} • {elapsed}m ago</p>
        </div>
        <span className="text-[10px] font-extrabold text-slate-400 shrink-0">₹{order.grandTotal?.toFixed(2)}</span>
      </div>

      <div className="space-y-1">
        {order.items?.slice(0, 3).map((item, i) => (
          <div key={i} className="flex justify-between text-[10px] text-slate-700 dark:text-slate-300">
            <span className="truncate">{item.name}</span>
            <span className="font-bold shrink-0 ml-1">×{item.quantity}</span>
          </div>
        ))}
        {order.items?.length > 3 && (
          <p className="text-[10px] text-slate-400">+{order.items.length - 3} more items…</p>
        )}
      </div>

      {order.specialRequests && (
        <p className="text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-lg px-2 py-1 line-clamp-1">
          📝 {order.specialRequests}
        </p>
      )}

      <div className="flex gap-1.5 pt-1">
        {NEXT_STATUS[order.orderStatus] && (
          <button
            onClick={() => onStatusChange(order._id, NEXT_STATUS[order.orderStatus])}
            className="flex-1 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-black uppercase tracking-wide transition-colors"
          >
            → {NEXT_STATUS[order.orderStatus]}
          </button>
        )}
        <button
          onClick={() => onPrintKOT(order)}
          title="Print KOT"
          className="px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold transition-colors"
        >
          🖨️ KOT
        </button>
        {(order.orderStatus === 'Served' || order.orderStatus === 'Completed') && (
          <button
            onClick={() => onPrintBill(order)}
            title="Print Bill"
            className="px-2 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 transition-colors"
          >
            🧾 Bill
          </button>
        )}
      </div>
    </div>
  );
}

export const LiveOrdersPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [filter, setFilter] = useState('all');
  const [printOrder, setPrintOrder] = useState(null);
  const [printType, setPrintType] = useState(null);
  const { socket } = useSocket();
  const { restaurantId } = useAuth();

  const kotRef = useRef();
  const billRef = useRef();

  const printKOT = useReactToPrint({ contentRef: kotRef, documentTitle: 'Kitchen Order Ticket' });
  const printBill = useReactToPrint({ contentRef: billRef, documentTitle: 'Customer Bill' });

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders?limit=100');
      if (res.data.success) setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data) => {
      if (audioEnabled) soundService.playDiningBell();
      fetchOrders();
    };

    const handleStatusUpdate = () => fetchOrders();

    socket.on('newOrder', handleNewOrder);
    socket.on('orderStatusUpdated', handleStatusUpdate);
    socket.on('paymentCompleted', handleStatusUpdate);

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('orderStatusUpdated', handleStatusUpdate);
      socket.off('paymentCompleted', handleStatusUpdate);
    };
  }, [socket, audioEnabled, fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handlePrintKOT = (order) => {
    setPrintOrder(order);
    setPrintType('kot');
    setTimeout(() => printKOT(), 300);
  };

  const handlePrintBill = (order) => {
    setPrintOrder(order);
    setPrintType('bill');
    setTimeout(() => printBill(), 300);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Hidden print targets */}
      <div className="hidden">
        <div ref={kotRef}>{printOrder && <PrintableKOT order={printOrder} />}</div>
        <div ref={billRef}>{printOrder && <PrintableBill order={printOrder} />}</div>
      </div>

      <div className="flex-1 lg:ml-64 flex flex-col min-w-0 overflow-hidden">
        <AdminTopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Live Orders Board" />

        {/* Toolbar */}
        <div className="px-4 sm:px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 flex-wrap">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${audioEnabled ? 'bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {audioEnabled ? 'Sound On' : 'Sound Off'}
          </button>
          <div className="ml-auto text-xs font-bold text-slate-400">
            {orders.filter(o => !['Completed', 'Cancelled'].includes(o.orderStatus)).length} active orders
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 p-4 sm:p-6 min-w-max h-full">
            {COLUMNS.map(col => {
              const colOrders = orders.filter(o => o.orderStatus === col.key);
              return (
                <div key={col.key} className={`flex flex-col rounded-3xl ${col.light} ${col.border} border w-72 shrink-0 overflow-hidden`}>
                  {/* Column Header */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                      <span className={`font-black text-xs uppercase tracking-wide ${col.text}`}>{col.label}</span>
                    </div>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${col.color} text-white`}>
                      {colOrders.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[calc(100vh-200px)]">
                    {loading && colOrders.length === 0 && (
                      <div className="text-center py-6 text-xs text-slate-400">Loading…</div>
                    )}
                    {!loading && colOrders.length === 0 && (
                      <div className="text-center py-8 text-xs text-slate-400 font-medium">
                        {col.key === 'Pending' ? '🎉 All caught up!' : 'No orders here'}
                      </div>
                    )}
                    {colOrders.map(order => (
                      <OrderCard
                        key={order._id}
                        order={order}
                        onStatusChange={handleStatusChange}
                        onPrintKOT={handlePrintKOT}
                        onPrintBill={handlePrintBill}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveOrdersPage;
