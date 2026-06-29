const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');
const authMiddleware = require('../middleware/authMiddleware');

// Setup multer for image uploads
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// GET /api/products (with search and category filters)
router.get('/', (req, res) => {
  try {
    const { search, type } = req.query;
    let products = db.find('products');

    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (type && type !== 'All') {
      products = products.filter(p => p.type === type);
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products', details: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  try {
    const product = db.findById('products', req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product', details: err.message });
  }
});

// POST /api/products (create product with optional image file upload)
router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  try {
    const { name, type, price, description } = req.body;
    if (!name || !type || price === undefined) {
      return res.status(400).json({ error: 'Name, category type, and price are required' });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const newProduct = db.insert('products', {
      name,
      type,
      price: parseFloat(price),
      description: description || '',
      imageUrl
    });

    // Create a system notification
    db.insert('notifications', {
      message: `New Gift Article Added: ${name} (Category: ${type})`,
      type: 'info',
      date: new Date().toISOString(),
      readStatus: 'unread'
    });

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product', details: err.message });
  }
});

// PUT /api/products/:id (update product fields and optional image upload)
router.put('/:id', authMiddleware, upload.single('image'), (req, res) => {
  try {
    const id = req.params.id;
    const existingProduct = db.findById('products', id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, type, price, description } = req.body;
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (description !== undefined) updateData.description = description;
    
    if (req.file) {
      // If a new image is uploaded, delete the old one if it exists
      if (existingProduct.imageUrl) {
        const oldImagePath = path.join(__dirname, '../..', existingProduct.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedProduct = db.update('products', id, updateData);
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product', details: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const id = req.params.id;
    const existingProduct = db.findById('products', id);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete image file from disk if present
    if (existingProduct.imageUrl) {
      const imagePath = path.join(__dirname, '../..', existingProduct.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Remove any material mappings associated with this product
    const mappings = db.find('productMaterialMapping', m => m.productId === Number(id));
    mappings.forEach(m => db.delete('productMaterialMapping', m.id));

    db.delete('products', id);
    res.json({ message: 'Product and associated mappings deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product', details: err.message });
  }
});

module.exports = router;
