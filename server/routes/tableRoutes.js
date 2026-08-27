const express = require('express');
const router = express.Router();
const {
  getTables,
  getTable,
  createTable,
  updateTable,
  resetTable,
  deleteTable
} = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getTables);
router.get('/restaurant/:restaurantId', getTables);
router.get('/single/:id', getTable);
router.get('/:id', getTable);

router.post('/', protect, authorize('owner', 'manager'), createTable);
router.put('/:id', protect, updateTable);
router.patch('/:id/status', protect, updateTable);
router.post('/:id/reset', protect, resetTable);
router.delete('/:id', protect, authorize('owner'), deleteTable);

module.exports = router;
