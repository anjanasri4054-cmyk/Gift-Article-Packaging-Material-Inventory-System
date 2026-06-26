const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getStats,
  getLowStock,
  getRecentActivity,
  getChartData
} = require('../controllers/dashboardController');

// All routes are protected
router.use(authMiddleware);

router.get('/stats', getStats);
router.get('/low-stock', getLowStock);
router.get('/recent-activity', getRecentActivity);
router.get('/chart-data', getChartData);

module.exports = router;
