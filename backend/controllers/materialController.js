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

// GET /api/materials
const getAllMaterials = (req, res) => {
  try {
    const { search, type, supplier_id } = req.query;
    let query = `
      SELECT m.*, s.name AS supplier_name
      FROM materials m
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND m.name LIKE ?';
      params.push(`%${search}%`);
    }
    if (type) {
      query += ' AND m.type = ?';
      params.push(type);
    }
    if (supplier_id) {
      query += ' AND m.supplier_id = ?';
      params.push(supplier_id);
    }

    query += ' ORDER BY m.created_at DESC';
    const materials = db.prepare(query).all(...params);
    return res.status(200).json({ materials });
  } catch (err) {
    console.error('getAllMaterials error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/materials/:id
const getMaterialById = (req, res) => {
  try {
    const { id } = req.params;
    const material = db.prepare(
      `SELECT m.*, s.name AS supplier_name
       FROM materials m
       LEFT JOIN suppliers s ON m.supplier_id = s.id
       WHERE m.id = ?`
    ).get(id);

    if (!material) {
      return res.status(404).json({ error: 'Material not found.' });
    }
    return res.status(200).json({ material });
  } catch (err) {
    console.error('getMaterialById error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/materials
const createMaterial = (req, res) => {
  try {
    const { name, type, quantity, unit, reorder_level, supplier_id, location } = req.body;

    if (!name || !type || quantity === undefined || !unit) {
      return res.status(400).json({ error: 'name, type, quantity, and unit are required.' });
    }

    const result = db.prepare(
      `INSERT INTO materials (name, type, quantity, unit, reorder_level, supplier_id, location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      name,
      type,
      parseInt(quantity) || 0,
      unit,
      parseInt(reorder_level) || 5,
      supplier_id ? parseInt(supplier_id) : null,
      location || ''
    );

    const newMaterial = db.prepare(
      `SELECT m.*, s.name AS supplier_name
       FROM materials m
       LEFT JOIN suppliers s ON m.supplier_id = s.id
       WHERE m.id = ?`
    ).get(result.lastInsertRowid);

    createNotification(
      'New Material Added',
      `Material "${name}" has been added to the inventory.`,
      'info'
    );
    createInventoryLog(newMaterial.id, name, 'material', 'Material Created', parseInt(quantity) || 0, 'New material added', req.user ? req.user.name : 'Admin');

    return res.status(201).json({ message: 'Material created successfully.', material: newMaterial });
  } catch (err) {
    console.error('createMaterial error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PUT /api/materials/:id
const updateMaterial = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM materials WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Material not found.' });
    }

    const {
      name = existing.name,
      type = existing.type,
      quantity = existing.quantity,
      unit = existing.unit,
      reorder_level = existing.reorder_level,
      supplier_id = existing.supplier_id,
      location = existing.location
    } = req.body;

    db.prepare(
      `UPDATE materials SET name=?, type=?, quantity=?, unit=?, reorder_level=?, supplier_id=?, location=?
       WHERE id=?`
    ).run(
      name,
      type,
      parseInt(quantity),
      unit,
      parseInt(reorder_level),
      supplier_id ? parseInt(supplier_id) : null,
      location,
      id
    );

    const updated = db.prepare(
      `SELECT m.*, s.name AS supplier_name
       FROM materials m
       LEFT JOIN suppliers s ON m.supplier_id = s.id
       WHERE m.id = ?`
    ).get(id);

    createInventoryLog(id, name, 'material', 'Material Updated', parseInt(quantity), 'Material details updated', req.user ? req.user.name : 'Admin');

    return res.status(200).json({ message: 'Material updated successfully.', material: updated });
  } catch (err) {
    console.error('updateMaterial error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/materials/:id
const deleteMaterial = (req, res) => {
  try {
    const { id } = req.params;
    const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(id);
    if (!material) {
      return res.status(404).json({ error: 'Material not found.' });
    }

    db.prepare('DELETE FROM materials WHERE id = ?').run(id);
    createInventoryLog(id, material.name, 'material', 'Material Deleted', material.quantity, 'Material removed from inventory', req.user ? req.user.name : 'Admin');

    return res.status(200).json({ message: 'Material deleted successfully.' });
  } catch (err) {
    console.error('deleteMaterial error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getAllMaterials, getMaterialById, createMaterial, updateMaterial, deleteMaterial };
