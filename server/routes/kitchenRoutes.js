const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Table = require('../models/Table');
const { emitToRestaurant, emitToKitchen, emitToTable } = require('../config/socket');
const { getKitchenOrders, updateItemStatus, getKOTData } = require('../controllers/kitchenController');
const { protect } = require('../middleware/authMiddleware');

// Active orders for KDS - alias /active → same as /orders
router.get('/active', protect, getKitchenOrders);
router.get('/orders', protect, getKitchenOrders);

// Toggle single item prepared status (by index since KDS sends index)
router.patch('/orders/:orderId/items/:itemIndex/toggle', protect, async (req, res, next) => {
  try {
    const { orderId, itemIndex } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const idx = parseInt(itemIndex, 10);
    if (!order.items[idx]) return res.status(404).json({ success: false, message: 'Item index out of range' });

    // Toggle: set preparedAt if not set, clear if already set
    if (order.items[idx].preparedAt) {
      order.items[idx].preparedAt = undefined;
    } else {
      order.items[idx].preparedAt = new Date();
    }

    await order.save();

    emitToKitchen(order.restaurant, 'kitchenOrderUpdated', { orderId: order._id, order });
    emitToRestaurant(order.restaurant, 'orderStatusUpdated', { orderId: order._id, order });

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

// Mark ALL items in an order as prepared
router.patch('/orders/:orderId/mark-all-prepared', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const now = new Date();
    order.items.forEach(item => {
      if (!item.preparedAt) item.preparedAt = now;
    });

    // Update status to Preparing if still pending
    if (['Pending', 'Confirmed'].includes(order.orderStatus)) {
      order.orderStatus = 'Preparing';
      if (!order.prepStartedAt) order.prepStartedAt = now;
    }

    await order.save();

    emitToKitchen(order.restaurant, 'kitchenOrderUpdated', { orderId: order._id, order });
    emitToRestaurant(order.restaurant, 'orderStatusUpdated', { orderId: order._id, order });

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

// Legacy item status update (by subdoc ID)
router.patch('/orders/:orderId/items/:itemId', protect, updateItemStatus);

// KOT data for printing
router.get('/kot/:orderId', getKOTData);

module.exports = router;
