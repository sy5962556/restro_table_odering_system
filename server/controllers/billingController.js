const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Customer = require('../models/Customer');
const Table = require('../models/Table');

// Generate unique invoice number: INV-YYYYMMDD-XXXX
const generateInvoiceNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await Invoice.countDocuments({
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lt: new Date(new Date().setHours(23, 59, 59, 999))
    }
  });
  const seq = (countToday + 1).toString().padStart(4, '0');
  return `INV-${dateStr}-${seq}`;
};

// @desc    Generate or retrieve Invoice for an Order
// @route   POST /api/billing/invoice/:orderId
// @access  Public / Private
exports.generateInvoice = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Check if invoice already exists
    let invoice = await Invoice.findOne({ order: orderId });
    if (invoice) {
      return res.status(200).json({ success: true, invoice, alreadyExists: true });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const restaurant = await Restaurant.findById(order.restaurant);
    const invoiceNumber = await generateInvoiceNumber();

    invoice = await Invoice.create({
      invoiceNumber,
      order: order._id,
      orderNumber: order.orderNumber,
      restaurant: restaurant._id,
      tableNumber: order.tableNumber,
      customer: {
        name: order.customer.name,
        mobile: order.customer.mobile
      },
      restaurantDetails: {
        name: restaurant.name,
        address: restaurant.address,
        phone: restaurant.phone,
        email: restaurant.email,
        gstNumber: restaurant.gstNumber,
        upiId: restaurant.upiId,
        upiMerchantName: restaurant.upiMerchantName
      },
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        itemTotal: item.itemTotal
      })),
      subtotal: order.subtotal,
      discount: order.discount,
      couponCode: order.couponCode,
      loyaltyDiscount: order.loyaltyDiscount,
      tax: order.tax,
      taxRate: order.taxRate,
      serviceCharge: order.serviceCharge,
      grandTotal: order.grandTotal,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod
    });

    res.status(201).json({
      success: true,
      invoice
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Invoice by ID
// @route   GET /api/billing/invoice/id/:id
// @access  Public
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('order');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.status(200).json({ success: true, invoice });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all Invoices for restaurant
// @route   GET /api/billing/invoices
// @access  Private (Owner / Manager / Cashier)
exports.getInvoices = async (req, res, next) => {
  try {
    const restaurantId = req.user?.restaurant?._id || req.user?.restaurant || req.query.restaurantId;
    const { paymentStatus, date, limit = 50, page = 1 } = req.query;

    const query = { restaurant: restaurantId };
    if (paymentStatus && paymentStatus !== 'ALL') {
      query.paymentStatus = paymentStatus;
    }
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      invoices
    });
  } catch (err) {
    next(err);
  }
};
