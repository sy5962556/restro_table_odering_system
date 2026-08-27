const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Table = require('../models/Table');
const Customer = require('../models/Customer');
const Restaurant = require('../models/Restaurant');
const QRCode = require('qrcode');
const { emitToRestaurant, emitToTable } = require('../config/socket');

// Generate Payment Number: PAY-YYYYMMDD-XXXX
const generatePaymentNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await Payment.countDocuments({
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lt: new Date(new Date().setHours(23, 59, 59, 999))
    }
  });
  const seq = (countToday + 1).toString().padStart(4, '0');
  return `PAY-${dateStr}-${seq}`;
};

// @desc    Process & Record Payment Settlement
// @route   POST /api/payments
// @access  Public / Private
exports.processPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      invoiceId,
      amount,
      paymentMethod, // 'Cash' | 'UPI' | 'Card' | 'Online'
      transactionId,
      upiReference,
      notes,
      autoClearTable = true
    } = req.body;

    const order = await Order.findById(orderId).populate('restaurant');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const restaurant = order.restaurant;
    const paymentNumber = await generatePaymentNumber();

    // Create Payment Record
    const payment = await Payment.create({
      paymentNumber,
      order: order._id,
      invoice: invoiceId,
      restaurant: restaurant._id,
      amount: amount || order.grandTotal,
      paymentMethod,
      paymentStatus: 'Success',
      transactionId: transactionId || `TXN-${Date.now()}`,
      upiReference,
      receivedBy: req.user?._id,
      notes
    });

    // Update Order Status
    order.paymentStatus = 'Paid';
    order.paymentMethod = paymentMethod;
    order.orderStatus = 'Completed';
    order.completedAt = new Date();
    await order.save();

    // Update Invoice if exists
    if (invoiceId) {
      await Invoice.findByIdAndUpdate(invoiceId, {
        paymentStatus: 'Paid',
        paymentMethod,
        paidAt: new Date()
      });
    }

    // Award Loyalty Points & update customer spending
    if (order.customer?.mobile) {
      const customer = await Customer.findOne({ restaurant: restaurant._id, mobile: order.customer.mobile });
      if (customer) {
        customer.totalSpent += (amount || order.grandTotal);
        const ptsPer100 = restaurant.loyaltySettings?.pointsPer100 || 1;
        const earnedPoints = Math.floor((amount || order.grandTotal) / 100) * ptsPer100;
        customer.loyaltyPoints += earnedPoints;
        await customer.save();
      }
    }

    // Update Table status
    const table = await Table.findById(order.table);
    if (table && autoClearTable) {
      table.status = 'AVAILABLE';
      table.currentCustomer = null;
      table.currentOrder = null;
      table.currentSessionId = null;
      table.lastCleanedAt = new Date();
      await table.save();
      emitToRestaurant(restaurant._id, 'tableUpdated', { action: 'reset', table });
    }

    // Broadcast real-time events
    emitToRestaurant(restaurant._id, 'paymentCompleted', {
      payment,
      orderId: order._id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      amount: payment.amount,
      paymentMethod
    });

    emitToTable(order.table, 'paymentCompleted', {
      orderId: order._id,
      paymentStatus: 'Paid'
    });

    res.status(201).json({
      success: true,
      message: 'Payment completed successfully!',
      payment,
      order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Generate dynamic UPI QR payload
// @route   GET /api/payments/upi-qr/:orderId
// @access  Public
exports.getUPIQR = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('restaurant');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const restaurant = order.restaurant;
    const upiId = restaurant.upiId || 'royaldine@upi';
    const merchantName = encodeURIComponent(restaurant.upiMerchantName || restaurant.name);
    const amount = order.grandTotal.toFixed(2);
    const txnNote = encodeURIComponent(`Bill Table ${order.tableNumber} Order ${order.orderNumber}`);

    // Standard NPCI UPI URI string
    const upiString = `upi://pay?pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR&tn=${txnNote}`;
    const qrDataUrl = await QRCode.toDataURL(upiString, {
      errorCorrectionLevel: 'H',
      width: 320,
      margin: 2
    });

    res.status(200).json({
      success: true,
      upiString,
      qrDataUrl,
      amount: order.grandTotal,
      upiId,
      merchantName: restaurant.upiMerchantName || restaurant.name
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private (Owner / Manager / Cashier)
exports.getPayments = async (req, res, next) => {
  try {
    const restaurantId = req.user?.restaurant?._id || req.user?.restaurant || req.query.restaurantId;
    const payments = await Payment.find({ restaurant: restaurantId })
      .populate('order', 'orderNumber tableNumber customer')
      .populate('receivedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (err) {
    next(err);
  }
};
