import React from 'react';
import { X, Sparkles, RotateCcw, Heart, Coins, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const ReturningCustomerModal = ({ customerInfo, onClose, currency = '₹' }) => {
  const { addItem } = useCart();

  if (!customerInfo || !customerInfo.isReturning) return null;

  const { customer } = customerInfo;
  const favorites = customer?.favoriteItems || [];

  const handleAddAllFavorites = () => {
    favorites.forEach((fav) => {
      if (fav.menuItem) {
        addItem(fav.menuItem, 1);
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-brand-500/40 p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Welcome Back Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shadow-glow">
            👑
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
              Visit #{customer.visitsCount}
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
              Welcome Back, {customer.name}!
            </h3>
          </div>
        </div>

        {/* Loyalty summary */}
        {customer.loyaltyPoints > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/60 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <Coins className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              You have <strong>{customer.loyaltyPoints} Loyalty Points</strong> ({currency}{customer.loyaltyPoints}) ready to redeem on this order!
            </span>
          </div>
        )}

        {/* Favorite Dishes */}
        {favorites.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                Your Past Favorites
              </h4>
            </div>

            <div className="space-y-2">
              {favorites.map((fav, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200">{fav.name}</span>
                  <button
                    onClick={() => {
                      if (fav.menuItem) addItem(fav.menuItem, 1);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-brand-600 bg-white dark:bg-slate-700 border border-brand-200 dark:border-brand-800 hover:bg-brand-500 hover:text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dismiss CTA */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Explore Full Menu
        </button>
      </div>
    </div>
  );
};

export default ReturningCustomerModal;
