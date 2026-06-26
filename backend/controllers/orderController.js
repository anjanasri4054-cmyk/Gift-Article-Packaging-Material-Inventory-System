const db = require('../database');

// Helper: create notification
const createNotification = (title, message, type = 'info') => {
  db.prepare('INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)').run(title, message, type);
};

// Helper: create inventory log
const createInventoryLog = (item_id, item_name, item_type, action, quantity, notes, user) => {
  db.prepare(
    `INSERT INTO inventory_logs (item_id, item_name, item_type, action, quantity, notes, user)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(item_id, item_name, item_type, action, quantity, notes || '', user || 'Admin');
};

// Helper: restore stock for an order
const restoreOrderStock = (orderId, user) => {
  const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId);
  if (!order) return;

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  for (const item of items) {
    const product = db.prepare('SELECT name FROM products WHERE id = ?').get(item.product_id);
    const prodName = product ? product.name : `Product #${item.product_id}`;

    // 1. Restore finished product stock
    db.prepare('UPDATE products SET quantity = quantity + ? WHERE id = ?').run(item.quantity, item.product_id);
    createInventoryLog(
      item.product_id,
      prodName,
      'product',
      'Stock In',
      item.quantity,
      `Stock restored: Order ${order.order_number} status changed/deleted.`,
      user
    );

    // 2. Restore packaging materials stock
    const materials = db.prepare('SELECT * FROM product_materials WHERE product_id = ?').all(item.product_id);
    for (const pm of materials) {
      const material = db.prepare('SELECT name, unit FROM materials WHERE id = ?').get(pm.material_id);
      if (material) {
        const requiredTotal = pm.quantity_required * item.quantity;
        db.prepare('UPDATE materials SET quantity = quantity + ? WHERE id = ?').run(requiredTotal, pm.material_id);
        createInventoryLog(
          pm.material_id,
          material.name,
          'material',
          'Stock In',
          requiredTotal,
          `Material restored: Order ${order.order_number} status changed/deleted.`,
          user
        );
      }
    }
  }
};

// Helper: check and deduct stock for an order
// Returns { success: true } or { success: false, error: string, shortages: [] }
const deductOrderStock = (orderId, user) => {
  const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId);
  if (!order) return { success: false, error: 'Order not found.' };

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  // 1. Gather all required quantities
  const productDeductions = [];
  const materialDeductions = {}; // materialId -> { quantity, name, unit, reorder_level }

  for (const item of items) {
    // Finish product requirement
    const product = db.prepare('SELECT name, quantity, minimum_stock FROM products WHERE id = ?').get(item.product_id);
    if (!product) {
      return { success: false, error: `Product ID #${item.product_id} not found.` };
    }

    productDeductions.push({
      product_id: item.product_id,
      name: product.name,
      quantity: item.quantity,
      available: product.quantity,
      minimum_stock: product.minimum_stock
    });

    // Material requirements
    const pmList = db.prepare('SELECT * FROM product_materials WHERE product_id = ?').all(item.product_id);
    for (const pm of pmList) {
      const material = db.prepare('SELECT name, quantity, unit, reorder_level FROM materials WHERE id = ?').get(pm.material_id);
      if (material) {
        const requiredQty = pm.quantity_required * item.quantity;
        if (!materialDeductions[pm.material_id]) {
          materialDeductions[pm.material_id] = {
            material_id: pm.material_id,
            name: material.name,
            required: 0,
            available: material.quantity,
            unit: material.unit,
            reorder_level: material.reorder_level
          };
        }
        materialDeductions[pm.material_id].required += requiredQty;
      }
    }
  }

  // 2. Pre-flight check: ensure enough stock for products & materials
  const shortages = [];

  for (const prod of productDeductions) {
    if (prod.available < prod.quantity) {
      shortages.push({
        item: prod.name,
        type: 'Gift Article',
        required: prod.quantity,
        available: prod.available,
        shortfall: prod.quantity - prod.available
      });
    }
  }

  for (const matId in materialDeductions) {
    const mat = materialDeductions[matId];
    if (mat.available < mat.required) {
      shortages.push({
        item: mat.name,
        type: 'Packaging Material',
        required: mat.required,
        available: mat.available,
        shortfall: mat.required - mat.available
      });
    }
  }

  if (shortages.length > 0) {
    return { success: false, error: 'Insufficient stock for products/materials.', shortages };
  }

  // 3. Deduct products
  for (const prod of productDeductions) {
    db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?').run(prod.quantity, prod.product_id);
    createInventoryLog(
      prod.product_id,
      prod.name,
      'product',
      'Stock Out',
      prod.quantity,
      `Deducted: Customer Order ${order.order_number}`,
      user
    );

    // Low stock check
    const updatedProd = db.prepare('SELECT quantity FROM products WHERE id = ?').get(prod.product_id);
    if (updatedProd.quantity <= prod.minimum_stock) {
      createNotification(
        'Low Stock Alert',
        `Product "${prod.name}" is low (Stock: ${updatedProd.quantity}, Min: ${prod.minimum_stock}) after Order ${order.order_number}.`,
        'warning'
      );
    }
  }

  // 4. Deduct materials
  for (const matId in materialDeductions) {
    const mat = materialDeductions[matId];
    db.prepare('UPDATE materials SET quantity = quantity - ? WHERE id = ?').run(mat.required, mat.material_id);
    createInventoryLog(
      mat.material_id,
      mat.name,
      'material',
      'Stock Out',
      mat.required,
      `Packaging: Customer Order ${order.order_number}`,
      user
    );

    // Low stock check
    const updatedMat = db.prepare('SELECT quantity FROM materials WHERE id = ?').get(mat.material_id);
    if (updatedMat.quantity <= mat.reorder_level) {
      createNotification(
        'Low Stock Alert',
        `Material "${mat.name}" is low (Stock: ${updatedMat.quantity}, Reorder: ${mat.reorder_level}) after Order ${order.order_number}.`,
        'warning'
      );
    }
  }

  return { success: true };
};

