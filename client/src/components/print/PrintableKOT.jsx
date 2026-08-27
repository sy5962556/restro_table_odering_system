import React, { forwardRef } from 'react';

export const PrintableKOT = forwardRef(({ order, restaurant }, ref) => {
  if (!order) return null;

  const items = order.items || [];

  return (
    <div ref={ref} className="print-area p-5 bg-white text-black font-mono text-sm max-w-[300px] mx-auto border-2 border-black">
      {/* KOT Header */}
      <div className="text-center pb-2 border-b-2 border-black">
        <h1 className="text-xl font-black uppercase tracking-wide">KITCHEN ORDER (KOT)</h1>
        <p className="text-xs font-bold uppercase">{restaurant?.name || 'THE ROYAL SPICE'}</p>
      </div>

      {/* Meta details */}
      <div className="py-2 border-b-2 border-black text-xs space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-base font-bold">TABLE: <span className="text-xl font-black">#{order.tableNumber}</span></span>
          <span className="font-bold">ORDER: #{order.orderNumber?.split('-')[2] || order.orderNumber}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>TIME: {new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span>EST. PREP: {order.estimatedPrepTime || 15} MIN</span>
        </div>
      </div>

      {/* Order Items */}
      <div className="py-3 border-b-2 border-black">
        <div className="flex justify-between text-xs font-bold pb-1 border-b border-black">
          <span className="w-4/5">ITEM</span>
          <span className="w-1/5 text-right">QTY</span>
        </div>
        <div className="divide-y divide-dotted divide-gray-400">
          {items.map((item, idx) => (
            <div key={idx} className="py-2">
              <div className="flex justify-between items-baseline font-bold text-sm">
                <span className="w-4/5 leading-tight">{item.name}</span>
                <span className="w-1/5 text-right text-base font-black">× {item.quantity}</span>
              </div>
              {item.specialInstructions && (
                <p className="text-xs font-semibold text-red-600 mt-0.5 uppercase bg-yellow-100 p-0.5 inline-block">
                  ⚠️ {item.specialInstructions}
                </p>
              )}
              {item.spicyLevel && item.spicyLevel !== 'none' && (
                <p className="text-[11px] text-gray-600">Spice: {item.spicyLevel}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Special Overall Instructions */}
      {order.specialInstructions && (
        <div className="py-2 border-b-2 border-black bg-yellow-50 p-2 my-1">
          <p className="text-xs font-bold uppercase text-red-700">GUEST NOTES:</p>
          <p className="text-xs font-semibold">{order.specialInstructions}</p>
        </div>
      )}

      {/* Footer Timestamp */}
      <div className="text-center pt-2 text-[10px] text-gray-500">
        PRINTED: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
});

export default PrintableKOT;
