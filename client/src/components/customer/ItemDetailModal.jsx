import React, { useState } from 'react';
import { X, Clock, Flame, Plus, Minus, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const ItemDetailModal = ({ item, onClose, currency = '₹' }) => {
  const { addItem, items, updateQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [spicyLevel, setSpicyLevel] = useState(item?.spicyLevel || 'medium');

  if (!item) return null;

  const isVeg = item.foodType === 'veg' || item.foodType === 'vegan';
  const hasDiscount = item.discount && item.discount > 0;
  const finalPrice = item.finalPrice || (hasDiscount ? item.price - (item.price * (item.discount / 100)) : item.price);

  const handleAddToCart = () => {
    addItem({ ...item, spicyLevel }, quantity, specialInstructions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Image */}
        <div className="relative h-60 w-full shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <div className={isVeg ? 'veg-badge bg-white' : 'non-veg-badge bg-white'}>
                <div className={isVeg ? 'veg-dot' : 'non-veg-dot'}></div>
              </div>
              <span className="text-xs font-bold uppercase tracking-wider bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                {item.category?.name || 'Chef Special'}
              </span>
            </div>
            <h2 className="text-2xl font-black">{item.name}</h2>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-5">
          {/* Price & Meta summary */}
          <div className="flex justify-between items-baseline border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-brand-600 dark:text-brand-400">
                  {currency}{Math.round(finalPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-slate-400 line-through">
                    {currency}{item.price}
                  </span>
                )}
                {hasDiscount && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    Save {currency}{Math.round(item.price - finalPrice)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Taxes & charges calculated at checkout</p>
            </div>

            <div className="text-right text-xs text-slate-500 space-y-0.5">
              <div className="flex items-center gap-1 justify-end font-semibold text-slate-700 dark:text-slate-300">
                <Clock className="w-3.5 h-3.5 text-brand-500" />
                <span>{item.preparationTime || 15} mins prep</span>
              </div>
              {item.calories && <p>{item.calories} kcal</p>}
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">About This Dish</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Ingredients */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Key Ingredients</h4>
              <div className="flex flex-wrap gap-1.5">
                {item.ingredients.map((ing, idx) => (
                  <span key={idx} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Allergen Info */}
          {item.allergens && item.allergens.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <span className="font-bold">Allergen Notice:</span> Contains {item.allergens.join(', ')}.
              </div>
            </div>
          )}

          {/* Spice Level Selector */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              Choose Spice Preference
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {['mild', 'medium', 'hot', 'extra_hot'].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSpicyLevel(level)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border capitalize transition-all ${
                    spicyLevel === level
                      ? 'bg-orange-500 border-orange-500 text-white shadow-glow'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {level.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Special Cooking Instructions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Special Cooking Notes
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Less oil, no coriander, extra crispy..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Footer Quantity & Add to Cart */}
        <div className="sticky bottom-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-slate-50 dark:bg-slate-800">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg active:scale-95"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-black text-base text-slate-900 dark:text-white">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
            className="flex-1 py-3.5 px-4 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-brand-500 to-amber-600 shadow-glow hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-between"
          >
            <span>{item.isAvailable ? 'ADD TO ORDER' : 'CURRENTLY UNAVAILABLE'}</span>
            <span>{currency}{Math.round(finalPrice * quantity)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;
