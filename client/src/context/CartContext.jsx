import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('pos_cart_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem('pos_customer');
    return saved ? JSON.parse(saved) : { name: '', mobile: '', tableNumber: '' };
  });

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [totals, setTotals] = useState({
    subtotal: 0,
    discount: 0,
    tax: 0,
    taxRate: 5,
    serviceCharge: 0,
    serviceChargeRate: 2.5,
    grandTotal: 0,
    estimatedPrepTime: 15
  });
  const [isCalculating, setIsCalculating] = useState(false);

  // Save cart to local storage
  useEffect(() => {
    localStorage.setItem('pos_cart_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('pos_customer', JSON.stringify(customer));
  }, [customer]);

  // Recalculate bill preview when items, coupon, or redeem points change
  const calculatePreview = async (restaurantId) => {
    if (!items || items.length === 0 || !restaurantId) {
      setTotals({
        subtotal: 0,
        discount: 0,
        tax: 0,
        taxRate: 5,
        serviceCharge: 0,
        serviceChargeRate: 2.5,
        grandTotal: 0,
        estimatedPrepTime: 15
      });
      return;
    }

    try {
      setIsCalculating(true);
      const res = await api.post('/orders/preview', {
        restaurantId,
        items: items.map(i => ({
          menuItemId: i._id,
          quantity: i.quantity,
          spicyLevel: i.spicyLevel,
          specialInstructions: i.specialInstructions
        })),
        couponCode: couponCode || appliedCoupon?.code,
        mobile: customer?.mobile,
        redeemPoints
      });

      if (res.data.success) {
        setTotals(res.data.calculation);
        if (res.data.calculation.couponCode) {
          setAppliedCoupon({ code: res.data.calculation.couponCode, discount: res.data.calculation.couponDiscount });
        }
      }
    } catch (err) {
      console.warn('Calculation error:', err.message);
    } finally {
      setIsCalculating(false);
    }
  };

  const addItem = (item, quantity = 1, specialInstructions = '') => {
    setItems((prevItems) => {
      const existingIdx = prevItems.findIndex(i => i._id === item._id);
      if (existingIdx > -1) {
        const updated = [...prevItems];
        updated[existingIdx].quantity += quantity;
        if (specialInstructions) updated[existingIdx].specialInstructions = specialInstructions;
        return updated;
      }
      return [...prevItems, {
        _id: item._id,
        name: item.name,
        price: item.finalPrice || item.price,
        originalPrice: item.price,
        image: item.image,
        foodType: item.foodType,
        spicyLevel: item.spicyLevel || 'medium',
        preparationTime: item.preparationTime || 15,
        quantity: Math.max(1, quantity),
        specialInstructions: specialInstructions || ''
      }];
    });
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) => prev.map(i => i._id === itemId ? { ...i, quantity } : i));
  };

  const updateInstruction = (itemId, instructions) => {
    setItems((prev) => prev.map(i => i._id === itemId ? { ...i, specialInstructions: instructions } : i));
  };

  const removeItem = (itemId) => {
    setItems((prev) => prev.filter(i => i._id !== itemId));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponCode('');
    setRedeemPoints(0);
    localStorage.removeItem('pos_cart_items');
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      customer,
      setCustomer,
      addItem,
      updateQuantity,
      updateInstruction,
      removeItem,
      clearCart,
      itemCount,
      totals,
      calculatePreview,
      isCalculating,
      couponCode,
      setCouponCode,
      appliedCoupon,
      setAppliedCoupon,
      redeemPoints,
      setRedeemPoints
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
