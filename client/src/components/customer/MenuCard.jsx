import React from 'react';
import { Plus, Minus, Flame, Clock, Sparkles, Star, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const MenuCard = ({ item, onOpenDetail, currency = '₹' }) => {
  const { items, addItem, updateQuantity } = useCart();

  const cartItem = items.find((i) => i._id === item._id);
  const qty = cartItem ? cartItem.quantity : 0;

  const isVeg = item.foodType === 'veg' || item.foodType === 'vegan';
  const hasDiscount = item.discount && item.discount > 0;
  const finalPrice = item.finalPrice || (hasDiscount ? item.price - (item.price * (item.discount / 100)) : item.price);

  return (
    <div className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-4 border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
      item.isAvailable
        ? 'border-slate-200/80 dark:border-slate-800'
        : 'border-slate-200/40 dark:border-slate-800/40 opacity-70'
    }`}>
      {/* Top Details & Image */}
      <div className="flex gap-4">
        {/* Info Column */}
        <div className="flex-1 min-w-0">
          {/* Badges: Veg/Non-veg & Spice & Bestseller */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {/* Veg / Non-Veg Indicator */}
            <div className={isVeg ? 'veg-badge' : 'non-veg-badge'} title={item.foodType}>
              <div className={isVeg ? 'veg-dot' : 'non-veg-dot'}></div>
            </div>

            {/* Bestseller */}
            {item.isBestseller && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                Bestseller
              </span>
            )}

            {/* Special Offer */}
            {hasDiscount && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
                {item.discount}% OFF
              </span>
            )}

            {/* Spice indicator */}
            {item.spicyLevel && item.spicyLevel !== 'none' && (
              <span className="inline-flex items-center text-[10px] text-orange-600 dark:text-orange-400">
                <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
              </span>
            )}
          </div>

          {/* Dish Name */}
          <h3 
            onClick={() => onOpenDetail && onOpenDetail(item)}
            className="font-bold text-base text-slate-900 dark:text-slate-100 leading-snug cursor-pointer group-hover:text-brand-500 transition-colors line-clamp-1"
          >
            {item.name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-extrabold text-base text-slate-900 dark:text-white">
              {currency}{Math.round(finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                {currency}{item.price}
              </span>
            )}
          </div>

          {/* Description */}
          <p 
            onClick={() => onOpenDetail && onOpenDetail(item)}
            className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 cursor-pointer"
          >
            {item.shortDescription || item.description}
          </p>

          {/* Preparation Time */}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {item.preparationTime || 15} mins
            </span>
            {item.portionSize && <span>• {item.portionSize}</span>}
          </div>
        </div>

        {/* Dish Image & Action Button */}
        <div className="relative flex flex-col items-center shrink-0 w-28 h-28">
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            onClick={() => onOpenDetail && onOpenDetail(item)}
            className="w-28 h-24 object-cover rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 cursor-pointer group-hover:scale-[1.02] transition-transform duration-200"
          />

          {/* Quantity Controls / Add Button */}
          <div className="absolute -bottom-2 w-24 shadow-md rounded-lg">
            {!item.isAvailable ? (
              <div className="w-full py-1 text-[10px] font-bold uppercase text-center bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-lg">
                Sold Out
              </div>
            ) : qty === 0 ? (
              <button
                onClick={() => addItem(item, 1)}
                className="w-full py-1.5 text-xs font-black uppercase text-brand-600 bg-white dark:bg-slate-800 border-2 border-brand-500 rounded-lg hover:bg-brand-500 hover:text-white transition-colors flex items-center justify-center gap-1 active:scale-95"
              >
                <span>ADD</span>
                <Plus className="w-3 h-3 stroke-[3]" />
              </button>
            ) : (
              <div className="w-full py-1 text-xs font-bold bg-brand-500 text-white rounded-lg flex items-center justify-between px-2 shadow-glow">
                <button
                  onClick={() => updateQuantity(item._id, qty - 1)}
                  className="hover:scale-125 transition-transform p-0.5 active:scale-90"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <span className="font-extrabold text-sm">{qty}</span>
                <button
                  onClick={() => updateQuantity(item._id, qty + 1)}
                  className="hover:scale-125 transition-transform p-0.5 active:scale-90"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
