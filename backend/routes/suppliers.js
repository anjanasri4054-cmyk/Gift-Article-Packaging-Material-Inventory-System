const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/suppliers
router.get('/', (req, res) => {
  try {
    const { search, status } = req.query;
    let suppliers = db.find('suppliers');
    const materials = db.find('materials');

    // Attach materials supplied count
    suppliers = suppliers.map(s => {
      const itemsSuppliedCount = materials.filter(m => m.supplierId === s.id).length;
      return {
        ...s,
        materialsCount: itemsSuppliedCount
      };
    });

    if (search) {
      const q = search.toLowerCase();
      suppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.gst.toLowerCase().includes(q) || 
        s.address.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'All') {
      suppliers = suppliers.filter(s => s.status === status);
    }

    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch suppliers', details: err.message });
  }
});

// GET /api/suppliers/:id
router.get('/:id', (req, res) => {
  try {
    const supplier = db.findById('suppliers', req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    const materials = db.find('materials', m => m.supplierId === Number(req.params.id));
    res.json({
      ...supplier,
      materials
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch supplier', details: err.message });
  }
});

// POST /api/suppliers
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, phone, email, gst, address, status } = req.body;
    if (!name || !gst) {
      return res.status(400).json({ error: 'Supplier name and GST number are required' });
    }

    const newSupplier = db.insert('suppliers', {
      name,
      phone: phone || '',
      email: email || '',
      gst,
      address: address || '',
      status: status || 'active'
    });

    res.status(201).json(newSupplier);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create supplier', details: err.message });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.findById('suppliers', id);
    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const { name, phone, email, gst, address, status } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (gst !== undefined) updateData.gst = gst;
    if (address !== undefined) updateData.address = address;
    if (status !== undefined) updateData.status = status;

    const updated = db.update('suppliers', id, updateData);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update supplier', details: err.message });
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.findById('suppliers', id);
    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Check if supplier supplies materials
    const materials = db.find('materials', m => m.supplierId === Number(id));
    if (materials.length > 0) {
      return res.status(400).json({ error: 'Cannot delete supplier. They supply active packaging materials.' });
    }

    db.delete('suppliers', id);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete supplier', details: err.message });
  }
});

module.exports = router;
