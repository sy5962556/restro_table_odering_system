import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import confetti from 'canvas-confetti';
import { 
  Receipt, 
  QrCode, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  Printer, 
  ArrowLeft, 
  Download, 
  Sparkles,
  Share2,
  ChevronLeft
} from 'lucide-react';

import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { playSuccessChime } from '../../services/soundService';
import PrintableBill from '../../components/print/PrintableBill';
import FeedbackModal from '../../components/customer/FeedbackModal';

export const DigitalBillPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const printRef = useRef(null);

  const [invoice, setInvoice] = useState(null);
  const [upiData, setUpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Trigger thermal receipt print
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice_${invoice?.invoiceNumber || orderId}`
  });

  // Fetch invoice & UPI payload
  const fetchBillData = async () => {
    try {
      setLoading(true);
      // Generate or retrieve invoice
      const invRes = await api.post(`/billing/invoice/${orderId}`);
      if (invRes.data.success) {
        setInvoice(invRes.data.invoice);
        if (invRes.data.invoice.paymentStatus === 'Paid') {
          setIsPaid(true);
        }
      }

      // Fetch UPI QR details
      const upiRes = await api.get(`/payments/upi-qr/${orderId}`);
      if (upiRes.data.success) {
        setUpiData(upiRes.data);
      }
    } catch (err) {
      console.error('Error loading digital bill:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillData();
  }, [orderId]);

  // Real-time socket event when payment is recorded by cashier or staff
  useEffect(() => {
    if (!socket) return;

    const handlePaymentCompleted = ({ orderId: paidOrderId }) => {
      if (paidOrderId === orderId) {
        playSuccessChime();
        setIsPaid(true);
        confetti({ particleCount: 60, spread: 60 });
        if (invoice) {
          setInvoice(prev => prev ? { ...prev, paymentStatus: 'Paid' } : null);
        }
      }
    };

    socket.on('paymentCompleted', handlePaymentCompleted);

    return () => {
      socket.off('paymentCompleted', handlePaymentCompleted);
    };
  }, [socket, orderId, invoice]);

  // Customer self-settlement simulator for UPI / Card / Cash
  const handleCompletePayment = async (method) => {
    try {
      setIsProcessing(true);
      const res = await api.post('/payments', {
        orderId,
        invoiceId: invoice?._id,
        amount: invoice?.grandTotal,
        paymentMethod: method,
        transactionId: `TXN-${Date.now()}`
      });

      if (res.data.success) {
        playSuccessChime();
        setIsPaid(true);
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        setInvoice(prev => prev ? { ...prev, paymentStatus: 'Paid', paymentMethod: method } : null);
      }
    } catch (err) {
      alert(err.message || 'Payment settlement failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-2xl animate-bounce shadow-glow">
          🧾
        </div>
        <p className="text-xs text-slate-400 font-semibold">Generating official invoice & UPI QR...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Invoice not available</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-500"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currency = invoice.restaurantDetails?.currency || '₹';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(`/order/status/${orderId}`)}
            className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-500"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Order Status</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 flex items-center gap-1 text-xs font-bold"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-5">
        {/* Payment Completed Celebration Hero */}
        {isPaid ? (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl text-center space-y-3 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl">
              ✨
            </div>
            <h2 className="text-2xl font-black">Payment Completed!</h2>
            <p className="text-xs text-emerald-100 max-w-xs mx-auto">
              Thank you for dining at {invoice.restaurantDetails?.name || 'The Royal Spice'}! Your invoice has been settled.
            </p>
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/20 text-xs font-extrabold tracking-wider">
              {currency}{invoice.grandTotal?.toFixed(2)} PAID ({invoice.paymentMethod || 'UPI'})
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsFeedbackOpen(true)}
                className="px-6 py-2.5 rounded-2xl font-black text-xs text-emerald-900 bg-white hover:bg-emerald-50 shadow-md transition-all active:scale-95"
              >
                Leave a 5-Star Review ⭐
              </button>
            </div>
          </div>
        ) : (
          /* Payment Mode Selector & UPI QR */
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-950 px-2.5 py-0.5 rounded-full">
                Settle Table #{invoice.tableNumber} Bill
              </span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {currency}{invoice.grandTotal?.toFixed(2)}
              </h2>
              <p className="text-xs text-slate-400">Invoice: {invoice.invoiceNumber}</p>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                { id: 'Cash', label: 'Cash at Desk', icon: Banknote },
                { id: 'Card', label: 'Card / POS', icon: CreditCard }
              ].map((m) => {
                const IconComponent = m.icon;
                const isSelected = selectedMethod === m.id;

                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`py-3 px-2 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-600 dark:text-brand-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="text-xs font-bold">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* UPI QR Display */}
            {selectedMethod === 'UPI' && upiData && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                <div className="p-3 bg-white rounded-2xl inline-block shadow-sm border border-slate-200">
                  <img
                    src={upiData.qrDataUrl}
                    alt="UPI QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Scan with Google Pay, PhonePe, Paytm, BHIM
                  </p>
                  <p className="text-[11px] font-mono text-slate-500">UPI ID: {upiData.upiId}</p>
                </div>

                {/* Mobile Intent link */}
                <a
                  href={upiData.upiString}
                  className="block w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-brand-500 to-amber-600 shadow-glow hover:brightness-105"
                >
                  Pay with UPI App
                </a>

                {/* Demo Instant Verification */}
                <button
                  onClick={() => handleCompletePayment('UPI')}
                  disabled={isProcessing}
                  className="text-xs text-brand-600 font-bold hover:underline"
                >
                  {isProcessing ? 'Verifying...' : 'Simulate Instant Payment Complete'}
                </button>
              </div>
            )}

            {/* Cash / Card Settlement button */}
            {selectedMethod !== 'UPI' && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Please inform your server or pay directly at the cashier desk using {selectedMethod}.
                </p>
                <button
                  onClick={() => handleCompletePayment(selectedMethod)}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-slate-900 dark:bg-slate-800 shadow-md hover:bg-black"
                >
                  {isProcessing ? 'Recording...' : `Record ${selectedMethod} Settlement`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Official Bill Card View */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 font-mono text-xs">
          <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-800 space-y-1">
            <h3 className="font-bold text-base font-sans uppercase tracking-wider">
              {invoice.restaurantDetails?.name || 'THE ROYAL SPICE'}
            </h3>
            <p className="text-[11px] text-slate-500">{invoice.restaurantDetails?.address?.street || 'Indiranagar 100ft Road'}</p>
            <p className="text-[11px] text-slate-500">Phone: {invoice.restaurantDetails?.phone || '+91 98450 12345'}</p>
            {invoice.restaurantDetails?.gstNumber && (
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">GSTIN: {invoice.restaurantDetails?.gstNumber}</p>
            )}
          </div>

          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-[11px]">
            <div>
              <p>INVOICE: <strong>{invoice.invoiceNumber}</strong></p>
              <p>GUEST: {invoice.customer?.name}</p>
            </div>
            <div className="text-right">
              <p>TABLE: <strong>#{invoice.tableNumber}</strong></p>
              <p>DATE: {new Date(invoice.createdAt || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Line items */}
          <div className="py-2 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="grid grid-cols-12 font-bold text-[11px] text-slate-400 border-b pb-1">
              <span className="col-span-6">ITEM</span>
              <span className="col-span-2 text-center">QTY</span>
              <span className="col-span-4 text-right">TOTAL</span>
            </div>
            {invoice.items?.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 text-xs py-1">
                <span className="col-span-6 font-medium">{item.name}</span>
                <span className="col-span-2 text-center font-bold">× {item.quantity}</span>
                <span className="col-span-4 text-right font-bold">{currency}{item.itemTotal?.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{currency}{invoice.subtotal?.toFixed(2)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount ({invoice.couponCode || 'PROMO'})</span>
                <span>-{currency}{invoice.discount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>GST ({invoice.taxRate || 5}%)</span>
              <span>{currency}{invoice.tax?.toFixed(2)}</span>
            </div>
            {invoice.serviceCharge > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Service Charge (2.5%)</span>
                <span>{currency}{invoice.serviceCharge?.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline font-black text-base pt-2 border-t border-slate-200 dark:border-slate-800 font-sans">
              <span>Grand Total</span>
              <span className="text-brand-600 dark:text-brand-400">{currency}{invoice.grandTotal?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Hidden Thermal Receipt Print Target */}
      <div className="hidden">
        <PrintableBill ref={printRef} invoice={invoice} restaurant={invoice.restaurantDetails} />
      </div>

      {/* Feedback Modal */}
      {isFeedbackOpen && (
        <FeedbackModal
          order={{ _id: orderId, tableNumber: invoice.tableNumber, customer: invoice.customer }}
          restaurantId={invoice.restaurant}
          onClose={() => setIsFeedbackOpen(false)}
        />
      )}
    </div>
  );
};

export default DigitalBillPage;
