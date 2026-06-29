const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/authMiddleware');

// All reports are protected by authMiddleware
router.use(authMiddleware);

// Helper: convert an array of objects to a CSV string
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

// GET /api/reports/gift-articles
router.get('/gift-articles', (req, res) => {
  try {
    const products = db.find('products');
    const rows = products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.type,
      description: p.description,
      price: p.price,
      status: 'active'
    }));

    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Name', key: 'name' },
      { header: 'Category', key: 'category' },
      { header: 'Description', key: 'description' },
      { header: 'Price (Rs)', key: 'price' },
      { header: 'Status', key: 'status' }
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="gift_articles.csv"');
    res.send(toCSV(rows, columns));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate gift articles report', details: err.message });
  }
});

// GET /api/reports/packaging-materials
router.get('/packaging-materials', (req, res) => {
  try {
    const materials = db.find('materials');
    const suppliers = db.find('suppliers');
    
    const rows = materials.map(m => {
      const s = suppliers.find(sup => sup.id === m.supplierId);
      return {
        id: m.id,
        name: m.name,
        type: m.unit, // Category unit
        quantity: m.currentStock,
        unit: m.unit,
        reorder_level: m.minimumStock,
        location: m.location,
        supplierName: s ? s.name : 'Unknown'
      };
    });

    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Name', key: 'name' },
      { header: 'Type/Unit', key: 'type' },
      { header: 'Current Stock', key: 'quantity' },
      { header: 'Unit', key: 'unit' },
      { header: 'Minimum Stock', key: 'reorder_level' },
      { header: 'Storage Location', key: 'location' },
      { header: 'Supplier', key: 'supplierName' }
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="packaging_materials.csv"');
    res.send(toCSV(rows, columns));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate materials report', details: err.message });
  }
});

// GET /api/reports/low-stock
router.get('/low-stock', (req, res) => {
  try {
    const materials = db.find('materials', m => m.currentStock <= m.minimumStock);
    
    const rows = materials.map(m => ({
      id: m.id,
      name: m.name,
      item_type: 'Packaging Material',
      type_label: m.unit,
      quantity: m.currentStock,
      threshold: m.minimumStock,
      suggested_purchase: Math.max(0, m.minimumStock - m.currentStock + 10)
    }));

    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Name', key: 'name' },
      { header: 'Item Type', key: 'item_type' },
      { header: 'Category/Type', key: 'type_label' },
      { header: 'Current Quantity', key: 'quantity' },
      { header: 'Minimum Threshold', key: 'threshold' },
      { header: 'Suggested Purchase', key: 'suggested_purchase' }
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="low_stock_report.csv"');
    res.send(toCSV(rows, columns));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate low stock report', details: err.message });
  }
});

// GET /api/reports/suppliers
router.get('/suppliers', (req, res) => {
  try {
    const suppliers = db.find('suppliers');
    const materials = db.find('materials');

    const rows = suppliers.map(s => {
      const materialsCount = materials.filter(m => m.supplierId === s.id).length;
      return {
        id: s.id,
        name: s.name,
        phone: s.phone,
        email: s.email,
        gst: s.gst,
        address: s.address,
        status: s.status,
        materials_count: materialsCount
      };
    });

    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Name', key: 'name' },
      { header: 'Phone', key: 'phone' },
      { header: 'Email', key: 'email' },
      { header: 'GSTIN', key: 'gst' },
      { header: 'Address', key: 'address' },
      { header: 'Status', key: 'status' },
      { header: 'Materials Supplied', key: 'materials_count' }
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="suppliers.csv"');
    res.send(toCSV(rows, columns));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate suppliers report', details: err.message });
  }
});

// GET /api/reports/stock-movements
router.get('/stock-movements', (req, res) => {
  try {
    const { from, to, type } = req.query;
    let movements = db.find('stockMovements');
    const materials = db.find('materials');

    if (type && type !== 'All') {
      movements = movements.filter(m => m.type === type);
    }
    if (from) {
      movements = movements.filter(m => new Date(m.date) >= new Date(from));
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setDate(toDate.getDate() + 1);
      movements = movements.filter(m => new Date(m.date) < toDate);
    }

    const rows = movements.map(m => {
      const material = materials.find(mat => mat.id === m.materialId);
      return {
        id: m.id,
        materialName: material ? material.name : 'Unknown Material',
        type: m.type,
        quantity: m.quantity,
        purpose: m.purpose,
        date: m.date
      };
    });

    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Material Name', key: 'materialName' },
      { header: 'Action Type', key: 'type' },
      { header: 'Quantity', key: 'quantity' },
      { header: 'Purpose/Notes', key: 'purpose' },
      { header: 'Date', key: 'date' }
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="stock_movements.csv"');
    res.send(toCSV(rows, columns));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate stock movements report', details: err.message });
  }
});

