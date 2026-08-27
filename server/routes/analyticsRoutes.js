const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getSalesCharts,
  getTableAnalytics,
  getAIForecasts
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getDashboardStats);
router.get('/sales-charts', protect, getSalesCharts);
router.get('/tables', protect, getTableAnalytics);
router.get('/ai-forecasts', protect, getAIForecasts);
router.get('/forecast', protect, getAIForecasts); // Alias used by frontend

module.exports = router;
