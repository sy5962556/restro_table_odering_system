const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  forgotPassword,
  resetPassword,
  verifyEmail
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/register-restaurant', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.get('/me', protect, getMe);

// Staff management routes
router.get('/staff', protect, authorize('owner', 'manager'), getStaff);
router.post('/staff', protect, authorize('owner', 'manager'), createStaff);
router.put('/staff/:id', protect, authorize('owner'), updateStaff);
router.delete('/staff/:id', protect, authorize('owner'), deleteStaff);

module.exports = router;
