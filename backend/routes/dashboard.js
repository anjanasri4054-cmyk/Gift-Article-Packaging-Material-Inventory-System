const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, (req, res) => {
  try {
    const totalProducts = db.find('products').length;
    const totalMaterials = db.find('materials').length;
    
    const suppliers = db.find('suppliers');
    const totalSuppliers = suppliers.filter(s => s.status === 'active').length;

    const materials = db.find('materials');
    const lowStockMaterials = materials.filter(m => m.currentStock <= m.minimumStock).length;
    const lowStockItems = lowStockMaterials;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayMovements = db.find('stockMovements', m => m.date.startsWith(todayStr)).length;

    const unreadNotifications = db.find('notifications', n => n.readStatus === 'unread').length;

    const orders = db.find('orders');
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const completedOrders = orders.filter(o => o.status === 'Completed').length;
    const todayOrders = orders.filter(o => o.orderDate.startsWith(todayStr)).length;

    res.json({
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
    res.status(500).json({ error: 'Failed to aggregate KPI stats', details: err.message });
  }
});

// GET /api/dashboard/low-stock
router.get('/low-stock', authMiddleware, (req, res) => {
  try {
    const materials = db.find('materials', m => m.currentStock <= m.minimumStock);
    const suppliers = db.find('suppliers');

    const result = materials.map(m => {
      const supplier = suppliers.find(s => s.id === m.supplierId);
      return {
        id: m.id,
        name: m.name,
        type: 'material',
        quantity: m.currentStock,
        reorder_level: m.minimumStock,
        supplier_name: supplier ? supplier.name : 'Unknown Supplier'
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch low-stock list', details: err.message });
  }
});

// GET /api/dashboard/recent-activity
router.get('/recent-activity', authMiddleware, (req, res) => {
  try {
    const movements = db.find('stockMovements');
    const materials = db.find('materials');

    const recentLogs = movements.map(m => {
      const material = materials.find(mat => mat.id === m.materialId);
      return {
        id: m.id,
        item_name: material ? material.name : 'Unknown Material',
        action: m.type,
        quantity: m.quantity,
        user: 'Admin',
        notes: m.purpose,
        date: m.date
      };
    });

    // Sort by date DESC and limit to 10
    recentLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    const logs = recentLogs.slice(0, 10);

    const orders = db.find('orders');
    const customers = db.find('customers');
    const recentOrders = orders.map(o => {
      const customer = customers.find(c => c.id === o.customerId);
      return {
        ...o,
        customer_name: customer ? customer.name : 'Unknown Customer'
      };
    });
    recentOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    const ordersResult = recentOrders.slice(0, 5);

    res.json({
      logs,
      orders: ordersResult
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent activities', details: err.message });
  }
});

// GET /api/dashboard/chart-data
router.get('/chart-data', authMiddleware, (req, res) => {
  try {
    // ── 1. Distribution by product category
    const products = db.find('products');
    const categoriesMap = {};
    products.forEach(p => {
      categoriesMap[p.type] = (categoriesMap[p.type] || 0) + 1;
    });

    const inventoryDistribution = {
      labels: Object.keys(categoriesMap),
      values: Object.values(categoriesMap)
    };

    // ── 2. Distribution by material unit/type
    const materials = db.find('materials');
    const materialMap = {};
    materials.forEach(m => {
      const type = m.unit; // split by unit or custom packaging types
      materialMap[type] = (materialMap[type] || 0) + 1;
    });

    const materialDistribution = {
      labels: Object.keys(materialMap),
      data: Object.values(materialMap)
    };

    // ── 3. Monthly movements (Last 6 Months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthLabels = [];
    const stockInData = [];
    const stockOutData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const label = `${monthNames[monthIndex]} ${year}`;
      monthLabels.push(label);

      const movements = db.find('stockMovements', m => {
        const moveDate = new Date(m.date);
        return moveDate.getFullYear() === year && moveDate.getMonth() === monthIndex;
      });

      const stockInCount = movements.filter(m => m.type === 'Stock In').length;
      const stockOutCount = movements.filter(m => m.type === 'Stock Out').length;

      stockInData.push(stockInCount);
      stockOutData.push(stockOutCount);
    }

    const monthlyMovements = {
      labels: monthLabels,
      stockIn: stockInData,
      stockOut: stockOutData
    };

    res.json({
      inventoryDistribution,
      materialDistribution,
      monthlyMovements
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate chart statistics', details: err.message });
  }
});

// POST /api/dashboard/reset
router.post('/reset', authMiddleware, (req, res) => {
  try {
    db.initialize();
    res.json({ message: 'Database reset and re-seeded successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset database', details: err.message });
  }
});

module.exports = router;
