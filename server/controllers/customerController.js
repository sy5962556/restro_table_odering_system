const Customer = require('../models/Customer');
const Order = require('../models/Order');

// @desc    Lookup customer by mobile for Welcome Back & Past Favorites
// @route   GET /api/customers/lookup
// @access  Public
exports.lookupCustomer = async (req, res, next) => {
  try {
    const { restaurantId, mobile } = req.query;

    if (!restaurantId || !mobile) {
      return res.status(400).json({ success: false, message: 'Restaurant ID and Mobile number required' });
    }

    const cleanMobile = mobile.trim();
    const customer = await Customer.findOne({ restaurant: restaurantId, mobile: cleanMobile });

    if (!customer) {
      return res.status(200).json({
        success: true,
        isReturning: false,
        customer: null
      });
    }

    // Get previous orders for this customer to find their favorite dishes
    const pastOrders = await Order.find({
      restaurant: restaurantId,
      'customer.mobile': cleanMobile,
      orderStatus: { $in: ['Completed', 'Served'] }
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // Aggregate frequently ordered items
    const itemMap = {};
    pastOrders.forEach(ord => {
      (ord.items || []).forEach(it => {
        if (!itemMap[it.name]) {
          itemMap[it.name] = {
            name: it.name,
            price: it.price,
            menuItem: it.menuItem,
            foodType: it.foodType,
            orderCount: 0
          };
        }
        itemMap[it.name].orderCount += it.quantity;
      });
    });

    const favoriteItems = Object.values(itemMap)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 4);

    res.status(200).json({
      success: true,
      isReturning: true,
      customer: {
        name: customer.name,
        mobile: customer.mobile,
        visitsCount: customer.visitsCount,
        loyaltyPoints: customer.loyaltyPoints,
        totalSpent: customer.totalSpent,
        favoriteItems
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all customers for restaurant
// @route   GET /api/customers
// @access  Private (Owner / Manager)
exports.getCustomers = async (req, res, next) => {
  try {
    const restaurantId = req.user?.restaurant?._id || req.user?.restaurant || req.query.restaurantId;
    const { search, limit = 50, page = 1 } = req.query;

    const query = { restaurant: restaurantId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ totalSpent: -1, visitsCount: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      customers
    });
  } catch (err) {
    next(err);
  }
};
