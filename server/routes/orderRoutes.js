const express = require('express');
const router = express.Router();
const {
  previewCart,
  placeOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  requestBill
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/preview', previewCart);
router.post('/', placeOrder);
router.get('/', protect, getOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', protect, updateOrderStatus);
router.post('/:id/request-bill', requestBill);

module.exports = router;
