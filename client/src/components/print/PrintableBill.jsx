import React, { forwardRef } from 'react';

export const PrintableBill = forwardRef(({ invoice, restaurant }, ref) => {
  if (!invoice) return null;

  const rest = restaurant || invoice.restaurantDetails || {};
  const items = invoice.items || [];
  const currency = rest.currency || '₹';

  return (
    <div ref={ref} className="print-area p-6 bg-white text-black font-mono text-sm max-w-[320px] mx-auto border border-dashed border-gray-300">
      {/* Header */}
      <div className="text-center pb-3 border-b border-dashed border-black">
        <h2 className="text-lg font-bold uppercase tracking-wider">{rest.name || 'THE ROYAL SPICE'}</h2>
        <p className="text-xs text-gray-700">{rest.address?.street || 'Indiranagar 100ft Road'}</p>
        <p className="text-xs text-gray-700">{rest.address?.city || 'Bengaluru'}, {rest.address?.pincode || '560038'}</p>
        <p className="text-xs text-gray-700">Phone: {rest.phone || '+91 98450 12345'}</p>
        {rest.gstNumber && <p className="text-xs font-semibold mt-1">GSTIN: {rest.gstNumber}</p>}
      </div>

      {/* Invoice Meta */}
      <div className="py-2 text-xs border-b border-dashed border-black space-y-1">
        <div className="flex justify-between">
          <span>INVOICE: <strong className="font-bold">{invoice.invoiceNumber || 'INV-0001'}</strong></span>
          <span>TABLE: <strong className="font-bold text-sm">#{invoice.tableNumber}</strong></span>
        </div>
        <div className="flex justify-between">
          <span>ORDER: #{invoice.orderNumber?.split('-')[2] || invoice.orderNumber || '0001'}</span>
          <span>DATE: {new Date(invoice.createdAt || Date.now()).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span>GUEST: {invoice.customer?.name || 'Valued Guest'}</span>
          <span>TIME: {new Date(invoice.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="py-2 border-b border-dashed border-black">
        <div className="grid grid-cols-12 text-xs font-bold pb-1 border-b border-black">
          <span className="col-span-6">ITEM</span>
          <span className="col-span-2 text-center">QTY</span>
          <span className="col-span-4 text-right">TOTAL</span>
        </div>
        <div className="divide-y divide-dotted divide-gray-300">
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 text-xs py-1.5">
              <div className="col-span-6 pr-1">
                <p className="font-medium leading-tight">{item.name}</p>
                <p className="text-[10px] text-gray-600">{currency}{item.price}</p>
              </div>
              <span className="col-span-2 text-center">{item.quantity}</span>
              <span className="col-span-4 text-right font-medium">{currency}{(item.itemTotal || item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Totals Breakdown */}
      <div className="py-2 text-xs space-y-1 border-b border-dashed border-black">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{currency}{(invoice.subtotal || 0).toFixed(2)}</span>
        </div>
        {invoice.discount > 0 && (
          <div className="flex justify-between text-emerald-700 font-medium">
            <span>Discount {invoice.couponCode ? `(${invoice.couponCode})` : ''}:</span>
            <span>-{currency}{invoice.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>GST ({invoice.taxRate || 5}%):</span>
          <span>{currency}{(invoice.tax || 0).toFixed(2)}</span>
        </div>
        {invoice.serviceCharge > 0 && (
          <div className="flex justify-between">
            <span>Service Charge (2.5%):</span>
            <span>{currency}{invoice.serviceCharge.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="py-3 border-b-2 border-black flex justify-between items-center">
        <span className="text-base font-extrabold uppercase">GRAND TOTAL:</span>
        <span className="text-lg font-black">{currency}{(invoice.grandTotal || 0).toFixed(2)}</span>
      </div>

      {/* Payment Meta */}
      <div className="py-2 text-xs text-center">
        <p className="font-semibold">
          STATUS: <span className={invoice.paymentStatus === 'Paid' ? 'text-emerald-700 font-bold' : 'text-amber-600 font-bold'}>
            {invoice.paymentStatus?.toUpperCase()}
          </span>
          {invoice.paymentMethod && invoice.paymentMethod !== 'Pending' ? ` via ${invoice.paymentMethod}` : ''}
        </p>
        {rest.upiId && invoice.paymentStatus !== 'Paid' && (
          <p className="text-[11px] text-gray-600 mt-1">UPI ID: {rest.upiId}</p>
        )}
      </div>

      {/* Footer message */}
      <div className="text-center pt-2 text-[11px] text-gray-600">
        <p className="font-bold">Thank you for dining with us!</p>
        <p>Please visit again ✨</p>
      </div>
    </div>
  );
});

export default PrintableBill;
