import React from 'react';
import { X, Sparkles, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const UpsellModal = ({ recommendations = [], onClose, currency = '₹' }) => {
  const { addItem } = useCart();

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 p-4 flex justify-center pointer-events-none animate-slideUp">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-brand-500/30 p-4 pointer-events-auto flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 fill-brand-500 text-brand-500" />
            <span>Complete Your Meal</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {recommendations.map(({ item, reason }, idx) => (
            <div
              key={idx}
              className="shrink-0 w-44 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between"
            >
              <div>
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-20 object-cover rounded-xl mb-1.5"
                />
                <h5 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{item.name}</h5>
                <p className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">{reason}</p>
              </div>

              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="font-black text-xs text-slate-900 dark:text-white">{currency}{item.price}</span>
                <button
                  onClick={() => addItem(item, 1)}
                  className="p-1 rounded-lg bg-brand-500 text-white hover:bg-brand-600 active:scale-95 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpsellModal;
