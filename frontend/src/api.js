const SEED_DATA = {
  "admins": [
    {
      "id": 1,
      "username": "Admin",
      "email": "admin@paperplane.com",
      "password": "admin123",
      "role": "administrator"
    }
  ],
  "customers": [
    {
      "id": 1,
      "name": "Rahul Sharma",
      "phone": "98765-43210",
      "email": "rahul@gmail.com",
      "address": "12A Mall Road, Civil Lines, Delhi"
    },
    {
      "id": 2,
      "name": "Saira Khan",
      "phone": "98123-45678",
      "email": "saira.khan@yahoo.com",
      "address": "Flat 503, Sector 15, Vashi, Navi Mumbai"
    },
    {
      "id": 3,
      "name": "Corporate Gifting Ltd",
      "phone": "99888-77766",
      "email": "orders@corporategifts.com",
      "address": "Sector 5, Salt Lake, Kolkata"
    }
  ],
  "products": [
    {
      "id": 1,
      "name": "Wooden Photo Frame 5x7",
      "type": "Photo Frames",
      "price": 450,
      "description": "Premium wooden frame with glass cover, 5x7 inches",
      "imageUrl": ""
    },
    {
      "id": 2,
      "name": "Ceramic Coffee Mug",
      "type": "Mugs",
      "price": 220,
      "description": "Glossy white ceramic mug 330ml, ideal for gifting",
      "imageUrl": ""
    },
    {
      "id": 3,
      "name": "Velvet Cushion Cover",
      "type": "Cushions",
      "price": 380,
      "description": "Soft velvet cushion cover 16x16 inches, multiple colors",
      "imageUrl": ""
    },
    {
      "id": 4,
      "name": "Glass Vase Medium",
      "type": "Customized Gifts",
      "price": 560,
      "description": "Elegant clear glass vase 20cm tall",
      "imageUrl": ""
    },
    {
      "id": 5,
      "name": "Scented Candle Set",
      "type": "Hampers",
      "price": 650,
      "description": "Set of 3 scented candles – lavender, vanilla, jasmine",
      "imageUrl": ""
    }
  ],
  "materials": [
    {
      "id": 1,
      "name": "Satin Ribbon 1 inch",
      "currentStock": 200,
      "minimumStock": 30,
      "supplierId": 1,
      "location": "Shelf A1",
      "unit": "Meters",
      "pricePerUnit": 15
    },
    {
      "id": 2,
      "name": "Corrugated Gift Box 12x12",
      "currentStock": 3,
      "minimumStock": 50,
      "supplierId": 2,
      "location": "Rack B2",
      "unit": "Pieces",
      "pricePerUnit": 45
    },
    {
      "id": 3,
      "name": "Tissue Wrapping Paper",
      "currentStock": 500,
      "minimumStock": 100,
      "supplierId": 3,
      "location": "Shelf C1",
      "unit": "Sheets",
      "pricePerUnit": 5
    },
    {
      "id": 4,
      "name": "Bow Decoration Large",
      "currentStock": 8,
      "minimumStock": 20,
      "supplierId": 1,
      "location": "Shelf A2",
      "unit": "Pieces",
      "pricePerUnit": 12
    },
    {
      "id": 5,
      "name": "Bubble Wrap 50m Roll",
      "currentStock": 1,
      "minimumStock": 5,
      "supplierId": 2,
      "location": "Rack B3",
      "unit": "Rolls",
      "pricePerUnit": 350
    }
  ],
  "productMaterialMapping": [
    { "id": 1, "productId": 1, "materialId": 1, "quantityNeeded": 2 },
    { "id": 2, "productId": 1, "materialId": 2, "quantityNeeded": 1 },
    { "id": 3, "productId": 1, "materialId": 3, "quantityNeeded": 3 },
    { "id": 4, "productId": 2, "materialId": 2, "quantityNeeded": 1 },
    { "id": 5, "productId": 2, "materialId": 1, "quantityNeeded": 1 },
    { "id": 6, "productId": 3, "materialId": 2, "quantityNeeded": 1 },
    { "id": 7, "productId": 3, "materialId": 3, "quantityNeeded": 2 },
    { "id": 8, "productId": 3, "materialId": 4, "quantityNeeded": 1 },
    { "id": 9, "productId": 4, "materialId": 2, "quantityNeeded": 1 },
    { "id": 10, "productId": 4, "materialId": 5, "quantityNeeded": 5 },
    { "id": 11, "productId": 4, "materialId": 1, "quantityNeeded": 2 },
    { "id": 12, "productId": 5, "materialId": 2, "quantityNeeded": 1 },
    { "id": 13, "productId": 5, "materialId": 1, "quantityNeeded": 1 },
    { "id": 14, "productId": 5, "materialId": 4, "quantityNeeded": 1 }
  ],
  "suppliers": [
    {
      "id": 1,
      "name": "Ribbon World",
      "phone": "98123-45678",
      "email": "ribbonworld@gmail.com",
      "gst": "07AAAAA1111A1Z1",
      "address": "Shop 12, Connaught Place, New Delhi, Delhi",
      "status": "active"
    },
    {
      "id": 2,
      "name": "Box Masters",
      "phone": "98765-43210",
      "email": "boxmasters@outlook.com",
      "gst": "27BBBBB2222B2Z2",
      "address": "Plot 5, Sector 15, Andheri East, Mumbai, Maharashtra",
      "status": "active"
    },
    {
      "id": 3,
      "name": "Print & Pack Co.",
      "phone": "91234-56789",
      "email": "printpack@yahoo.com",
      "gst": "29CCCCC3333C3Z3",
      "address": "Office 3, 2nd Floor, Indiranagar, Bengaluru, Karnataka",
      "status": "active"
    }
  ],
  "orders": [
    {
      "id": 1,
      "orderNumber": "ORD-1001",
      "customerId": 1,
      "orderDate": "2026-06-25T17:35:41.034Z",
      "deliveryDate": "2026-06-30T17:35:41.035Z",
      "totalPrice": 1120,
      "status": "Pending"
    },
    {
      "id": 2,
      "orderNumber": "ORD-1002",
      "customerId": 3,
      "orderDate": "2026-06-27T17:35:41.035Z",
      "deliveryDate": "2026-07-03T17:35:41.035Z",
      "totalPrice": 22000,
      "status": "In Production"
    },
    {
      "id": 3,
      "orderNumber": "ORD-1003",
      "customerId": 2,
      "orderDate": "2026-06-26T17:35:41.035Z",
      "deliveryDate": "2026-07-01T17:35:41.035Z",
      "totalPrice": 1030,
      "status": "Pending"
    }
  ],
  "orderItems": [
    { "id": 1, "orderId": 1, "productId": 1, "quantity": 2, "price": 450 },
    { "id": 2, "orderId": 1, "productId": 2, "quantity": 1, "price": 220 },
    { "id": 3, "orderId": 2, "productId": 2, "quantity": 100, "price": 220 },
    { "id": 4, "orderId": 3, "productId": 3, "quantity": 1, "price": 380 },
    { "id": 5, "orderId": 3, "productId": 5, "quantity": 1, "price": 650 }
  ],
  "stockMovements": [
    {
      "id": 1,
      "materialId": 1,
      "type": "Stock In",
      "quantity": 300,
      "purpose": "Purchased from Ribbon World",
      "referenceId": 1,
      "date": "2026-06-25T17:35:41.035Z"
    },
    {
      "id": 2,
      "materialId": 2,
      "type": "Stock In",
      "quantity": 100,
      "purpose": "Restocking from Box Masters",
      "referenceId": 2,
      "date": "2026-06-27T17:35:41.035Z"
    },
    {
      "id": 3,
      "materialId": 1,
      "type": "Stock In",
      "quantity": 50,
      "purpose": "Monthly ribbon restock",
      "referenceId": 1,
      "date": "2026-05-10T09:00:00.000Z"
    },
    {
      "id": 4,
      "materialId": 2,
      "type": "Stock In",
      "quantity": 120,
      "purpose": "Mug box inventory replenishment",
      "referenceId": 2,
      "date": "2026-05-15T11:30:00.000Z"
    },
    {
      "id": 5,
      "materialId": 3,
      "type": "Stock In",
      "quantity": 200,
      "purpose": "Wrapping paper restocking",
      "referenceId": 3,
      "date": "2026-05-18T14:15:00.000Z"
    },
    {
      "id": 6,
      "materialId": 1,
      "type": "Stock Out",
      "quantity": 15,
      "purpose": "Sold for corporate order usage",
      "referenceId": 1,
      "date": "2026-05-22T10:00:00.000Z"
    },
    {
      "id": 7,
      "materialId": 2,
      "type": "Stock Out",
      "quantity": 45,
      "purpose": "Corporate order delivery usage",
      "referenceId": 2,
      "date": "2026-05-25T15:45:00.000Z"
    }
  ],
  "notifications": [
    {
      "id": 2,
      "message": "Low Stock Alert: Velvet Cushion Cover is running low (3 remaining, minimum: 10).",
      "type": "warning",
      "date": "2026-06-28T17:35:41.035Z",
      "readStatus": "read"
    },
    {
      "id": 3,
      "message": "Low Stock Alert: Scented Candle Set is running low (4 remaining, minimum: 15).",
      "type": "warning",
      "date": "2026-06-28T17:35:41.035Z",
      "readStatus": "read"
    },
    {
      "id": 4,
      "message": "Low Stock Alert: Corrugated Gift Box 12x12 is running low (3 remaining, reorder level: 50).",
      "type": "warning",
      "date": "2026-06-28T17:35:41.035Z",
      "readStatus": "unread"
    },
    {
      "id": 5,
      "message": "Low Stock Alert: Bow Decoration Large is running low (8 remaining, reorder level: 20).",
      "type": "warning",
      "date": "2026-06-28T17:35:41.035Z",
      "readStatus": "unread"
    },
    {
      "id": 6,
      "message": "Low Stock Alert: Bubble Wrap 50m Roll is running low (1 remaining, minimum threshold: 5).",
      "type": "warning",
      "date": "2026-06-28T17:53:17.951Z",
      "readStatus": "unread"
    }
  ],
  "systemConfig": [
    {
      "id": 1,
      "businessName": "Paper Plane",
      "businessAddress": "Shop 12, Connaught Place, New Delhi, Delhi",
      "businessGst": "07AAAAA1111A1Z1",
      "invoiceSubtitle": "Gift Article & Packaging Material Inventory System",
      "orderPrefix": "ORD-",
      "defaultGstRate": "18",
      "defaultUnit": "Pieces"
    }
  ]
};

