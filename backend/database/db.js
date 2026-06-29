const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'db.json');

const https = require('https');

const BUCKET_ID = '019f123b-5103-72a0-b1b9-1421d7f88d89';
const KEY_NAME = 'paperplane_inventory_db';

let memoryData = null;
let isSynced = false;
let syncResolver = null;
const syncPromise = new Promise((resolve) => {
  syncResolver = resolve;
});

function cloudGet(blobId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'jsonblob.com',
      port: 443,
      path: `/api/jsonBlob/${blobId}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    };
    https.get(options, (res) => {
      if (res.statusCode === 404) {
        resolve(null);
        return;
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          resolve(null);
        }
      });
    }).on('error', err => reject(err));
  });
}

function cloudPost(blobId, key, data) {
  const payloadData = data !== undefined ? data : key;
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(payloadData);
    const options = {
      hostname: 'jsonblob.com',
      port: 443,
      path: `/api/jsonBlob/${blobId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve(true));
    });
    req.on('error', err => reject(err));
    req.write(payload);
    req.end();
  });
}

async function syncWithCloud() {
  if (isSynced) {
    if (syncResolver) syncResolver();
    return;
  }
  try {
    const cloudData = await cloudGet(BUCKET_ID);
    if (cloudData) {
      memoryData = cloudData;
      console.log('☁️ Database successfully synchronized from cloud storage!');
    } else {
      // First time: initialize cloud with local seed
      const localData = readLocal();
      await cloudPost(BUCKET_ID, localData);
      console.log('☁️ Initialized cloud database with local seed data.');
    }
    isSynced = true;
  } catch (err) {
    console.error('☁️ Failed to synchronize database from cloud:', err.message);
  } finally {
    if (syncResolver) syncResolver();
  }
}

function readLocal() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading local JSON database:', err);
  }
  try {
    return require('./db.json');
  } catch (err) {
    return {};
  }
}

// Start cloud sync immediately on boot
syncWithCloud().catch(err => console.error('Cloud sync boot error:', err));

// Read database
function read() {
  if (!memoryData) {
    memoryData = readLocal();
  }
  return memoryData;
}

// Write database
function write(data) {
  memoryData = data;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // silently skip local write errors on EROFS
  }
  cloudPost(BUCKET_ID, data)
    .then(() => console.log('☁️ Database changes saved permanently in cloud.'))
    .catch(err => console.error('☁️ Failed to save database to cloud:', err.message));
}

