const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getLogs,
  stockIn,
  stockOut,
  getTodayMovements
} = require('../controllers/inventoryController');

// All routes are protected
router.use(authMiddleware);

router.get('/logs', getLogs);
router.get('/today', getTodayMovements);
router.post('/stock-in', stockIn);
router.post('/stock-out', stockOut);

module.exports = router;
