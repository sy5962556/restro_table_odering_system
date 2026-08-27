import React, { useState, useEffect, useCallback } from 'react';
import { ChefHat, Clock, CheckCircle, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminTopNav from '../../components/admin/AdminTopNav';

const URGENCY_COLORS = {
  critical: 'border-rose-500 bg-rose-950/10',
  high: 'border-amber-500 bg-amber-950/10',
  normal: 'border-emerald-600 bg-emerald-950/10',
};

function KDSCard({ order, onItemDone, onOrderReady }) {
  const elapsedMs = Date.now() - new Date(order.createdAt);
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const urgency = elapsedMin >= 20 ? 'critical' : elapsedMin >= 12 ? 'high' : 'normal';

  const allDone = order.items?.every(i => i.preparedAt);

  return (
    <div className={`rounded-3xl border-2 ${URGENCY_COLORS[urgency]} p-4 space-y-3 flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-black text-lg">T{order.tableNumber}</span>
            <span className="text-xs font-bold text-slate-400">{order.orderNumber}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className={`w-3.5 h-3.5 ${urgency === 'critical' ? 'text-rose-400' : urgency === 'high' ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span className={`text-xs font-black ${urgency === 'critical' ? 'text-rose-400' : urgency === 'high' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {elapsedMin}m {Math.floor((elapsedMs % 60000) / 1000)}s
            </span>
          </div>
        </div>
        {urgency === 'critical' && (
          <span className="text-[10px] font-black uppercase bg-rose-500 text-white px-2 py-1 rounded-full animate-pulse">
            URGENT!
          </span>
        )}
      </div>

      {/* Item List */}
      <div className="space-y-2 flex-1">
        {order.items?.map((item, idx) => (
          <div
            key={idx}
            onClick={() => !item.preparedAt && onItemDone(order._id, idx)}
            className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all select-none ${
              item.preparedAt
                ? 'bg-slate-800/60 opacity-50 line-through'
                : 'bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              item.preparedAt ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'
            }`}>
              {item.preparedAt && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-extrabold text-white truncate block">{item.name}</span>
              {item.customNote && (
                <span className="text-[10px] text-amber-400">📝 {item.customNote}</span>
              )}
            </div>
            <span className="text-sm font-black text-white shrink-0">×{item.quantity}</span>
          </div>
        ))}
      </div>

      {/* Mark Ready Button */}
      {!allDone && (
        <button
          onClick={() => onItemDone(order._id, 'all')}
          className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-colors"
        >
          ✓ Mark All Items Prepared
        </button>
      )}
      {allDone && (
        <button
          onClick={() => onOrderReady(order._id)}
          className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition-colors animate-pulse"
        >
          🛎️ SEND TO TABLE — FOOD READY!
        </button>
      )}
    </div>
  );
}

export const KitchenDisplayPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const { socket } = useSocket();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/kitchen/active');
      if (res.data.success) setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Error fetching kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;
    socket.on('newOrder', fetchOrders);
    socket.on('orderStatusUpdated', fetchOrders);
    return () => {
      socket.off('newOrder', fetchOrders);
      socket.off('orderStatusUpdated', fetchOrders);
    };
  }, [socket, fetchOrders]);

  const handleItemDone = async (orderId, itemIndex) => {
    try {
      if (itemIndex === 'all') {
        await api.patch(`/kitchen/orders/${orderId}/mark-all-prepared`);
      } else {
        await api.patch(`/kitchen/orders/${orderId}/items/${itemIndex}/toggle`);
      }
      fetchOrders();
    } catch (err) {
      console.error('Error updating item:', err);
    }
  };

  const handleOrderReady = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'Ready' });
      fetchOrders();
    } catch (err) {
      console.error('Error marking order ready:', err);
    }
  };

  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100">
      {!fullscreen && <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

      <div className={`flex-1 ${!fullscreen ? 'lg:ml-64' : ''} flex flex-col min-w-0`}>
        {!fullscreen && <AdminTopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} title="Kitchen Display System" />}

        {/* KDS Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ChefHat className="w-5 h-5 text-amber-400" />
            <span className="font-black text-sm text-white uppercase tracking-widest">KITCHEN DISPLAY</span>
            <span className="text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full">
              {orders.length} active orders
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchOrders} className="p-2 rounded-xl hover:bg-slate-800 transition-colors">
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              {fullscreen ? <Minimize2 className="w-4 h-4 text-slate-400" /> : <Maximize2 className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-[11px] font-bold text-slate-400">On Time</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-[11px] font-bold text-slate-400">12+ min</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /><span className="text-[11px] font-bold text-slate-400">20+ min URGENT</span></div>
          <span className="text-[11px] text-slate-500 ml-auto">Tap items to mark prepared</span>
        </div>

        {/* KDS Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-500 font-bold animate-pulse text-sm">Loading kitchen orders…</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <ChefHat className="w-16 h-16 text-slate-700" />
              <p className="text-slate-500 font-extrabold text-lg">Kitchen is clear! 🎉</p>
              <p className="text-slate-600 text-sm">No active orders in the queue.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {orders.map(order => (
                <KDSCard
                  key={order._id}
                  order={order}
                  onItemDone={handleItemDone}
                  onOrderReady={handleOrderReady}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KitchenDisplayPage;
