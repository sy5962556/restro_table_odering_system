const express = require('express');
const router = express.Router();
const {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  adjustStock,
  deleteInventoryItem
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getInventory);
router.post('/', protect, createInventoryItem);
router.put('/:id', protect, updateInventoryItem);
router.patch('/:id/adjust', protect, adjustStock);
router.delete('/:id', protect, deleteInventoryItem);

module.exports = router;
