const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/settings
router.get('/', authMiddleware, (req, res) => {
  try {
    const config = db.findById('systemConfig', 1);
    if (!config) {
      // Fallback fallback seed
      const newConfig = db.insert('systemConfig', {
        id: 1,
        businessName: 'Paper Plane',
        businessAddress: 'Shop 12, Connaught Place, New Delhi, Delhi',
        businessGst: '07AAAAA1111A1Z1',
        invoiceSubtitle: 'Gift Article & Packaging Material Inventory System',
        orderPrefix: 'ORD-',
        defaultGstRate: '18',
        defaultUnit: 'Pieces'
      });
      return res.json(newConfig);
    }
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve settings', details: err.message });
  }
});

// PUT /api/settings
router.get('/config', (req, res) => {
  // Public config endpoint if needed (no auth required for basic details on invoice)
  try {
    const config = db.findById('systemConfig', 1);
    res.json(config || {});
  } catch {
    res.json({});
  }
});

router.put('/', authMiddleware, (req, res) => {
  try {
    const {
      businessName,
      businessAddress,
      businessGst,
      invoiceSubtitle,
      orderPrefix,
      defaultGstRate,
      defaultUnit
    } = req.body;

    const updated = db.update('systemConfig', 1, {
      businessName,
      businessAddress,
      businessGst,
      invoiceSubtitle,
      orderPrefix,
      defaultGstRate,
      defaultUnit
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update configurations', details: err.message });
  }
});

module.exports = router;
