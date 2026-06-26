const db = require('../database');

// ── Helper: convert an array of objects to a CSV string ────────────────────────
function toCSV(rows, columns) {
  if (!rows || rows.length === 0) return columns.map(c => c.header).join(',') + '\n';

  const header = columns.map(c => `"${c.header}"`).join(',');
  const body = rows.map(row =>
    columns.map(c => {
      const val = row[c.key] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  return [header, ...body].join('\n');
}

// ── GET /api/reports/gift-articles ─────────────────────────────────────────────
const reportGiftArticles = (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT id, name, category, description, price, quantity, minimum_stock, status, created_at
      FROM products ORDER BY category, name
    `).all();

    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Name', key: 'name' },
      { header: 'Category', key: 'category' },
      { header: 'Description', key: 'description' },
      { header: 'Price (Rs)', key: 'price' },
      { header: 'Quantity', key: 'quantity' },
      { header: 'Minimum Stock', key: 'minimum_stock' },
      { header: 'Status', key: 'status' },
      { header: 'Created At', key: 'created_at' },
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="gift_articles.csv"');
    return res.send(toCSV(rows, columns));
  } catch (err) {
    console.error('reportGiftArticles error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── GET /api/reports/packaging-materials ───────────────────────────────────────
const reportPackagingMaterials = (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT m.id, m.name, m.type, m.quantity, m.unit, m.reorder_level, m.location, s.name AS supplier, m.created_at
      FROM materials m
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      ORDER BY m.type, m.name
    `).all();

    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Name', key: 'name' },
      { header: 'Type', key: 'type' },
      { header: 'Quantity', key: 'quantity' },
      { header: 'Unit', key: 'unit' },
      { header: 'Reorder Level', key: 'reorder_level' },
      { header: 'Location', key: 'location' },
      { header: 'Supplier', key: 'supplier' },
      { header: 'Created At', key: 'created_at' },
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="packaging_materials.csv"');
    return res.send(toCSV(rows, columns));
  } catch (err) {
    console.error('reportPackagingMaterials error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── GET /api/reports/low-stock ─────────────────────────────────────────────────
const reportLowStock = (req, res) => {
  try {
    const products = db.prepare(`
      SELECT id, name, category AS type_label, quantity, minimum_stock AS threshold, 'Gift Article' AS item_type,
             (minimum_stock - quantity + 10) AS suggested_purchase
      FROM products WHERE quantity <= minimum_stock ORDER BY quantity ASC
    `).all();

    const materials = db.prepare(`
      SELECT m.id, m.name, m.type AS type_label, m.quantity, m.reorder_level AS threshold, 'Packaging Material' AS item_type,
             (m.reorder_level - m.quantity + 10) AS suggested_purchase
      FROM materials m WHERE m.quantity <= m.reorder_level ORDER BY m.quantity ASC
    `).all();

    const rows = [...products, ...materials];

    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Name', key: 'name' },
      { header: 'Item Type', key: 'item_type' },
      { header: 'Category/Type', key: 'type_label' },
      { header: 'Current Quantity', key: 'quantity' },
      { header: 'Minimum Threshold', key: 'threshold' },
      { header: 'Suggested Purchase', key: 'suggested_purchase' },
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="low_stock_report.csv"');
    return res.send(toCSV(rows, columns));
  } catch (err) {
    console.error('reportLowStock error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── GET /api/reports/suppliers ─────────────────────────────────────────────────
const reportSuppliers = (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT s.id, s.name, s.phone, s.email, s.address, s.status,
             COUNT(m.id) AS materials_count,
             s.created_at
      FROM suppliers s
      LEFT JOIN materials m ON m.supplier_id = s.id
      GROUP BY s.id ORDER BY s.name
    `).all();

    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Name', key: 'name' },
      { header: 'Phone', key: 'phone' },
      { header: 'Email', key: 'email' },
      { header: 'Address', key: 'address' },
      { header: 'Status', key: 'status' },
      { header: 'Materials Count', key: 'materials_count' },
      { header: 'Created At', key: 'created_at' },
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="suppliers.csv"');
    return res.send(toCSV(rows, columns));
  } catch (err) {
    console.error('reportSuppliers error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── GET /api/reports/stock-movements ──────────────────────────────────────────
const reportStockMovements = (req, res) => {
  try {
    const { from, to, item_type, action } = req.query;
    let query = 'SELECT * FROM inventory_logs WHERE 1=1';
    const params = [];

    if (item_type) { query += ' AND item_type = ?'; params.push(item_type); }
    if (action)    { query += ' AND action = ?';    params.push(action); }
    if (from)      { query += ' AND date >= ?';     params.push(from); }
    if (to) {
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      query += ' AND date < ?';
      params.push(toDate.toISOString());
    }
    query += ' ORDER BY date DESC';

    const rows = db.prepare(query).all(...params);

    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Item Name', key: 'item_name' },
      { header: 'Item Type', key: 'item_type' },
      { header: 'Action', key: 'action' },
      { header: 'Quantity', key: 'quantity' },
      { header: 'Notes', key: 'notes' },
      { header: 'User', key: 'user' },
      { header: 'Date', key: 'date' },
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="stock_movements.csv"');
    return res.send(toCSV(rows, columns));
  } catch (err) {
    console.error('reportStockMovements error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── GET /api/reports/orders ────────────────────────────────────────────────────
const reportOrders = (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT o.order_number, c.customer_name, o.order_date, o.delivery_date, o.order_type, o.total_amount, o.status
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      ORDER BY o.order_date DESC
    `).all();

    const columns = [
      { header: 'Order Number', key: 'order_number' },
      { header: 'Customer Name', key: 'customer_name' },
      { header: 'Order Date', key: 'order_date' },
      { header: 'Delivery Date', key: 'delivery_date' },
      { header: 'Order Type', key: 'order_type' },
      { header: 'Total Amount (Rs)', key: 'total_amount' },
      { header: 'Status', key: 'status' },
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customer_orders.csv"');
    return res.send(toCSV(rows, columns));
  } catch (err) {
    console.error('reportOrders error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── GET /api/reports/order-status ──────────────────────────────────────────────
const reportOrderStatus = (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT status, COUNT(*) as count, SUM(total_amount) as total_value
      FROM orders
      GROUP BY status
    `).all();

    const columns = [
      { header: 'Status', key: 'status' },
      { header: 'Orders Count', key: 'count' },
      { header: 'Total Value (Rs)', key: 'total_value' },
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="order_status.csv"');
    return res.send(toCSV(rows, columns));
  } catch (err) {
    console.error('reportOrderStatus error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── GET /api/reports/order-history ─────────────────────────────────────────────
const reportOrderHistory = (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM inventory_logs
      WHERE notes LIKE '%Order%'
      ORDER BY date DESC
    `).all();

    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Item Name', key: 'item_name' },
      { header: 'Item Type', key: 'item_type' },
      { header: 'Action', key: 'action' },
      { header: 'Quantity', key: 'quantity' },
      { header: 'Notes', key: 'notes' },
      { header: 'User', key: 'user' },
      { header: 'Date', key: 'date' },
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="order_history.csv"');
    return res.send(toCSV(rows, columns));
  } catch (err) {
    console.error('reportOrderHistory error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── GET /api/reports/top-products ──────────────────────────────────────────────
const reportTopProducts = (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT p.name, p.category, SUM(oi.quantity) as total_ordered, SUM(oi.subtotal) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY oi.product_id
      ORDER BY total_ordered DESC
    `).all();

    const columns = [
      { header: 'Product Name', key: 'name' },
      { header: 'Category', key: 'category' },
      { header: 'Total Quantity Ordered', key: 'total_ordered' },
      { header: 'Total Revenue (Rs)', key: 'total_revenue' },
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="top_ordered_products.csv"');
    return res.send(toCSV(rows, columns));
  } catch (err) {
    console.error('reportTopProducts error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── GET /api/reports/material-consumption ──────────────────────────────────────
const reportMaterialConsumption = (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT m.name as material_name, m.type as material_type, SUM(pm.quantity_required * oi.quantity) as total_consumed, m.unit
      FROM order_items oi
      JOIN product_materials pm ON oi.product_id = pm.product_id
      JOIN materials m ON pm.material_id = m.id
      GROUP BY pm.material_id
      ORDER BY total_consumed DESC
    `).all();

    const columns = [
      { header: 'Material Name', key: 'material_name' },
      { header: 'Material Type', key: 'material_type' },
      { header: 'Total Quantity Consumed', key: 'total_consumed' },
      { header: 'Unit', key: 'unit' },
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="material_consumption.csv"');
    return res.send(toCSV(rows, columns));
  } catch (err) {
    console.error('reportMaterialConsumption error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ── GET /api/reports/summary ── JSON data used by frontend to build PDF ────────
const reportSummaryJSON = (req, res) => {
  try {
    const totalProducts    = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
    const totalMaterials   = db.prepare('SELECT COUNT(*) as c FROM materials').get().c;
    const totalSuppliers   = db.prepare('SELECT COUNT(*) as c FROM suppliers').get().c;
    const lowStockProducts = db.prepare('SELECT COUNT(*) as c FROM products WHERE quantity <= minimum_stock').get().c;
    const lowStockMaterials= db.prepare('SELECT COUNT(*) as c FROM materials WHERE quantity <= reorder_level').get().c;

    const products = db.prepare('SELECT id,name,category,quantity,minimum_stock,status FROM products ORDER BY category,name').all();
    const materials = db.prepare(`
      SELECT m.id,m.name,m.type,m.quantity,m.unit,m.reorder_level,s.name as supplier
      FROM materials m LEFT JOIN suppliers s ON m.supplier_id=s.id ORDER BY m.type,m.name
    `).all();
    const suppliers = db.prepare(`
      SELECT s.*,COUNT(m.id) as materials_count FROM suppliers s LEFT JOIN materials m ON m.supplier_id=s.id GROUP BY s.id ORDER BY s.name
    `).all();
    const lowStockItems = db.prepare(`
      SELECT name,'Gift Article' as item_type,quantity,minimum_stock as threshold, (minimum_stock - quantity + 10) as suggested FROM products WHERE quantity<=minimum_stock
      UNION ALL
      SELECT name,'Material' as item_type,quantity,reorder_level as threshold, (reorder_level - quantity + 10) as suggested FROM materials WHERE quantity<=reorder_level
      ORDER BY quantity
    `).all();
    const recentMovements = db.prepare('SELECT * FROM inventory_logs ORDER BY date DESC LIMIT 50').all();

    // Customer Orders Reports JSON Data
    const orders = db.prepare(`
      SELECT o.*, c.customer_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      ORDER BY o.order_date DESC
    `).all();

    const orderStatus = db.prepare(`
      SELECT status, COUNT(*) as count, SUM(total_amount) as total_value
      FROM orders
      GROUP BY status
    `).all();

    const orderHistory = db.prepare(`
      SELECT * FROM inventory_logs
      WHERE notes LIKE '%Order%'
      ORDER BY date DESC LIMIT 50
    `).all();

    const topProducts = db.prepare(`
      SELECT p.name, p.category, SUM(oi.quantity) as total_ordered, SUM(oi.subtotal) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY oi.product_id
      ORDER BY total_ordered DESC LIMIT 20
    `).all();

    const materialConsumption = db.prepare(`
      SELECT m.name as material_name, m.type as material_type, SUM(pm.quantity_required * oi.quantity) as total_consumed, m.unit
      FROM order_items oi
      JOIN product_materials pm ON oi.product_id = pm.product_id
      JOIN materials m ON pm.material_id = m.id
      GROUP BY pm.material_id
      ORDER BY total_consumed DESC LIMIT 20
    `).all();

    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      summary: { totalProducts, totalMaterials, totalSuppliers, lowStockProducts, lowStockMaterials },
      products,
      materials,
      suppliers,
      lowStockItems,
      recentMovements,
      orders,
      orderStatus,
      orderHistory,
      topProducts,
      materialConsumption
    });
  } catch (err) {
    console.error('reportSummaryJSON error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  reportGiftArticles,
  reportPackagingMaterials,
  reportLowStock,
  reportSuppliers,
  reportStockMovements,
  reportOrders,
  reportOrderStatus,
  reportOrderHistory,
  reportTopProducts,
  reportMaterialConsumption,
  reportSummaryJSON,
};
