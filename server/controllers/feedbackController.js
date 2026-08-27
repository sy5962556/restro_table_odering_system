const Feedback = require('../models/Feedback');
const Order = require('../models/Order');

// @desc    Submit guest feedback after order
// @route   POST /api/feedback
// @access  Public
exports.submitFeedback = async (req, res, next) => {
  try {
    const {
      restaurantId,
      orderId,
      tableNumber,
      customerName,
      customerMobile,
      foodRating,
      serviceRating,
      ambienceRating,
      overallRating,
      comment,
      tags
    } = req.body;

    const feedback = await Feedback.create({
      restaurant: restaurantId,
      order: orderId,
      tableNumber: tableNumber || '01',
      customerName: customerName || 'Valued Guest',
      customerMobile,
      foodRating: foodRating || 5,
      serviceRating: serviceRating || 5,
      ambienceRating: ambienceRating || 5,
      overallRating: overallRating || 5,
      comment: comment || '',
      tags: tags || []
    });

    if (orderId) {
      await Order.findByIdAndUpdate(orderId, { feedbackSubmitted: true });
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for your valuable feedback!',
      feedback
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all feedback and average ratings for restaurant
// @route   GET /api/feedback/:restaurantId
// @access  Public / Private
exports.getFeedback = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId || req.user?.restaurant;
    const feedbacks = await Feedback.find({ restaurant: restaurantId }).sort({ createdAt: -1 });

    let avgOverall = 5.0;
    let avgFood = 5.0;
    let avgService = 5.0;

    if (feedbacks.length > 0) {
      const sumOverall = feedbacks.reduce((s, f) => s + f.overallRating, 0);
      const sumFood = feedbacks.reduce((s, f) => s + f.foodRating, 0);
      const sumService = feedbacks.reduce((s, f) => s + f.serviceRating, 0);

      avgOverall = Math.round((sumOverall / feedbacks.length) * 10) / 10;
      avgFood = Math.round((sumFood / feedbacks.length) * 10) / 10;
      avgService = Math.round((sumService / feedbacks.length) * 10) / 10;
    }

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      ratings: {
        avgOverall,
        avgFood,
        avgService,
        totalReviews: feedbacks.length
      },
      feedbacks
    });
  } catch (err) {
    next(err);
  }
};
