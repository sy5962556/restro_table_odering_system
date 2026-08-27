const express = require('express');
const router = express.Router();
const {
  validateTableQR,
  getAllQRCodes,
  regenerateQR
} = require('../controllers/qrController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/validate', validateTableQR);
router.get('/all/:restaurantId', protect, authorize('owner', 'manager'), getAllQRCodes);
router.post('/regenerate/:tableId', protect, authorize('owner'), regenerateQR);

module.exports = router;
