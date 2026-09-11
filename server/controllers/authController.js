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

// @desc    Register a new Multi-Tenant Restaurant + Owner Account
// @route   POST /api/auth/register-restaurant
// @access  Public
exports.registerRestaurant = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      mobile,
      restaurantName,
      description,
      phone,
      address,
      gstNumber,
      currency,
      taxRate,
      serviceChargeRate,
      numberOfTables,
      requireApproval
    } = req.body;

    if (!name || !email || !password || !restaurantName) {
      return res.status(400).json({
        success: false,
        message: 'Owner name, email, password, and restaurant name are required.'
      });
    }

    // Check existing email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Create Restaurant
    const initialStatus = requireApproval ? 'PENDING' : 'APPROVED';
    const restaurant = await Restaurant.create({
      name: restaurantName,
      description: description || 'Welcome to our restaurant! Order online directly from your table.',
      email: email,
      phone: phone || mobile || '+91 98765 43210',
      address: address || { street: 'Main Street', city: 'City', state: 'State', pincode: '000000', country: 'India' },
      gstNumber: gstNumber || '',
      currency: currency || '₹',
      taxRate: taxRate !== undefined ? Number(taxRate) : 5,
      serviceChargeRate: serviceChargeRate !== undefined ? Number(serviceChargeRate) : 2.5,
      status: initialStatus,
      onboardingCompleted: false
    });

    // Create Owner User
    const user = await User.create({
      name,
      email,
      password,
      mobile,
      role: 'owner',
      restaurant: restaurant._id
    });

    restaurant.owner = user._id;
    await restaurant.save();

    // Generate Default Categories for New Restaurant
    const Category = require('../models/Category');
    const defaultCategories = ['Starters & Snacks', 'Main Course', 'Beverages & Drinks', 'Desserts'];
    for (let i = 0; i < defaultCategories.length; i++) {
      await Category.create({
        restaurant: restaurant._id,
        name: defaultCategories[i],
        displayOrder: i + 1
      });
    }

    // Generate Default Tables for New Restaurant
    const Table = require('../models/Table');
    const QRCode = require('../models/QRCode');
    const { generateTableToken } = require('../utils/qrGenerator');
    const tableCount = parseInt(numberOfTables) || 5;
    for (let t = 1; t <= tableCount; t++) {
      const tableNum = `T-${t < 10 ? '0' + t : t}`;
      const qrToken = generateTableToken(tableNum);
      const table = await Table.create({
        restaurant: restaurant._id,
        tableNumber: tableNum,
        tableName: `Table ${t}`,
        capacity: t <= 2 ? 2 : (t <= 4 ? 4 : 6),
        section: t <= 3 ? 'Main Dining' : 'Patio',
        qrCodeToken: qrToken
      });

      await QRCode.create({
        restaurant: restaurant._id,
        table: table._id,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`http://localhost:5173/order/${restaurant._id}/${table._id}`)}`,
        targetUrl: `http://localhost:5173/order/${restaurant._id}/${table._id}`
      });
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// Legacy single-step register route wrapper
exports.register = exports.registerRestaurant;

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

// @desc    Forgot Password - Request reset token
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const crypto = require('crypto');
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account registered with that email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 mins
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Password reset token generated successfully',
      resetToken // Returned for testing / email delivery
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset Password using token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    const crypto = require('crypto');

    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
    }

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Email Address Token
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const { verificationToken } = req.body;
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email verification token' });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Email address verified successfully'
    });
  } catch (err) {
    next(err);
  }
};

