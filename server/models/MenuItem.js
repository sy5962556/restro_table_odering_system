const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide dish name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide detailed description'],
    trim: true
  },
  shortDescription: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Please provide dish image URL']
  },
  price: {
    type: Number,
    required: [true, 'Please provide base price'],
    min: 0
  },
  discount: {
    type: Number,
    default: 0, // In percentage e.g. 10 for 10% off
    min: 0,
    max: 100
  },
  foodType: {
    type: String,
    enum: ['veg', 'non-veg', 'vegan', 'egg'],
    default: 'veg'
  },
  spicyLevel: {
    type: String,
    enum: ['none', 'mild', 'medium', 'hot', 'extra_hot'],
    default: 'medium'
  },
  preparationTime: {
    type: Number, // In minutes
    default: 15
  },
  ingredients: [{
    type: String
  }],
  allergens: [{
    type: String
  }],
  calories: {
    type: Number
  },
  portionSize: {
    type: String,
    default: '1 Serving'
  },
  availableQuantity: {
    type: Number,
    default: 100
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isBestseller: {
    type: Boolean,
    default: false
  },
  isSpecialOffer: {
    type: Boolean,
    default: false
  },
  recommendedCombos: [{
    name: String,
    price: Number,
    image: String,
    tag: String
  }],
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for calculating calculated final item price after item discount
menuItemSchema.virtual('finalPrice').get(function() {
  if (this.discount && this.discount > 0) {
    const discounted = this.price - (this.price * (this.discount / 100));
    return Math.round(discounted * 100) / 100;
  }
  return this.price;
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
