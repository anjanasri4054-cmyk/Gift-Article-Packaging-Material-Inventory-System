const db = require('../database');

// Helper: create a notification
const createNotification = (title, message, type = 'info') => {
  db.prepare('INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)').run(title, message, type);
};

// GET /api/suppliers
const getAllSuppliers = (req, res) => {
  try {
    const { search, status } = req.query;
    let query = `
      SELECT s.*,
             COUNT(m.id) AS materials_count
      FROM suppliers s
      LEFT JOIN materials m ON m.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND s.name LIKE ?';
      params.push(`%${search}%`);
    }
    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }

    query += ' GROUP BY s.id ORDER BY s.created_at DESC';
    const suppliers = db.prepare(query).all(...params);
    return res.status(200).json({ suppliers });
  } catch (err) {
    console.error('getAllSuppliers error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/suppliers/:id
const getSupplierById = (req, res) => {
  try {
    const { id } = req.params;
    const supplier = db.prepare(
      `SELECT s.*, COUNT(m.id) AS materials_count
       FROM suppliers s
       LEFT JOIN materials m ON m.supplier_id = s.id
       WHERE s.id = ?
       GROUP BY s.id`
    ).get(id);

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found.' });
    }
    return res.status(200).json({ supplier });
  } catch (err) {
    console.error('getSupplierById error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/suppliers
const createSupplier = (req, res) => {
  try {
    const { name, phone, email, address, status } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Supplier name is required.' });
    }

    const result = db.prepare(
      `INSERT INTO suppliers (name, phone, email, address, status)
       VALUES (?, ?, ?, ?, ?)`
    ).run(name, phone || '', email || '', address || '', status || 'active');

    const newSupplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);

    createNotification(
      'New Supplier Added',
      `Supplier "${name}" has been added to the system.`,
      'info'
    );

    return res.status(201).json({ message: 'Supplier created successfully.', supplier: newSupplier });
  } catch (err) {
    console.error('createSupplier error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PUT /api/suppliers/:id
const updateSupplier = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found.' });
    }

    const {
      name = existing.name,
      phone = existing.phone,
      email = existing.email,
      address = existing.address,
      status = existing.status
    } = req.body;

    db.prepare(
      `UPDATE suppliers SET name=?, phone=?, email=?, address=?, status=? WHERE id=?`
    ).run(name, phone, email, address, status, id);

    const updated = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
    return res.status(200).json({ message: 'Supplier updated successfully.', supplier: updated });
  } catch (err) {
    console.error('updateSupplier error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/suppliers/:id
const deleteSupplier = (req, res) => {
  try {
    const { id } = req.params;
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found.' });
    }

    // Check if any materials reference this supplier
    const referencedMaterials = db.prepare('SELECT COUNT(*) as count FROM materials WHERE supplier_id = ?').get(id);
    if (referencedMaterials.count > 0) {
      return res.status(400).json({
        error: `Cannot delete supplier. ${referencedMaterials.count} material(s) are linked to this supplier. Please reassign or delete those materials first.`
      });
    }

    db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
    return res.status(200).json({ message: 'Supplier deleted successfully.' });
  } catch (err) {
    console.error('deleteSupplier error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getAllSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier };
