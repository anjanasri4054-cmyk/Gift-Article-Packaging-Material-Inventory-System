const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/mappings (list all mappings, with optional product filter)
router.get('/', (req, res) => {
  try {
    const { productId } = req.query;
    let mappings = db.find('productMaterialMapping');
    const products = db.find('products');
    const materials = db.find('materials');

    mappings = mappings.map(m => {
      const product = products.find(p => p.id === m.productId);
      const material = materials.find(mat => mat.id === m.materialId);
      return {
        ...m,
        productName: product ? product.name : 'Unknown Product',
        materialName: material ? material.name : 'Unknown Material',
        unit: material ? material.unit : ''
      };
    });

    if (productId) {
      mappings = mappings.filter(m => m.productId === Number(productId));
    }

    res.json(mappings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mappings', details: err.message });
  }
});

// GET /api/mappings/product/:productId (specific product recipe)
router.get('/product/:productId', (req, res) => {
  try {
    const pid = Number(req.params.productId);
    const mappings = db.find('productMaterialMapping', m => m.productId === pid);
    const materials = db.find('materials');

    const result = mappings.map(m => {
      const material = materials.find(mat => mat.id === m.materialId);
      return {
        id: m.id,
        productId: m.productId,
        materialId: m.materialId,
        quantityNeeded: m.quantityNeeded,
        materialName: material ? material.name : 'Unknown Material',
        unit: material ? material.unit : '',
        currentStock: material ? material.currentStock : 0
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product mappings', details: err.message });
  }
});

// POST /api/mappings (add material mapping to a product)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { productId, materialId, quantityNeeded } = req.body;
    if (!productId || !materialId || quantityNeeded === undefined || Number(quantityNeeded) <= 0) {
      return res.status(400).json({ error: 'productId, materialId, and a positive quantityNeeded are required' });
    }

    // Check if mapping already exists
    const duplicate = db.find('productMaterialMapping', m => 
      m.productId === Number(productId) && m.materialId === Number(materialId)
    );
    if (duplicate.length > 0) {
      return res.status(400).json({ error: 'A mapping for this product and material combination already exists.' });
    }

    const newMapping = db.insert('productMaterialMapping', {
      productId: Number(productId),
      materialId: Number(materialId),
      quantityNeeded: Number(quantityNeeded)
    });

    res.status(201).json(newMapping);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create mapping', details: err.message });
  }
});

// PUT /api/mappings/:id (update mapped quantities)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.findById('productMaterialMapping', id);
    if (!existing) {
      return res.status(404).json({ error: 'Mapping not found' });
    }

    const { quantityNeeded } = req.body;
    if (quantityNeeded === undefined || Number(quantityNeeded) <= 0) {
      return res.status(400).json({ error: 'A positive quantityNeeded is required' });
    }

    const updated = db.update('productMaterialMapping', id, {
      quantityNeeded: Number(quantityNeeded)
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update mapping', details: err.message });
  }
});

// DELETE /api/mappings/:id
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.findById('productMaterialMapping', id);
    if (!existing) {
      return res.status(404).json({ error: 'Mapping not found' });
    }

    db.delete('productMaterialMapping', id);
    res.json({ message: 'Mapping deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete mapping', details: err.message });
  }
});

module.exports = router;
