const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/customers (list all customers, with optional search filter)
router.get('/', (req, res) => {
  try {
    const { search } = req.query;
    let customers = db.find('customers');

    if (search) {
      const q = search.toLowerCase();
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.phone.includes(q) || 
        (c.email && c.email.toLowerCase().includes(q))
      );
    }

    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers', details: err.message });
  }
});

// GET /api/customers/:id
router.get('/:id', (req, res) => {
  try {
    const customer = db.findById('customers', req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customer', details: err.message });
  }
});

// POST /api/customers
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Customer name and phone number are required' });
    }

    const newCustomer = db.insert('customers', {
      name,
      phone,
      email: email || '',
      address: address || ''
    });

    res.status(201).json(newCustomer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create customer', details: err.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.findById('customers', id);
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const { name, phone, email, address } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;

    const updated = db.update('customers', id, updateData);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update customer', details: err.message });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const id = req.params.id;
    const existing = db.findById('customers', id);
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if customer has orders
    const orders = db.find('orders', o => o.customerId === Number(id));
    if (orders.length > 0) {
      return res.status(400).json({ error: 'Cannot delete customer. They have active orders in the database.' });
    }

    db.delete('customers', id);
    res.json({ message: 'Customer profile deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete customer', details: err.message });
  }
});

module.exports = router;
