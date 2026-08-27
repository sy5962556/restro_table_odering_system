const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  tableNumber: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    default: 'Valued Guest'
  },
  customerMobile: {
    type: String
  },
  foodRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  serviceRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  ambienceRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  overallRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    trim: true
  },
  tags: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['Published', 'Hidden'],
    default: 'Published'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);
