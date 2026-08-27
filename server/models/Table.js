const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  tableNumber: {
    type: String,
    required: [true, 'Please provide table number (e.g. 01, T-12)'],
    trim: true
  },
  tableName: {
    type: String,
    default: function() {
      return `Table ${this.tableNumber}`;
    }
  },
  capacity: {
    type: Number,
    default: 4
  },
  floor: {
    type: String,
    default: 'Ground Floor'
  },
  section: {
    type: String,
    default: 'Main Hall',
    trim: true
  },
  status: {
    type: String,
    enum: [
      'AVAILABLE',
      'OCCUPIED',
      'ORDERING',
      'FOOD_READY',
      'BILL_REQUESTED',
      'PAYMENT_PENDING',
      'COMPLETED',
      'CLEANING'
    ],
    default: 'AVAILABLE'
  },
  qrCodeToken: {
    type: String,
    required: true
  },
  qrCodeUrl: {
    type: String
  },
  currentCustomer: {
    name: String,
    mobile: String,
    joinedAt: Date
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  currentSessionId: {
    type: String
  },
  lastOccupiedAt: {
    type: Date
  },
  lastCleanedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound unique index for tableNumber per restaurant
tableSchema.index({ restaurant: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);
