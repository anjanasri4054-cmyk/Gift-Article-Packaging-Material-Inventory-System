const db = require('../database');

// GET /api/dashboard/stats
const getStats = (req, res) => {
  try {
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const totalMaterials = db.prepare('SELECT COUNT(*) as count FROM materials').get().count;
    const totalSuppliers = db.prepare("SELECT COUNT(*) as count FROM suppliers WHERE status = 'active'").get().count;

    const lowStockProducts = db.prepare(
      'SELECT COUNT(*) as count FROM products WHERE quantity <= minimum_stock'
    ).get().count;
    const lowStockMaterials = db.prepare(
      'SELECT COUNT(*) as count FROM materials WHERE quantity <= reorder_level'
    ).get().count;
    const lowStockItems = lowStockProducts + lowStockMaterials;

    const today = new Date().toISOString().split('T')[0];
    const todayMovements = db.prepare(
      `SELECT COUNT(*) as count FROM inventory_logs WHERE date(date) = ?`
    ).get(today).count;

    const unreadNotifications = db.prepare(
      "SELECT COUNT(*) as count FROM notifications WHERE status = 'unread'"
    ).get().count;

    // Customer order stats
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'Pending'").get().count;
    const completedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'Completed'").get().count;
    const todayOrders = db.prepare(
      `SELECT COUNT(*) as count FROM orders WHERE date(order_date) = ?`
    ).get(today).count;

    return res.status(200).json({
      totalProducts,
      totalMaterials,
      totalSuppliers,
      lowStockItems,
      todayMovements,
      unreadNotifications,
      totalOrders,
      pendingOrders,
      completedOrders,
      todayOrders
    });
  } catch (err) {
    console.error('getStats error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/dashboard/low-stock
const getLowStock = (req, res) => {
  try {
    const products = db.prepare(
      'SELECT * FROM products WHERE quantity <= minimum_stock ORDER BY quantity ASC'
    ).all();

    const materials = db.prepare(
      `SELECT m.*, s.name AS supplier_name
       FROM materials m
       LEFT JOIN suppliers s ON m.supplier_id = s.id
       WHERE m.quantity <= m.reorder_level
       ORDER BY m.quantity ASC`
    ).all();

    return res.status(200).json({ products, materials });
  } catch (err) {
    console.error('getLowStock error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/dashboard/recent-activity
const getRecentActivity = (req, res) => {
  try {
    const logs = db.prepare(
      'SELECT * FROM inventory_logs ORDER BY date DESC LIMIT 10'
    ).all();

    const orders = db.prepare(
      `SELECT o.*, c.customer_name
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       ORDER BY o.order_date DESC LIMIT 5`
    ).all();

    return res.status(200).json({ logs, orders });
  } catch (err) {
    console.error('getRecentActivity error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/dashboard/chart-data
const getChartData = (req, res) => {
  try {
    // ── Inventory distribution by product category ──────────────────────────
    const categoryRows = db.prepare(
      `SELECT category AS label, COUNT(*) AS value
       FROM products
       GROUP BY category
       ORDER BY value DESC`
    ).all();

    const inventoryDistribution = {
      labels: categoryRows.map(r => r.label),
      data: categoryRows.map(r => r.value)
    };

    // ── Material distribution by type ───────────────────────────────────────
    const typeRows = db.prepare(
      `SELECT type AS label, COUNT(*) AS value
       FROM materials
       GROUP BY type
       ORDER BY value DESC`
    ).all();

    const materialDistribution = {
      labels: typeRows.map(r => r.label),
      data: typeRows.map(r => r.value)
    };

    // ── Monthly movements – last 6 months ───────────────────────────────────
    const monthLabels = [];
    const stockInData = [];
    const stockOutData = [];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-based
      const monthPadded = String(month).padStart(2, '0');
      const label = `${monthNames[month - 1]} ${year}`;
      monthLabels.push(label);

      const stockInCount = db.prepare(
        `SELECT COUNT(*) as count FROM inventory_logs
         WHERE action = 'Stock In'
           AND strftime('%Y', date) = ?
           AND strftime('%m', date) = ?`
      ).get(String(year), monthPadded).count;

      const stockOutCount = db.prepare(
        `SELECT COUNT(*) as count FROM inventory_logs
         WHERE action = 'Stock Out'
           AND strftime('%Y', date) = ?
           AND strftime('%m', date) = ?`
      ).get(String(year), monthPadded).count;

      stockInData.push(stockInCount);
      stockOutData.push(stockOutCount);
    }

    const monthlyMovements = {
      labels: monthLabels,
      stockIn: stockInData,
      stockOut: stockOutData
    };

    return res.status(200).json({
      inventoryDistribution,
      materialDistribution,
      monthlyMovements
    });
  } catch (err) {
    console.error('getChartData error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getStats, getLowStock, getRecentActivity, getChartData };
