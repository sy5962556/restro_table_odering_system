const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide restaurant name'],
    trim: true
  },
  tagline: {
    type: String,
    default: 'Authentic Flavors, Smart Dining'
  },
  description: {
    type: String,
    default: 'Experience contactless QR ordering, freshly prepared meals, and delightful ambiance.'
  },
  logo: {
    type: String,
    default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60'
  },
  banner: {
    type: String,
    default: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80'
  },
  address: {
    street: { type: String, default: '108 Gourmet Boulevard' },
    city: { type: String, default: 'Bengaluru' },
    state: { type: String, default: 'Karnataka' },
    pincode: { type: String, default: '560001' },
    country: { type: String, default: 'India' }
  },
  phone: {
    type: String,
    default: '+91 98765 43210'
  },
  email: {
    type: String,
    default: 'contact@royaldine.com'
  },
  gstNumber: {
    type: String,
    default: '29ABCDE1234F1Z5'
  },
  currency: {
    type: String,
    default: '₹'
  },
  currencyCode: {
    type: String,
    default: 'INR'
  },
  taxRate: {
    type: Number,
    default: 5 // 5% GST
  },
  serviceChargeRate: {
    type: Number,
    default: 2.5 // 2.5% Service Charge
  },
  packagingCharge: {
    type: Number,
    default: 0
  },
  upiId: {
    type: String,
    default: 'royaldine@upi'
  },
  upiMerchantName: {
    type: String,
    default: 'Royal Spices Fine Dine'
  },
  openingHours: {
    open: { type: String, default: '11:00 AM' },
    close: { type: String, default: '11:30 PM' }
  },
  isAcceptingOrders: {
    type: Boolean,
    default: true
  },
  loyaltySettings: {
    pointsPer100: { type: Number, default: 1 }, // 1 point per 100 spent
    pointValue: { type: Number, default: 1 },    // 1 point = ₹1 discount
    minRedeemPoints: { type: Number, default: 20 }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
