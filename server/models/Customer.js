const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  visitsCount: {
    type: Number,
    default: 1
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  ordersCount: {
    type: Number,
    default: 0
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  favoriteItems: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    name: String,
    orderCount: { type: Number, default: 1 }
  }],
  lastVisit: {
    type: Date,
    default: Date.now
  },
  lastTableNumber: {
    type: String
  }
}, {
  timestamps: true
});

customerSchema.index({ restaurant: 1, mobile: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);
