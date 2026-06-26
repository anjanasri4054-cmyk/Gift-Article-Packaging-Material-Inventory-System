const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAllBundles,
  getBundleByProduct,
  addMaterialToBundle,
  updateBundleEntry,
  deleteBundleEntry,
  useBundle,
  calculateBundle,
} = require('../controllers/bundleController');

// All routes protected
router.use(authMiddleware);

// List products that have bundles
router.get('/', getAllBundles);

// Get / manage a specific product bundle
router.get('/:productId', getBundleByProduct);
router.post('/:productId/materials', addMaterialToBundle);
router.post('/:productId/use', useBundle);
router.get('/:productId/calculate', calculateBundle);

// Manage individual bundle entries
router.put('/entry/:bundleId', updateBundleEntry);
router.delete('/entry/:bundleId', deleteBundleEntry);

module.exports = router;
