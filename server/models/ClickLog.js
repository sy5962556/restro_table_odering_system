const mongoose = require('mongoose');

const clickLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  userRole: String,
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  },
  restaurantCode: String,
  restaurantName: String,
  action: {
    type: String,
    required: true
  },
  page: String,
  entity: String,
  entityId: String,
  metadata: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  sessionId: String
}, {
  timestamps: true
});

clickLogSchema.index({ user: 1, createdAt: -1 });
clickLogSchema.index({ restaurant: 1, createdAt: -1 });
clickLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('ClickLog', clickLogSchema);
