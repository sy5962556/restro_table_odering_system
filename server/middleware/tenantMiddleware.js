const Restaurant = require('../models/Restaurant');

/**
 * Enforce multi-tenant scoping and authorization
 * Extracts and validates req.restaurantId based on authenticated user or request context
 */
const requireTenantScope = async (req, res, next) => {
  try {
    let targetRestaurantId = null;

    // 1. Authenticated user scope
    if (req.user) {
      if (req.user.role === 'superadmin') {
        // Superadmin can specify target restaurantId via query, param, or header
        targetRestaurantId = req.params.restaurantId || req.query.restaurantId || req.headers['x-restaurant-id'] || (req.user.restaurant ? (req.user.restaurant._id || req.user.restaurant) : null);
      } else {
        // Staff/Owner MUST use their assigned restaurantId ONLY
        targetRestaurantId = req.user.restaurant ? (req.user.restaurant._id || req.user.restaurant) : null;
        
        // Prevent tenant spoofing in params or body
        const requestedId = req.params.restaurantId || req.query.restaurantId || (req.body && req.body.restaurant);
        if (requestedId && requestedId.toString() !== targetRestaurantId?.toString()) {
          return res.status(403).json({
            success: false,
            message: 'You are not authorized to access data for another restaurant.',
            errorCode: 'TENANT_ACCESS_DENIED'
          });
        }
      }
    } else {
      // 2. Unauthenticated customer / public scope
      targetRestaurantId = req.params.restaurantId || req.query.restaurantId || req.headers['x-restaurant-id'] || (req.body && req.body.restaurant);
    }

    if (!targetRestaurantId && (!req.user || req.user.role !== 'superadmin')) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant tenant scope is required for this operation.',
        errorCode: 'TENANT_SCOPE_MISSING'
      });
    }

    if (targetRestaurantId) {
      req.restaurantId = targetRestaurantId.toString();
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Subscription plan feature access control
 * Options: 'tables', 'inventory', 'analytics', 'loyalty', 'staff', 'aiForecast'
 */
const checkFeatureAccess = (feature) => {
  return async (req, res, next) => {
    try {
      if (req.user && req.user.role === 'superadmin') {
        return next();
      }

      const restaurantId = req.restaurantId || (req.user?.restaurant ? (req.user.restaurant._id || req.user.restaurant) : null);
      if (!restaurantId) {
        return next();
      }

      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ success: false, message: 'Restaurant profile not found' });
      }

      const plan = restaurant.plan || 'PRO';

      // Feature limits by tier
      const PLAN_FEATURES = {
        FREE: ['menu', 'orders', 'tables_basic'],
        BASIC: ['menu', 'orders', 'tables_basic', 'analytics_basic', 'billing', 'qr'],
        PRO: ['menu', 'orders', 'tables', 'analytics', 'billing', 'qr', 'inventory', 'loyalty', 'staff', 'offers', 'feedback'],
        PREMIUM: ['menu', 'orders', 'tables', 'analytics', 'billing', 'qr', 'inventory', 'loyalty', 'staff', 'offers', 'feedback', 'aiForecast']
      };

      const allowedFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES.PRO;

      if (!allowedFeatures.includes(feature)) {
        return res.status(403).json({
          success: false,
          message: `The '${feature}' feature is not included in your current '${plan}' plan. Please upgrade your subscription.`,
          errorCode: 'PLAN_FEATURE_LOCKED',
          requiredPlan: 'PRO'
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  requireTenantScope,
  checkFeatureAccess
};
