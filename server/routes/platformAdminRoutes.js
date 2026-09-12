const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getPlatformDashboard,
  getRestaurantTree,
  getAllRestaurants,
  getRestaurantDetails,
  updateRestaurantStatus,
  updateRestaurantPlan,
  resetRestaurantPassword,
  getTenantControlData,
  getTenantUsers,
  createTenantUser,
  updateTenantUser,
  deleteTenantUser,
  getTenantMenu,
  getTenantTables,
  regenerateTableQR,
  getTenantOrders,
  getTenantReports,
  getGlobalUsers,
  getGlobalOrders,
  getGlobalReports,
  getLocationMonitorData,
  recordClickLog,
  getClickLogs,
  getAuditLogs
} = require('../controllers/platformAdminController');

// All routes are strictly protected for Super Admin only
router.use(protect);
router.use(authorize('superadmin'));

// Platform & Tree
router.get('/dashboard', getPlatformDashboard);
router.get('/tree', getRestaurantTree);

// Restaurants & Control Mode
router.get('/restaurants', getAllRestaurants);
router.get('/restaurants/:id', getRestaurantDetails);
router.patch('/restaurants/:id/status', updateRestaurantStatus);
router.patch('/restaurants/:id/plan', updateRestaurantPlan);
router.post('/restaurants/:id/reset-password', resetRestaurantPassword);
router.get('/restaurants/:id/control-data', getTenantControlData);

// Tenant-Scoped Management (Control Mode)
router.get('/restaurants/:id/users', getTenantUsers);
router.post('/restaurants/:id/users', createTenantUser);
router.patch('/restaurants/:id/users/:userId', updateTenantUser);
router.delete('/restaurants/:id/users/:userId', deleteTenantUser);
router.get('/restaurants/:id/menu', getTenantMenu);
router.get('/restaurants/:id/tables', getTenantTables);
router.post('/restaurants/:id/tables/:tableId/regenerate-qr', regenerateTableQR);
router.get('/restaurants/:id/orders', getTenantOrders);
router.get('/restaurants/:id/reports', getTenantReports);

// Global Views
router.get('/users', getGlobalUsers);
router.get('/orders', getGlobalOrders);
router.get('/reports', getGlobalReports);
router.get('/location-monitor', getLocationMonitorData);

// Logging & Audit
router.post('/click-log', recordClickLog);
router.get('/click-logs', getClickLogs);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
