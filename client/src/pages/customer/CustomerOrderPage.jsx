import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  Search, 
  ShoppingBag, 
  Bell, 
  Moon, 
  Sun, 
  Flame, 
  Star, 
  Percent, 
  Check, 
  AlertCircle,
  Phone,
  User,
  Sparkles,
  ChevronRight
} from 'lucide-react';

import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { playSuccessChime, playOrderBell } from '../../services/soundService';

import CategoryNav from '../../components/customer/CategoryNav';
import MenuCard from '../../components/customer/MenuCard';
import ItemDetailModal from '../../components/customer/ItemDetailModal';
import CartDrawer from '../../components/customer/CartDrawer';
import UpsellModal from '../../components/customer/UpsellModal';
import ReturningCustomerModal from '../../components/customer/ReturningCustomerModal';
import WaiterCallModal from '../../components/customer/WaiterCallModal';

export const CustomerOrderPage = () => {
  const { restaurantId, tableId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const { theme, toggleTheme } = useTheme();
  const { socket, joinTable } = useSocket();
  const { 
    items, 
    customer, 
    setCustomer, 
    totals, 
    itemCount, 
    clearCart,
    calculatePreview 
  } = useCart();

  // State
  const [restaurant, setRestaurant] = useState(null);
  const [table, setTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'VEG' | 'NON_VEG' | 'BESTSELLER' | 'OFFERS'

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Drawers
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWaiterCallOpen, setIsWaiterCallOpen] = useState(false);
  const [returningCustomerData, setReturningCustomerData] = useState(null);
  const [upsellRecommendations, setUpsellRecommendations] = useState([]);
  const [showCustomerPrompt, setShowCustomerPrompt] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Customer Form state
  const [custName, setCustName] = useState(customer.name || '');
  const [custMobile, setCustMobile] = useState(customer.mobile || '');

  // 1. Validate QR & Load Restaurant + Menu
  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch Restaurant details
        const restRes = await api.get(`/restaurants/${restaurantId || 'current'}`);
        if (!restRes.data.success) throw new Error('Restaurant not found');
        const restData = restRes.data.restaurant;
        setRestaurant(restData);

        // Fetch Menu (categories + products)
        const menuRes = await api.get(`/menu/${restData._id}`);
        if (menuRes.data.success) {
          setCategories(menuRes.data.categories || []);
          setMenuItems(menuRes.data.items || []);
          setFilteredItems(menuRes.data.items || []);
        }

        // Validate Table
        const targetTable = tableId || '01';
        try {
          const tblRes = await api.get(`/tables/${targetTable}`);
          if (tblRes.data.success && tblRes.data.table) {
            setTable(tblRes.data.table);
            setCustomer(prev => ({ ...prev, tableNumber: tblRes.data.table.tableNumber }));
          } else {
            setTable({ tableNumber: targetTable, _id: targetTable });
            setCustomer(prev => ({ ...prev, tableNumber: targetTable }));
          }
        } catch (tblErr) {
          setTable({ tableNumber: targetTable, _id: targetTable });
          setCustomer(prev => ({ ...prev, tableNumber: targetTable }));
        }

        // Check if customer name & mobile exist, if not show prompt
        if (!customer.name || !customer.mobile) {
          setShowCustomerPrompt(true);
        } else {
          // Lookup returning customer data
          lookupReturningCustomer(restData._id, customer.mobile);
        }

        // Join socket table room
        joinTable(restData._id, targetTable);
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err.message || 'Unable to load restaurant menu. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [restaurantId, tableId]);

  // Real-time menu availability updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleMenuAvailability = ({ itemId, isAvailable }) => {
      setMenuItems(prev => prev.map(item => item._id === itemId ? { ...item, isAvailable } : item));
      setFilteredItems(prev => prev.map(item => item._id === itemId ? { ...item, isAvailable } : item));
    };

    socket.on('menuAvailabilityChanged', handleMenuAvailability);

    return () => {
      socket.off('menuAvailabilityChanged', handleMenuAvailability);
    };
  }, [socket]);

  // Lookup Returning Customer
  const lookupReturningCustomer = async (restId, mobile) => {
    try {
      const res = await api.get(`/customers/lookup?restaurantId=${restId}&mobile=${mobile}`);
      if (res.data.success && res.data.isReturning) {
        setReturningCustomerData(res.data);
      }
    } catch (err) {
      console.warn('Customer lookup error:', err.message);
    }
  };

  // Submit Customer Information Prompt
  const handleSaveCustomerInfo = (e) => {
    e.preventDefault();
    if (!custName.trim() || !custMobile.trim() || custMobile.trim().length < 10) {
      alert('Please provide your name and a valid 10-digit mobile number');
      return;
    }

    const updatedCust = {
      name: custName.trim(),
      mobile: custMobile.trim(),
      tableNumber: tableId || '01'
    };

    setCustomer(updatedCust);
    setShowCustomerPrompt(false);

    if (restaurant?._id) {
      lookupReturningCustomer(restaurant._id, updatedCust.mobile);
    }
  };

  // Filtering Logic
  useEffect(() => {
    let result = [...menuItems];

    // Category Filter
    if (activeCategory !== 'ALL') {
      result = result.filter(item => {
        const catId = item.category?._id || item.category;
        return catId === activeCategory;
      });
    }

    // Type Filter
    if (filterType === 'VEG') {
      result = result.filter(item => item.foodType === 'veg' || item.foodType === 'vegan');
    } else if (filterType === 'NON_VEG') {
      result = result.filter(item => item.foodType === 'non-veg');
    } else if (filterType === 'BESTSELLER') {
      result = result.filter(item => item.isBestseller);
    } else if (filterType === 'OFFERS') {
      result = result.filter(item => item.discount && item.discount > 0);
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.ingredients && item.ingredients.some(ing => ing.toLowerCase().includes(query)))
      );
    }

    setFilteredItems(result);
  }, [activeCategory, filterType, searchQuery, menuItems]);

  // Trigger Place Order
  const handlePlaceOrder = async ({ specialInstructions }) => {
    if (!customer.name || !customer.mobile) {
      setIsCartOpen(false);
      setShowCustomerPrompt(true);
      return;
    }

    if (items.length === 0) {
      alert('Please add items to your cart first.');
      return;
    }

    try {
      setIsPlacingOrder(true);

      const payload = {
        restaurantId: restaurant._id,
        tableId: table?._id || tableId,
        tableNumber: table?.tableNumber || tableId || '01',
        customerName: customer.name,
        customerMobile: customer.mobile,
        items: items.map(i => ({
          menuItemId: i._id,
          quantity: i.quantity,
          spicyLevel: i.spicyLevel,
          specialInstructions: i.specialInstructions
        })),
        specialInstructions,
        couponCode: totals.couponCode,
        redeemPoints: totals.loyaltyPointsUsed
      };

      const res = await api.post('/orders', payload);

      if (res.data.success) {
        // Confetti celebratory burst!
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });

        playSuccessChime();
        clearCart();
        setIsCartOpen(false);

        // Navigate to live status page
        navigate(`/order/status/${res.data.order._id}`);
      }
    } catch (err) {
      alert(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-3xl animate-bounce shadow-glow">
          🍽️
        </div>
        <div className="text-center space-y-1">
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-slate-200">Setting up Table #{tableId || '01'}</h2>
          <p className="text-xs text-slate-400">Loading gourmet menu and real-time specials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Dining Table Notice</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-brand-500 shadow-glow"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28">
      {/* Top Mobile-First Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-brand-500 flex items-center justify-center text-xl shadow-sm shrink-0">
              {restaurant?.logo ? (
                <img src={restaurant.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                '🍽️'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base text-slate-900 dark:text-white tracking-tight leading-tight line-clamp-1">
                  {restaurant?.name || 'The Royal Spice'}
                </h1>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-extrabold px-2 py-0.5 rounded-md">
                  Table #{tableId || '01'}
                </span>
                {customer.name && (
                  <span>Guest: <strong className="text-slate-700 dark:text-slate-200">{customer.name}</strong></span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Call Waiter */}
            <button
              onClick={() => setIsWaiterCallOpen(true)}
              className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 hover:bg-amber-100 transition-colors flex items-center gap-1 text-xs font-bold"
              title="Call Waiter"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Waiter</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner with Tagline */}
      <div className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-brand-600 text-white px-4 py-5 overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest bg-black/30 backdrop-blur-md px-2.5 py-0.5 rounded-full mb-1 text-amber-200">
              <Sparkles className="w-3 h-3 text-amber-300" /> Contactless Smart Dining
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
              {restaurant?.tagline || 'Experience Authentic Gourmet Dining'}
            </h2>
            <p className="text-xs text-amber-100 max-w-md mt-0.5 opacity-90">
              Select your favorites, customize spice levels, and order directly to the kitchen.
            </p>
          </div>

          {/* Quick Active Deals Tag */}
          <div className="shrink-0 bg-white/15 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-2xl flex items-center gap-2">
            <Percent className="w-5 h-5 text-amber-300" />
            <div className="text-left text-xs">
              <p className="font-extrabold leading-tight">WELCOME50</p>
              <p className="text-[10px] text-amber-200">Flat ₹50 OFF on ₹300+</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Quick Filter Chips */}
      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-3">
        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes, ingredients, curries, breads..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
          />
        </div>

        {/* Quick Filter Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'VEG', label: '🌱 Pure Veg', color: 'emerald' },
            { id: 'NON_VEG', label: '🍗 Non-Veg', color: 'rose' },
            { id: 'BESTSELLER', label: '⭐ Bestsellers', color: 'amber' },
            { id: 'OFFERS', label: '🏷️ Deals', color: 'orange' }
          ].map((f) => {
            const isSelected = filterType === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Pills Navigation (Sticky) */}
      <CategoryNav
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {/* Main Menu Feed */}
      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
              🔍
            </div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">No dishes match your filter</h3>
            <p className="text-xs text-slate-400">Try changing your search terms or clearing filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredItems.map((item) => (
              <MenuCard
                key={item._id}
                item={item}
                currency={restaurant?.currency || '₹'}
                onOpenDetail={(it) => setSelectedDetailItem(it)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating Sticky Bottom Cart Action Bar */}
      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 px-4 flex justify-center animate-slideUp">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full max-w-md py-3.5 px-5 rounded-2xl bg-slate-900 dark:bg-brand-600 text-white shadow-2xl flex items-center justify-between active:scale-[0.99] transition-all border border-slate-700/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-500 dark:bg-white text-white dark:text-brand-600 flex items-center justify-center font-black text-sm">
                {itemCount}
              </div>
              <div className="text-left">
                <span className="font-extrabold text-xs uppercase tracking-wider block text-slate-300 dark:text-amber-200">
                  {itemCount} {itemCount === 1 ? 'Dish' : 'Dishes'} in Cart
                </span>
                <span className="font-black text-base leading-none">
                  View Order • {restaurant?.currency || '₹'}{totals.grandTotal ? totals.grandTotal.toFixed(2) : '...'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 font-bold text-xs bg-white/20 dark:bg-black/20 px-3 py-1.5 rounded-xl">
              <span>Checkout</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Customer Name & Mobile Identification Prompt Modal */}
      {showCustomerPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-500 text-white flex items-center justify-center text-2xl shadow-glow">
                🍽️
              </div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">Welcome to Table #{tableId || '01'}</h3>
              <p className="text-xs text-slate-500">Please provide your details to personalize your dining session.</p>
            </div>

            <form onSubmit={handleSaveCustomerInfo} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Mobile Number (For Loyalty & Bill)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={custMobile}
                    onChange={(e) => setCustMobile(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-brand-500 to-amber-600 shadow-glow hover:brightness-105 active:scale-95 transition-all mt-2"
              >
                Start Ordering
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedDetailItem && (
        <ItemDetailModal
          item={selectedDetailItem}
          currency={restaurant?.currency || '₹'}
          onClose={() => setSelectedDetailItem(null)}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        restaurant={restaurant}
        tableNumber={tableId || '01'}
        onPlaceOrder={handlePlaceOrder}
        isPlacingOrder={isPlacingOrder}
        customerLoyaltyPoints={returningCustomerData?.customer?.loyaltyPoints || 0}
      />

      {/* Returning Customer Welcome Modal */}
      {returningCustomerData && (
        <ReturningCustomerModal
          customerInfo={returningCustomerData}
          currency={restaurant?.currency || '₹'}
          onClose={() => setReturningCustomerData(null)}
        />
      )}

      {/* Call Waiter Modal */}
      {isWaiterCallOpen && (
        <WaiterCallModal
          restaurantId={restaurant?._id}
          tableNumber={tableId || '01'}
          onClose={() => setIsWaiterCallOpen(false)}
        />
      )}
    </div>
  );
};

export default CustomerOrderPage;
