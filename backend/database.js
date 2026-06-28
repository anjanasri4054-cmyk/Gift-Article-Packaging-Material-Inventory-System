/**
 * database.js — SQLite database using sql.js (pure JS/WASM, no native compilation)
 *
 * Exports a wrapper that mimics the better-sqlite3 API: db.prepare(sql).get/all/run(params)
 * so all controllers work unchanged.
 *
 * Usage in server.js:
 *   const db = require('./database');
 *   await db.initialize();
 *   // then all controllers use db.prepare(sql).get/all/run(...)
 */

const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'inventory.db')
  : path.join(__dirname, 'inventory.db');

// ─── Internal state ──────────────────────────────────────────────────────────
let _rawDb = null;

// ─── Save database to disk ──────────────────────────────────────────────────
function _save() {
  if (_rawDb) {
    const data = _rawDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// ─── Wrapper that mimics better-sqlite3 API ─────────────────────────────────
const db = {
  /**
   * Initialize the database. Must be called (and awaited) before any queries.
   */
  async initialize() {
    const wasmPath = path.join(__dirname, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    
    // Force Vercel's Node File Trace (NFT) to bundle the sql-wasm.wasm asset
    if (process.env.VERCEL) {
      try {
        if (fs.existsSync(wasmPath)) {
          fs.readFileSync(wasmPath);
          console.log('✅ Bundled WASM found and verified');
        }
      } catch (e) {
        console.warn('WASM prefetch warning:', e.message);
      }
    }

    const SQL = await initSqlJs({
      locateFile: () => wasmPath
    });

    // Load existing database file or create new
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      _rawDb = new SQL.Database(fileBuffer);
      console.log('📦 Loaded existing database from inventory.db');
    } else {
      _rawDb = new SQL.Database();
      console.log('📦 Created new database');
    }

    // Enable foreign keys
    _rawDb.run('PRAGMA foreign_keys = ON');

    // Create tables
    _createTables();

    // Seed data
    _seedData();

    _save();
    console.log('📦 Database initialized successfully');
  },

  /**
   * Mimics better-sqlite3's db.prepare(sql) — returns { get, all, run }
   */
  prepare(sql) {
    return {
      /**
       * Execute the statement and return the first row as an object, or undefined.
       * Usage: db.prepare('SELECT * FROM x WHERE id = ?').get(id)
       */
      get(...params) {
        const stmt = _rawDb.prepare(sql);
        if (params.length > 0) {
          stmt.bind(params);
        }
        let row = undefined;
        if (stmt.step()) {
          row = stmt.getAsObject();
        }
        stmt.free();
        return row;
      },

      /**
       * Execute the statement and return all matching rows as an array of objects.
       * Usage: db.prepare('SELECT * FROM x').all()
       * Usage: db.prepare('SELECT * FROM x WHERE name LIKE ?').all('%foo%')
       */
      all(...params) {
        const stmt = _rawDb.prepare(sql);
        if (params.length > 0) {
          stmt.bind(params);
        }
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
      },

      /**
       * Execute the statement (INSERT/UPDATE/DELETE) and return { lastInsertRowid, changes }.
       * Usage: db.prepare('INSERT INTO x ...').run(val1, val2)
       */
      run(...params) {
        const stmt = _rawDb.prepare(sql);
        if (params.length > 0) {
          stmt.bind(params);
        }
        stmt.step();
        stmt.free();

        // Get last insert rowid and changes count
        const lastIdResult = _rawDb.exec('SELECT last_insert_rowid() as id');
        const lastInsertRowid = lastIdResult[0]?.values[0]?.[0] || 0;
        const changes = _rawDb.getRowsModified();

        _save();

        return { lastInsertRowid, changes };
      }
    };
  },

  /**
   * Execute raw SQL (for multi-statement exec like CREATE TABLE).
   */
  exec(sql) {
    _rawDb.run(sql);
    _save();
  }
};

// ─── Create Tables ───────────────────────────────────────────────────────────
function _createTables() {
  _rawDb.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      name     TEXT    NOT NULL,
      email    TEXT    NOT NULL UNIQUE,
      password TEXT    NOT NULL
    )
  `);

  _rawDb.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id         INTEGER  PRIMARY KEY AUTOINCREMENT,
      name       TEXT     NOT NULL,
      phone      TEXT,
      email      TEXT,
      address    TEXT,
      status     TEXT     DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  _rawDb.run(`
    CREATE TABLE IF NOT EXISTS products (
      id            INTEGER  PRIMARY KEY AUTOINCREMENT,
      name          TEXT     NOT NULL,
      category      TEXT     NOT NULL,
      description   TEXT,
      price         REAL     DEFAULT 0,
      quantity      INTEGER  DEFAULT 0,
      minimum_stock INTEGER  DEFAULT 5,
      image         TEXT,
      status        TEXT     DEFAULT 'active',
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  _rawDb.run(`
    CREATE TABLE IF NOT EXISTS materials (
      id            INTEGER  PRIMARY KEY AUTOINCREMENT,
      name          TEXT     NOT NULL,
      type          TEXT     NOT NULL,
      quantity      INTEGER  DEFAULT 0,
      unit          TEXT     NOT NULL,
      reorder_level INTEGER  DEFAULT 5,
      supplier_id   INTEGER,
      location      TEXT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    )
  `);

  _rawDb.run(`
    CREATE TABLE IF NOT EXISTS inventory_logs (
      id        INTEGER  PRIMARY KEY AUTOINCREMENT,
      item_id   INTEGER,
      item_name TEXT,
      item_type TEXT,
      action    TEXT,
      quantity  INTEGER,
      notes     TEXT,
      user      TEXT,
      date      DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  _rawDb.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id         INTEGER  PRIMARY KEY AUTOINCREMENT,
      title      TEXT,
      message    TEXT,
      type       TEXT     DEFAULT 'info',
      status     TEXT     DEFAULT 'unread',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  _rawDb.run(`
    CREATE TABLE IF NOT EXISTS product_materials (
      id                INTEGER  PRIMARY KEY AUTOINCREMENT,
      product_id        INTEGER  NOT NULL,
      material_id       INTEGER  NOT NULL,
      quantity_required REAL     NOT NULL DEFAULT 1,
      FOREIGN KEY (product_id)  REFERENCES products(id)  ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
    )
  `);

  _rawDb.run(`
    CREATE TABLE IF NOT EXISTS customers (
      customer_id   INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT    NOT NULL,
      phone         TEXT,
      email         TEXT,
      address       TEXT,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  _rawDb.run(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id      INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number  TEXT    NOT NULL UNIQUE,
      customer_id   INTEGER NOT NULL,
      order_date    DATETIME NOT NULL,
      delivery_date DATETIME,
      order_type    TEXT    NOT NULL,
      total_amount  REAL    NOT NULL,
      status        TEXT    DEFAULT 'Pending',
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
    )
  `);

  _rawDb.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id      INTEGER NOT NULL,
      product_id    INTEGER NOT NULL,
      quantity      INTEGER NOT NULL,
      price         REAL    NOT NULL,
      subtotal      REAL    NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);
}

// ─── Seed Data ───────────────────────────────────────────────────────────────
function _seedData() {
  // Seed admin
  const adminCheck = db.prepare('SELECT id FROM admins WHERE email = ?').get('admin@paperplane.com');
  if (!adminCheck) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)').run('Admin', 'admin@paperplane.com', hashedPassword);
    console.log('✅ Admin seeded: admin@paperplane.com / admin123');
  }

  // Seed suppliers
  const suppliersCount = db.prepare('SELECT COUNT(*) as count FROM suppliers').get().count;
  if (suppliersCount === 0) {
    const ins = db.prepare('INSERT INTO suppliers (name, phone, email, address, status) VALUES (?, ?, ?, ?, ?)');
    ins.run('Ribbon World', '98123-45678', 'ribbonworld@gmail.com', 'Shop 12, Connaught Place, New Delhi, Delhi', 'active');
    ins.run('Box Masters', '98765-43210', 'boxmasters@outlook.com', 'Plot 5, Sector 15, Andheri East, Mumbai, Maharashtra', 'active');
    ins.run('Print & Pack Co.', '91234-56789', 'printpack@yahoo.com', 'Office 3, 2nd Floor, Indiranagar, Bengaluru, Karnataka', 'active');
    ins.run('Paper Plane Packaging', '98901-23456', 'packaging@paperplane.com', 'Sector 4, Industrial Area, Okhla, New Delhi, Delhi', 'active');
    ins.run('Vibrant Labels & Tags', '99887-76655', 'info@vibrantlabels.com', '45 Commercial Area, Sector 62, Noida, Uttar Pradesh', 'active');
    ins.run('Eco Wrap Materials', '97766-55443', 'sales@ecowrap.com', 'Plot 104, GIDC Industrial Area, Surat, Gujarat', 'active');
    ins.run('Craft & Decor Wholesale', '96655-44332', 'wholesale@craftdecor.com', 'Shop 5, Main G.N. Chetty Road, T. Nagar, Chennai, Tamil Nadu', 'active');
    console.log('✅ Suppliers seeded');
  }

  // Seed products
  const productsCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productsCount === 0) {
    const ins = db.prepare(
      `INSERT INTO products (name, category, description, price, quantity, minimum_stock, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    ins.run('Wooden Photo Frame 5x7', 'Photo Frames', 'Premium wooden frame with glass cover, 5x7 inches', 450.00, 80, 10, 'active');
    ins.run('Ceramic Coffee Mug', 'Mugs', 'Glossy white ceramic mug 330ml, ideal for gifting', 220.00, 150, 20, 'active');
    ins.run('Velvet Cushion Cover', 'Cushions', 'Soft velvet cushion cover 16x16 inches, multiple colors', 380.00, 3, 10, 'active');
    ins.run('Glass Vase Medium', 'Customized Gifts', 'Elegant clear glass vase 20cm tall', 560.00, 45, 8, 'active');
    ins.run('Scented Candle Set', 'Hampers', 'Set of 3 scented candles – lavender, vanilla, jasmine', 650.00, 4, 15, 'active');
    console.log('✅ Products seeded');
  }

  // Seed materials
  const materialsCount = db.prepare('SELECT COUNT(*) as count FROM materials').get().count;
  if (materialsCount === 0) {
    const suppliers = db.prepare('SELECT id FROM suppliers LIMIT 3').all();
    const s1 = suppliers[0] ? suppliers[0].id : null;
    const s2 = suppliers[1] ? suppliers[1].id : null;
    const s3 = suppliers[2] ? suppliers[2].id : null;

    const ins = db.prepare(
      `INSERT INTO materials (name, type, quantity, unit, reorder_level, supplier_id, location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    ins.run('Satin Ribbon 1 inch', 'Ribbons', 200, 'Meters', 30, s1, 'Shelf A1');
    ins.run('Corrugated Gift Box 12x12', 'Boxes', 3, 'Pieces', 50, s2, 'Rack B2');
    ins.run('Tissue Wrapping Paper', 'Wrapping Paper', 500, 'Sheets', 100, s3, 'Shelf C1');
    ins.run('Bow Decoration Large', 'Decorative Items', 8, 'Pieces', 20, s1, 'Shelf A2');
    ins.run('Bubble Wrap 50m Roll', 'Filler Materials', 10, 'Rolls', 5, s2, 'Rack B3');
    console.log('✅ Materials seeded');
  }

  // Seed inventory logs
  const logsCount = db.prepare('SELECT COUNT(*) as count FROM inventory_logs').get().count;
  if (logsCount === 0) {
    const ins = db.prepare(
      `INSERT INTO inventory_logs (item_id, item_name, item_type, action, quantity, notes, user, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    ins.run(1, 'Wooden Photo Frame 5x7', 'product', 'Stock In', 100, 'Initial stock entry', 'Admin', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString());
    ins.run(2, 'Ceramic Coffee Mug', 'product', 'Stock In', 200, 'Initial stock entry', 'Admin', new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString());
    ins.run(1, 'Satin Ribbon 1 inch', 'material', 'Stock In', 300, 'Purchased from Ribbon World', 'Admin', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString());
    ins.run(1, 'Wooden Photo Frame 5x7', 'product', 'Stock Out', 20, 'Sold to retail customer', 'Admin', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString());
    ins.run(2, 'Corrugated Gift Box 12x12', 'material', 'Stock In', 100, 'Restocking from Box Masters', 'Admin', new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString());
    
    // Seed May 2026 data
    ins.run(1, 'Wooden Photo Frame 5x7', 'product', 'Stock In', 50, 'Monthly frame restock', 'Admin', '2026-05-10T09:00:00.000Z');
    ins.run(2, 'Ceramic Coffee Mug', 'product', 'Stock In', 120, 'Mug inventory replenishment', 'Admin', '2026-05-15T11:30:00.000Z');
    ins.run(3, 'Tissue Wrapping Paper', 'material', 'Stock In', 200, 'Wrapper restocking', 'Admin', '2026-05-18T14:15:00.000Z');
    ins.run(1, 'Wooden Photo Frame 5x7', 'product', 'Stock Out', 15, 'Sold for corporate order', 'Admin', '2026-05-22T10:00:00.000Z');
    ins.run(2, 'Ceramic Coffee Mug', 'product', 'Stock Out', 45, 'Corporate order delivery', 'Admin', '2026-05-25T15:45:00.000Z');
    console.log('✅ Inventory logs seeded');
  }

  // Seed notifications
  const notifCount = db.prepare('SELECT COUNT(*) as count FROM notifications').get().count;
  if (notifCount === 0) {
    const ins = db.prepare('INSERT INTO notifications (title, message, type, status) VALUES (?, ?, ?, ?)');
    ins.run('System Ready', 'Paper Plane Inventory System has been initialized successfully.', 'info', 'unread');
    ins.run('Low Stock Alert', 'Velvet Cushion Cover is running low (3 remaining, minimum: 10).', 'warning', 'unread');
    ins.run('Low Stock Alert', 'Scented Candle Set is running low (4 remaining, minimum: 15).', 'warning', 'unread');
    ins.run('Low Stock Alert', 'Corrugated Gift Box 12x12 is running low (3 remaining, reorder level: 50).', 'warning', 'unread');
    ins.run('Low Stock Alert', 'Bow Decoration Large is running low (8 remaining, reorder level: 20).', 'warning', 'unread');
    console.log('✅ Notifications seeded');
  }

  // Seed product_materials (previously bundle_materials)
  const bundleCount = db.prepare('SELECT COUNT(*) as count FROM product_materials').get().count;
  if (bundleCount === 0) {
    const allProds = db.prepare('SELECT id, name FROM products').all();
    const allMats = db.prepare('SELECT id, name FROM materials').all();
    
    const getMatId = (name) => allMats.find(m => m.name.includes(name))?.id;
    const ribId = getMatId('Ribbon');
    const boxId = getMatId('Box');
    const tissueId = getMatId('Tissue');
    const bowId = getMatId('Bow');
    const bubbleId = getMatId('Bubble');

    const ins = db.prepare('INSERT INTO product_materials (product_id, material_id, quantity_required) VALUES (?, ?, ?)');

    allProds.forEach(p => {
      if (p.name.includes('Photo Frame')) {
        if (ribId) ins.run(p.id, ribId, 2);
        if (boxId) ins.run(p.id, boxId, 1);
        if (tissueId) ins.run(p.id, tissueId, 3);
      } else if (p.name.includes('Coffee Mug')) {
        if (boxId) ins.run(p.id, boxId, 1);
        if (ribId) ins.run(p.id, ribId, 1);
      } else if (p.name.includes('Cushion Cover')) {
        if (boxId) ins.run(p.id, boxId, 1);
        if (tissueId) ins.run(p.id, tissueId, 2);
        if (bowId) ins.run(p.id, bowId, 1);
      } else if (p.name.includes('Glass Vase')) {
        if (boxId) ins.run(p.id, boxId, 1);
        if (bubbleId) ins.run(p.id, bubbleId, 5);
        if (ribId) ins.run(p.id, ribId, 2);
      } else if (p.name.includes('Scented Candle')) {
        if (boxId) ins.run(p.id, boxId, 1);
        if (ribId) ins.run(p.id, ribId, 1);
        if (bowId) ins.run(p.id, bowId, 1);
      }
    });
    console.log('✅ Product materials seeded for all products');
  }

  // Seed customers
  const customersCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
  if (customersCount === 0) {
    const ins = db.prepare('INSERT INTO customers (customer_name, phone, email, address) VALUES (?, ?, ?, ?)');
    ins.run('Rahul Sharma', '98765-43210', 'rahul@gmail.com', '12A Mall Road, Civil Lines, Delhi');
    ins.run('Saira Khan', '98123-45678', 'saira.khan@yahoo.com', 'Flat 503, Sector 15, Vashi, Navi Mumbai');
    ins.run('Corporate Gifting Ltd', '99888-77766', 'orders@corporategifts.com', 'Sector 5, Salt Lake, Kolkata');
    console.log('✅ Customers seeded');
  }

  // Seed orders & order items
  const ordersCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  if (ordersCount === 0) {
    const p1 = db.prepare("SELECT * FROM products WHERE name LIKE '%Photo Frame%'").get();
    const p2 = db.prepare("SELECT * FROM products WHERE name LIKE '%Coffee Mug%'").get();
    const p3 = db.prepare("SELECT * FROM products WHERE name LIKE '%Cushion Cover%'").get();
    const p4 = db.prepare("SELECT * FROM products WHERE name LIKE '%Glass Vase%'").get();
    const p5 = db.prepare("SELECT * FROM products WHERE name LIKE '%Scented Candle%'").get();
    
    if (p1 && p2) {
      const insOrder = db.prepare(`
        INSERT INTO orders (order_number, customer_id, order_date, delivery_date, order_type, total_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const insItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, quantity, price, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      // Order 1: Personal Gift for Rahul
      const res1 = insOrder.run(
        'ORD-1001',
        1,
        new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        'Personal Gift',
        1120.00,
        'Pending'
      );
      insItem.run(res1.lastInsertRowid, p1.id, 2, p1.price, p1.price * 2); // 2 Photo Frames (900)
      insItem.run(res1.lastInsertRowid, p2.id, 1, p2.price, p2.price * 1); // 1 Coffee Mug (220)
      
      // Order 2: Corporate Gift for Corporate Gifting
      const res2 = insOrder.run(
        'ORD-1002',
        3,
        new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        'Corporate Gift',
        22000.00,
        'In Production'
      );
      insItem.run(res2.lastInsertRowid, p2.id, 100, p2.price, p2.price * 100); // 100 Mugs (22000)

      // Order 3: Personal Gift for Saira Khan
      if (p3 && p5) {
        const res3 = insOrder.run(
          'ORD-1003',
          2,
          new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          'Personal Gift',
          1030.00,
          'Pending'
        );
        insItem.run(res3.lastInsertRowid, p3.id, 1, p3.price, p3.price); // 1 Cushion Cover (380)
        insItem.run(res3.lastInsertRowid, p5.id, 1, p5.price, p5.price); // 1 Scented Candle (650)
      }

      // Order 4: Bulk Hampers for Corporate Gifting
      if (p4) {
        const res4 = insOrder.run(
          'ORD-1004',
          3,
          new Date().toISOString(),
          new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          'Bulk Hampers',
          2800.00,
          'Ready'
        );
        insItem.run(res4.lastInsertRowid, p4.id, 5, p4.price, p4.price * 5); // 5 Glass Vases (2800)
      }

      // Order 5: Customized Order for Rahul Sharma
      const res5 = insOrder.run(
        'ORD-1005',
        1,
        new Date().toISOString(),
        new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        'Customized Order',
        220.00,
        'Pending'
      );
      insItem.run(res5.lastInsertRowid, p2.id, 1, p2.price, p2.price); // 1 Coffee Mug (220)

      console.log('✅ Orders and items seeded');
    }
  }
}

module.exports = db;

