const Order = require('../models/Order');
const Table = require('../models/Table');
const Customer = require('../models/Customer');
const Notification = require('../models/Notification');
const Restaurant = require('../models/Restaurant');
const AuditLog = require('../models/AuditLog');
const { calculateOrderTotals } = require('../utils/priceCalculator');
const { emitToRestaurant, emitToKitchen, emitToTable } = require('../config/socket');

// Generate unique order number: ORD-YYYYMMDD-XXXX
const generateOrderNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await Order.countDocuments({
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lt: new Date(new Date().setHours(23, 59, 59, 999))
    }
  });
  const seq = (countToday + 1).toString().padStart(4, '0');
  return `ORD-${dateStr}-${seq}`;
};

// @desc    Preview & calculate cart totals (Server-verified)
// @route   POST /api/orders/preview
// @access  Public
exports.previewCart = async (req, res, next) => {
  try {
    const { restaurantId, items, couponCode, mobile, redeemPoints } = req.body;

    const calculation = await calculateOrderTotals({
      restaurantId,
      items,
      couponCode,
      mobile,
      redeemPoints
    });

    res.status(200).json({
      success: true,
      calculation
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Place a new Order from Customer Table QR
// @route   POST /api/orders
// @access  Public
exports.placeOrder = async (req, res, next) => {
  try {
    const {
      restaurantId,
      tableNumber,
      customerName,
      customerMobile,
      items,
      specialInstructions,
      couponCode,
      redeemPoints
    } = req.body;

    if (!restaurantId || !tableNumber || !customerName || !customerMobile) {
      return res.status(400).json({
        success: false,
        message: 'Please provide restaurant, table, customer name and mobile number'
      });
    }

    // Verify table (smart resolution by ObjectId, tableId, or tableNumber)
    const mongoose = require('mongoose');
    let table = null;
    const targetTableParam = req.body.tableId || tableNumber;

    if (mongoose.Types.ObjectId.isValid(targetTableParam)) {
      table = await Table.findById(targetTableParam);
    }
    if (!table && targetTableParam) {
      table = await Table.findOne({ restaurant: restaurantId, tableNumber: String(targetTableParam).trim() });
    }
    if (!table && targetTableParam) {
      // Try padding single digit (e.g. "1" -> "01") or stripping padding ("01" -> "1")
      const padded = String(targetTableParam).padStart(2, '0');
      const unpadded = String(targetTableParam).replace(/^0+/, '') || '1';
      table = await Table.findOne({
        restaurant: restaurantId,
        $or: [{ tableNumber: padded }, { tableNumber: unpadded }]
      });
    }
    if (!table) {
      table = await Table.findOne({ restaurant: restaurantId });
    }

    if (!table) {
      return res.status(404).json({ success: false, message: `Table ${tableNumber} not found` });
    }

    // Calculate verified totals securely on backend
    const calc = await calculateOrderTotals({
      restaurantId,
      items,
      couponCode,
      mobile: customerMobile,
      redeemPoints: redeemPoints || 0
    });

    const orderNumber = await generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      restaurant: restaurantId,
      table: table._id,
      tableNumber: table.tableNumber,
      customer: {
        name: customerName.trim(),
        mobile: customerMobile.trim()
      },
      items: calc.verifiedItems,
      subtotal: calc.subtotal,
      discount: calc.discount,
      couponCode: calc.couponCode,
      loyaltyPointsUsed: calc.loyaltyPointsUsed,
      loyaltyDiscount: calc.loyaltyDiscount,
      tax: calc.tax,
      taxRate: calc.taxRate,
      serviceCharge: calc.serviceCharge,
      serviceChargeRate: calc.serviceChargeRate,
      packagingCharge: calc.packagingCharge,
      grandTotal: calc.grandTotal,
      orderStatus: 'New',
      paymentStatus: 'Pending',
      specialInstructions: specialInstructions || '',
      estimatedPrepTime: calc.estimatedPrepTime,
      tableSessionId: table.currentSessionId || `${table._id}_${Date.now()}`
    });

    // Update Table status
    table.status = 'OCCUPIED';
    table.currentCustomer = {
      name: customerName.trim(),
      mobile: customerMobile.trim(),
      joinedAt: new Date()
    };
    table.currentOrder = order._id;
    table.currentSessionId = order.tableSessionId;
    if (!table.lastOccupiedAt) table.lastOccupiedAt = new Date();
    await table.save();

    // Update or Create Customer Record & Loyalty Tracking
    let customer = await Customer.findOne({ restaurant: restaurantId, mobile: customerMobile.trim() });
    if (!customer) {
      customer = await Customer.create({
        restaurant: restaurantId,
        name: customerName.trim(),
        mobile: customerMobile.trim(),
        visitsCount: 1,
        totalSpent: 0,
        ordersCount: 1,
        loyaltyPoints: 0,
        lastTableNumber: tableNumber
      });
    } else {
      customer.visitsCount += 1;
      customer.ordersCount += 1;
      customer.lastVisit = new Date();
      customer.lastTableNumber = tableNumber;
      if (calc.loyaltyPointsUsed > 0) {
        customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints - calc.loyaltyPointsUsed);
      }
      await customer.save();
    }

    // Create Notification for Restaurant Staff
    const notification = await Notification.create({
      restaurant: restaurantId,
      title: `🔔 New Order #${orderNumber.split('-')[2] || orderNumber}`,
      message: `Table ${tableNumber} placed an order for ${calc.verifiedItems.length} items (${order.restaurantDetails?.currency || '₹'}${calc.grandTotal})`,
      type: 'NEW_ORDER',
      tableNumber: table.tableNumber,
      orderId: order._id,
      metadata: {
        orderNumber,
        customerName,
        grandTotal: calc.grandTotal,
        itemsCount: calc.verifiedItems.length
      }
    });

    // Real-Time Socket.IO Broadcasts
    const populatedOrder = await Order.findById(order._id)
      .populate('table')
      .populate('restaurant', 'name currency upiId');

    emitToRestaurant(restaurantId, 'newOrder', {
      order: populatedOrder,
      notification
    });

    emitToKitchen(restaurantId, 'newKitchenOrder', {
      order: populatedOrder
    });

    emitToTable(table._id, 'orderPlaced', {
      order: populatedOrder
    });

    emitToRestaurant(restaurantId, 'tableUpdated', { action: 'update', table });

    res.status(201).json({
      success: true,
      message: 'Order successfully placed!',
      order: populatedOrder
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all orders for restaurant
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res, next) => {
  try {
    const restaurantId = req.user?.restaurant?._id || req.user?.restaurant || req.query.restaurantId;
    const { status, tableNumber, date, limit = 50, page = 1 } = req.query;

    const query = { restaurant: restaurantId };
    if (status && status !== 'ALL') {
      if (status === 'active') {
        query.orderStatus = { $in: ['New', 'Accepted', 'Preparing', 'Ready', 'Served'] };
      } else {
        query.orderStatus = status;
      }
    }
    if (tableNumber) {
      query.tableNumber = tableNumber;
    }
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('table')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      orders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Public / Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table')
      .populate('restaurant');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order status (New -> Accepted -> Preparing -> Ready -> Served -> Completed -> Cancelled)
// @route   PATCH /api/orders/:id/status
// @access  Private (Staff / Kitchen / Manager)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, cancelledReason } = req.body;
    const order = await Order.findById(req.params.id).populate('table');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const oldStatus = order.orderStatus;
    order.orderStatus = status;

    if (status === 'Accepted' && !order.acceptedAt) order.acceptedAt = new Date();
    if (status === 'Preparing' && !order.prepStartedAt) order.prepStartedAt = new Date();
    if (status === 'Ready') {
      order.readyAt = new Date();
      // Also update table status to FOOD_READY
      await Table.findByIdAndUpdate(order.table._id || order.table, { status: 'FOOD_READY' });
    }
    if (status === 'Served' && !order.servedAt) {
      order.servedAt = new Date();
      await Table.findByIdAndUpdate(order.table._id || order.table, { status: 'OCCUPIED' });
    }
    if (status === 'Completed' && !order.completedAt) {
      order.completedAt = new Date();
    }
    if (status === 'Cancelled') {
      order.cancelledAt = new Date();
      order.cancelledReason = cancelledReason || 'Cancelled by manager';
    }

    await order.save();

    // Audit log
    await AuditLog.create({
      restaurant: order.restaurant,
      user: req.user?._id,
      userName: req.user?.name || 'Staff',
      userRole: req.user?.role || 'Manager',
      action: `Changed Order #${order.orderNumber} status from ${oldStatus} to ${status}`,
      entity: 'Order',
      entityId: order._id.toString(),
      oldValue: { status: oldStatus },
      newValue: { status }
    });

    // Real-Time Socket broadcasts
    emitToRestaurant(order.restaurant, 'orderStatusUpdated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.orderStatus,
      order
    });

    emitToTable(order.table._id || order.table, 'orderStatusUpdated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.orderStatus,
      order
    });

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Customer requests bill
// @route   POST /api/orders/:id/request-bill
// @access  Public
exports.requestBill = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.billRequested = true;
    order.billRequestedAt = new Date();
    await order.save();

    const table = await Table.findById(order.table);
    if (table) {
      table.status = 'BILL_REQUESTED';
      await table.save();
      emitToRestaurant(order.restaurant, 'tableUpdated', { action: 'update', table });
    }

    const notification = await Notification.create({
      restaurant: order.restaurant,
      title: `🧾 Table ${order.tableNumber} Requested Bill`,
      message: `Customer ${order.customer.name} on Table ${order.tableNumber} is ready to settle bill for Order #${order.orderNumber}`,
      type: 'BILL_REQUESTED',
      tableNumber: order.tableNumber,
      orderId: order._id
    });

    emitToRestaurant(order.restaurant, 'billRequested', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      notification
    });

    res.status(200).json({
      success: true,
      message: 'Bill requested. Staff will attend your table shortly.',
      order
    });
  } catch (err) {
    next(err);
  }
};
