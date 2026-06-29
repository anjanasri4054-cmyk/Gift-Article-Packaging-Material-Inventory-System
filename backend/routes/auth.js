const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const authMiddleware = require('../middleware/authMiddleware');

const JWT_SECRET = 'paperplane_secret_key_2024';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const admins = db.find('admins', a => a.email.toLowerCase() === email.toLowerCase());
  if (admins.length === 0) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const admin = admins[0];
  const isMatch = bcrypt.compareSync(password, admin.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username, email: admin.email, role: admin.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role
    }
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
