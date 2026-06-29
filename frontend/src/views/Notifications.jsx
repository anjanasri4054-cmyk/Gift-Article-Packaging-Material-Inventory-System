import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Gift, Package, BarChart3, Info, Check, Trash2, CheckCircle } from 'lucide-react';
import api from '../api';
import { toast } from '../components/Toast';

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  try {
    const now = new Date();
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr || '—';
  }
}

function getNotificationIcon(type) {
  const size = 20;
  const map = {
    'low_stock': <AlertTriangle size={size} style={{ color: 'var(--danger)' }} />,
    'warning': <AlertTriangle size={size} style={{ color: 'var(--danger)' }} />,
    'product_added': <Gift size={size} style={{ color: 'var(--accent)' }} />,
    'material_added': <Package size={size} style={{ color: 'var(--info)' }} />,
    'stock_updated': <BarChart3 size={size} style={{ color: 'var(--success)' }} />,
    'stock_in': <Package size={size} style={{ color: 'var(--success)' }} />,
    'stock_out': <Package size={size} style={{ color: 'var(--danger)' }} />,
    'info': <Info size={size} style={{ color: 'var(--info)' }} />,
    'success': <CheckCircle size={size} style={{ color: 'var(--success)' }} />
  };
  return map[(type || '').toLowerCase()] || <Info size={size} style={{ color: 'var(--info)' }} />;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      toast('Failed to load notifications', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      const [prodRes, matRes] = await Promise.all([
        api.get('/products'),
        api.get('/materials')
      ]);
      setProducts(prodRes.data || []);
      setMaterials(matRes.data || []);
    } catch (err) {
      console.error('Failed to load catalog items', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchItems();
  }, [fetchNotifications, fetchItems]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, readStatus: 'read' } : n)
      );
    } catch (err) {
      toast('Failed to mark notification as read', 'error');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev =>
        prev.map(n => ({ ...n, readStatus: 'read' }))
      );
      toast('All notifications marked as read', 'success');
    } catch (err) {
      toast('Failed to mark all as read', 'error');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast('Notification deleted successfully', 'success');
    } catch (err) {
      toast('Failed to delete notification', 'error');
    }
  };

  const handleNotificationClick = async (notification) => {
    // 1. Mark as read on click
    if (notification.readStatus === 'unread') {
      try {
        await api.put(`/notifications/${notification.id}/read`);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, readStatus: 'read' } : n)
        );
      } catch (err) {
        console.error('Failed to mark notification as read on click', err);
      }
    }

    // 2. Parse item name from message
    const msg = notification.message || '';
    
    // Check materials first
    const matchedMaterial = materials.find(m => msg.toLowerCase().includes(m.name.toLowerCase()));
    if (matchedMaterial) {
      navigate(`/materials?search=${encodeURIComponent(matchedMaterial.name)}`);
      return;
    }

    // Check products next
    const matchedProduct = products.find(p => msg.toLowerCase().includes(p.name.toLowerCase()));
    if (matchedProduct) {
      navigate(`/products?search=${encodeURIComponent(matchedProduct.name)}`);
      return;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return n.readStatus === 'unread';
    if (filter === 'read') return n.readStatus === 'read';
    return true;
  });

  const unreadCount = notifications.filter(n => n.readStatus === 'unread').length;

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <p className="loading-text">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={24} /> Notifications Alerts
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {unreadCount > 0 && (
            <button className="btn btn-primary" onClick={markAllAsRead}>
              <Check size={16} style={{ marginRight: '4px' }} /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { key: 'all', label: `All (${notifications.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'read', label: `Read (${notifications.length - unreadCount})` },
        ].map(tab => (
          <button
            key={tab.key}
            className={`btn ${filter === tab.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Bell size={40} style={{ color: 'var(--text-muted)' }} /></div>
          <h3>No notifications</h3>
          <p>{filter === 'all' ? 'No notifications yet.' : `No ${filter} notifications.`}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className="card"
              style={{
                padding: '16px 20px',
                cursor: 'pointer',
                borderLeft: notification.readStatus === 'unread'
                  ? '4px solid var(--accent)'
                  : '4px solid transparent',
                background: notification.readStatus === 'unread'
                  ? 'linear-gradient(135deg, var(--card-bg), var(--accent-light))'
                  : 'var(--card-bg)',
                opacity: notification.readStatus === 'read' ? 0.75 : 1,
                transition: 'all 0.2s ease',
                animation: 'fadeIn 0.3s ease',
              }}
              onClick={() => handleNotificationClick(notification)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1 }}>
                  {/* Icon */}
                  <div style={{
                    minWidth: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                    background: notification.readStatus === 'unread'
                      ? 'rgba(245, 158, 11, 0.12)'
                      : 'var(--bg)',
                  }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: 14.5,
                        fontWeight: notification.readStatus === 'unread' ? 700 : 500,
                        color: 'var(--text-primary)',
                      }}>
                        {notification.type === 'warning' ? 'Low Stock Alert' : 'System Event'}
                      </h4>
                      {notification.readStatus === 'unread' && (
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--accent)',
                          display: 'inline-block',
                          flexShrink: 0,
                        }} />
                      )}
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}>
                      {notification.message}
                    </p>
                    <p style={{
                      margin: '6px 0 0',
                      fontSize: 11.5,
                      color: 'var(--text-muted)',
                    }}>
                      {timeAgo(notification.date)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {notification.readStatus === 'unread' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      title="Mark as read"
                      style={{ padding: '0 8px', height: '30px' }}
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    title="Delete"
                    style={{ padding: '0 8px', height: '30px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
