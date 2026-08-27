const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Table = require('../models/Table');
const { getRestaurant, updateRestaurant } = require('../controllers/restaurantController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public - get first restaurant info + table IDs (for QR simulator)
router.get('/public', async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'No restaurant found. Run the seed script.' });
    }
    const tables = await Table.find({ restaurant: restaurant._id }).select('_id tableNumber floor section status capacity').sort('tableNumber');
    res.json({ success: true, restaurantId: restaurant._id, restaurant, tables });
  } catch (err) {
    next(err);
  }
});

// Authenticated - get current user's restaurant
router.get('/mine', protect, async (req, res, next) => {
  try {
    const restaurantId = req.user?.restaurant?._id || req.user?.restaurant;
    const restaurant = restaurantId
      ? await Restaurant.findById(restaurantId)
      : await Restaurant.findOne();

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }
    res.json({ success: true, restaurant });
  } catch (err) {
    next(err);
  }
});

// Authenticated - update current user's restaurant
router.put('/mine', protect, authorize('owner', 'manager'), async (req, res, next) => {
  try {
    const restaurantId = req.user?.restaurant?._id || req.user?.restaurant;
    const restaurant = await Restaurant.findByIdAndUpdate(restaurantId, req.body, { new: true, runValidators: true });
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, message: 'Settings saved', restaurant });
  } catch (err) {
    next(err);
  }
});

// Get by ID (public for customers scanning QR)
router.get('/:id', getRestaurant);

// Update by ID
router.put('/:id', protect, authorize('owner', 'manager'), updateRestaurant);

module.exports = router;
