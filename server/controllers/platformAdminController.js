const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const AuditLog = require('../models/AuditLog');

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
      recentRestaurants
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

    if (status) query.status = status;
    if (plan) query.plan = plan;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const restaurants = await Restaurant.find(query)
      .populate('owner', 'name email mobile role')
      .sort('-createdAt');

    // Attach order & revenue counts per restaurant
    const enriched = await Promise.all(restaurants.map(async (rest) => {
      const restObj = rest.toObject();
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
    if (!['PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'].includes(status)) {
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

    // Log action
    await AuditLog.create({
      restaurant: restaurant._id,
      user: req.user._id,
      userName: req.user.name,
      userRole: req.user.role,
      action: `RESTAURANT_STATUS_CHANGED_TO_${status}`,
      entity: 'Restaurant',
      entityId: restaurant._id,
      details: `Status updated to ${status} by Super Admin`
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

// @desc    Update Subscription Plan (FREE, BASIC, PRO, PREMIUM)
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

    res.status(200).json({
      success: true,
      message: 'Subscription plan updated successfully',
      restaurant
    });
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
