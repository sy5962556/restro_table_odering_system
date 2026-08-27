const express = require('express');
const router = express.Router();
const {
  generateInvoice,
  getInvoice,
  getInvoices
} = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/invoice/:orderId', generateInvoice);
router.get('/invoice/id/:id', getInvoice);
router.get('/invoices', protect, getInvoices);

module.exports = router;
