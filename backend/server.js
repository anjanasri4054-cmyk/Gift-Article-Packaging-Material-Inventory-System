const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
require('dotenv').config();

// Load the JSON query database engine
const db = require('./database/db');

// Require new route modules
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const materialRoutes = require('./routes/materials');
const mappingRoutes = require('./routes/mappings');
const customerRoutes = require('./routes/customers');
const supplierRoutes = require('./routes/suppliers');
const orderRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
db.initialize();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn('Could not create uploads directory (read-only system):', err.message);
}

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Body Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploads static assets
app.use('/uploads', express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));

// Middleware to ensure database is fully synchronized from cloud before processing requests
app.use(async (req, res, next) => {
  if (req.path === '/health' || req.path === '/api/health' || req.path.startsWith('/uploads') || req.path.startsWith('/api/uploads')) {
    return next();
  }
  try {
    await db.syncPromise;
  } catch (err) {
    console.error('Middleware database sync error:', err.message);
  }
  next();
});

// Mount routing endpoints (both with and without /api prefix for maximum client compatibility)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/products', productRoutes);
app.use('/products', productRoutes);

app.use('/api/materials', materialRoutes);
app.use('/materials', materialRoutes);

app.use('/api/mappings', mappingRoutes);
app.use('/mappings', mappingRoutes);

app.use('/api/customers', customerRoutes);
app.use('/customers', customerRoutes);

app.use('/api/suppliers', supplierRoutes);
app.use('/suppliers', supplierRoutes);

app.use('/api/orders', orderRoutes);
app.use('/orders', orderRoutes);

app.use('/api/inventory', inventoryRoutes);
app.use('/inventory', inventoryRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/dashboard', dashboardRoutes);

app.use('/api/reports', reportRoutes);
app.use('/reports', reportRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/notifications', notificationRoutes);

app.use('/api/settings', settingsRoutes);
app.use('/settings', settingsRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Paper Plane JSON Inventory API is running' });
});
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Paper Plane JSON Inventory API is running' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Listen on Port
app.listen(PORT, () => {
  console.log(`🚀 Paper Plane JSON-based Inventory Server running on port ${PORT}`);
});

module.exports = app;
