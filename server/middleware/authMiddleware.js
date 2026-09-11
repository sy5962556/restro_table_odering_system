const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require valid JWT
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_restaurant_jwt_token_2026_antigravity_pos');
    const user = await User.findById(decoded.id).select('-password').populate('restaurant');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.'
      });
    }

    // Check restaurant status for non-superadmin staff/owners
    if (user.role !== 'superadmin' && user.restaurant) {
      const restStatus = user.restaurant.status || 'APPROVED';
      if (restStatus === 'PENDING') {
        return res.status(403).json({
          success: false,
          status: 'PENDING',
          message: 'Your restaurant registration is under review. You will be able to access the system after approval.'
        });
      }
      if (restStatus === 'SUSPENDED') {
        return res.status(403).json({
          success: false,
          status: 'SUSPENDED',
          message: 'Your restaurant account has been suspended. Please contact platform administration.'
        });
      }
      if (restStatus === 'REJECTED') {
        return res.status(403).json({
          success: false,
          status: 'REJECTED',
          message: 'Your restaurant registration was rejected by platform administration.'
        });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token.'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // superadmin has universal access
    if (req.user.role === 'superadmin' || roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `User role '${req.user.role}' is not authorized to access this route.`
    });
  };
};

// Optional auth for public customer routes that can link to staff
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_restaurant_jwt_token_2026_antigravity_pos');
      req.user = await User.findById(decoded.id).select('-password');
    } catch (err) {
      // Ignore invalid token on optional route
    }
  }
  next();
};

module.exports = {
  protect,
  authorize,
  optionalAuth
};
