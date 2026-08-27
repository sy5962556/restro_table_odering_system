import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  Flame, 
  ChefHat, 
  UtensilsCrossed, 
  Receipt, 
  Bell, 
  Sparkles, 
  ChevronLeft,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { playSuccessChime } from '../../services/soundService';
import WaiterCallModal from '../../components/customer/WaiterCallModal';
import FeedbackModal from '../../components/customer/FeedbackModal';

const statusSteps = [
  { key: 'New', label: 'Order Placed', desc: 'Sent to kitchen', icon: Clock },
  { key: 'Accepted', label: 'Accepted', desc: 'Manager acknowledged', icon: CheckCircle2 },
  { key: 'Preparing', label: 'Preparing', desc: 'Chef is cooking your meal', icon: ChefHat },
  { key: 'Ready', label: 'Food Ready', desc: 'Fresh & hot on pass', icon: Flame },
  { key: 'Served', label: 'Served', desc: 'Delivered to table', icon: UtensilsCrossed },
  { key: 'Completed', label: 'Completed', desc: 'Enjoy your meal!', icon: Sparkles }
];

export const OrderStatusPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { socket, joinTable } = useSocket();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWaiterCallOpen, setIsWaiterCallOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isRequestingBill, setIsRequestingBill] = useState(false);

  // Fetch Order
  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}`);
      if (res.data.success) {
        setOrder(res.data.order);
        if (res.data.order.restaurant?._id && res.data.order.table?._id) {
          joinTable(res.data.order.restaurant._id, res.data.order.table._id);
        }
      }
    } catch (err) {
      console.error('Fetch order error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // Real-time socket events for status updates
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = ({ orderId: updatedId, status, order: updatedOrder }) => {
      if (updatedId === orderId || (updatedOrder && updatedOrder._id === orderId)) {
        playSuccessChime();
        setOrder(prev => updatedOrder || (prev ? { ...prev, orderStatus: status } : null));
      }
    };

    const handlePaymentCompleted = ({ orderId: updatedId }) => {
      if (updatedId === orderId) {
        fetchOrder();
      }
    };

    socket.on('orderStatusUpdated', handleStatusUpdate);
    socket.on('paymentCompleted', handlePaymentCompleted);

    return () => {
      socket.off('orderStatusUpdated', handleStatusUpdate);
      socket.off('paymentCompleted', handlePaymentCompleted);
    };
  }, [socket, orderId]);

  // Request Bill
  const handleRequestBill = async () => {
    try {
      setIsRequestingBill(true);
      const res = await api.post(`/orders/${orderId}/request-bill`);
      if (res.data.success) {
        setOrder(res.data.order);
        navigate(`/order/bill/${orderId}`);
      }
    } catch (err) {
      alert(err.message || 'Could not request bill');
    } finally {
      setIsRequestingBill(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-2xl animate-spin">
          🔄
        </div>
        <p className="text-xs text-slate-400 font-semibold">Connecting to kitchen order tracker...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Order not found</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-500"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  const currentStepIdx = statusSteps.findIndex(s => s.key === order.orderStatus);
  const currency = order.restaurant?.currency || '₹';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(`/order/${order.restaurant?._id || order.restaurant}/${order.tableNumber}`)}
            className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-500"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Add More Items</span>
          </button>

          <div className="text-right">
            <span className="text-xs font-black uppercase text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-md">
              Table #{order.tableNumber}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-5">
        {/* Status Card Hero */}
        <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-full mb-2">
                <Sparkles className="w-3 h-3 text-amber-300" /> Real-Time Live Status
              </span>
              <h1 className="text-2xl font-black tracking-tight">Order #{order.orderNumber?.split('-')[2] || '0001'}</h1>
              <p className="text-xs text-slate-300 mt-0.5">Guest: {order.customer?.name} ({order.customer?.mobile})</p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-2xl shadow-glow">
              {order.orderStatus === 'Preparing' ? '🍳' : order.orderStatus === 'Ready' ? '🔥' : order.orderStatus === 'Completed' ? '✨' : '📋'}
            </div>
          </div>

          {/* Current Status Pill */}
          <div className="mt-5 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Current Progress</p>
              <h3 className="text-lg font-black text-white">{order.orderStatus}</h3>
              <p className="text-xs text-slate-300">
                {order.orderStatus === 'New' && 'Your order was received and is awaiting chef confirmation.'}
                {order.orderStatus === 'Accepted' && 'Order accepted! Ingredients are being prepared.'}
                {order.orderStatus === 'Preparing' && 'Chef is currently cooking your hot gourmet dishes.'}
                {order.orderStatus === 'Ready' && 'Food is plated and on the counter ready to be served!'}
                {order.orderStatus === 'Served' && 'Food delivered to your table. Bon appétit!'}
                {order.orderStatus === 'Completed' && 'Dining session completed. Thank you!'}
              </p>
            </div>
            
            <div className="text-right shrink-0">
              <span className="flex items-center gap-1 text-xs font-black text-amber-300">
                <Clock className="w-4 h-4" /> ~{order.estimatedPrepTime || 20}m
              </span>
            </div>
          </div>
        </div>

        {/* Step Progress Visualizer */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Preparation Timeline</h3>

          <div className="space-y-4">
            {statusSteps.map((step, idx) => {
              const IconComponent = step.icon;
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const isFuture = idx > currentStepIdx;

              return (
                <div key={step.key} className="flex items-start gap-4 relative">
                  {/* Vertical Line Connector */}
                  {idx !== statusSteps.length - 1 && (
                    <div 
                      className={`absolute left-4 top-8 bottom-0 w-0.5 -mb-4 transition-colors ${
                        idx < currentStepIdx ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  )}

                  {/* Step Icon */}
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                      isPast
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : isCurrent
                        ? 'bg-brand-500 text-white shadow-glow ring-4 ring-brand-100 dark:ring-brand-950 scale-110'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4 stroke-[3]" /> : <IconComponent className="w-4 h-4" />}
                  </div>

                  {/* Step Text */}
                  <div className="flex-1 pb-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-extrabold ${isCurrent ? 'text-brand-600 dark:text-brand-400' : isPast ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                        {step.label}
                      </h4>
                      {isCurrent && (
                        <span className="text-[10px] font-black uppercase text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded animate-pulse">
                          In Progress
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ordered Dishes Summary */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Order Summary ({order.items?.length} items)</h3>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
              Total: {currency}{order.grandTotal?.toFixed(2)}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                    <span className="text-[11px] font-extrabold text-brand-600 dark:text-brand-400">× {item.quantity}</span>
                  </div>
                  {item.specialInstructions && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">"{item.specialInstructions}"</p>
                  )}
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white">{currency}{item.itemTotal?.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Subtotal & Charges */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{currency}{order.subtotal?.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount</span>
                <span>-{currency}{order.discount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST ({order.taxRate || 5}%)</span>
              <span>{currency}{order.tax?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-slate-900 dark:text-white pt-1">
              <span>Grand Total</span>
              <span className="text-brand-600 dark:text-brand-400">{currency}{order.grandTotal?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Quick Action Floating Bar */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => setIsWaiterCallOpen(true)}
            className="py-3 px-4 rounded-2xl font-bold text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Bell className="w-4 h-4 text-amber-500" />
            <span>Call Waiter</span>
          </button>

          <button
            onClick={() => navigate(`/order/bill/${order._id}`)}
            className="py-3 px-4 rounded-2xl font-black text-xs text-white bg-slate-900 dark:bg-slate-800 hover:bg-black flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>View Digital Bill</span>
          </button>
        </div>

        {/* Big Request Bill CTA */}
        <button
          onClick={handleRequestBill}
          disabled={isRequestingBill}
          className="w-full py-4 px-6 rounded-3xl font-black text-sm text-white bg-gradient-to-r from-brand-500 to-amber-600 shadow-glow hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            <span>{isRequestingBill ? 'REQUESTING BILL...' : 'REQUEST BILL & PAY'}</span>
          </div>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Feedback Trigger Banner */}
        <div 
          onClick={() => setIsFeedbackOpen(true)}
          className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⭐</span>
            <div>
              <h4 className="text-xs font-black text-amber-900 dark:text-amber-200">Rate Your Experience</h4>
              <p className="text-[10px] text-amber-700 dark:text-amber-400">Share your review with our chef</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Give Feedback →</span>
        </div>
      </main>

      {/* Call Waiter Modal */}
      {isWaiterCallOpen && (
        <WaiterCallModal
          restaurantId={order.restaurant?._id || order.restaurant}
          tableNumber={order.tableNumber}
          onClose={() => setIsWaiterCallOpen(false)}
        />
      )}

      {/* Feedback Modal */}
      {isFeedbackOpen && (
        <FeedbackModal
          order={order}
          restaurantId={order.restaurant?._id || order.restaurant}
          onClose={() => setIsFeedbackOpen(false)}
        />
      )}
    </div>
  );
};

export default OrderStatusPage;
