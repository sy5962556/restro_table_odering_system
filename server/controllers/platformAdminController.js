const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const Table = require('../models/Table');
const QRCode = require('../models/QRCode');
const AuditLog = require('../models/AuditLog');
const ClickLog = require('../models/ClickLog');
const crypto = require('crypto');
const { generateTableToken, generateQRCodeDataUrl } = require('../utils/qrGenerator');

// @desc    Get Platform-Wide Dashboard KPIs
// @route   GET /api/platform/dashboard
// @access  Private (Super Admin)
exports.getPlatformDashboard = async (req, res, next) => {
  try {
    const totalRestaurants = await Restaurant.countDocuments();
    const approvedRestaurants = await Restaurant.countDocuments({ status: 'APPROVED' });
    const pendingRestaurants = await Restaurant.countDocuments({ status: 'PENDING' });
    const suspendedRestaurants = await Restaurant.countDocuments({ status: 'SUSPENDED' });
    const totalUsers = await User.countDocuments();

    // Aggregate platform-wide order stats
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$grandTotal' }
        }
      }
    ]);

    const totalOrders = orderStats[0]?.totalOrders || 0;
    const totalRevenue = orderStats[0]?.totalRevenue || 0;

    // Recent registered restaurants
    const recentRestaurants = await Restaurant.find()
      .populate('owner', 'name email mobile')
      .sort('-createdAt')
      .limit(5);

    // Recent Audit Activity Logs
    const recentAuditLogs = await AuditLog.find()
      .populate('restaurant', 'name')
      .sort('-createdAt')
      .limit(8);

    res.status(200).json({
      success: true,
      stats: {
        totalRestaurants,
        approvedRestaurants,
        pendingRestaurants,
        suspendedRestaurants,
        totalUsers,
        totalOrders,
        totalRevenue: Math.round(totalRevenue)
      },
      recentRestaurants,
      recentAuditLogs
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Restaurant Tree Hierarchy Data
// @route   GET /api/platform/tree
// @access  Private (Super Admin)
exports.getRestaurantTree = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { restaurantCode: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const restaurants = await Restaurant.find(query)
      .populate('owner', 'name email mobile')
      .sort('-createdAt');

    // Build hierarchical tree nodes with child metrics
    const tree = await Promise.all(restaurants.map(async (rest, idx) => {
      const code = rest.restaurantCode || `REST-${String(idx + 1).padStart(5, '0')}`;
      
      const [usersCount, menuCount, tablesCount, ordersCount] = await Promise.all([
        User.countDocuments({ restaurant: rest._id }),
        MenuItem.countDocuments({ restaurant: rest._id }),
        Table.countDocuments({ restaurant: rest._id }),
        Order.countDocuments({ restaurant: rest._id })
      ]);

      const revAgg = await Order.aggregate([
        { $match: { restaurant: rest._id } },
        { $group: { _id: null, rev: { $sum: '$grandTotal' } } }
      ]);

      return {
        _id: rest._id,
        id: code,
        name: rest.name,
        restaurantCode: code,
        status: rest.status,
        plan: rest.plan,
        subscriptionStatus: rest.subscriptionStatus || 'ACTIVE',
        logo: rest.logo,
        email: rest.email || rest.owner?.email,
        phone: rest.phone,
        city: rest.address?.city || 'Main',
        ownerName: rest.owner?.name || 'Owner',
        isOnline: rest.isAcceptingOrders,
        metrics: {
          usersCount,
          menuCount,
          tablesCount,
          ordersCount,
          revenue: Math.round(revAgg[0]?.rev || 0)
        }
      };
    }));

    res.status(200).json({
      success: true,
      count: tree.length,
      tree
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get All Restaurants (Paginated & Filtered)
// @route   GET /api/platform/restaurants
// @access  Private (Super Admin)
exports.getAllRestaurants = async (req, res, next) => {
  try {
    const { status, plan, search } = req.query;
    const query = {};

    if (status && status !== 'ALL') query.status = status;
    if (plan && plan !== 'ALL') query.plan = plan;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { restaurantCode: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const restaurants = await Restaurant.find(query)
      .populate('owner', 'name email mobile role')
      .sort('-createdAt');

    const enriched = await Promise.all(restaurants.map(async (rest, idx) => {
      const restObj = rest.toObject();
      restObj.restaurantCode = rest.restaurantCode || `REST-${String(idx + 1).padStart(5, '0')}`;
      
      const orderAgg = await Order.aggregate([
        { $match: { restaurant: rest._id } },
        { $group: { _id: null, totalOrders: { $sum: 1 }, totalSales: { $sum: '$grandTotal' } } }
      ]);
      restObj.totalOrders = orderAgg[0]?.totalOrders || 0;
      restObj.totalSales = Math.round(orderAgg[0]?.totalSales || 0);
      return restObj;
    }));

    res.status(200).json({
      success: true,
      count: enriched.length,
      restaurants: enriched
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Restaurant Deep-Dive Details
// @route   GET /api/platform/restaurants/:id
// @access  Private (Super Admin)
exports.getRestaurantDetails = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate('owner', 'name email mobile role createdAt');
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const [totalOrders, totalMenuItems, totalTables, totalStaff] = await Promise.all([
      Order.countDocuments({ restaurant: restaurant._id }),
      MenuItem.countDocuments({ restaurant: restaurant._id }),
      Table.countDocuments({ restaurant: restaurant._id }),
      User.countDocuments({ restaurant: restaurant._id })
    ]);

    const revenueAgg = await Order.aggregate([
      { $match: { restaurant: restaurant._id } },
      { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' } } }
    ]);

    const staffList = await User.find({ restaurant: restaurant._id }).select('-password');

    res.status(200).json({
      success: true,
      restaurant,
      metrics: {
        totalOrders,
        totalRevenue: Math.round(revenueAgg[0]?.totalRevenue || 0),
        totalMenuItems,
        totalTables,
        totalStaff
      },
      staffList
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Restaurant Status (APPROVE, SUSPEND, REJECT, ACTIVATE)
// @route   PATCH /api/platform/restaurants/:id/status
// @access  Private (Super Admin)
exports.updateRestaurantStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    await AuditLog.create({
      restaurant: restaurant._id,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: `RESTAURANT_STATUS_${status}`,
      entity: 'Restaurant',
      entityId: restaurant._id,
      details: `Super Admin set restaurant status to ${status}`
    });

    res.status(200).json({
      success: true,
      message: `Restaurant status updated to ${status} successfully`,
      restaurant
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Subscription Plan
// @route   PATCH /api/platform/restaurants/:id/plan
// @access  Private (Super Admin)
exports.updateRestaurantPlan = async (req, res, next) => {
  try {
    const { plan, subscriptionStatus } = req.body;
    const updateData = {};
    if (plan) updateData.plan = plan;
    if (subscriptionStatus) updateData.subscriptionStatus = subscriptionStatus;

    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    await AuditLog.create({
      restaurant: restaurant._id,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'RESTAURANT_PLAN_UPDATED',
      entity: 'Restaurant',
      entityId: restaurant._id,
      details: `Plan set to ${plan || restaurant.plan}`
    });

    res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully',
      restaurant
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Securely Reset Restaurant Admin Password
// @route   POST /api/platform/restaurants/:id/reset-password
// @access  Private (Super Admin)
exports.resetRestaurantPassword = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate('owner');
    if (!restaurant || !restaurant.owner) {
      return res.status(404).json({ success: false, message: 'Restaurant or owner account not found' });
    }

    // Generate random 10-character temporary password
    const tempPassword = `Temp@${crypto.randomBytes(3).toString('hex')}`;
    
    // Update user password
    const ownerUser = await User.findById(restaurant.owner._id);
    ownerUser.password = tempPassword;
    await ownerUser.save();

    // Log action to AuditLog without storing plaintext password
    await AuditLog.create({
      restaurant: restaurant._id,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'ADMIN_PASSWORD_RESET',
      entity: 'User',
      entityId: ownerUser._id,
      details: `Super Admin generated a temporary password for owner ${ownerUser.email}`
    });

    res.status(200).json({
      success: true,
      message: 'Temporary admin password generated successfully',
      tempCredentials: {
        email: ownerUser.email,
        tempPassword,
        restaurantName: restaurant.name,
        expiresNotice: 'Displayed securely in this single one-time payload.'
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Tenant Control Data Bundle (Control Mode Workspace)
// @route   GET /api/platform/restaurants/:id/control-data
// @access  Private (Super Admin)
exports.getTenantControlData = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate(
      'owner',
      'name email mobile role createdAt lastLogin isActive'
    );
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const [totalOrders, totalMenuItems, totalTables, totalStaff, totalCategories] = await Promise.all([
      Order.countDocuments({ restaurant: restaurant._id }),
      MenuItem.countDocuments({ restaurant: restaurant._id }),
      Table.countDocuments({ restaurant: restaurant._id }),
      User.countDocuments({ restaurant: restaurant._id }),
      Category.countDocuments({ restaurant: restaurant._id })
    ]);

    const activeOrders = await Order.countDocuments({
      restaurant: restaurant._id,
      orderStatus: { $in: ['New', 'Accepted', 'Preparing', 'Ready'] }
    });

    const revAgg = await Order.aggregate([
      { $match: { restaurant: restaurant._id } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    const recentOrders = await Order.find({ restaurant: restaurant._id })
      .populate('table', 'tableNumber section')
      .sort('-createdAt')
      .limit(10);

    const categories = await Category.find({ restaurant: restaurant._id }).sort('displayOrder');
    const menuItems = await MenuItem.find({ restaurant: restaurant._id }).sort('name');
    const tables = await Table.find({ restaurant: restaurant._id }).sort('tableNumber');
    const staffList = await User.find({ restaurant: restaurant._id }).select('-password');

    // Database footprint: collection item counts per entity
    const footprint = [
      { collection: 'User Accounts', count: totalStaff },
      { collection: 'Orders', count: totalOrders },
      { collection: 'Menu Items', count: totalMenuItems },
      { collection: 'Categories', count: totalCategories },
      { collection: 'Tables', count: totalTables },
      { collection: 'QR Codes', count: await QRCode.countDocuments({ restaurant: restaurant._id }) },
    ];

    res.status(200).json({
      success: true,
      restaurant,
      metrics: {
        totalOrders,
        activeOrders,
        totalRevenue: Math.round(revAgg[0]?.total || 0),
        totalMenuItems,
        totalTables,
        totalStaff,
        totalCategories
      },
      footprint,
      categories,
      menuItems,
      tables,
      staffList,
      recentOrders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Tenant Users
// @route   GET /api/platform/restaurants/:id/users
// @access  Private (Super Admin)
exports.getTenantUsers = async (req, res, next) => {
  try {
    const users = await User.find({ restaurant: req.params.id }).select('-password').sort('-createdAt');
    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Tenant User
// @route   POST /api/platform/restaurants/:id/users
// @access  Private (Super Admin)
exports.createTenantUser = async (req, res, next) => {
  try {
    const { name, email, password, role, mobile } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email address already registered' });
    }

    const newUser = await User.create({
      name,
      email,
      password: password || 'Staff@123',
      role: role || 'manager',
      mobile,
      restaurant: req.params.id
    });

    await AuditLog.create({
      restaurant: req.params.id,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'TENANT_USER_CREATED',
      entity: 'User',
      entityId: newUser._id,
      details: `Created user ${email} with role ${role}`
    });

    res.status(201).json({ success: true, user: newUser });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Tenant User
// @route   PATCH /api/platform/restaurants/:id/users/:userId
// @access  Private (Super Admin)
exports.updateTenantUser = async (req, res, next) => {
  try {
    const { name, role, isActive, permissions } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (permissions) updateData.permissions = permissions;

    const user = await User.findOneAndUpdate(
      { _id: req.params.userId, restaurant: req.params.id },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Staff user not found for this tenant' });
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete/Deactivate Tenant User
// @route   DELETE /api/platform/restaurants/:id/users/:userId
// @access  Private (Super Admin)
exports.deleteTenantUser = async (req, res, next) => {
  try {
    const user = await User.findOneAndDelete({ _id: req.params.userId, restaurant: req.params.id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Staff user not found' });
    }

    await AuditLog.create({
      restaurant: req.params.id,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'TENANT_USER_DELETED',
      entity: 'User',
      entityId: req.params.userId,
      details: `Super Admin deleted user ${user.email}`
    });

    res.status(200).json({ success: true, message: 'Staff user removed successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Tenant Menu & Categories
// @route   GET /api/platform/restaurants/:id/menu
// @access  Private (Super Admin)
exports.getTenantMenu = async (req, res, next) => {
  try {
    const categories = await Category.find({ restaurant: req.params.id }).sort('displayOrder');
    const items = await MenuItem.find({ restaurant: req.params.id }).sort('name');
    res.status(200).json({ success: true, categories, items });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Tenant Tables & QR Codes
// @route   GET /api/platform/restaurants/:id/tables
// @access  Private (Super Admin)
exports.getTenantTables = async (req, res, next) => {
  try {
    const tables = await Table.find({ restaurant: req.params.id }).sort('tableNumber');
    const qrCodes = await QRCode.find({ restaurant: req.params.id });
    res.status(200).json({ success: true, tables, qrCodes });
  } catch (err) {
    next(err);
  }
};

// @desc    Regenerate Table QR Token
// @route   POST /api/platform/restaurants/:id/tables/:tableId/regenerate-qr
// @access  Private (Super Admin)
exports.regenerateTableQR = async (req, res, next) => {
  try {
    const table = await Table.findOne({ _id: req.params.tableId, restaurant: req.params.id });
    if (!table) {
      return res.status(404).json({ success: false, message: 'Table not found' });
    }

    const newToken = generateTableToken();
    const qrDataUrl = await generateQRCodeDataUrl(req.params.id, table._id, newToken);

    table.qrToken = newToken;
    table.qrCodeImage = qrDataUrl;
    await table.save();

    await AuditLog.create({
      restaurant: req.params.id,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'QR_REGENERATED',
      entity: 'Table',
      entityId: table._id,
      details: `Regenerated QR code token for Table #${table.tableNumber}`
    });

    res.status(200).json({ success: true, table, qrCodeImage: qrDataUrl });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Tenant Orders
// @route   GET /api/platform/restaurants/:id/orders
// @access  Private (Super Admin)
exports.getTenantOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { restaurant: req.params.id };
    if (status && status !== 'ALL') query.orderStatus = status;

    const orders = await Order.find(query)
      .populate('table', 'tableNumber section')
      .sort('-createdAt')
      .limit(100);

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Tenant Reports
// @route   GET /api/platform/restaurants/:id/reports
// @access  Private (Super Admin)
exports.getTenantReports = async (req, res, next) => {
  try {
    const restaurantId = req.params.id;

    const totalAgg = await Order.aggregate([
      { $match: { restaurant: new (require('mongoose').Types.ObjectId)(restaurantId) } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          totalOrders: { $sum: 1 },
          totalSubtotal: { $sum: '$subtotal' },
          totalTax: { $sum: '$tax' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      report: {
        totalRevenue: Math.round(totalAgg[0]?.totalRevenue || 0),
        totalOrders: totalAgg[0]?.totalOrders || 0,
        totalSubtotal: Math.round(totalAgg[0]?.totalSubtotal || 0),
        totalTax: Math.round(totalAgg[0]?.totalTax || 0)
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Global Platform Users
// @route   GET /api/platform/users
// @access  Private (Super Admin)
exports.getGlobalUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;
    const query = {};
    if (role && role !== 'ALL') query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .populate('restaurant', 'name restaurantCode logo')
      .select('-password')
      .sort('-createdAt')
      .limit(150);

    res.status(200).json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Global Platform Orders
// @route   GET /api/platform/orders
// @access  Private (Super Admin)
exports.getGlobalOrders = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};
    if (status && status !== 'ALL') query.orderStatus = status;

    const orders = await Order.find(query)
      .populate('restaurant', 'name restaurantCode logo')
      .populate('table', 'tableNumber section')
      .sort('-createdAt')
      .limit(150);

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Global Platform Revenue Reports
// @route   GET /api/platform/reports
// @access  Private (Super Admin)
exports.getGlobalReports = async (req, res, next) => {
  try {
    const topRestaurants = await Order.aggregate([
      {
        $group: {
          _id: '$restaurant',
          totalRevenue: { $sum: '$grandTotal' },
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      { $unwind: '$restaurant' }
    ]);

    res.status(200).json({
      success: true,
      topRestaurants: topRestaurants.map(item => ({
        _id: item._id,
        name: item.restaurant.name,
        code: item.restaurant.restaurantCode,
        logo: item.restaurant.logo,
        totalRevenue: Math.round(item.totalRevenue),
        totalOrders: item.totalOrders
      }))
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Operational Location Monitor Data
// @route   GET /api/platform/location-monitor
// @access  Private (Super Admin)
exports.getLocationMonitorData = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find().select('name restaurantCode logo address phone status isAcceptingOrders plan createdAt');

    const locations = restaurants.map((r, idx) => ({
      _id: r._id,
      code: r.restaurantCode || `REST-${String(idx + 1).padStart(5, '0')}`,
      name: r.name,
      logo: r.logo,
      status: r.status,
      isOnline: r.isAcceptingOrders,
      address: `${r.address?.street || ''}, ${r.address?.city || 'Bengaluru'}, ${r.address?.state || 'Karnataka'}`,
      city: r.address?.city || 'Bengaluru',
      state: r.address?.state || 'Karnataka',
      country: r.address?.country || 'India',
      lat: r.address?.lat || (12.9716 + (idx * 0.02)),
      lng: r.address?.lng || (77.5946 + (idx * 0.02)),
      phone: r.phone
    }));

    res.status(200).json({ success: true, count: locations.length, locations });
  } catch (err) {
    next(err);
  }
};

// @desc    Record Administrative Click Log Event
// @route   POST /api/platform/click-log
// @access  Private (Super Admin)
exports.recordClickLog = async (req, res, next) => {
  try {
    const { action, page, entity, entityId, restaurantId, metadata } = req.body;

    const log = await ClickLog.create({
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      restaurant: restaurantId || null,
      action,
      page,
      entity,
      entityId,
      metadata,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({ success: true, log });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Click Logs
// @route   GET /api/platform/click-logs
// @access  Private (Super Admin)
exports.getClickLogs = async (req, res, next) => {
  try {
    const logs = await ClickLog.find()
      .populate('restaurant', 'name restaurantCode')
      .sort('-createdAt')
      .limit(100);

    res.status(200).json({ success: true, count: logs.length, logs });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Platform Audit Logs
// @route   GET /api/platform/audit-logs
// @access  Private (Super Admin)
exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('restaurant', 'name')
      .sort('-createdAt')
      .limit(100);

    res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Register New Restaurant by Super Admin
// @route   POST /api/platform/restaurants
// @access  Private (Super Admin)
exports.registerNewRestaurantByAdmin = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      ownerName,
      ownerEmail,
      ownerPassword,
      ownerMobile,
      plan,
      street,
      city,
      state,
      pincode
    } = req.body;

    const existingUser = await User.findOne({ email: ownerEmail || email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Owner/User email already registered' });
    }

    const restaurantCode = `REST-${Math.floor(10000 + Math.random() * 90000)}`;

    const restaurant = new Restaurant({
      name,
      email: email || ownerEmail,
      phone: phone || ownerMobile,
      restaurantCode,
      status: 'APPROVED',
      plan: plan || 'PRO',
      subscriptionStatus: 'ACTIVE',
      address: {
        street: street || '',
        city: city || 'Bengaluru',
        state: state || 'Karnataka',
        pincode: pincode || '560001',
        country: 'India'
      }
    });

    const ownerUser = new User({
      name: ownerName || `Owner - ${name}`,
      email: ownerEmail || email,
      password: ownerPassword || 'Owner@123',
      role: 'admin',
      mobile: ownerMobile || phone,
      restaurant: restaurant._id
    });

    await ownerUser.save();
    restaurant.owner = ownerUser._id;
    await restaurant.save();

    await AuditLog.create({
      restaurant: restaurant._id,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'RESTAURANT_REGISTERED_BY_ADMIN',
      entity: 'Restaurant',
      entityId: restaurant._id,
      details: `Super Admin registered new restaurant ${name} (${restaurantCode})`
    });

    res.status(201).json({
      success: true,
      message: 'Restaurant registered successfully!',
      restaurant,
      owner: {
        _id: ownerUser._id,
        name: ownerUser.name,
        email: ownerUser.email,
        role: ownerUser.role
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Restaurant Owner Credentials
// @route   PUT /api/platform/restaurants/:id/credentials
// @access  Private (Super Admin)
exports.updateOwnerCredentials = async (req, res, next) => {
  try {
    const { email, password, name, mobile } = req.body;

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    let ownerUser = null;
    if (restaurant.owner) {
      ownerUser = await User.findById(restaurant.owner);
    } else {
      ownerUser = await User.findOne({ restaurant: restaurant._id, role: 'admin' });
    }

    if (!ownerUser) {
      return res.status(404).json({ success: false, message: 'Owner user account not found for this restaurant' });
    }

    if (email && email.toLowerCase() !== ownerUser.email.toLowerCase()) {
      const emailExists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: ownerUser._id } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email is already in use by another user' });
      }
      ownerUser.email = email.toLowerCase();
      restaurant.email = email.toLowerCase();
    }

    if (name) ownerUser.name = name;
    if (mobile) ownerUser.mobile = mobile;
    if (password && password.trim().length > 0) {
      ownerUser.password = password; // pre-save hook in User.js will hash this
    }

    await ownerUser.save();
    await restaurant.save();

    await AuditLog.create({
      restaurant: restaurant._id,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'OWNER_CREDENTIALS_UPDATED',
      entity: 'User',
      entityId: ownerUser._id,
      details: `Super Admin updated credentials for owner (${ownerUser.email})`
    });

    const updatedUser = await User.findById(ownerUser._id).select('-password');

    res.status(200).json({
      success: true,
      message: 'Owner credentials updated successfully',
      user: updatedUser
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Staff Credentials (ID, Email, Password, Role)
// @route   PUT /api/platform/users/:id/credentials
// @access  Private (Super Admin)
exports.updateStaffCredentials = async (req, res, next) => {
  try {
    const { email, password, name, mobile, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email is already in use by another user' });
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (mobile) user.mobile = mobile;
    if (role) user.role = role;
    if (password && password.trim().length > 0) {
      user.password = password; // pre-save hook hashes it
    }

    await user.save();

    await AuditLog.create({
      restaurant: user.restaurant || null,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'STAFF_CREDENTIALS_UPDATED',
      entity: 'User',
      entityId: user._id,
      details: `Super Admin updated credentials for staff user (${user.email})`
    });

    const updatedUser = await User.findById(user._id).select('-password');

    res.status(200).json({
      success: true,
      message: 'Staff credentials updated successfully',
      user: updatedUser
    });
  } catch (err) {
    next(err);
  }
};

