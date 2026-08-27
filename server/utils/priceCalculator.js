const MenuItem = require('../models/MenuItem');
const Offer = require('../models/Offer');
const Restaurant = require('../models/Restaurant');
const Customer = require('../models/Customer');

/**
 * Calculates server-side verified bill totals.
 * Never trust client prices!
 */
const calculateOrderTotals = async ({
  restaurantId,
  items,
  couponCode = null,
  mobile = null,
  redeemPoints = 0
}) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    throw new Error('Restaurant not found');
  }

  if (!items || items.length === 0) {
    throw new Error('Cart cannot be empty');
  }

  // Extract menu item IDs
  const menuItemIds = items.map(i => i.menuItemId || i.menuItem || i._id);
  const dbMenuItems = await MenuItem.find({
    _id: { $in: menuItemIds },
    restaurant: restaurantId
  });

  const menuItemMap = new Map();
  dbMenuItems.forEach(item => {
    menuItemMap.set(item._id.toString(), item);
  });

  // Calculate items with verified prices
  const verifiedItems = [];
  let subtotal = 0;
  let estimatedPrepTime = 15;

  for (const itemReq of items) {
    const itemIdStr = (itemReq.menuItemId || itemReq.menuItem || itemReq._id).toString();
    const dbItem = menuItemMap.get(itemIdStr);

    if (!dbItem) {
      throw new Error(`Menu item not found in catalog`);
    }

    if (!dbItem.isAvailable) {
      throw new Error(`Item "${dbItem.name}" is currently unavailable`);
    }

    const qty = parseInt(itemReq.quantity, 10);
    if (!qty || qty < 1) {
      throw new Error(`Invalid quantity for item "${dbItem.name}"`);
    }

    // Determine accurate unit price taking item-level discount into account
    let unitPrice = dbItem.price;
    if (dbItem.discount && dbItem.discount > 0) {
      unitPrice = dbItem.price - (dbItem.price * (dbItem.discount / 100));
      unitPrice = Math.round(unitPrice * 100) / 100;
    }

    const itemTotal = Math.round((unitPrice * qty) * 100) / 100;
    subtotal += itemTotal;

    if (dbItem.preparationTime && dbItem.preparationTime > estimatedPrepTime) {
      estimatedPrepTime = dbItem.preparationTime;
    }

    verifiedItems.push({
      menuItem: dbItem._id,
      name: dbItem.name,
      price: unitPrice,
      originalPrice: dbItem.price,
      discount: dbItem.discount || 0,
      quantity: qty,
      itemTotal,
      foodType: dbItem.foodType,
      spicyLevel: itemReq.spicyLevel || dbItem.spicyLevel || 'medium',
      preparationTime: dbItem.preparationTime || 15,
      specialInstructions: itemReq.specialInstructions || '',
      status: 'pending'
    });
  }

  subtotal = Math.round(subtotal * 100) / 100;

  // 1. Coupon Discount Calculation
  let couponDiscount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const offer = await Offer.findOne({
      restaurant: restaurantId,
      code: couponCode.trim().toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (offer) {
      if (subtotal >= offer.minOrderValue) {
        if (offer.discountType === 'percentage') {
          couponDiscount = (subtotal * offer.discountValue) / 100;
          if (offer.maxDiscount && couponDiscount > offer.maxDiscount) {
            couponDiscount = offer.maxDiscount;
          }
        } else if (offer.discountType === 'flat') {
          couponDiscount = Math.min(offer.discountValue, subtotal);
        }
        appliedCoupon = offer.code;
      }
    }
  }

  couponDiscount = Math.round(couponDiscount * 100) / 100;

  // 2. Loyalty Points Redemption
  let loyaltyDiscount = 0;
  let pointsUsed = 0;

  if (redeemPoints > 0 && mobile) {
    const customer = await Customer.findOne({ restaurant: restaurantId, mobile });
    if (customer && customer.loyaltyPoints >= redeemPoints) {
      const minPoints = restaurant.loyaltySettings?.minRedeemPoints || 20;
      if (redeemPoints >= minPoints) {
        const pointValue = restaurant.loyaltySettings?.pointValue || 1;
        loyaltyDiscount = Math.min(redeemPoints * pointValue, subtotal - couponDiscount);
        pointsUsed = redeemPoints;
      }
    }
  }

  loyaltyDiscount = Math.round(loyaltyDiscount * 100) / 100;
  const totalDiscount = Math.min(couponDiscount + loyaltyDiscount, subtotal);

  // 3. Tax and Service Charge calculations on taxable amount
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const taxRate = restaurant.taxRate !== undefined ? restaurant.taxRate : 5; // e.g. 5% GST
  const serviceChargeRate = restaurant.serviceChargeRate !== undefined ? restaurant.serviceChargeRate : 2.5;

  const tax = Math.round((taxableAmount * (taxRate / 100)) * 100) / 100;
  const serviceCharge = Math.round((taxableAmount * (serviceChargeRate / 100)) * 100) / 100;
  const packagingCharge = restaurant.packagingCharge || 0;

  const grandTotal = Math.round((taxableAmount + tax + serviceCharge + packagingCharge) * 100) / 100;

  return {
    verifiedItems,
    subtotal,
    discount: totalDiscount,
    couponDiscount,
    couponCode: appliedCoupon,
    loyaltyPointsUsed: pointsUsed,
    loyaltyDiscount,
    tax,
    taxRate,
    serviceCharge,
    serviceChargeRate,
    packagingCharge,
    grandTotal,
    estimatedPrepTime
  };
};

module.exports = { calculateOrderTotals };
