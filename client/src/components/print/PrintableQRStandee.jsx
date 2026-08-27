import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export const PrintableQRStandee = forwardRef(({ table, restaurant }, ref) => {
  if (!table) return null;

  const rest = restaurant || {};
  const orderUrl = table.qrCodeUrl || `${window.location.origin}/order/${table.restaurant}/${table.tableNumber}`;

  return (
    <div ref={ref} className="p-8 bg-white text-slate-900 font-sans max-w-[340px] mx-auto border-4 border-amber-600 rounded-3xl shadow-xl text-center print:border-4 print:shadow-none my-4">
      {/* Restaurant branding */}
      <div className="flex flex-col items-center pb-4 border-b-2 border-amber-200">
        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-2xl shadow-md mb-2">
          🍽️
        </div>
        <h2 className="text-xl font-black uppercase text-slate-900 leading-tight">{rest.name || 'THE ROYAL SPICE'}</h2>
        <p className="text-xs text-amber-700 font-semibold">{rest.tagline || 'Contactless Smart Dining'}</p>
      </div>

      {/* Table Badge */}
      <div className="my-5">
        <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          {table.section || 'Main Dining'} • {table.floor || 'Ground'}
        </span>
        <h1 className="text-4xl font-black text-slate-900 mt-2 tracking-tight">TABLE {table.tableNumber}</h1>
      </div>

      {/* QR Code Container */}
      <div className="p-4 bg-slate-50 border-2 border-dashed border-amber-400 rounded-2xl inline-block shadow-inner">
        <QRCodeSVG
          value={orderUrl}
          size={180}
          level="H"
          includeMargin={false}
          imageSettings={{
            src: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>✨</text></svg>',
            x: undefined,
            y: undefined,
            height: 24,
            width: 24,
            excavate: true,
          }}
        />
      </div>

      {/* Instructions */}
      <div className="mt-5 space-y-1 text-slate-700">
        <p className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1">
          <span>📱</span> <span>Scan with Camera to Order</span>
        </p>
        <p className="text-xs text-slate-500">Browse Menu • Customize • Pay Seamlessly</p>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-3 border-t border-slate-100 flex justify-between text-[10px] text-slate-400 font-mono">
        <span>Token: {table.qrCodeToken ? `${table.qrCodeToken.slice(0, 8)}...` : 'ACTIVE'}</span>
        <span>Wi-Fi: RoyalGuest / dining123</span>
      </div>
    </div>
  );
});

export default PrintableQRStandee;
