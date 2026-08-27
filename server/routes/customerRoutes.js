const express = require('express');
const router = express.Router();
const {
  lookupCustomer,
  getCustomers
} = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/lookup', lookupCustomer);
router.get('/', protect, authorize('owner', 'manager'), getCustomers);

module.exports = router;