function getDb() {
  const data = localStorage.getItem('paperplane_db');
  if (!data) {
    localStorage.setItem('paperplane_db', JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  return JSON.parse(data);
}

function saveDb(db) {
  localStorage.setItem('paperplane_db', JSON.stringify(db));
}

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

const api = {
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} }
  },

  get(url, config) {
    const db = getDb();
    const cleanUrl = url.replace(/^\/api/, '');

    if (cleanUrl === '/auth/me') {
      const token = localStorage.getItem('token');
      if (!token) return Promise.reject({ response: { status: 401 } });
      return Promise.resolve({ data: { name: 'Admin', email: 'admin@paperplane.com' } });
    }

    if (cleanUrl === '/settings' || cleanUrl === '/settings/config') {
      return Promise.resolve({ data: db.systemConfig[0] });
    }

    if (cleanUrl === '/products') {
      return Promise.resolve({ data: db.products });
    }

    if (cleanUrl === '/materials') {
      const result = db.materials.map(m => {
        const sup = db.suppliers.find(s => s.id === m.supplierId);
        return {
          ...m,
          supplierName: sup ? sup.name : 'Unknown Supplier'
        };
      });
      return Promise.resolve({ data: result });
    }

    if (cleanUrl === '/customers') {
      return Promise.resolve({ data: db.customers });
    }

    if (cleanUrl === '/suppliers') {
      return Promise.resolve({ data: db.suppliers });
    }

    if (cleanUrl === '/orders') {
      const result = db.orders.map(o => {
        const customer = db.customers.find(c => c.id === o.customerId);
        return {
          ...o,
          customerName: customer ? customer.name : 'Unknown Customer'
        };
      });
      return Promise.resolve({ data: result });
    }

    if (cleanUrl.startsWith('/orders/')) {
      const id = parseInt(cleanUrl.split('/').pop());
      const order = db.orders.find(o => o.id === id);
      if (!order) return Promise.reject({ response: { status: 404 } });
      const customer = db.customers.find(c => c.id === order.customerId);
      const orderItems = db.orderItems.filter(item => item.orderId === order.id);
      const itemsWithDetails = orderItems.map(item => {
        const product = db.products.find(p => p.id === item.productId);
        return {
          ...item,
          productName: product ? product.name : 'Unknown Product',
          productType: product ? product.type : ''
        };
      });
      return Promise.resolve({
        data: {
          ...order,
          customerName: customer ? customer.name : 'Unknown Customer',
          customerPhone: customer ? customer.phone : '',
          customerAddress: customer ? customer.address : '',
          items: itemsWithDetails
        }
      });
    }

    if (cleanUrl === '/mappings') {
      return Promise.resolve({ data: db.productMaterialMapping });
    }

    if (cleanUrl === '/inventory/logs') {
      const movements = db.stockMovements.map(sm => {
        const mat = db.materials.find(m => m.id === sm.materialId);
        return {
          ...sm,
          materialName: mat ? mat.name : 'Unknown Material',
          itemName: mat ? mat.name : 'Unknown Material',
          item_name: mat ? mat.name : 'Unknown Material',
          action: sm.type,
          type: sm.type,
          location: mat ? mat.location : '—',
          unit: mat ? mat.unit : 'Pieces',
          user: 'Admin',
          notes: sm.purpose,
          purpose: sm.purpose
        };
      });
      return Promise.resolve({ data: movements });
    }

    if (cleanUrl === '/notifications') {
      return Promise.resolve({ data: db.notifications });
    }

    if (cleanUrl === '/dashboard/stats') {
      const lowStockCount = db.materials.filter(m => m.currentStock <= m.minimumStock).length;
      const unreadNotifs = db.notifications.filter(n => n.readStatus === 'unread').length;
      const todayStr = new Date().toISOString().split('T')[0];
      const todayOrders = db.orders.filter(o => o.orderDate.startsWith(todayStr)).length;

      return Promise.resolve({
        data: {
          totalProducts: db.products.length,
          totalMaterials: db.materials.length,
          totalSuppliers: db.suppliers.length,
          lowStockItems: lowStockCount,
          todayMovements: db.stockMovements.filter(sm => sm.date.startsWith(todayStr)).length,
          unreadNotifications: unreadNotifs,
          totalOrders: db.orders.length,
          pendingOrders: db.orders.filter(o => o.status === 'Pending').length,
          completedOrders: db.orders.filter(o => o.status === 'Completed').length,
          todayOrders: todayOrders
        }
      });
    }

    if (cleanUrl === '/dashboard/chart-data') {
      const customerOrdersCount = {};
      db.orders.forEach(o => {
        const customer = db.customers.find(c => c.id === o.customerId);
        const name = customer ? customer.name : 'Unknown Customer';
        customerOrdersCount[name] = (customerOrdersCount[name] || 0) + 1;
      });
      return Promise.resolve({
        data: {
          inventoryDistribution: {
            labels: Object.keys(customerOrdersCount),
            values: Object.values(customerOrdersCount)
          },
          monthlyMovements: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            stockIn: [100, 150, 200, 120, 300, 450],
            stockOut: [80, 110, 140, 130, 280, 380]
          }
        }
      });
    }

    if (cleanUrl === '/dashboard/low-stock') {
      const lowStock = db.materials.filter(m => m.currentStock <= m.minimumStock);
      const mapped = lowStock.map(m => {
        const sup = db.suppliers.find(s => s.id === m.supplierId);
        return {
          id: m.id,
          name: m.name,
          type: 'material',
          quantity: m.currentStock,
          reorder_level: m.minimumStock,
          supplier_name: sup ? sup.name : 'Unknown Supplier'
        };
      });
      return Promise.resolve({ data: mapped });
    }

    if (cleanUrl === '/dashboard/recent-activity') {
      const movements = db.stockMovements.map(sm => {
        const mat = db.materials.find(m => m.id === sm.materialId);
        return {
          ...sm,
          item_name: mat ? mat.name : 'Unknown Material',
          itemName: mat ? mat.name : 'Unknown Material',
          action: sm.type,
          type: sm.type,
          user: 'Admin',
          notes: sm.purpose,
          purpose: sm.purpose
        };
      });
      return Promise.resolve({
        data: {
          logs: movements.slice(-10).reverse(),
          orders: db.orders.slice(-10).reverse()
        }
      });
    }

    // Reports Endpoints (CSV download mock simulation)
    if (cleanUrl.startsWith('/reports/')) {
      const reportType = cleanUrl.replace('/reports/', '');
      if (reportType === 'gift-articles') {
        const rows = db.products.map(p => ({ id: p.id, name: p.name, category: p.type, description: p.description, price: p.price, status: 'active' }));
        const columns = [{ header: 'ID', key: 'id' }, { header: 'Name', key: 'name' }, { header: 'Category', key: 'category' }, { header: 'Description', key: 'description' }, { header: 'Price (Rs)', key: 'price' }, { header: 'Status', key: 'status' }];
        return Promise.resolve({ data: toCSV(rows, columns) });
      }
      if (reportType === 'packaging-materials') {
        const rows = db.materials.map(m => {
          const s = db.suppliers.find(sup => sup.id === m.supplierId);
          return { id: m.id, name: m.name, type: m.unit, quantity: m.currentStock, unit: m.unit, reorder_level: m.minimumStock, location: m.location, supplierName: s ? s.name : 'Unknown' };
        });
        const columns = [{ header: 'ID', key: 'id' }, { header: 'Name', key: 'name' }, { header: 'Type/Unit', key: 'type' }, { header: 'Current Stock', key: 'quantity' }, { header: 'Unit', key: 'unit' }, { header: 'Minimum Stock', key: 'reorder_level' }, { header: 'Storage Location', key: 'location' }, { header: 'Supplier', key: 'supplierName' }];
        return Promise.resolve({ data: toCSV(rows, columns) });
      }
      if (reportType === 'low-stock') {
        const low = db.materials.filter(m => m.currentStock <= m.minimumStock);
        const rows = low.map(m => ({ id: m.id, name: m.name, item_type: 'Packaging Material', type_label: m.unit, quantity: m.currentStock, threshold: m.minimumStock, suggested_purchase: Math.max(0, m.minimumStock - m.currentStock + 10) }));
        const columns = [{ header: 'ID', key: 'id' }, { header: 'Name', key: 'name' }, { header: 'Item Type', key: 'item_type' }, { header: 'Category/Type', key: 'type_label' }, { header: 'Current Quantity', key: 'quantity' }, { header: 'Minimum Threshold', key: 'threshold' }, { header: 'Suggested Purchase', key: 'suggested_purchase' }];
        return Promise.resolve({ data: toCSV(rows, columns) });
      }
      if (reportType === 'suppliers') {
        const rows = db.suppliers.map(s => {
          const count = db.materials.filter(m => m.supplierId === s.id).length;
          return { ...s, materials_count: count };
        });
        const columns = [{ header: 'ID', key: 'id' }, { header: 'Name', key: 'name' }, { header: 'Phone', key: 'phone' }, { header: 'Email', key: 'email' }, { header: 'GSTIN', key: 'gst' }, { header: 'Address', key: 'address' }, { header: 'Status', key: 'status' }, { header: 'Materials Supplied', key: 'materials_count' }];
        return Promise.resolve({ data: toCSV(rows, columns) });
      }
      if (reportType === 'stock-movements') {
        const rows = db.stockMovements.map(m => {
          const mat = db.materials.find(mat => mat.id === m.materialId);
          return { id: m.id, materialName: mat ? mat.name : 'Unknown Material', type: m.type, quantity: m.quantity, purpose: m.purpose, date: m.date };
        });
        const columns = [{ header: 'ID', key: 'id' }, { header: 'Material Name', key: 'materialName' }, { header: 'Action Type', key: 'type' }, { header: 'Quantity', key: 'quantity' }, { header: 'Purpose/Notes', key: 'purpose' }, { header: 'Date', key: 'date' }];
        return Promise.resolve({ data: toCSV(rows, columns) });
      }
      if (reportType === 'orders') {
        const rows = db.orders.map(o => {
          const customer = db.customers.find(c => c.id === o.customerId);
          return { orderNumber: o.orderNumber, customerName: customer ? customer.name : 'Unknown', orderDate: o.orderDate, deliveryDate: o.deliveryDate, totalPrice: o.totalPrice, status: o.status };
        });
        const columns = [{ header: 'Order Number', key: 'orderNumber' }, { header: 'Customer Name', key: 'customerName' }, { header: 'Order Date', key: 'orderDate' }, { header: 'Delivery Date', key: 'deliveryDate' }, { header: 'Total Value (Rs)', key: 'totalPrice' }, { header: 'Status', key: 'status' }];
        return Promise.resolve({ data: toCSV(rows, columns) });
      }
      if (reportType === 'summary') {
        const totalProducts = db.products.length;
        const totalMaterials = db.materials.length;
        const totalSuppliers = db.suppliers.filter(s => s.status === 'active').length;
        const lowStockMaterials = db.materials.filter(m => m.currentStock <= m.minimumStock).length;

        const productsData = db.products.map(p => ({ id: p.id, name: p.name, category: p.type, quantity: 0, minimum_stock: 0, status: 'active', price: p.price }));
        const materialsData = db.materials.map(m => {
          const s = db.suppliers.find(sup => sup.id === m.supplierId);
          return { id: m.id, name: m.name, type: m.unit, quantity: m.currentStock, unit: m.unit, reorder_level: m.minimumStock, supplier: s ? s.name : 'Unknown' };
        });
        const suppliersData = db.suppliers.map(s => {
          const count = db.materials.filter(m => m.supplierId === s.id).length;
          return { ...s, materials_count: count };
        });
        const lowStockItems = db.materials.filter(m => m.currentStock <= m.minimumStock).map(m => ({ name: m.name, item_type: 'Material', quantity: m.currentStock, threshold: m.minimumStock, suggested: Math.max(0, m.minimumStock - m.currentStock + 10) }));
        const recentMovements = db.stockMovements.map(m => {
          const mat = db.materials.find(material => material.id === m.materialId);
          return { id: m.id, item_name: mat ? mat.name : 'Unknown Material', item_type: 'material', action: m.type, quantity: m.quantity, notes: m.purpose, user: 'Admin', date: m.date };
        });
        const ordersData = db.orders.map(o => {
          const customer = db.customers.find(c => c.id === o.customerId);
          return { ...o, customer_name: customer ? customer.name : 'Unknown Customer' };
        });

        const statusMap = {};
        db.orders.forEach(o => {
          if (!statusMap[o.status]) statusMap[o.status] = { status: o.status, count: 0, total_value: 0 };
          statusMap[o.status].count += 1;
          statusMap[o.status].total_value += o.totalPrice;
        });

        const topMap = {};
        db.orderItems.forEach(item => {
          const p = db.products.find(prod => prod.id === item.productId);
          if (p) {
            if (!topMap[p.id]) topMap[p.id] = { name: p.name, category: p.type, total_ordered: 0, total_revenue: 0 };
            topMap[p.id].total_ordered += item.quantity;
            topMap[p.id].total_revenue += (item.quantity * item.price);
          }
        });

        const consumptionMap = {};
        db.orderItems.forEach(item => {
          const prodMappings = db.productMaterialMapping.filter(m => m.productId === item.productId);
          prodMappings.forEach(map => {
            const material = db.materials.find(mat => mat.id === map.materialId);
            if (material) {
              if (!consumptionMap[material.id]) consumptionMap[material.id] = { material_name: material.name, material_type: material.unit, total_consumed: 0, unit: material.unit };
              consumptionMap[material.id].total_consumed += (map.quantityNeeded * item.quantity);
            }
          });
        });

        return Promise.resolve({
          data: {
            generatedAt: new Date().toISOString(),
            summary: { totalProducts, totalMaterials, totalSuppliers, lowStockProducts: 0, lowStockMaterials },
            products: productsData,
            materials: materialsData,
            suppliers: suppliersData,
            lowStockItems,
            recentMovements: recentMovements.slice(-50).reverse(),
            orders: ordersData,
            orderStatus: Object.values(statusMap),
            orderHistory: recentMovements.filter(m => m.notes.includes('Order')).slice(-50).reverse(),
            topProducts: Object.values(topMap).sort((a, b) => b.total_ordered - a.total_ordered).slice(0, 20),
            materialConsumption: Object.values(consumptionMap).sort((a, b) => b.total_consumed - a.total_consumed).slice(0, 20)
          }
        });
      }
    }

    return Promise.reject({ response: { status: 404, data: { error: 'Route not found' } } });
  },

  post(url, data, config) {
    const db = getDb();
    const cleanUrl = url.replace(/^\/api/, '');

    if (cleanUrl === '/auth/login') {
      const { email, password } = data;
      if (email === 'admin@paperplane.com' && password === 'admin123') {
        localStorage.setItem('token', 'paperplane_fake_jwt_token');
        localStorage.setItem('adminName', 'Admin');
        return Promise.resolve({ data: { token: 'paperplane_fake_jwt_token', name: 'Admin', email: 'admin@paperplane.com' } });
      } else {
        return Promise.reject({ response: { status: 401, data: { error: 'Invalid credentials' } } });
      }
    }

    if (cleanUrl === '/auth/logout') {
      localStorage.removeItem('token');
      localStorage.removeItem('adminName');
      return Promise.resolve({ data: { message: 'Logged out successfully' } });
    }

    if (cleanUrl === '/products') {
      let name, type, price, description;
      if (data instanceof FormData) {
        name = data.get('name');
        type = data.get('type');
        price = parseFloat(data.get('price'));
        description = data.get('description');
      } else {
        name = data.name;
        type = data.type;
        price = parseFloat(data.price);
        description = data.description;
      }
      const newProd = {
        id: db.products.reduce((max, p) => p.id > max ? p.id : max, 0) + 1,
        name,
        type,
        price,
        description,
        imageUrl: ""
      };
      db.products.push(newProd);
      saveDb(db);
      return Promise.resolve({ data: newProd });
    }

    if (cleanUrl === '/materials') {
      const newMat = {
        id: db.materials.reduce((max, m) => m.id > max ? m.id : max, 0) + 1,
        name: data.name,
        currentStock: Number(data.currentStock || 0),
        minimumStock: Number(data.minimumStock || 0),
        supplierId: Number(data.supplierId),
        location: data.location || '',
        unit: data.unit || 'Pieces',
        pricePerUnit: Number(data.pricePerUnit || 0)
      };
      db.materials.push(newMat);
      saveDb(db);
      return Promise.resolve({ data: newMat });
    }

    if (cleanUrl === '/customers') {
      const newCust = {
        id: db.customers.reduce((max, c) => c.id > max ? c.id : max, 0) + 1,
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        address: data.address || ''
      };
      db.customers.push(newCust);
      saveDb(db);
      return Promise.resolve({ data: newCust });
    }

    if (cleanUrl === '/suppliers') {
      const newSup = {
        id: db.suppliers.reduce((max, s) => s.id > max ? s.id : max, 0) + 1,
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        gst: data.gst || '',
        address: data.address || '',
        status: data.status || 'active'
      };
      db.suppliers.push(newSup);
      saveDb(db);
      return Promise.resolve({ data: newSup });
    }

    if (cleanUrl === '/orders') {
      const nextId = db.orders.reduce((max, r) => r.id > max ? r.id : max, 0) + 1;
      const orderNumber = `ORD-${1000 + nextId}`;

      const newOrder = {
        id: nextId,
        orderNumber,
        customerId: Number(data.customerId),
        orderDate: data.orderDate || new Date().toISOString(),
        deliveryDate: data.deliveryDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        totalPrice: parseFloat(data.totalPrice || 0),
        status: 'Pending'
      };
      db.orders.push(newOrder);

      data.items.forEach(item => {
        db.orderItems.push({
          id: db.orderItems.reduce((max, oi) => oi.id > max ? oi.id : max, 0) + 1,
          orderId: newOrder.id,
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          price: parseFloat(item.price || 0)
        });
      });

      saveDb(db);
      return Promise.resolve({ data: newOrder });
    }

    if (cleanUrl === '/orders/calculate-materials') {
      const { items } = data;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return Promise.resolve({ data: { materialsNeeded: [], status: 'valid' } });
      }
      const requirements = {};
      items.forEach(item => {
        const productMappings = db.productMaterialMapping.filter(m => m.productId === Number(item.productId));
        productMappings.forEach(map => {
          const totalQty = map.quantityNeeded * Number(item.quantity);
          if (!requirements[map.materialId]) requirements[map.materialId] = 0;
          requirements[map.materialId] += totalQty;
        });
      });

      const materialsNeeded = [];
      let hasShortage = false;

      Object.keys(requirements).forEach(matIdStr => {
        const matId = Number(matIdStr);
        const material = db.materials.find(m => m.id === matId);
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

      return Promise.resolve({
        data: { materialsNeeded, hasShortage, status: hasShortage ? 'shortage' : 'valid' }
      });
    }

    if (cleanUrl === '/mappings') {
      const newMap = {
        id: db.productMaterialMapping.reduce((max, m) => m.id > max ? m.id : max, 0) + 1,
        productId: Number(data.productId),
        materialId: Number(data.materialId),
        quantityNeeded: Number(data.quantityNeeded)
      };
      db.productMaterialMapping.push(newMap);
      saveDb(db);
      return Promise.resolve({ data: newMap });
    }

    if (cleanUrl === '/inventory/stock-in') {
      const matId = Number(data.materialId || data.item_id);
      const qty = Number(data.quantity);
      const material = db.materials.find(m => m.id === matId);
      if (material) {
        material.currentStock += qty;
        db.stockMovements.push({
          id: db.stockMovements.reduce((max, sm) => sm.id > max ? sm.id : max, 0) + 1,
          materialId: matId,
          type: 'Stock In',
          quantity: qty,
          purpose: data.notes || 'Restocked',
          referenceId: null,
          date: new Date().toISOString()
        });
        saveDb(db);
        return Promise.resolve({ data: material });
      }
    }

    if (cleanUrl === '/inventory/stock-out') {
      const matId = Number(data.materialId || data.item_id);
      const qty = Number(data.quantity);
      const material = db.materials.find(m => m.id === matId);
      if (material) {
        material.currentStock = Math.max(0, material.currentStock - qty);
        db.stockMovements.push({
          id: db.stockMovements.reduce((max, sm) => sm.id > max ? sm.id : max, 0) + 1,
          materialId: matId,
          type: 'Stock Out',
          quantity: qty,
          purpose: data.purpose || data.notes || 'Dispatched',
          referenceId: null,
          date: new Date().toISOString()
        });
        saveDb(db);
        return Promise.resolve({ data: material });
      }
    }

    if (cleanUrl === '/dashboard/reset') {
      localStorage.removeItem('paperplane_db');
      getDb();
      return Promise.resolve({ data: { message: 'Reset successful' } });
    }

    return Promise.reject({ response: { status: 404, data: { error: 'Route not found' } } });
  },

  put(url, data, config) {
    const db = getDb();
    const cleanUrl = url.replace(/^\/api/, '');

    if (cleanUrl === '/settings') {
      db.systemConfig[0] = { ...db.systemConfig[0], ...data };
      saveDb(db);
      return Promise.resolve({ data: db.systemConfig[0] });
    }

    if (cleanUrl.startsWith('/products/')) {
      const id = parseInt(cleanUrl.split('/').pop());
      const idx = db.products.findIndex(p => p.id === id);
      if (idx !== -1) {
        let name, type, price, description;
        if (data instanceof FormData) {
          name = data.get('name');
          type = data.get('type');
          price = parseFloat(data.get('price'));
          description = data.get('description');
        } else {
          name = data.name;
          type = data.type;
          price = parseFloat(data.price);
          description = data.description;
        }
        db.products[idx] = { ...db.products[idx], name, type, price, description };
        saveDb(db);
        return Promise.resolve({ data: db.products[idx] });
      }
    }

    if (cleanUrl.startsWith('/materials/')) {
      const id = parseInt(cleanUrl.split('/').pop());
      const idx = db.materials.findIndex(m => m.id === id);
      if (idx !== -1) {
        db.materials[idx] = {
          ...db.materials[idx],
          name: data.name,
          currentStock: Number(data.currentStock),
          minimumStock: Number(data.minimumStock),
          supplierId: Number(data.supplierId),
          location: data.location,
          unit: data.unit,
          pricePerUnit: Number(data.pricePerUnit)
        };
        saveDb(db);
        return Promise.resolve({ data: db.materials[idx] });
      }
    }

    if (cleanUrl.startsWith('/customers/')) {
      const id = parseInt(cleanUrl.split('/').pop());
      const idx = db.customers.findIndex(c => c.id === id);
      if (idx !== -1) {
        db.customers[idx] = { ...db.customers[idx], ...data };
        saveDb(db);
        return Promise.resolve({ data: db.customers[idx] });
      }
    }

    if (cleanUrl.startsWith('/suppliers/')) {
      const id = parseInt(cleanUrl.split('/').pop());
      const idx = db.suppliers.findIndex(s => s.id === id);
      if (idx !== -1) {
        db.suppliers[idx] = { ...db.suppliers[idx], ...data };
        saveDb(db);
        return Promise.resolve({ data: db.suppliers[idx] });
      }
    }

    if (cleanUrl.endsWith('/status')) {
      const id = parseInt(cleanUrl.split('/').slice(-2)[0]);
      const { status } = data;
      const orderIdx = db.orders.findIndex(o => o.id === id);
      if (orderIdx === -1) return Promise.reject({ response: { status: 404 } });

      const existingOrder = db.orders[orderIdx];
      const oldStatus = existingOrder.status;

      if (status === 'In Production' && oldStatus !== 'In Production') {
        const orderItems = db.orderItems.filter(item => item.orderId === id);
        const requirements = {};

        orderItems.forEach(item => {
          const productMappings = db.productMaterialMapping.filter(m => m.productId === item.productId);
          productMappings.forEach(map => {
            const totalQty = map.quantityNeeded * item.quantity;
            if (!requirements[map.materialId]) requirements[map.materialId] = 0;
            requirements[map.materialId] += totalQty;
          });
        });

        Object.keys(requirements).forEach(matIdStr => {
          const matId = Number(matIdStr);
          const material = db.materials.find(m => m.id === matId);
          if (material) {
            const qtyToDeduct = requirements[matId];
            const newStock = Math.max(0, material.currentStock - qtyToDeduct);
            material.currentStock = newStock;

            db.stockMovements.push({
              id: db.stockMovements.reduce((max, sm) => sm.id > max ? sm.id : max, 0) + 1,
              materialId: matId,
              type: 'Stock Out',
              quantity: qtyToDeduct,
              purpose: `Order ${existingOrder.orderNumber} Production`,
              referenceId: id,
              date: new Date().toISOString()
            });

            if (newStock <= material.minimumStock) {
              db.notifications.push({
                id: db.notifications.reduce((max, n) => n.id > max ? n.id : max, 0) + 1,
                message: `Low Stock Warning: ${material.name} dropped to ${newStock} ${material.unit} during production of ${existingOrder.orderNumber}.`,
                type: 'warning',
                date: new Date().toISOString(),
                readStatus: 'unread'
              });
            }
          }
        });
      }

      db.orders[orderIdx].status = status;
      saveDb(db);
      return Promise.resolve({ data: db.orders[orderIdx] });
    }

    if (cleanUrl.endsWith('/read')) {
      const id = parseInt(cleanUrl.split('/').slice(-2)[0]);
      const notification = db.notifications.find(n => n.id === id);
      if (notification) {
        notification.readStatus = 'read';
        saveDb(db);
      }
      return Promise.resolve({ data: { message: 'Read' } });
    }

    if (cleanUrl === '/notifications/read-all') {
      db.notifications.forEach(n => n.readStatus = 'read');
      saveDb(db);
      return Promise.resolve({ data: { message: 'All read' } });
    }

    return Promise.reject({ response: { status: 404, data: { error: 'Route not found' } } });
  },

  delete(url, config) {
    const db = getDb();
    const cleanUrl = url.replace(/^\/api/, '');

    if (cleanUrl.startsWith('/products/')) {
      const id = parseInt(cleanUrl.split('/').pop());
      db.products = db.products.filter(p => p.id !== id);
      db.productMaterialMapping = db.productMaterialMapping.filter(m => m.productId !== id);
      saveDb(db);
      return Promise.resolve({ data: { message: 'Product deleted' } });
    }

    if (cleanUrl.startsWith('/materials/')) {
      const id = parseInt(cleanUrl.split('/').pop());
      db.materials = db.materials.filter(m => m.id !== id);
      db.productMaterialMapping = db.productMaterialMapping.filter(m => m.materialId !== id);
      saveDb(db);
      return Promise.resolve({ data: { message: 'Material deleted' } });
    }

    if (cleanUrl.startsWith('/customers/')) {
      const id = parseInt(cleanUrl.split('/').pop());
      db.customers = db.customers.filter(c => c.id !== id);
      saveDb(db);
      return Promise.resolve({ data: { message: 'Customer deleted' } });
    }

    if (cleanUrl.startsWith('/suppliers/')) {
      const id = parseInt(cleanUrl.split('/').pop());
      db.suppliers = db.suppliers.filter(s => s.id !== id);
      saveDb(db);
      return Promise.resolve({ data: { message: 'Supplier deleted' } });
    }

    if (cleanUrl.startsWith('/orders/')) {
      const id = parseInt(cleanUrl.split('/').pop());
      db.orders = db.orders.filter(o => o.id !== id);
      db.orderItems = db.orderItems.filter(item => item.orderId !== id);
      saveDb(db);
      return Promise.resolve({ data: { message: 'Order deleted' } });
    }

    if (cleanUrl.startsWith('/mappings/')) {
      const id = parseInt(cleanUrl.split('/').pop());
      db.productMaterialMapping = db.productMaterialMapping.filter(m => m.id !== id);
      saveDb(db);
      return Promise.resolve({ data: { message: 'Mapping deleted' } });
    }

    if (cleanUrl.startsWith('/notifications/')) {
      const id = parseInt(cleanUrl.split('/').pop());
      db.notifications = db.notifications.filter(n => n.id !== id);
      saveDb(db);
      return Promise.resolve({ data: { message: 'Notification deleted' } });
    }

    return Promise.reject({ response: { status: 404, data: { error: 'Route not found' } } });
  }
};

export default api;
