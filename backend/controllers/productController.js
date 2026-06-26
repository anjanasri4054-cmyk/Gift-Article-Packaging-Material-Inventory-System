const db = require('../database');

// Helper: create a notification
const createNotification = (title, message, type = 'info') => {
  db.prepare('INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)').run(title, message, type);
};

// Helper: create an inventory log
const createInventoryLog = (item_id, item_name, item_type, action, quantity, notes, user) => {
  db.prepare(
    `INSERT INTO inventory_logs (item_id, item_name, item_type, action, quantity, notes, user)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(item_id, item_name, item_type, action, quantity, notes || '', user || 'Admin');
};

// GET /api/products
const getAllProducts = (req, res) => {
  try {
    const { search, category, status } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';
    const products = db.prepare(query).all(...params);
    return res.status(200).json({ products });
  } catch (err) {
    console.error('getAllProducts error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/products/:id
const getProductById = (req, res) => {
  try {
    const { id } = req.params;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    return res.status(200).json({ product });
  } catch (err) {
    console.error('getProductById error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/products
const createProduct = (req, res) => {
  try {
    const { name, category, description, price, quantity, minimum_stock, status } = req.body;

    if (!name || !category || quantity === undefined || minimum_stock === undefined) {
      return res.status(400).json({ error: 'name, category, quantity, and minimum_stock are required.' });
    }

    const imagePath = req.file ? req.file.filename : null;

    const result = db.prepare(
      `INSERT INTO products (name, category, description, price, quantity, minimum_stock, image, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      name,
      category,
      description || '',
      parseFloat(price) || 0,
      parseInt(quantity) || 0,
      parseInt(minimum_stock) || 5,
      imagePath,
      status || 'active'
    );

    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);

    createNotification(
      'New Product Added',
      `Product "${name}" has been added to the inventory.`,
      'info'
    );
    createInventoryLog(newProduct.id, name, 'product', 'Product Created', parseInt(quantity) || 0, 'New product added', req.user ? req.user.name : 'Admin');

    return res.status(201).json({ message: 'Product created successfully.', product: newProduct });
  } catch (err) {
    console.error('createProduct error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PUT /api/products/:id
const updateProduct = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const {
      name = existing.name,
      category = existing.category,
      description = existing.description,
      price = existing.price,
      quantity = existing.quantity,
      minimum_stock = existing.minimum_stock,
      status = existing.status
    } = req.body;

    const imagePath = req.file ? req.file.filename : existing.image;

    db.prepare(
      `UPDATE products SET name=?, category=?, description=?, price=?, quantity=?, minimum_stock=?, image=?, status=?
       WHERE id=?`
    ).run(
      name,
      category,
      description,
      parseFloat(price),
      parseInt(quantity),
      parseInt(minimum_stock),
      imagePath,
      status,
      id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    createInventoryLog(id, name, 'product', 'Product Updated', parseInt(quantity), 'Product details updated', req.user ? req.user.name : 'Admin');

    return res.status(200).json({ message: 'Product updated successfully.', product: updated });
  } catch (err) {
    console.error('updateProduct error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/products/:id
const deleteProduct = (req, res) => {
  try {
    const { id } = req.params;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    createInventoryLog(id, product.name, 'product', 'Product Deleted', product.quantity, 'Product removed from inventory', req.user ? req.user.name : 'Admin');

    return res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('deleteProduct error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
