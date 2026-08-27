const express = require('express');
const router = express.Router();
const {
  getOffers,
  validateOffer,
  createOffer,
  updateOffer,
  deleteOffer
} = require('../controllers/offerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/:restaurantId', getOffers);
router.post('/validate', validateOffer);
router.post('/', protect, authorize('owner', 'manager'), createOffer);
router.put('/:id', protect, authorize('owner', 'manager'), updateOffer);
router.delete('/:id', protect, authorize('owner', 'manager'), deleteOffer);

module.exports = router;
