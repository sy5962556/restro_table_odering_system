const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const jwt = require('jsonwebtoken');

// Generate JWT token
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role, restaurant: user.restaurant },
    process.env.JWT_SECRET || 'super_secret_restaurant_jwt_token_2026_antigravity_pos',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      restaurant: user.restaurant,
      permissions: user.permissions
    }
  });
};

// @desc    Register a new Owner / Admin user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, mobile, role, restaurantName } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // If registering as owner and restaurantName provided, create default restaurant
    let restaurantId = null;
    if (role === 'owner' || !role) {
      const restaurant = await Restaurant.create({
        name: restaurantName || `${name}'s Restaurant`,
        email: email,
        phone: mobile || '+91 98765 43210'
      });
      restaurantId = restaurant._id;
    }

    user = await User.create({
      name,
      email,
      password,
      mobile,
      role: role || 'owner',
      restaurant: restaurantId
    });

    if (restaurantId) {
      await Restaurant.findByIdAndUpdate(restaurantId, { owner: user._id });
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password').populate('restaurant');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('restaurant');
    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all staff for restaurant
// @route   GET /api/auth/staff
// @access  Private (Owner/Manager)
exports.getStaff = async (req, res, next) => {
  try {
    const restaurantId = req.user.restaurant?._id || req.user.restaurant || req.query.restaurantId;
    const staff = await User.find({ restaurant: restaurantId }).select('-password').sort('-createdAt');
    res.status(200).json({ success: true, count: staff.length, staff });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new staff member
// @route   POST /api/auth/staff
// @access  Private (Owner/Manager)
exports.createStaff = async (req, res, next) => {
  try {
    const { name, email, password, mobile, role, permissions } = req.body;
    const restaurantId = req.user.restaurant?._id || req.user.restaurant;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const staffMember = await User.create({
      name,
      email,
      password: password || 'Restaurant@123',
      mobile,
      role: role || 'waiter',
      restaurant: restaurantId,
      permissions: permissions || []
    });

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      staff: {
        id: staffMember._id,
        name: staffMember.name,
        email: staffMember.email,
        role: staffMember.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update staff member
// @route   PUT /api/auth/staff/:id
// @access  Private (Owner)
exports.updateStaff = async (req, res, next) => {
  try {
    const { name, mobile, role, isActive, permissions } = req.body;
    const staff = await User.findByIdAndUpdate(
      req.params.id,
      { name, mobile, role, isActive, permissions },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({ success: true, staff });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete staff member
// @route   DELETE /api/auth/staff/:id
// @access  Private (Owner)
exports.deleteStaff = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Staff member deleted successfully' });
  } catch (err) {
    next(err);
  }
};