// GET /api/reports/orders
router.get('/orders', (req, res) => {
  try {
    const orders = db.find('orders');
    const customers = db.find('customers');

    const rows = orders.map(o => {
      const customer = customers.find(c => c.id === o.customerId);
      return {
        orderNumber: o.orderNumber,
        customerName: customer ? customer.name : 'Unknown',
        orderDate: o.orderDate,
        deliveryDate: o.deliveryDate,
        totalPrice: o.totalPrice,
        status: o.status
      };
    });

    const columns = [
      { header: 'Order Number', key: 'orderNumber' },
      { header: 'Customer Name', key: 'customerName' },
      { header: 'Order Date', key: 'orderDate' },
      { header: 'Delivery Date', key: 'deliveryDate' },
      { header: 'Total Value (Rs)', key: 'totalPrice' },
      { header: 'Status', key: 'status' }
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="customer_orders.csv"');
    res.send(toCSV(rows, columns));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate orders report', details: err.message });
  }
});

// GET /api/reports/order-status
router.get('/order-status', (req, res) => {
  try {
    const orders = db.find('orders');
    const statusCounts = {};
    orders.forEach(o => {
      if (!statusCounts[o.status]) {
        statusCounts[o.status] = { status: o.status, count: 0, totalPrice: 0 };
      }
      statusCounts[o.status].count += 1;
      statusCounts[o.status].totalPrice += o.totalPrice;
    });

    const rows = Object.values(statusCounts);
    const columns = [
      { header: 'Status', key: 'status' },
      { header: 'Orders Count', key: 'count' },
      { header: 'Total Value (Rs)', key: 'totalPrice' }
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="order_status.csv"');
    res.send(toCSV(rows, columns));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate order status report', details: err.message });
  }
});

// GET /api/reports/order-history
router.get('/order-history', (req, res) => {
  try {
    const movements = db.find('stockMovements', m => m.purpose.includes('Order'));
    const materials = db.find('materials');

    const rows = movements.map(m => {
      const mat = materials.find(material => material.id === m.materialId);
      return {
        id: m.id,
        materialName: mat ? mat.name : 'Unknown Material',
        type: m.type,
        quantity: m.quantity,
        purpose: m.purpose,
        date: m.date
      };
    });

    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Material Name', key: 'materialName' },
      { header: 'Action', key: 'type' },
      { header: 'Quantity', key: 'quantity' },
      { header: 'Notes', key: 'purpose' },
      { header: 'Date', key: 'date' }
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="order_history.csv"');
    res.send(toCSV(rows, columns));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate order history report', details: err.message });
  }
});

// GET /api/reports/top-products
router.get('/top-products', (req, res) => {
  try {
    const orderItems = db.find('orderItems');
    const products = db.find('products');
    const topMap = {};

    orderItems.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        if (!topMap[p.id]) {
          topMap[p.id] = { name: p.name, category: p.type, total_ordered: 0, total_revenue: 0 };
        }
        topMap[p.id].total_ordered += item.quantity;
        topMap[p.id].total_revenue += (item.quantity * item.price);
      }
    });

    const rows = Object.values(topMap).sort((a, b) => b.total_ordered - a.total_ordered);
    const columns = [
      { header: 'Product Name', key: 'name' },
      { header: 'Category', key: 'category' },
      { header: 'Total Quantity Ordered', key: 'total_ordered' },
      { header: 'Total Revenue (Rs)', key: 'total_revenue' }
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="top_ordered_products.csv"');
    res.send(toCSV(rows, columns));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate top products report', details: err.message });
  }
});

