const express = require('express');
const router = express.Router();
const {
  callWaiter,
  getWaiterCalls,
  resolveWaiterCall
} = require('../controllers/waiterCallController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', callWaiter);
router.get('/', protect, getWaiterCalls);
router.patch('/:id/resolve', protect, resolveWaiterCall);

module.exports = router;
