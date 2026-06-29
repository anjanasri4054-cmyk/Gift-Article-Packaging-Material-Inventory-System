const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/orders
router.get('/', (req, res) => {
  try {
    const orders = db.find('orders');
    const customers = db.find('customers');

    const result = orders.map(o => {
      const customer = customers.find(c => c.id === o.customerId);
      return {
        ...o,
        customerName: customer ? customer.name : 'Unknown Customer'
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  try {
    const order = db.findById('orders', req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const customer = db.findById('customers', order.customerId);
    const orderItems = db.find('orderItems', item => item.orderId === order.id);
    const products = db.find('products');

    const itemsWithDetails = orderItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...item,
        productName: product ? product.name : 'Unknown Product',
        productType: product ? product.type : ''
      };
    });

    res.json({
      ...order,
      customerName: customer ? customer.name : 'Unknown Customer',
      customerPhone: customer ? customer.phone : '',
      customerAddress: customer ? customer.address : '',
      items: itemsWithDetails
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order details', details: err.message });
  }
});

// POST /api/orders/calculate-materials (Auto Calculator API)
router.post('/calculate-materials', (req, res) => {
  try {
    const { items } = req.body; // Array of { productId, quantity }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ materialsNeeded: [], status: 'valid' });
    }

    const mappings = db.find('productMaterialMapping');
    const materials = db.find('materials');

    // Aggregate material requirements
    const requirements = {}; // materialId -> quantityNeeded

    items.forEach(item => {
      const productMappings = mappings.filter(m => m.productId === Number(item.productId));
      productMappings.forEach(map => {
        const totalQty = map.quantityNeeded * Number(item.quantity);
        if (!requirements[map.materialId]) {
          requirements[map.materialId] = 0;
        }
        requirements[map.materialId] += totalQty;
      });
    });

    // Match with current stock and calculate shortfalls
    const materialsNeeded = [];
    let hasShortage = false;

    Object.keys(requirements).forEach(matIdStr => {
      const matId = Number(matIdStr);
      const material = materials.find(m => m.id === matId);
      if (material) {
        const needed = requirements[matId];
        const stock = material.currentStock;
        const shortage = Math.max(0, needed - stock);
        if (shortage > 0) hasShortage = true;

        materialsNeeded.push({
          materialId: matId,
          name: material.name,
          unit: material.unit,
          currentStock: stock,
          quantityNeeded: needed,
          shortage,
          location: material.location,
          status: shortage > 0 ? 'shortage' : 'instock'
        });
      }
    });

    res.json({
      materialsNeeded,
      hasShortage,
      status: hasShortage ? 'shortage' : 'valid'
    });
  } catch (err) {
    res.status(500).json({ error: 'Auto material calculation failed', details: err.message });
  }
});

// POST /api/orders (Create Order)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { customerId, orderDate, deliveryDate, totalPrice, items } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'CustomerId and a list of order items are required' });
    }

    // Insert order record
    const nextId = db.find('orders').reduce((max, r) => r.id > max ? r.id : max, 0) + 1;
    const orderNumber = `ORD-${1000 + nextId}`;

    const newOrder = db.insert('orders', {
      orderNumber,
      customerId: Number(customerId),
      orderDate: orderDate || new Date().toISOString(),
      deliveryDate: deliveryDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      totalPrice: parseFloat(totalPrice || 0),
      status: 'Pending'
    });

    // Insert order items
    items.forEach(item => {
      db.insert('orderItems', {
        orderId: newOrder.id,
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        price: parseFloat(item.price || 0)
      });
    });

    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order', details: err.message });
  }
});

// PUT /api/orders/:id/status (Transition Order Status & Deduct Stock)
router.put('/:id/status', authMiddleware, (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const existingOrder = db.findById('orders', orderId);
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const oldStatus = existingOrder.status;

    // Deduct stock if transitioning to In Production
    if (status === 'In Production' && oldStatus !== 'In Production') {
      const orderItems = db.find('orderItems', item => item.orderId === orderId);
      const mappings = db.find('productMaterialMapping');
      const materials = db.find('materials');

      // Verify availability first
      let hasStockShortage = false;
      const requirements = {};

      orderItems.forEach(item => {
        const productMappings = mappings.filter(m => m.productId === item.productId);
        productMappings.forEach(map => {
          const totalQty = map.quantityNeeded * item.quantity;
          if (!requirements[map.materialId]) {
            requirements[map.materialId] = 0;
          }
          requirements[map.materialId] += totalQty;
        });
      });

      // Deduct materials and log stock movement
      Object.keys(requirements).forEach(matIdStr => {
        const matId = Number(matIdStr);
        const material = materials.find(m => m.id === matId);
        if (material) {
          const qtyToDeduct = requirements[matId];
          const newStock = Math.max(0, material.currentStock - qtyToDeduct);

          // Update stock level
          db.update('materials', matId, { currentStock: newStock });

          // Log stock movement
          db.insert('stockMovements', {
            materialId: matId,
            type: 'Stock Out',
            quantity: qtyToDeduct,
            purpose: `Order ${existingOrder.orderNumber} Production`,
            referenceId: orderId,
            date: new Date().toISOString()
          });

          // Create notification if stock hits warning threshold
          if (newStock <= material.minimumStock) {
            db.insert('notifications', {
              message: `Low Stock Warning: ${material.name} dropped to ${newStock} ${material.unit} during production of ${existingOrder.orderNumber}.`,
              type: 'warning',
              date: new Date().toISOString(),
              readStatus: 'unread'
            });
          }
        }
      });
    }

    // Update order status
    const updatedOrder = db.update('orders', orderId, { status });
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status', details: err.message });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const existing = db.findById('orders', orderId);
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Delete order items first
    const items = db.find('orderItems', item => item.orderId === orderId);
    items.forEach(item => db.delete('orderItems', item.id));

    db.delete('orders', orderId);
    res.json({ message: 'Order and associated items deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete order', details: err.message });
  }
});

module.exports = router;
