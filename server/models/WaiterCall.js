const mongoose = require('mongoose');

const waiterCallSchema = new mongoose.Schema({
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
  reason: {
    type: String,
    enum: ['Need Assistance', 'Need Water', 'Need Cutlery', 'Request Bill', 'Clean Table', 'Other'],
    default: 'Need Assistance'
  },
  note: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved'],
    default: 'pending'
  },
  attendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WaiterCall', waiterCallSchema);
