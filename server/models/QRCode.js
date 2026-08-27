const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
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
  token: {
    type: String,
    required: true,
    unique: true
  },
  orderUrl: {
    type: String,
    required: true
  },
  qrDataUrl: {
    type: String // Base64 data image or URL
  },
  isActive: {
    type: Boolean,
    default: true
  },
  scanCount: {
    type: Number,
    default: 0
  },
  lastScannedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QRCode', qrCodeSchema);
