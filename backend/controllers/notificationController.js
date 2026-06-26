const db = require('../database');

// GET /api/notifications
const getAllNotifications = (req, res) => {
  try {
    const notifications = db.prepare(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50'
    ).all();
    return res.status(200).json({ notifications });
  } catch (err) {
    console.error('getAllNotifications error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/notifications/unread-count
const getUnreadCount = (req, res) => {
  try {
    const result = db.prepare(
      "SELECT COUNT(*) as count FROM notifications WHERE status = 'unread'"
    ).get();
    return res.status(200).json({ count: result.count });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PUT /api/notifications/:id/read
const markAsRead = (req, res) => {
  try {
    const { id } = req.params;
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    db.prepare("UPDATE notifications SET status = 'read' WHERE id = ?").run(id);
    return res.status(200).json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error('markAsRead error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// PUT /api/notifications/read-all
const markAllAsRead = (req, res) => {
  try {
    db.prepare("UPDATE notifications SET status = 'read' WHERE status = 'unread'").run();
    return res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('markAllAsRead error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/notifications/:id
const deleteNotification = (req, res) => {
  try {
    const { id } = req.params;
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
    return res.status(200).json({ message: 'Notification deleted successfully.' });
  } catch (err) {
    console.error('deleteNotification error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { getAllNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification };
