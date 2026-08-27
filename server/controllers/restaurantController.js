const Restaurant = require('../models/Restaurant');

// @desc    Get restaurant profile / details (Public for customers & admin)
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurant = async (req, res, next) => {
  try {
    let restaurant;
    if (req.params.id && req.params.id !== 'current') {
      restaurant = await Restaurant.findById(req.params.id);
    } else if (req.user && req.user.restaurant) {
      restaurant = await Restaurant.findById(req.user.restaurant);
    } else {
      restaurant = await Restaurant.findOne();
    }

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    res.status(200).json({
      success: true,
      restaurant
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update restaurant profile and settings
// @route   PUT /api/restaurants/:id
// @access  Private (Owner / Manager)
exports.updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Restaurant profile updated successfully',
      restaurant
    });
  } catch (err) {
    next(err);
  }
};
