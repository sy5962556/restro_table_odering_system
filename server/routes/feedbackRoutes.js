const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getFeedback
} = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', submitFeedback);
router.get('/:restaurantId', getFeedback);

module.exports = router;
