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

// GET /api/inventory/logs
const getLogs = (req, res) => {
  try {
    const { item_type, action, from, to, search } = req.query;
    let query = 'SELECT * FROM inventory_logs WHERE 1=1';
    const params = [];

    if (item_type) {
      query += ' AND item_type = ?';
      params.push(item_type);
    }
    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }
    if (from) {
      query += ' AND date >= ?';
      params.push(from);
    }
    if (to) {
      // Add one day to 'to' so the filter is inclusive of the end date
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      query += ' AND date < ?';
      params.push(toDate.toISOString());
    }
    if (search) {
      query += ' AND item_name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY date DESC';
    const logs = db.prepare(query).all(...params);
    return res.status(200).json({ logs });
  } catch (err) {
    console.error('getLogs error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/inventory/stock-in
const stockIn = (req, res) => {
  try {
    const { item_id, item_type, item_name, quantity, supplier, date, notes } = req.body;

    if (!item_id || !item_type || !item_name || quantity === undefined) {
      return res.status(400).json({ error: 'item_id, item_type, item_name, and quantity are required.' });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number.' });
    }

    let updatedItem = null;

    if (item_type === 'product') {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item_id);
      if (!product) return res.status(404).json({ error: 'Product not found.' });

      db.prepare('UPDATE products SET quantity = quantity + ? WHERE id = ?').run(qty, item_id);
      updatedItem = db.prepare('SELECT * FROM products WHERE id = ?').get(item_id);
    } else if (item_type === 'material') {
      const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(item_id);
      if (!material) return res.status(404).json({ error: 'Material not found.' });

      db.prepare('UPDATE materials SET quantity = quantity + ? WHERE id = ?').run(qty, item_id);
      updatedItem = db.prepare('SELECT * FROM materials WHERE id = ?').get(item_id);
    } else {
      return res.status(400).json({ error: 'item_type must be "product" or "material".' });
    }

    const logNotes = [
      notes || '',
      supplier ? `Supplier: ${supplier}` : ''
    ].filter(Boolean).join(' | ');

    createInventoryLog(item_id, item_name, item_type, 'Stock In', qty, logNotes, req.user ? req.user.name : 'Admin');
    createNotification(
      'Stock Updated',
      `Stock In: ${qty} unit(s) of "${item_name}" added to inventory.`,
      'info'
    );

    return res.status(200).json({ message: 'Stock in recorded successfully.', item: updatedItem });
  } catch (err) {
    console.error('stockIn error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/inventory/stock-out
const stockOut = (req, res) => {
  try {
    const { item_id, item_type, item_name, quantity, purpose, date, notes } = req.body;

    if (!item_id || !item_type || !item_name || quantity === undefined) {
      return res.status(400).json({ error: 'item_id, item_type, item_name, and quantity are required.' });
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number.' });
    }

    let updatedItem = null;
    let currentQty = 0;
    let thresholdField = 'minimum_stock';

    if (item_type === 'product') {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item_id);
      if (!product) return res.status(404).json({ error: 'Product not found.' });

      currentQty = product.quantity;
      if (currentQty < qty) {
        return res.status(400).json({ error: `Insufficient stock. Available: ${currentQty}, Requested: ${qty}.` });
      }

      db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?').run(qty, item_id);
      updatedItem = db.prepare('SELECT * FROM products WHERE id = ?').get(item_id);

      // Low stock check
      if (updatedItem.quantity <= updatedItem.minimum_stock) {
        createNotification(
          'Low Stock Alert',
          `"${item_name}" is running low! Current stock: ${updatedItem.quantity} (Minimum: ${updatedItem.minimum_stock}).`,
          'warning'
        );
      }
    } else if (item_type === 'material') {
      const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(item_id);
      if (!material) return res.status(404).json({ error: 'Material not found.' });

      currentQty = material.quantity;
      if (currentQty < qty) {
        return res.status(400).json({ error: `Insufficient stock. Available: ${currentQty}, Requested: ${qty}.` });
      }

      db.prepare('UPDATE materials SET quantity = quantity - ? WHERE id = ?').run(qty, item_id);
      updatedItem = db.prepare('SELECT * FROM materials WHERE id = ?').get(item_id);

      // Low stock check
      if (updatedItem.quantity <= updatedItem.reorder_level) {
        createNotification(
          'Low Stock Alert',
          `"${item_name}" is running low! Current stock: ${updatedItem.quantity} (Reorder Level: ${updatedItem.reorder_level}).`,
          'warning'
        );
      }
    } else {
      return res.status(400).json({ error: 'item_type must be "product" or "material".' });
    }

    const logNotes = [
      notes || '',
      purpose ? `Purpose: ${purpose}` : ''
    ].filter(Boolean).join(' | ');

    createInventoryLog(item_id, item_name, item_type, 'Stock Out', qty, logNotes, req.user ? req.user.name : 'Admin');
    createNotification(
      'Stock Updated',
      `Stock Out: ${qty} unit(s) of "${item_name}" removed from inventory.`,
      'info'
    );

    return res.status(200).json({ message: 'Stock out recorded successfully.', item: updatedItem });
  } catch (err) {
    console.error('stockOut error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/inventory/today
const getTodayMovements = (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const stockInCount = db.prepare(
      `SELECT COUNT(*) as count FROM inventory_logs
       WHERE action = 'Stock In' AND date(date) = ?`
    ).get(today).count;

    const stockOutCount = db.prepare(
      `SELECT COUNT(*) as count FROM inventory_logs
       WHERE action = 'Stock Out' AND date(date) = ?`
    ).get(today).count;

    return res.status(200).json({
      stockIn: stockInCount,
      stockOut: stockOutCount,
      total: stockInCount + stockOutCount
    });
  } catch (err) {
    console.error('getTodayMovements error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getLogs, stockIn, stockOut, getTodayMovements };
