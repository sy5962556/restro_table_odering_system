const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Table = require('../models/Table');
const { emitToRestaurant, emitToKitchen, emitToTable } = require('../config/socket');

// @desc    Get active orders for Kitchen Display System (KDS)
// @route   GET /api/kitchen/orders
// @access  Private (Kitchen / Manager / Owner)
exports.getKitchenOrders = async (req, res, next) => {
  try {
    const restaurantId = req.user?.restaurant?._id || req.user?.restaurant || req.query.restaurantId;

    const orders = await Order.find({
      restaurant: restaurantId,
      orderStatus: { $in: ['New', 'Accepted', 'Preparing', 'Ready'] }
    })
      .populate('table')
      .sort({ createdAt: 1 }); // Oldest first for FIFO preparation

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update single item preparation status inside an order
// @route   PATCH /api/kitchen/orders/:orderId/items/:itemId
// @access  Private (Kitchen / Manager)
exports.updateItemStatus = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body; // 'pending' | 'preparing' | 'ready' | 'served'

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found in order' });

    item.status = status;

    // Check overall order progression
    const allReady = order.items.every(i => i.status === 'ready' || i.status === 'served');
    const anyPreparing = order.items.some(i => i.status === 'preparing');

    if (allReady && order.orderStatus !== 'Ready' && order.orderStatus !== 'Served' && order.orderStatus !== 'Completed') {
      order.orderStatus = 'Ready';
      order.readyAt = new Date();
      await Table.findByIdAndUpdate(order.table, { status: 'FOOD_READY' });
    } else if (anyPreparing && order.orderStatus === 'New' || order.orderStatus === 'Accepted') {
      order.orderStatus = 'Preparing';
      if (!order.prepStartedAt) order.prepStartedAt = new Date();
    }

    await order.save();

    // Broadcast update
    emitToKitchen(order.restaurant, 'kitchenOrderUpdated', { orderId: order._id, itemId, status, order });
    emitToTable(order.table, 'orderStatusUpdated', { orderId: order._id, status: order.orderStatus, order });
    emitToRestaurant(order.restaurant, 'orderStatusUpdated', { orderId: order._id, status: order.orderStatus, order });

    res.status(200).json({ success: true, item, order });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Printable Kitchen Order Ticket (KOT) payload
// @route   GET /api/kitchen/kot/:orderId
// @access  Private / Public
exports.getKOTData = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('restaurant', 'name address phone')
      .populate('table');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const kotTicket = {
      restaurantName: order.restaurant.name,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      orderTime: order.createdAt,
      specialInstructions: order.specialInstructions,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        spicyLevel: item.spicyLevel,
        specialInstructions: item.specialInstructions,
        foodType: item.foodType
      }))
    };

    res.status(200).json({
      success: true,
      kotTicket
    });
  } catch (err) {
    next(err);
  }
};
