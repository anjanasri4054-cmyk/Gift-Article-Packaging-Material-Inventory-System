const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/inventory/logs (list all stock movements, with search/filters)
router.get('/logs', (req, res) => {
  try {
    const { search, type, materialId } = req.query;
    let movements = db.find('stockMovements');
    const materials = db.find('materials');

    // Join material details
    movements = movements.map(m => {
      const material = materials.find(mat => mat.id === m.materialId);
      return {
        ...m,
        materialName: material ? material.name : 'Unknown Material',
        unit: material ? material.unit : '',
        location: material ? material.location : ''
      };
    });

    if (search) {
      const q = search.toLowerCase();
      movements = movements.filter(m => 
        m.materialName.toLowerCase().includes(q) || 
        m.purpose.toLowerCase().includes(q)
      );
    }

    if (type && type !== 'All') {
      movements = movements.filter(m => m.type === type);
    }

    if (materialId) {
      movements = movements.filter(m => m.materialId === Number(materialId));
    }

    // Sort by date DESC
    movements.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(movements);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stock ledger logs', details: err.message });
  }
});

// POST /api/inventory/stock-in (restock material from a supplier)
router.post('/stock-in', authMiddleware, (req, res) => {
  try {
    const { materialId, quantity, supplierId, notes } = req.body;
    if (!materialId || quantity === undefined || Number(quantity) <= 0 || !supplierId) {
      return res.status(400).json({ error: 'materialId, supplierId, and a positive quantity are required' });
    }

    const material = db.findById('materials', materialId);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    const supplier = db.findById('suppliers', supplierId);
    const supplierName = supplier ? supplier.name : 'Unknown Supplier';

    // Update material stock levels
    const newStock = material.currentStock + Number(quantity);
    db.update('materials', materialId, { currentStock: newStock });

    // Log movement
    const movement = db.insert('stockMovements', {
      materialId: Number(materialId),
      type: 'Stock In',
      quantity: Number(quantity),
      purpose: notes || `Restocked from ${supplierName}`,
      referenceId: Number(supplierId),
      date: new Date().toISOString()
    });

    const dateFormatted = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Find and update matching active low stock notifications for this material
    const notifications = db.find('notifications');
    notifications.forEach(n => {
      const isAlert = n.message.includes('Low Stock') || n.message.includes('Out of Stock');
      const isThisMaterial = n.message.includes(material.name);
      if (isAlert && isThisMaterial && !n.message.includes('[Stock In')) {
        db.update('notifications', n.id, {
          message: `${n.message} [Stock In - ${dateFormatted}]`,
          readStatus: 'read',
          type: 'stock_in'
        });
      }
    });

    // Notify of restock success
    db.insert('notifications', {
      message: `Stock Restocked: Added ${quantity} ${material.unit} of ${material.name} (New Stock: ${newStock}) on ${dateFormatted}.`,
      type: 'stock_in',
      date: new Date().toISOString(),
      readStatus: 'unread'
    });

    res.status(201).json({
      message: 'Material restocked successfully',
      movement,
      material: { ...material, currentStock: newStock }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log stock-in', details: err.message });
  }
});

// POST /api/inventory/stock-out (log damage or internal use)
router.post('/stock-out', authMiddleware, (req, res) => {
  try {
    const { materialId, quantity, purpose, notes } = req.body;
    if (!materialId || quantity === undefined || Number(quantity) <= 0 || !purpose) {
      return res.status(400).json({ error: 'materialId, purpose, and a positive quantity are required' });
    }

    const material = db.findById('materials', materialId);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    if (material.currentStock < Number(quantity)) {
      return res.status(400).json({ error: `Insufficient stock. Current stock is only ${material.currentStock} ${material.unit}.` });
    }

    // Update stock level
    const newStock = material.currentStock - Number(quantity);
    db.update('materials', materialId, { currentStock: newStock });

    // Log movement
    const movement = db.insert('stockMovements', {
      materialId: Number(materialId),
      type: 'Stock Out',
      quantity: Number(quantity),
      purpose: `${purpose}${notes ? ' - ' + notes : ''}`,
      referenceId: 0, // No supplier/order reference needed for damages
      date: new Date().toISOString()
    });

    // If stock level drops to 0, send Out of Stock Alert, else send Low Stock Warning
    if (newStock <= 0) {
      db.insert('notifications', {
        message: `Out of Stock Alert: ${material.name} is completely out of stock after Stock Out (${purpose}).`,
        type: 'warning',
        date: new Date().toISOString(),
        readStatus: 'unread'
      });
    } else if (newStock <= material.minimumStock) {
      db.insert('notifications', {
        message: `Low Stock Warning: ${material.name} dropped to ${newStock} ${material.unit} after Stock Out (${purpose}).`,
        type: 'warning',
        date: new Date().toISOString(),
        readStatus: 'unread'
      });
    }

    res.status(201).json({
      message: 'Stock-out logged successfully',
      movement,
      material: { ...material, currentStock: newStock }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log stock-out', details: err.message });
  }
});

module.exports = router;
