const express = require('express');
const router = express.Router();
const {
  getMenu,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createMenuItem,
  updateMenuItem,
  toggleItemAvailability,
  deleteMenuItem,
  generateAIDescription
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public Menu Access
router.get('/:restaurantId', getMenu);
router.get('/categories/:restaurantId', getCategories);

// Category Management
router.post('/categories', protect, authorize('owner', 'manager'), createCategory);
router.put('/categories/:id', protect, authorize('owner', 'manager'), updateCategory);
router.delete('/categories/:id', protect, authorize('owner', 'manager'), deleteCategory);

// Menu Item Management
router.post('/items', protect, authorize('owner', 'manager'), createMenuItem);
router.put('/items/:id', protect, authorize('owner', 'manager'), updateMenuItem);
router.patch('/items/:id/availability', protect, toggleItemAvailability);
router.delete('/items/:id', protect, authorize('owner', 'manager'), deleteMenuItem);

// AI Menu Description Generator
router.post('/ai-description', protect, authorize('owner', 'manager'), generateAIDescription);

module.exports = router;
