const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: {
    type: String,
    default: 'System / Customer'
  },
  userRole: {
    type: String,
    default: 'Customer'
  },
  action: {
    type: String,
    required: true
  },
  entity: {
    type: String,
    required: true // 'Order', 'MenuItem', 'Table', 'Invoice', 'Payment', 'User'
  },
  entityId: {
    type: String
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
