const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Customer = require('../models/Customer');
const InventoryItem = require('../models/InventoryItem');
const { predictSalesAndDemand, predictIngredientStock } = require('../utils/aiPredictor');

// @desc    Get Admin Dashboard Overview Stats & KPIs
// @route   GET /api/analytics/dashboard
// @access  Private (Owner / Manager)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const restaurantId = req.user?.restaurant?._id || req.user?.restaurant || req.query.restaurantId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Today's orders
    const todayOrders = await Order.find({
      restaurant: restaurantId,
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });

    const todayValidOrders = todayOrders.filter(o => o.orderStatus !== 'Cancelled');
    const todaySales = todayValidOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const todayOrderCount = todayOrders.length;
    const todayCompletedCount = todayOrders.filter(o => o.orderStatus === 'Completed').length;
    const todayCancelledCount = todayOrders.filter(o => o.orderStatus === 'Cancelled').length;
    const avgOrderValue = todayValidOrders.length ? Math.round(todaySales / todayValidOrders.length) : 0;

    // Table Stats
    const tables = await Table.find({ restaurant: restaurantId });
    const totalTables = tables.length;
    const occupiedTables = tables.filter(t => t.status !== 'AVAILABLE' && t.status !== 'CLEANING').length;
    const availableTables = totalTables - occupiedTables;

    // Active orders currently in kitchen / preparation
    const activeOrdersCount = await Order.countDocuments({
      restaurant: restaurantId,
      orderStatus: { $in: ['New', 'Accepted', 'Preparing', 'Ready'] }
    });

    // Total unique customers served today
    const uniqueCustomersToday = new Set(todayValidOrders.map(o => o.customer?.mobile).filter(Boolean)).size;

    // Low stock inventory count
    const lowStockCount = await InventoryItem.countDocuments({
      restaurant: restaurantId,
      $expr: { $lte: ['$currentStock', '$minimumStock'] }
    });

    res.status(200).json({
      success: true,
      stats: {
        todaySales,
        todayOrderCount,
        todayCompletedCount,
        todayCancelledCount,
        avgOrderValue,
        totalTables,
        occupiedTables,
        availableTables,
        activeOrdersCount,
        uniqueCustomersToday,
        lowStockCount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Sales Trends & Category Distribution Charts
// @route   GET /api/analytics/sales-charts
// @access  Private (Owner / Manager)
exports.getSalesCharts = async (req, res, next) => {
  try {
    const restaurantId = req.user?.restaurant?._id || req.user?.restaurant || req.query.restaurantId;
    const { range = '7days' } = req.query;

    const now = new Date();
    let daysToFetch = 7;
    if (range === '30days') daysToFetch = 30;
    if (range === '90days') daysToFetch = 90;

    const startDate = new Date(now.getTime() - (daysToFetch * 24 * 60 * 60 * 1000));
    startDate.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      restaurant: restaurantId,
      createdAt: { $gte: startDate },
      orderStatus: { $ne: 'Cancelled' }
    });

    // Daily Sales Aggregation
    const dailyMap = {};
    for (let i = 0; i < daysToFetch; i++) {
      const d = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dateKey = d.toISOString().slice(5, 10); // MM-DD
      dailyMap[dateKey] = { date: dateKey, revenue: 0, orders: 0 };
    }

    // Hourly Distribution (Peak Hours)
    const hourlyMap = {};
    for (let h = 0; h < 24; h++) {
      const label = `${h % 12 === 0 ? 12 : h % 12} ${h >= 12 ? 'PM' : 'AM'}`;
      hourlyMap[h] = { hour: label, orders: 0, revenue: 0 };
    }

    // Category Sales Map & Product Leaderboard
    const categoryMap = {};
    const productMap = {};

    orders.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().slice(5, 10);
      if (dailyMap[dateKey]) {
        dailyMap[dateKey].revenue += order.grandTotal;
        dailyMap[dateKey].orders += 1;
      }

      const hr = new Date(order.createdAt).getHours();
      if (hourlyMap[hr]) {
        hourlyMap[hr].orders += 1;
        hourlyMap[hr].revenue += order.grandTotal;
      }

      // Items tally
      (order.items || []).forEach(item => {
        productMap[item.name] = (productMap[item.name] || 0) + item.quantity;
      });
    });

    const dailySales = Object.values(dailyMap);
    const hourlySales = Object.values(hourlyMap);

    // Top 5 Products
    const topProducts = Object.keys(productMap)
      .map(name => ({ name, quantity: productMap[name] }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 7);

    // Payment Methods Distribution
    const paymentMethods = [
      { name: 'UPI', value: orders.filter(o => o.paymentMethod === 'UPI').length },
      { name: 'Cash', value: orders.filter(o => o.paymentMethod === 'Cash').length },
      { name: 'Card', value: orders.filter(o => o.paymentMethod === 'Card').length },
      { name: 'Online', value: orders.filter(o => o.paymentMethod === 'Online').length }
    ].filter(p => p.value > 0);

    res.status(200).json({
      success: true,
      dailySales,
      hourlySales,
      topProducts,
      paymentMethods
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Detailed Table Analytics & Performance Heatmap
// @route   GET /api/analytics/tables
// @access  Private (Owner / Manager)
exports.getTableAnalytics = async (req, res, next) => {
  try {
    const restaurantId = req.user?.restaurant?._id || req.user?.restaurant || req.query.restaurantId;

    const tables = await Table.find({ restaurant: restaurantId });
    const orders = await Order.find({ restaurant: restaurantId });

    // Group orders per tableNumber
    const tableStatsMap = {};
    tables.forEach(t => {
      tableStatsMap[t.tableNumber] = {
        tableId: t._id,
        tableNumber: t.tableNumber,
        tableName: t.tableName,
        capacity: t.capacity,
        section: t.section,
        floor: t.floor,
        currentStatus: t.status,
        totalOrders: 0,
        totalRevenue: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        avgOrderValue: 0,
        avgOccupancyMinutes: 45, // Default average estimated
        topProducts: {},
        heatScore: 0 // Normalized 0 - 100 for visual heatmap
      };
    });

    orders.forEach(order => {
      const stats = tableStatsMap[order.tableNumber];
      if (stats) {
        stats.totalOrders += 1;
        if (order.orderStatus === 'Cancelled') {
          stats.cancelledOrders += 1;
        } else {
          stats.totalRevenue += order.grandTotal;
          if (order.orderStatus === 'Completed') stats.completedOrders += 1;

          // Item tallies
          (order.items || []).forEach(item => {
            stats.topProducts[item.name] = (stats.topProducts[item.name] || 0) + item.quantity;
          });
        }
      }
    });

    // Calculate averages & rankings
    let maxRevenue = 0;
    const tableAnalyticsList = Object.values(tableStatsMap).map(stats => {
      const validOrdersCount = stats.totalOrders - stats.cancelledOrders;
      stats.avgOrderValue = validOrdersCount > 0 ? Math.round(stats.totalRevenue / validOrdersCount) : 0;
      stats.totalRevenue = Math.round(stats.totalRevenue * 100) / 100;

      // Convert top products object to sorted array
      stats.topSellingItems = Object.keys(stats.topProducts)
        .map(name => ({ name, quantity: stats.topProducts[name] }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 3);
      delete stats.topProducts;

      if (stats.totalRevenue > maxRevenue) maxRevenue = stats.totalRevenue;
      return stats;
    });

    // Calculate heat scores for heatmap visualization
    tableAnalyticsList.forEach(t => {
      t.heatScore = maxRevenue > 0 ? Math.round((t.totalRevenue / maxRevenue) * 100) : 10;
    });

    // Find highest & lowest performing tables
    const sortedByRevenue = [...tableAnalyticsList].sort((a, b) => b.totalRevenue - a.totalRevenue);
    const highestRevenueTable = sortedByRevenue[0] || null;
    const lowestRevenueTable = sortedByRevenue[sortedByRevenue.length - 1] || null;

    res.status(200).json({
      success: true,
      tables: tableAnalyticsList,
      summary: {
        totalTablesCount: tables.length,
        highestRevenueTable,
        lowestRevenueTable,
        mostOccupiedTable: sortedByRevenue[0]
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get AI Statistical Demand Forecasts & Ingredient Stock Forecasts
// @route   GET /api/analytics/ai-forecasts
// @access  Private (Owner / Manager)
exports.getAIForecasts = async (req, res, next) => {
  try {
    const restaurantId = req.user?.restaurant?._id || req.user?.restaurant || req.query.restaurantId;

    const orders = await Order.find({ restaurant: restaurantId }).sort({ createdAt: -1 }).limit(200);
    const inventory = await InventoryItem.find({ restaurant: restaurantId });

    const salesForecast = predictSalesAndDemand(orders);
    const ingredientForecast = predictIngredientStock(inventory, orders);

    res.status(200).json({
      success: true,
      salesForecast,
      ingredientForecast
    });
  } catch (err) {
    next(err);
  }
};
