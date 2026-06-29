const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/authMiddleware');

// All notification routes are protected
router.use(authMiddleware);

// GET /api/notifications (get all notifications, max 50, sorted by date DESC)
router.get('/', (req, res) => {
  try {
    const notifications = db.find('notifications');
    notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(notifications.slice(0, 50));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications', details: err.message });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', (req, res) => {
  try {
    const unread = db.find('notifications', n => n.readStatus === 'unread').length;
    const materials = db.find('materials');
    const outOfStock = materials.filter(m => m.currentStock <= 0).length;
    const lowStock = materials.filter(m => m.currentStock <= m.minimumStock && m.currentStock > 0).length;

    res.json({
      unreadCount: unread,
      count: unread,
      outOfStockCount: outOfStock,
      lowStockCount: lowStock
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unread notifications count', details: err.message });
  }
});

// PUT /api/notifications/read-all (mark all as read)
router.put('/read-all', (req, res) => {
  try {
    const notifications = db.find('notifications');
    notifications.forEach(n => {
      if (n.readStatus === 'unread') {
        db.update('notifications', n.id, { readStatus: 'read' });
      }
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notifications status', details: err.message });
  }
});

// PUT /api/notifications/:id/read (mark single notification as read)
router.put('/:id/read', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = db.findById('notifications', id);
    if (!existing) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updated = db.update('notifications', id, { readStatus: 'read' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read', details: err.message });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = db.findById('notifications', id);
    if (!existing) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    db.delete('notifications', id);
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notification', details: err.message });
  }
});

module.exports = router;
