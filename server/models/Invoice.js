const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderNumber: {
    type: String,
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  tableNumber: {
    type: String,
    required: true
  },
  customer: {
    name: { type: String, required: true },
    mobile: { type: String, required: true }
  },
  restaurantDetails: {
    name: String,
    address: Object,
    phone: String,
    email: String,
    gstNumber: String,
    upiId: String,
    upiMerchantName: String
  },
  items: [{
    name: String,
    quantity: Number,
    price: Number,
    discount: Number,
    itemTotal: Number
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  couponCode: { type: String, default: null },
  loyaltyDiscount: { type: Number, default: 0 },
  tax: { type: Number, required: true },
  taxRate: { type: Number, default: 5 },
  serviceCharge: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Partially Paid', 'Refunded', 'Cancelled'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Online', 'Pending'],
    default: 'Pending'
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  paidAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);
