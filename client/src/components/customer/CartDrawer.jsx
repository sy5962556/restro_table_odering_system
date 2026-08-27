import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  Tag, 
  Sparkles, 
  Coins, 
  ChevronRight, 
  Receipt, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';

export const CartDrawer = ({ 
  isOpen, 
  onClose, 
  restaurant, 
  tableNumber, 
  onPlaceOrder, 
  isPlacingOrder,
  customerLoyaltyPoints = 0
}) => {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    updateInstruction, 
    totals, 
    calculatePreview, 
    isCalculating,
    couponCode, 
    setCouponCode,
    appliedCoupon,
    setAppliedCoupon,
    redeemPoints,
    setRedeemPoints,
    customer,
    setCustomer
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [overallNotes, setOverallNotes] = useState('');
  const [showPointsToggle, setShowPointsToggle] = useState(false);

  const currency = restaurant?.currency || '₹';

  // Recalculate bill whenever cart items change
  useEffect(() => {
    if (restaurant?._id && isOpen) {
      calculatePreview(restaurant._id);
    }
  }, [items, couponCode, redeemPoints, isOpen, restaurant?._id]);

  if (!isOpen) return null;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');

    if (!couponInput.trim()) return;

    try {
      const res = await api.post('/offers/validate', {
        restaurantId: restaurant._id,
        code: couponInput.trim(),
        subtotal: totals.subtotal
      });

      if (res.data.success) {
        setCouponCode(res.data.offer.code);
        setAppliedCoupon(res.data.offer);
        setCouponInput('');
      }
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon');
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm animate-fadeIn flex justify-end">
      <div 
        className="w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-black text-base shadow-glow">
              🛒
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">Your Dining Cart</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Table #{tableNumber} • {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl">
                🍽️
              </div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Your cart is empty</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Explore our gourmet menu and add your favorite dishes to place an order.
              </p>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Selected Dishes</h4>
                {items.map((item) => (
                  <div 
                    key={item._id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <div className={item.foodType === 'veg' || item.foodType === 'vegan' ? 'veg-badge' : 'non-veg-badge'}>
                            <div className={item.foodType === 'veg' || item.foodType === 'vegan' ? 'veg-dot' : 'non-veg-dot'}></div>
                          </div>
                          <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">{item.name}</h5>
                        </div>
                        <p className="text-xs font-extrabold text-brand-600 dark:text-brand-400 mt-0.5">
                          {currency}{item.price} × {item.quantity} = {currency}{item.price * item.quantity}
                        </p>
                      </div>

                      {/* Quantity Buttons */}
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-red-500"
                        >
                          {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-rose-500" /> : <Minus className="w-3 h-3" />}
                        </button>
                        <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-500"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Custom instruction note for this item */}
                    <input
                      type="text"
                      value={item.specialInstructions || ''}
                      onChange={(e) => updateInstruction(item._id, e.target.value)}
                      placeholder="Add note for this item (e.g. less spicy)..."
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                ))}
              </div>

              {/* Overall Special Instructions for kitchen */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Overall Order Cooking Notes
                </label>
                <textarea
                  rows={2}
                  value={overallNotes}
                  onChange={(e) => setOverallNotes(e.target.value)}
                  placeholder="Any special allergy requests or dietary preferences for the chef..."
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Promo Offers & Coupon Section */}
              <div className="p-3.5 bg-brand-50/60 dark:bg-brand-950/30 rounded-2xl border border-brand-100 dark:border-brand-900/50">
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-800 dark:text-brand-300 mb-2">
                  <Tag className="w-3.5 h-3.5 text-brand-600" />
                  <span>Apply Promo Code</span>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">{appliedCoupon.code}</span>
                        <p className="text-[10px] text-emerald-600 font-semibold">Saved {currency}{totals.discount}!</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs text-rose-500 font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="e.g. WELCOME50, ROYAL15"
                      className="flex-1 text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 uppercase font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 text-xs font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponError && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {couponError}
                  </p>
                )}
              </div>

              {/* Loyalty Points Redemption (if returning customer with points) */}
              {customerLoyaltyPoints > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-600" />
                    <div>
                      <h5 className="font-bold text-xs text-amber-900 dark:text-amber-200">Redeem Loyalty Points</h5>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400">
                        You have {customerLoyaltyPoints} points ({currency}{customerLoyaltyPoints})
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={redeemPoints > 0}
                    onChange={(e) => setRedeemPoints(e.target.checked ? Math.min(customerLoyaltyPoints, totals.subtotal) : 0)}
                    className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
                  />
                </div>
              )}

              {/* Bill Details Breakdown */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-medium">
                  <span>Subtotal</span>
                  <span>{currency}{totals.subtotal.toFixed(2)}</span>
                </div>

                {totals.discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-semibold">
                    <span>Discount</span>
                    <span>-{currency}{totals.discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-medium">
                  <span>GST ({totals.taxRate || 5}%)</span>
                  <span>{currency}{totals.tax.toFixed(2)}</span>
                </div>

                {totals.serviceCharge > 0 && (
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-medium">
                    <span>Service Charge ({totals.serviceChargeRate || 2.5}%)</span>
                    <span>{currency}{totals.serviceCharge.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-base font-black text-slate-900 dark:text-white">
                  <span>To Pay</span>
                  <span className="text-brand-600 dark:text-brand-400">{currency}{totals.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer CTA */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-brand-500" />
                Est. Prep: {totals.estimatedPrepTime || 15} mins
              </span>
              <span>Total items: {items.reduce((s, i) => s + i.quantity, 0)}</span>
            </div>

            <button
              onClick={() => onPlaceOrder({ specialInstructions: overallNotes })}
              disabled={isPlacingOrder || isCalculating}
              className="w-full py-3.5 px-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-brand-500 to-amber-600 shadow-glow hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-between disabled:opacity-50"
            >
              <span>{isPlacingOrder ? 'PLACING ORDER...' : 'CONFIRM & PLACE ORDER'}</span>
              <div className="flex items-center gap-1">
                <span>{currency}{totals.grandTotal.toFixed(2)}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