// GET /api/reports/material-consumption
router.get('/material-consumption', (req, res) => {
  try {
    const orderItems = db.find('orderItems');
    const mappings = db.find('productMaterialMapping');
    const materials = db.find('materials');
    const consumptionMap = {};

    orderItems.forEach(item => {
      const prodMappings = mappings.filter(m => m.productId === item.productId);
      prodMappings.forEach(map => {
        const material = materials.find(mat => mat.id === map.materialId);
        if (material) {
          if (!consumptionMap[material.id]) {
            consumptionMap[material.id] = { material_name: material.name, material_type: material.unit, total_consumed: 0, unit: material.unit };
          }
          consumptionMap[material.id].total_consumed += (map.quantityNeeded * item.quantity);
        }
      });
    });

    const rows = Object.values(consumptionMap).sort((a, b) => b.total_consumed - a.total_consumed);
    const columns = [
      { header: 'Material Name', key: 'material_name' },
      { header: 'Type/Unit', key: 'material_type' },
      { header: 'Total Quantity Consumed', key: 'total_consumed' },
      { header: 'Unit', key: 'unit' }
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="material_consumption.csv"');
    res.send(toCSV(rows, columns));
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate material consumption report', details: err.message });
  }
});

// GET /api/reports/summary (JSON summaries for PDF generators)
router.get('/summary', (req, res) => {
  try {
    const products = db.find('products');
    const materials = db.find('materials');
    const suppliers = db.find('suppliers');
    const orders = db.find('orders');
    const customers = db.find('customers');
    const movements = db.find('stockMovements');

    const totalProducts = products.length;
    const totalMaterials = materials.length;
    const totalSuppliers = suppliers.filter(s => s.status === 'active').length;
    const lowStockProducts = 0; // JSON relational has only lowStockMaterials
    const lowStockMaterials = materials.filter(m => m.currentStock <= m.minimumStock).length;

    // Joined Products List
    const productsData = products.map(p => ({
      id: p.id,
      name: p.name,
      category: p.type,
      quantity: 0, // Placeholder
      minimum_stock: 0,
      status: 'active'
    }));

    // Joined Materials List
    const materialsData = materials.map(m => {
      const s = suppliers.find(sup => sup.id === m.supplierId);
      return {
        id: m.id,
        name: m.name,
        type: m.unit,
        quantity: m.currentStock,
        unit: m.unit,
        reorder_level: m.minimumStock,
        supplier: s ? s.name : 'Unknown'
      };
    });

    // Joined Suppliers List
    const suppliersData = suppliers.map(s => {
      const count = materials.filter(m => m.supplierId === s.id).length;
      return {
        ...s,
        materials_count: count
      };
    });

    // Joined Low Stock List
    const lowStockItems = materials.filter(m => m.currentStock <= m.minimumStock).map(m => ({
      name: m.name,
      item_type: 'Material',
      quantity: m.currentStock,
      threshold: m.minimumStock,
      suggested: Math.max(0, m.minimumStock - m.currentStock + 10)
    }));

    // Joined Recent Movements
    movements.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentMovements = movements.slice(0, 50).map(m => {
      const mat = materials.find(material => material.id === m.materialId);
      return {
        id: m.id,
        item_name: mat ? mat.name : 'Unknown Material',
        item_type: 'material',
        action: m.type,
        quantity: m.quantity,
        notes: m.purpose,
        user: 'Admin',
        date: m.date
      };
    });

    // Joined Orders List
    const ordersData = orders.map(o => {
      const customer = customers.find(c => c.id === o.customerId);
      return {
        ...o,
        customer_name: customer ? customer.name : 'Unknown Customer'
      };
    });

    // Status distributions
    const statusMap = {};
    orders.forEach(o => {
      if (!statusMap[o.status]) {
        statusMap[o.status] = { status: o.status, count: 0, total_value: 0 };
      }
      statusMap[o.status].count += 1;
      statusMap[o.status].total_value += o.totalPrice;
    });
    const orderStatus = Object.values(statusMap);

    // Order History Logs
    const orderHistory = recentMovements.filter(m => m.notes.includes('Order')).slice(0, 50);

    // Top Products
    const topMap = {};
    const orderItems = db.find('orderItems');
    orderItems.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        if (!topMap[p.id]) {
          topMap[p.id] = { name: p.name, category: p.type, total_ordered: 0, total_revenue: 0 };
        }
        topMap[p.id].total_ordered += item.quantity;
        topMap[p.id].total_revenue += (item.quantity * item.price);
      }
    });
    const topProducts = Object.values(topMap).sort((a, b) => b.total_ordered - a.total_ordered).slice(0, 20);

    // Material Consumption
    const mappings = db.find('productMaterialMapping');
    const consumptionMap = {};
    orderItems.forEach(item => {
      const prodMappings = mappings.filter(m => m.productId === item.productId);
      prodMappings.forEach(map => {
        const material = materials.find(mat => mat.id === map.materialId);
        if (material) {
          if (!consumptionMap[material.id]) {
            consumptionMap[material.id] = { material_name: material.name, material_type: material.unit, total_consumed: 0, unit: material.unit };
          }
          consumptionMap[material.id].total_consumed += (map.quantityNeeded * item.quantity);
        }
      });
    });
    const materialConsumption = Object.values(consumptionMap).sort((a, b) => b.total_consumed - a.total_consumed).slice(0, 20);

    res.json({
      generatedAt: new Date().toISOString(),
      summary: { totalProducts, totalMaterials, totalSuppliers, lowStockProducts, lowStockMaterials },
      products: productsData,
      materials: materialsData,
      suppliers: suppliersData,
      lowStockItems,
      recentMovements,
      orders: ordersData,
      orderStatus,
      orderHistory,
      topProducts,
      materialConsumption
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report summary', details: err.message });
  }
});

module.exports = router;