// Initialize and Seed Database
function initialize() {
  console.log('📦 Initializing JSON database...');
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync('admin123', salt);

  const initialData = {
    admins: [
      {
        id: 1,
        username: 'Admin',
        email: 'admin@paperplane.com',
        password: hashedPassword,
        role: 'administrator'
      }
    ],
    customers: [
      {
        id: 1,
        name: 'Rahul Sharma',
        phone: '98765-43210',
        email: 'rahul@gmail.com',
        address: '12A Mall Road, Civil Lines, Delhi'
      },
      {
        id: 2,
        name: 'Saira Khan',
        phone: '98123-45678',
        email: 'saira.khan@yahoo.com',
        address: 'Flat 503, Sector 15, Vashi, Navi Mumbai'
      },
      {
        id: 3,
        name: 'Corporate Gifting Ltd',
        phone: '99888-77766',
        email: 'orders@corporategifts.com',
        address: 'Sector 5, Salt Lake, Kolkata'
      }
    ],
    products: [
      {
        id: 1,
        name: 'Wooden Photo Frame 5x7',
        type: 'Photo Frames',
        price: 450.00,
        description: 'Premium wooden frame with glass cover, 5x7 inches',
        imageUrl: ''
      },
      {
        id: 2,
        name: 'Ceramic Coffee Mug',
        type: 'Mugs',
        price: 220.00,
        description: 'Glossy white ceramic mug 330ml, ideal for gifting',
        imageUrl: ''
      },
      {
        id: 3,
        name: 'Velvet Cushion Cover',
        type: 'Cushions',
        price: 380.00,
        description: 'Soft velvet cushion cover 16x16 inches, multiple colors',
        imageUrl: ''
      },
      {
        id: 4,
        name: 'Glass Vase Medium',
        type: 'Customized Gifts',
        price: 560.00,
        description: 'Elegant clear glass vase 20cm tall',
        imageUrl: ''
      },
      {
        id: 5,
        name: 'Scented Candle Set',
        type: 'Hampers',
        price: 650.00,
        description: 'Set of 3 scented candles – lavender, vanilla, jasmine',
        imageUrl: ''
      }
    ],
    materials: [
      {
        id: 1,
        name: 'Satin Ribbon 1 inch',
        currentStock: 200,
        minimumStock: 30,
        supplierId: 1,
        location: 'Shelf A1',
        unit: 'Meters',
        pricePerUnit: 15.00
      },
      {
        id: 2,
        name: 'Corrugated Gift Box 12x12',
        currentStock: 3,
        minimumStock: 50,
        supplierId: 2,
        location: 'Rack B2',
        unit: 'Pieces',
        pricePerUnit: 45.00
      },
      {
        id: 3,
        name: 'Tissue Wrapping Paper',
        currentStock: 500,
        minimumStock: 100,
        supplierId: 3,
        location: 'Shelf C1',
        unit: 'Sheets',
        pricePerUnit: 5.00
      },
      {
        id: 4,
        name: 'Bow Decoration Large',
        currentStock: 8,
        minimumStock: 20,
        supplierId: 1,
        location: 'Shelf A2',
        unit: 'Pieces',
        pricePerUnit: 12.00
      },
      {
        id: 5,
        name: 'Bubble Wrap 50m Roll',
        currentStock: 10,
        minimumStock: 5,
        supplierId: 2,
        location: 'Rack B3',
        unit: 'Rolls',
        pricePerUnit: 350.00
      }
    ],
    productMaterialMapping: [
      { id: 1, productId: 1, materialId: 1, quantityNeeded: 2 },
      { id: 2, productId: 1, materialId: 2, quantityNeeded: 1 },
      { id: 3, productId: 1, materialId: 3, quantityNeeded: 3 },
      { id: 4, productId: 2, materialId: 2, quantityNeeded: 1 },
      { id: 5, productId: 2, materialId: 1, quantityNeeded: 1 },
      { id: 6, productId: 3, materialId: 2, quantityNeeded: 1 },
      { id: 7, productId: 3, materialId: 3, quantityNeeded: 2 },
      { id: 8, productId: 3, materialId: 4, quantityNeeded: 1 },
      { id: 9, productId: 4, materialId: 2, quantityNeeded: 1 },
      { id: 10, productId: 4, materialId: 5, quantityNeeded: 5 },
      { id: 11, productId: 4, materialId: 1, quantityNeeded: 2 },
      { id: 12, productId: 5, materialId: 2, quantityNeeded: 1 },
      { id: 13, productId: 5, materialId: 1, quantityNeeded: 1 },
      { id: 14, productId: 5, materialId: 4, quantityNeeded: 1 }
    ],
    suppliers: [
      {
        id: 1,
        name: 'Ribbon World',
        phone: '98123-45678',
        email: 'ribbonworld@gmail.com',
        gst: '07AAAAA1111A1Z1',
        address: 'Shop 12, Connaught Place, New Delhi, Delhi',
        status: 'active'
      },
      {
        id: 2,
        name: 'Box Masters',
        phone: '98765-43210',
        email: 'boxmasters@outlook.com',
        gst: '27BBBBB2222B2Z2',
        address: 'Plot 5, Sector 15, Andheri East, Mumbai, Maharashtra',
        status: 'active'
      },
      {
        id: 3,
        name: 'Print & Pack Co.',
        phone: '91234-56789',
        email: 'printpack@yahoo.com',
        gst: '29CCCCC3333C3Z3',
        address: 'Office 3, 2nd Floor, Indiranagar, Bengaluru, Karnataka',
        status: 'active'
      }
    ],
    orders: [
      {
        id: 1,
        orderNumber: 'ORD-1001',
        customerId: 1,
        orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        totalPrice: 1120.00,
        status: 'Pending'
      },
      {
        id: 2,
        orderNumber: 'ORD-1002',
        customerId: 3,
        orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        totalPrice: 22000.00,
        status: 'In Production'
      },
      {
        id: 3,
        orderNumber: 'ORD-1003',
        customerId: 2,
        orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        totalPrice: 1030.00,
        status: 'Pending'
      }
    ],
    orderItems: [
      { id: 1, orderId: 1, productId: 1, quantity: 2, price: 450.00 },
      { id: 2, orderId: 1, productId: 2, quantity: 1, price: 220.00 },
      { id: 3, orderId: 2, productId: 2, quantity: 100, price: 220.00 },
      { id: 4, orderId: 3, productId: 3, quantity: 1, price: 380.00 },
      { id: 5, orderId: 3, productId: 5, quantity: 1, price: 650.00 }
    ],
    stockMovements: [
      {
        id: 1,
        materialId: 1,
        type: 'Stock In',
        quantity: 300,
        purpose: 'Purchased from Ribbon World',
        referenceId: 1,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        materialId: 2,
        type: 'Stock In',
        quantity: 100,
        purpose: 'Restocking from Box Masters',
        referenceId: 2,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      // Seed May 2026 logs for movements
      {
        id: 3,
        materialId: 1,
        type: 'Stock In',
        quantity: 50,
        purpose: 'Monthly ribbon restock',
        referenceId: 1,
        date: '2026-05-10T09:00:00.000Z'
      },
      {
        id: 4,
        materialId: 2,
        type: 'Stock In',
        quantity: 120,
        purpose: 'Mug box inventory replenishment',
        referenceId: 2,
        date: '2026-05-15T11:30:00.000Z'
      },
      {
        id: 5,
        materialId: 3,
        type: 'Stock In',
        quantity: 200,
        purpose: 'Wrapping paper restocking',
        referenceId: 3,
        date: '2026-05-18T14:15:00.000Z'
      },
      {
        id: 6,
        materialId: 1,
        type: 'Stock Out',
        quantity: 15,
        purpose: 'Sold for corporate order usage',
        referenceId: 1,
        date: '2026-05-22T10:00:00.000Z'
      },
      {
        id: 7,
        materialId: 2,
        type: 'Stock Out',
        quantity: 45,
        purpose: 'Corporate order delivery usage',
        referenceId: 2,
        date: '2026-05-25T15:45:00.000Z'
      }
    ],
    notifications: [
      {
        id: 1,
        message: 'System Ready: Paper Plane JSON Inventory System initialized.',
        type: 'info',
        date: new Date().toISOString(),
        readStatus: 'unread'
      },
      {
        id: 2,
        message: 'Low Stock Alert: Velvet Cushion Cover is running low (3 remaining, minimum: 10).',
        type: 'warning',
        date: new Date().toISOString(),
        readStatus: 'unread'
      },
      {
        id: 3,
        message: 'Low Stock Alert: Scented Candle Set is running low (4 remaining, minimum: 15).',
        type: 'warning',
        date: new Date().toISOString(),
        readStatus: 'unread'
      },
      {
        id: 4,
        message: 'Low Stock Alert: Corrugated Gift Box 12x12 is running low (3 remaining, reorder level: 50).',
        type: 'warning',
        date: new Date().toISOString(),
        readStatus: 'unread'
      },
      {
        id: 5,
        message: 'Low Stock Alert: Bow Decoration Large is running low (8 remaining, reorder level: 20).',
        type: 'warning',
        date: new Date().toISOString(),
        readStatus: 'unread'
      }
    ],
    systemConfig: [
      {
        id: 1,
        businessName: 'Paper Plane',
        businessAddress: 'Shop 12, Connaught Place, New Delhi, Delhi',
        businessGst: '07AAAAA1111A1Z1',
        invoiceSubtitle: 'Gift Article & Packaging Material Inventory System',
        orderPrefix: 'ORD-',
        defaultGstRate: '18',
        defaultUnit: 'Pieces'
      }
    ]
  };

  write(initialData);
  console.log('✅ JSON Database seeded successfully');
}

// CRUD query helpers
const db = {
  read,
  write,
  initialize,
  syncPromise,
  
  find(table, filterFn) {
    const data = read();
    const rows = data[table] || [];
    return filterFn ? rows.filter(filterFn) : rows;
  },
  
  findById(table, id) {
    const data = read();
    const rows = data[table] || [];
    return rows.find(row => row.id === Number(id));
  },
  
  insert(table, rowData) {
    const data = read();
    if (!data[table]) data[table] = [];
    const nextId = data[table].reduce((max, r) => r.id > max ? r.id : max, 0) + 1;
    const newRow = { id: nextId, ...rowData };
    data[table].push(newRow);
    write(data);
    return newRow;
  },
  
  update(table, id, rowData) {
    const data = read();
    const rows = data[table] || [];
    const index = rows.findIndex(row => row.id === Number(id));
    if (index === -1) return null;
    const updatedRow = { ...rows[index], ...rowData, id: Number(id) };
    data[table][index] = updatedRow;
    write(data);
    return updatedRow;
  },
  
  delete(table, id) {
    const data = read();
    const rows = data[table] || [];
    const index = rows.findIndex(row => row.id === Number(id));
    if (index === -1) return false;
    data[table].splice(index, 1);
    write(data);
    return true;
  }
};

module.exports = db;
