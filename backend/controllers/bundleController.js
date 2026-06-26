const db = require('../database');

// Helper: create a notification
const createNotification = (title, message, type = 'info') => {
  db.prepare('INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)').run(title, message, type);
};

// Helper: create an inventory log
const createInventoryLog = (item_id, item_name, item_type, action, quantity, notes, user) => {
  db.prepare(
    `INSERT INTO inventory_logs (item_id, item_name, item_type, action, quantity, notes, user)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(item_id, item_name, item_type, action, quantity, notes || '', user || 'Admin');
};

// ─── GET /api/bundles ── list all products that have bundle definitions ────────
const getAllBundles = (req, res) => {
  try {
    const products = db.prepare(`
      SELECT DISTINCT p.id, p.name, p.category, p.quantity
      FROM products p
      INNER JOIN product_materials pm ON pm.product_id = p.id
      ORDER BY p.name
    `).all();

    return res.status(200).json({ products });
  } catch (err) {
    console.error('getAllBundles error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ─── GET /api/bundles/:productId ── get materials required for a product ───────
const getBundleByProduct = (req, res) => {
  try {
    const { productId } = req.params;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const materials = db.prepare(`
      SELECT
        pm.id AS bundle_id,
        pm.product_id,
        pm.material_id,
        pm.quantity_required,
        m.name AS material_name,
        m.type AS material_type,
        m.quantity AS available_quantity,
        m.unit,
        m.reorder_level
      FROM product_materials pm
      INNER JOIN materials m ON m.id = pm.material_id
      WHERE pm.product_id = ?
      ORDER BY m.name
    `).all(productId);

    return res.status(200).json({ product, materials });
  } catch (err) {
    console.error('getBundleByProduct error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ─── POST /api/bundles/:productId/materials ── add a material to a bundle ──────
const addMaterialToBundle = (req, res) => {
  try {
    const { productId } = req.params;
    const { material_id, quantity_required } = req.body;

    if (!material_id || !quantity_required) {
      return res.status(400).json({ error: 'material_id and quantity_required are required.' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(material_id);
    if (!material) return res.status(404).json({ error: 'Material not found.' });

    // Check if already exists
    const existing = db.prepare(
      'SELECT id FROM product_materials WHERE product_id = ? AND material_id = ?'
    ).get(productId, material_id);
    if (existing) {
      return res.status(409).json({ error: 'This material is already in the bundle. Update it instead.' });
    }

    const result = db.prepare(
      'INSERT INTO product_materials (product_id, material_id, quantity_required) VALUES (?, ?, ?)'
    ).run(productId, material_id, parseFloat(quantity_required));

    const newEntry = db.prepare(`
      SELECT pm.*, m.name AS material_name, m.type AS material_type, m.quantity AS available_quantity, m.unit
      FROM product_materials pm
      INNER JOIN materials m ON m.id = pm.material_id
      WHERE pm.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({ message: 'Material added to bundle.', entry: newEntry });
  } catch (err) {
    console.error('addMaterialToBundle error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ─── PUT /api/bundles/entry/:bundleId ── update quantity_required ────────────
const updateBundleEntry = (req, res) => {
  try {
    const { bundleId } = req.params;
    const { quantity_required } = req.body;

    if (!quantity_required || parseFloat(quantity_required) <= 0) {
      return res.status(400).json({ error: 'quantity_required must be a positive number.' });
    }

    const entry = db.prepare('SELECT * FROM product_materials WHERE id = ?').get(bundleId);
    if (!entry) return res.status(404).json({ error: 'Bundle entry not found.' });

    db.prepare('UPDATE product_materials SET quantity_required = ? WHERE id = ?')
      .run(parseFloat(quantity_required), bundleId);

    const updated = db.prepare(`
      SELECT pm.*, m.name AS material_name, m.type AS material_type, m.quantity AS available_quantity, m.unit
      FROM product_materials pm
      INNER JOIN materials m ON m.id = pm.material_id
      WHERE pm.id = ?
    `).get(bundleId);

    return res.status(200).json({ message: 'Bundle entry updated.', entry: updated });
  } catch (err) {
    console.error('updateBundleEntry error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ─── DELETE /api/bundles/entry/:bundleId ── remove a material from a bundle ──
const deleteBundleEntry = (req, res) => {
  try {
    const { bundleId } = req.params;
    const entry = db.prepare('SELECT * FROM product_materials WHERE id = ?').get(bundleId);
    if (!entry) return res.status(404).json({ error: 'Bundle entry not found.' });

    db.prepare('DELETE FROM product_materials WHERE id = ?').run(bundleId);
    return res.status(200).json({ message: 'Material removed from bundle.' });
  } catch (err) {
    console.error('deleteBundleEntry error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ─── POST /api/bundles/:productId/use ── deduct materials for N units ────────
// Body: { quantity: number, notes: string }
const useBundle = (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, notes } = req.body;

    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      return res.status(400).json({ error: 'quantity must be a positive integer.' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const bundleMaterials = db.prepare(`
      SELECT pm.*, m.name AS material_name, m.quantity AS available_quantity, m.unit, m.reorder_level
      FROM product_materials pm
      INNER JOIN materials m ON m.id = pm.material_id
      WHERE pm.product_id = ?
    `).all(productId);

    if (bundleMaterials.length === 0) {
      return res.status(400).json({ error: 'No materials defined for this product bundle.' });
    }

    // ── Pre-flight check: ensure all materials have sufficient stock ──────────
    const shortages = [];
    for (const pm of bundleMaterials) {
      const required = pm.quantity_required * qty;
      if (pm.available_quantity < required) {
        shortages.push({
          material: pm.material_name,
          required,
          available: pm.available_quantity,
          shortfall: required - pm.available_quantity,
        });
      }
    }

    if (shortages.length > 0) {
      return res.status(400).json({
        error: 'Insufficient stock for one or more materials.',
        shortages,
      });
    }

    // ── Deduct each material ─────────────────────────────────────────────────
    const deducted = [];
    for (const pm of bundleMaterials) {
      const required = pm.quantity_required * qty;
      db.prepare('UPDATE materials SET quantity = quantity - ? WHERE id = ?')
        .run(required, pm.material_id);

      const updatedMaterial = db.prepare('SELECT * FROM materials WHERE id = ?').get(pm.material_id);

      createInventoryLog(
        pm.material_id,
        pm.material_name,
        'material',
        'Stock Out',
        required,
        `Bundle usage: ${qty} × ${product.name}. ${notes || ''}`,
        req.user ? req.user.name : 'Admin'
      );

      // Low stock check after deduction
      if (updatedMaterial.quantity <= updatedMaterial.reorder_level) {
        createNotification(
          'Low Stock Alert',
          `"${pm.material_name}" is running low after bundle usage! Stock: ${updatedMaterial.quantity} (Reorder: ${updatedMaterial.reorder_level}).`,
          'warning'
        );
      }

      deducted.push({
        material_id: pm.material_id,
        material_name: pm.material_name,
        deducted: required,
        remaining: updatedMaterial.quantity,
        unit: pm.unit,
      });
    }

    createNotification(
      'Bundle Usage Recorded',
      `${qty} unit(s) of "${product.name}" packaged — ${bundleMaterials.length} material(s) deducted.`,
      'info'
    );

    return res.status(200).json({
      message: `Bundle usage recorded for ${qty} unit(s) of "${product.name}".`,
      deducted,
    });
  } catch (err) {
    console.error('useBundle error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ─── GET /api/bundles/:productId/calculate ── preview deduction (no write) ───
// Query: ?quantity=N
const calculateBundle = (req, res) => {
  try {
    const { productId } = req.params;
    const qty = parseInt(req.query.quantity) || 1;

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const bundleMaterials = db.prepare(`
      SELECT pm.*, m.name AS material_name, m.quantity AS available_quantity, m.unit, m.reorder_level
      FROM product_materials pm
      INNER JOIN materials m ON m.id = pm.material_id
      WHERE pm.product_id = ?
    `).all(productId);

    const breakdown = bundleMaterials.map(pm => {
      const required = pm.quantity_required * qty;
      const sufficient = pm.available_quantity >= required;
      return {
        material_id: pm.material_id,
        material_name: pm.material_name,
        unit: pm.unit,
        per_unit: pm.quantity_required,
        required,
        available: pm.available_quantity,
        sufficient,
        shortfall: sufficient ? 0 : required - pm.available_quantity,
      };
    });

    const canFulfill = breakdown.every(b => b.sufficient);

    return res.status(200).json({ product, quantity: qty, canFulfill, breakdown });
  } catch (err) {
    console.error('calculateBundle error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  getAllBundles,
  getBundleByProduct,
  addMaterialToBundle,
  updateBundleEntry,
  deleteBundleEntry,
  useBundle,
  calculateBundle,
};
