const mongoose = require('mongoose');

const tableSessionSchema = new mongoose.Schema({
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
  customerName: {
    type: String,
    trim: true
  },
  customerMobile: {
    type: String,
    trim: true
  },
  sessionToken: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'BILL_REQUESTED', 'CLOSED'],
    default: 'ACTIVE'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  totalOrdersCount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

tableSessionSchema.index({ restaurant: 1, table: 1, status: 1 });

module.exports = mongoose.model('TableSession', tableSessionSchema);
