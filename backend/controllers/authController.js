const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'paperplane_secret_key_2024';

// POST /api/auth/login
const login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const payload = { id: admin.id, email: admin.email, name: admin.name };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    const { password: _pw, ...adminWithoutPassword } = admin;

    return res.status(200).json({
      message: 'Login successful',
      token,
      admin: adminWithoutPassword
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/auth/me
const getMe = (req, res) => {
  try {
    const admin = db.prepare('SELECT id, name, email FROM admins WHERE id = ?').get(req.user.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found.' });
    }
    return res.status(200).json({ admin });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  try {
    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { login, getMe, logout };
