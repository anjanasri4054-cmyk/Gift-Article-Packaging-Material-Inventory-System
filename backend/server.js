const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./database');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const materialRoutes = require('./routes/materialRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const bundleRoutes = require('./routes/bundleRoutes');
const reportRoutes = require('./routes/reportRoutes');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Ensure uploads directory exists ─────────────────────────────────────────
const uploadsDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory');
  } catch (err) {
    console.warn('⚠️ Could not create uploads directory:', err.message);
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images as static files
app.use('/uploads', express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));

// ─── DB initialization middleware (crucial for Vercel serverless) ─────────────
let dbInitialized = false;
app.use(async (req, res, next) => {
  try {
    if (!dbInitialized) {
      await db.initialize();
      dbInitialized = true;
    }
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/products', productRoutes);
app.use('/products', productRoutes);

app.use('/api/materials', materialRoutes);
app.use('/materials', materialRoutes);

app.use('/api/suppliers', supplierRoutes);
app.use('/suppliers', supplierRoutes);

app.use('/api/inventory', inventoryRoutes);
app.use('/inventory', inventoryRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/notifications', notificationRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/dashboard', dashboardRoutes);

app.use('/api/bundles', bundleRoutes);
app.use('/bundles', bundleRoutes);

app.use('/api/reports', reportRoutes);
app.use('/reports', reportRoutes);

app.use('/api/customers', customerRoutes);
app.use('/customers', customerRoutes);

app.use('/api/orders', orderRoutes);
app.use('/orders', orderRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Paper Plane Inventory API is running' });
});
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Paper Plane Inventory API is running' });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ─── Start Server (async for local, middleware-based for Vercel) ──────────────
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  db.initialize().then(() => {
    dbInitialized = true;
    app.listen(PORT, () => {
      console.log(`🚀 Paper Plane Inventory Server running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = app;
