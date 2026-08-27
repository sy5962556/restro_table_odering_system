const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  ingredient: {
    type: String,
    required: [true, 'Please provide ingredient name'],
    trim: true
  },
  unit: {
    type: String,
    enum: ['kg', 'g', 'l', 'ml', 'pcs', 'packets', 'cans'],
    default: 'kg'
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0
  },
  minimumStock: {
    type: Number,
    required: true,
    default: 5
  },
  purchasePrice: {
    type: Number,
    default: 0
  },
  supplier: {
    type: String,
    default: 'Prime Foods Wholesale'
  },
  expiryDate: {
    type: Date
  },
  category: {
    type: String,
    enum: ['Dairy', 'Produce', 'Spices & Condiments', 'Grains & Flour', 'Beverages', 'Packaging', 'Meat/Poultry'],
    default: 'Dairy'
  },
  lastRestockedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Status virtual: NORMAL, LOW_STOCK, OUT_OF_STOCK
inventoryItemSchema.virtual('status').get(function() {
  if (this.currentStock <= 0) return 'OUT_OF_STOCK';
  if (this.currentStock <= this.minimumStock) return 'LOW_STOCK';
  return 'NORMAL';
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