// GET /api/orders
const getAllOrders = (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT o.*, c.customer_name, c.phone, c.email, c.address
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (o.order_number LIKE ? OR c.customer_name LIKE ? OR c.phone LIKE ? OR c.address LIKE ?)';
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild, searchWild, searchWild);
    }

    query += ' ORDER BY o.order_date DESC';

    const orders = db.prepare(query).all(...params);

    // Hydrate each order with items, items count, and products list string representation
    const updated = orders.map(o => {
      const items = db.prepare(`
        SELECT oi.*, p.name AS product_name, p.category
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `).all(o.order_id);
      
      const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
      const productsList = items.map(item => `${item.product_name} (x${item.quantity})`).join(', ');

      return {
        ...o,
        items_count: itemsCount,
        products_list: productsList,
        items: items
      };
    });

    return res.status(200).json({ orders: updated });
  } catch (err) {
    console.error('getAllOrders error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/orders/:id
const getOrderById = (req, res) => {
  try {
    const { id } = req.params;
    const order = db.prepare(`
      SELECT o.*, c.customer_name, c.phone, c.email, c.address
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      WHERE o.order_id = ?
    `).get(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const items = db.prepare(`
      SELECT oi.*, p.name AS product_name, p.category
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(id);

    // Calculate packaging materials used for this order
    const materialsUsed = [];
    for (const item of items) {
      const pmList = db.prepare(`
        SELECT pm.quantity_required, m.name AS material_name, m.unit
        FROM product_materials pm
        JOIN materials m ON pm.material_id = m.id
        WHERE pm.product_id = ?
      `).all(item.product_id);

      for (const pm of pmList) {
        const requiredTotal = pm.quantity_required * item.quantity;
        const existing = materialsUsed.find(m => m.name === pm.material_name);
        if (existing) {
          existing.quantity += requiredTotal;
        } else {
          materialsUsed.push({ name: pm.material_name, quantity: requiredTotal, unit: pm.unit });
        }
      }
    }

    return res.status(200).json({ order, items, materialsUsed });
  } catch (err) {
    console.error('getOrderById error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/orders
const createOrder = (req, res) => {
  try {
    const {
      customer_id,
      customer_name, phone, email, address,
      order_date, delivery_date, order_type,
      status, items
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one product item is required.' });
    }

    // 1. Resolve customer
    let custId = customer_id;
    if (!custId) {
      if (!customer_name) {
        return res.status(400).json({ error: 'Customer information is incomplete (customer_name is required).' });
      }
      // Insert new customer
      const result = db.prepare(
        'INSERT INTO customers (customer_name, phone, email, address) VALUES (?, ?, ?, ?)'
      ).run(customer_name, phone || '', email || '', address || '');
      custId = result.lastInsertRowid;
    }

    // 2. Auto-generate ORD-XXXX number
    const maxRes = db.prepare('SELECT MAX(order_id) as max_id FROM orders').get();
    const nextNum = (maxRes.max_id || 0) + 1001;
    const orderNumber = `ORD-${nextNum}`;

    // 3. Calculate order total
    let totalAmount = 0;
    const hydratedItems = [];

    for (const item of items) {
      const product = db.prepare('SELECT price FROM products WHERE id = ?').get(item.product_id);
      if (!product) {
        return res.status(400).json({ error: `Product ID #${item.product_id} not found.` });
      }
      const itemSubtotal = product.price * parseInt(item.quantity);
      totalAmount += itemSubtotal;
      hydratedItems.push({
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
        price: product.price,
        subtotal: itemSubtotal
      });
    }

    // 4. Save order to database first (so we have reference for stock operations)
    const oStatus = status || 'Pending';
    const oDate = order_date || new Date().toISOString();
    const dDate = delivery_date || null;

    const ordResult = db.prepare(`
      INSERT INTO orders (order_number, customer_id, order_date, delivery_date, order_type, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(orderNumber, custId, oDate, dDate, order_type || 'Personal Gift', totalAmount, oStatus);

    const newOrderId = ordResult.lastInsertRowid;

    // Save order items
    const insItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const item of hydratedItems) {
      insItem.run(newOrderId, item.product_id, item.quantity, item.price, item.subtotal);
    }

    // 5. If order status is NOT Cancelled, perform pre-flight and deduct inventory
    if (oStatus !== 'Cancelled') {
      const stockRes = deductOrderStock(newOrderId, req.user ? req.user.name : 'Admin');
      if (!stockRes.success) {
        // Rollback: delete the order and items we just saved
        db.prepare('DELETE FROM order_items WHERE order_id = ?').run(newOrderId);
        db.prepare('DELETE FROM orders WHERE order_id = ?').run(newOrderId);
        return res.status(400).json({ error: stockRes.error, shortages: stockRes.shortages });
      }
    }

    createNotification(
      'New Order Created',
      `Order ${orderNumber} created for Customer #${custId}. Total: Rs. ${totalAmount.toFixed(2)}`,
      'info'
    );

    const createdOrder = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(newOrderId);

    return res.status(201).json({
      message: 'Order created successfully.',
      order: createdOrder,
      items: hydratedItems
    });

  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PATCH /api/orders/:id/status
const patchOrderStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const oldStatus = order.status;
    const newStatus = status;

    if (oldStatus === newStatus) {
      return res.status(200).json({ message: 'Status is already set to ' + newStatus, order });
    }

    const userName = req.user ? req.user.name : 'Admin';

    // Transitioning logic
    if (oldStatus !== 'Cancelled' && newStatus === 'Cancelled') {
      // Revert/restore stock
      restoreOrderStock(id, userName);
    } else if (oldStatus === 'Cancelled' && newStatus !== 'Cancelled') {
      // Deduct stock again
      const stockRes = deductOrderStock(id, userName);
      if (!stockRes.success) {
        return res.status(400).json({ error: stockRes.error, shortages: stockRes.shortages });
      }
    }

    db.prepare('UPDATE orders SET status = ? WHERE order_id = ?').run(newStatus, id);

    createNotification(
      'Order Status Updated',
      `Order ${order.order_number} status changed from "${oldStatus}" to "${newStatus}".`,
      'info'
    );

    const updated = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(id);

    return res.status(200).json({ message: 'Order status updated.', order: updated });
  } catch (err) {
    console.error('patchOrderStatus error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/orders/:id
const deleteOrder = (req, res) => {
  try {
    const { id } = req.params;

    const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const userName = req.user ? req.user.name : 'Admin';

    // If order was active (not Cancelled), restore stock first!
    if (order.status !== 'Cancelled') {
      restoreOrderStock(id, userName);
    }

    // Cascade deletes because of foreign keys constraints
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
    db.prepare('DELETE FROM orders WHERE order_id = ?').run(id);

    createNotification(
      'Order Deleted',
      `Order ${order.order_number} has been deleted. Stock was restored.`,
      'warning'
    );

    return res.status(200).json({ message: 'Order deleted successfully.' });
  } catch (err) {
    console.error('deleteOrder error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PUT /api/orders/:id
const updateOrder = (req, res) => {
  try {
    const { id } = req.params;
    const {
      delivery_date, order_type, status, items
    } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const oldStatus = order.status;
    const newStatus = status || oldStatus;
    const userName = req.user ? req.user.name : 'Admin';

    // 1. Store backup of original items in case we need to rollback
    const originalItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);

    // 2. Temporarily restore previous stock if old order was active
    if (oldStatus !== 'Cancelled') {
      restoreOrderStock(id, userName);
    }

    // Resolve items list to save
    let finalItems = items;
    if (!finalItems || !Array.isArray(finalItems) || finalItems.length === 0) {
      // Re-use original items if new ones are not provided
      finalItems = originalItems.map(oi => ({ product_id: oi.product_id, quantity: oi.quantity }));
    }

    // 3. Recalculate order total amount and validate product IDs
    let totalAmount = 0;
    const hydratedItems = [];

    for (const item of finalItems) {
      const product = db.prepare('SELECT price FROM products WHERE id = ?').get(item.product_id);
      if (!product) {
        // Rollback stock restoration
        if (oldStatus !== 'Cancelled') {
          deductOrderStock(id, userName);
        }
        return res.status(400).json({ error: `Product ID #${item.product_id} not found.` });
      }
      const itemSubtotal = product.price * parseInt(item.quantity);
      totalAmount += itemSubtotal;
      hydratedItems.push({
        product_id: item.product_id,
        quantity: parseInt(item.quantity),
        price: product.price,
        subtotal: itemSubtotal
      });
    }

    // 4. Update the order in the database and overwrite order items
    db.prepare(`
      UPDATE orders
      SET delivery_date = ?, order_type = ?, total_amount = ?, status = ?
      WHERE order_id = ?
    `).run(
      delivery_date !== undefined ? delivery_date : order.delivery_date,
      order_type || order.order_type,
      totalAmount,
      newStatus,
      id
    );

    // Replace order items
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
    const insItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const item of hydratedItems) {
      insItem.run(id, item.product_id, item.quantity, item.price, item.subtotal);
    }

    // 5. If new status is NOT Cancelled, perform pre-flight and deduct inventory
    if (newStatus !== 'Cancelled') {
      const stockRes = deductOrderStock(id, userName);
      if (!stockRes.success) {
        // ROLLBACK EVERYTHING!
        // A. Restore order header meta
        db.prepare(`
          UPDATE orders
          SET delivery_date = ?, order_type = ?, total_amount = ?, status = ?
          WHERE order_id = ?
        `).run(order.delivery_date, order.order_type, order.total_amount, oldStatus, id);

        // B. Restore order items table
        db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
        const insOriginalItem = db.prepare(`
          INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const oi of originalItems) {
          insOriginalItem.run(id, oi.product_id, oi.quantity, oi.price, oi.subtotal);
        }

        // C. Re-deduct original stock if order was active originally
        if (oldStatus !== 'Cancelled') {
          deductOrderStock(id, userName);
        }

        return res.status(400).json({ error: stockRes.error, shortages: stockRes.shortages });
      }
    }

    createNotification(
      'Order Updated',
      `Order ${order.order_number} details have been updated. Status: "${newStatus}".`,
      'info'
    );

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(id);

    return res.status(200).json({
      message: 'Order updated successfully.',
      order: updatedOrder
    });

  } catch (err) {
    console.error('updateOrder error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  patchOrderStatus,
  deleteOrder,
  updateOrder
};
