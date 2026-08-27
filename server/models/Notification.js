const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['NEW_ORDER', 'BILL_REQUESTED', 'CALL_WAITER', 'LOW_STOCK', 'ORDER_STATUS', 'SYSTEM'],
    default: 'NEW_ORDER'
  },
  tableNumber: {
    type: String
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
