const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getPlatformDashboard,
  getAllRestaurants,
  getRestaurantDetails,
  updateRestaurantStatus,
  updateRestaurantPlan,
  getAuditLogs
} = require('../controllers/platformAdminController');

// All routes are strictly protected for Super Admin only
router.use(protect);
router.use(authorize('superadmin'));

router.get('/dashboard', getPlatformDashboard);
router.get('/restaurants', getAllRestaurants);
router.get('/restaurants/:id', getRestaurantDetails);
router.patch('/restaurants/:id/status', updateRestaurantStatus);
router.patch('/restaurants/:id/plan', updateRestaurantPlan);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
