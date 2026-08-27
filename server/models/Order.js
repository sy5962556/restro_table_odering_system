const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number
  },
  discount: {
    type: Number,
    default: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  itemTotal: {
    type: Number,
    required: true
  },
  foodType: {
    type: String,
    enum: ['veg', 'non-veg', 'vegan', 'egg'],
    default: 'veg'
  },
  spicyLevel: {
    type: String,
    default: 'medium'
  },
  preparationTime: {
    type: Number,
    default: 15
  },
  specialInstructions: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served'],
    default: 'pending'
  }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  tableNumber: {
    type: String,
    required: true
  },
  customer: {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true
    }
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  couponCode: {
    type: String,
    default: null
  },
  loyaltyPointsUsed: {
    type: Number,
    default: 0
  },
  loyaltyDiscount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    required: true,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 5
  },
  serviceCharge: {
    type: Number,
    default: 0
  },
  serviceChargeRate: {
    type: Number,
    default: 2.5
  },
  packagingCharge: {
    type: Number,
    default: 0
  },
  grandTotal: {
    type: Number,
    required: true,
    default: 0
  },
  orderStatus: {
    type: String,
    enum: ['New', 'Accepted', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled'],
    default: 'New'
  },
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
  specialInstructions: {
    type: String,
    default: ''
  },
  estimatedPrepTime: {
    type: Number, // In minutes
    default: 20
  },
  billRequested: {
    type: Boolean,
    default: false
  },
  billRequestedAt: {
    type: Date
  },
  acceptedAt: Date,
  prepStartedAt: Date,
  readyAt: Date,
  servedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancelledReason: String,
  feedbackSubmitted: {
    type: Boolean,
    default: false
  },
  tableSessionId: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
