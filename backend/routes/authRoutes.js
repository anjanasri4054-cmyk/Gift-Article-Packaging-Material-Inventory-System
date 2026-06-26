const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  login,
  getMe,
  logout
} = require('../controllers/authController');

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me (protected)
router.get('/me', authMiddleware, getMe);

// POST /api/auth/logout
router.post('/logout', logout);

module.exports = router;
