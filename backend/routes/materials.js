const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/materials (with search and filters)
router.get('/', (req, res) => {
  try {
    const { search, supplierId } = req.query;
    let materials = db.find('materials');
    const suppliers = db.find('suppliers');

    // Attach supplier info
    materials = materials.map(m => {
      const supplier = suppliers.find(s => s.id === m.supplierId);
      return {
        ...m,
        supplierName: supplier ? supplier.name : 'Unknown Supplier'
      };
    });

    if (search) {
      const q = search.toLowerCase();
      materials = materials.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.location.toLowerCase().includes(q)
      );
    }

    if (supplierId) {
      materials = materials.filter(m => m.supplierId === Number(supplierId));
    }

    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch materials', details: err.message });
  }
});

// GET /api/materials/:id
router.get('/:id', (req, res) => {
  try {
    const material = db.findById('materials', req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    const supplier = db.findById('suppliers', material.supplierId);
    res.json({
      ...material,
      supplierName: supplier ? supplier.name : 'Unknown Supplier'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch material', details: err.message });
  }
});

// POST /api/materials
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, currentStock, minimumStock, supplierId, location, unit, pricePerUnit } = req.body;
    
    if (!name || currentStock === undefined || minimumStock === undefined || !supplierId || !unit || pricePerUnit === undefined) {
      return res.status(400).json({ error: 'All fields (name, currentStock, minimumStock, supplierId, location, unit, pricePerUnit) are required' });
    }

    const newMaterial = db.insert('materials', {
      name,
      currentStock: Number(currentStock),
      minimumStock: Number(minimumStock),
      supplierId: Number(supplierId),
      location: location || '',
      unit,
      pricePerUnit: parseFloat(pricePerUnit)
    });

    // System notification
    db.insert('notifications', {
      message: `New Packaging Material Added: ${name} (Min Stock threshold: ${minimumStock} ${unit})`,
      type: 'info',
      date: new Date().toISOString(),
      readStatus: 'unread'
    });

    res.status(201).json(newMaterial);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create material', details: err.message });
  }
});

// PUT /api/materials/:id
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.findById('materials', id);
    if (!existing) {
      return res.status(404).json({ error: 'Material not found' });
    }

    const { name, currentStock, minimumStock, supplierId, location, unit, pricePerUnit } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (currentStock !== undefined) updateData.currentStock = Number(currentStock);
    if (minimumStock !== undefined) updateData.minimumStock = Number(minimumStock);
    if (supplierId !== undefined) updateData.supplierId = Number(supplierId);
    if (location !== undefined) updateData.location = location;
    if (unit !== undefined) updateData.unit = unit;
    if (pricePerUnit !== undefined) updateData.pricePerUnit = parseFloat(pricePerUnit);

    const updated = db.update('materials', id, updateData);

    // If stock goes below minimum, trigger a warning notification
    if (updated.currentStock <= updated.minimumStock) {
      const duplicateNotif = db.find('notifications', n => 
        n.message.includes(updated.name) && 
        n.type === 'warning' && 
        n.readStatus === 'unread'
      );
      if (duplicateNotif.length === 0) {
        db.insert('notifications', {
          message: `Low Stock Alert: ${updated.name} is running low (${updated.currentStock} remaining, minimum threshold: ${updated.minimumStock}).`,
          type: 'warning',
          date: new Date().toISOString(),
          readStatus: 'unread'
        });
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update material', details: err.message });
  }
});

// DELETE /api/materials/:id
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.findById('materials', id);
    if (!existing) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Remove any product mappings associated with this material
    const mappings = db.find('productMaterialMapping', m => m.materialId === Number(id));
    mappings.forEach(m => db.delete('productMaterialMapping', m.id));

    db.delete('materials', id);
    res.json({ message: 'Material and associated mappings deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete material', details: err.message });
  }
});

module.exports = router;
