const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  reportGiftArticles,
  reportPackagingMaterials,
  reportLowStock,
  reportSuppliers,
  reportStockMovements,
  reportOrders,
  reportOrderStatus,
  reportOrderHistory,
  reportTopProducts,
  reportMaterialConsumption,
  reportSummaryJSON,
} = require('../controllers/reportController');

// All routes protected
router.use(authMiddleware);

// JSON summary used by frontend for PDF generation
router.get('/summary', reportSummaryJSON);

// CSV downloads
router.get('/gift-articles', reportGiftArticles);
router.get('/packaging-materials', reportPackagingMaterials);
router.get('/low-stock', reportLowStock);
router.get('/suppliers', reportSuppliers);
router.get('/stock-movements', reportStockMovements);
router.get('/orders', reportOrders);
router.get('/order-status', reportOrderStatus);
router.get('/order-history', reportOrderHistory);
router.get('/top-products', reportTopProducts);
router.get('/material-consumption', reportMaterialConsumption);

module.exports = router;
