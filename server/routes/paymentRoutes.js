const express = require('express');
const router = express.Router();
const {
  processPayment,
  getUPIQR,
  getPayments
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', processPayment);
router.get('/upi-qr/:orderId', getUPIQR);
router.get('/', protect, getPayments);

module.exports = router;
