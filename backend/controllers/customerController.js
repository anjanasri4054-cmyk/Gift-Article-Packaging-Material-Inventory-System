const db = require('../database');

// GET /api/customers
const getAllCustomers = (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM customers';
    const params = [];

    if (search) {
      query += ' WHERE customer_name LIKE ? OR phone LIKE ? OR email LIKE ?';
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild, searchWild);
    }
    query += ' ORDER BY customer_name ASC';

    const customers = db.prepare(query).all(...params);

    // For each customer, append order count
    const updated = customers.map(c => {
      const ordersCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE customer_id = ?').get(c.customer_id).count;
      return { ...c, orders_count: ordersCount };
    });

    return res.status(200).json({ customers: updated });
  } catch (err) {
    console.error('getAllCustomers error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/customers/:id
const getCustomerById = (req, res) => {
  try {
    const { id } = req.params;
    const customer = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const orders = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC').all(id);

    return res.status(200).json({ customer, orders });
  } catch (err) {
    console.error('getCustomerById error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/customers
const createCustomer = (req, res) => {
  try {
    const { customer_name, phone, email, address } = req.body;

    if (!customer_name) {
      return res.status(400).json({ error: 'Customer name is required.' });
    }

    const result = db.prepare(
      'INSERT INTO customers (customer_name, phone, email, address) VALUES (?, ?, ?, ?)'
    ).run(customer_name, phone || '', email || '', address || '');

    const newCustomer = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(result.lastInsertRowid);

    return res.status(201).json({ message: 'Customer created successfully.', customer: newCustomer });
  } catch (err) {
    console.error('createCustomer error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PUT /api/customers/:id
const updateCustomer = (req, res) => {
  try {
    const { id } = req.params;
    const { customer_name, phone, email, address } = req.body;

    if (!customer_name) {
      return res.status(400).json({ error: 'Customer name is required.' });
    }

    const customer = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    db.prepare(
      'UPDATE customers SET customer_name = ?, phone = ?, email = ?, address = ? WHERE customer_id = ?'
    ).run(customer_name, phone || '', email || '', address || '', id);

    const updated = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(id);

    return res.status(200).json({ message: 'Customer updated successfully.', customer: updated });
  } catch (err) {
    console.error('updateCustomer error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/customers/:id
const deleteCustomer = (req, res) => {
  try {
    const { id } = req.params;

    const customer = db.prepare('SELECT * FROM customers WHERE customer_id = ?').get(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // Check if customer has orders
    const ordersCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE customer_id = ?').get(id).count;
    if (ordersCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete customer. This customer has active orders in the database. Archive or cancel the orders first.'
      });
    }

    db.prepare('DELETE FROM customers WHERE customer_id = ?').run(id);

    return res.status(200).json({ message: 'Customer deleted successfully.' });
  } catch (err) {
    console.error('deleteCustomer error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
