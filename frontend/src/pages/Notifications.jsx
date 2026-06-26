import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from '../components/Toast'

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  try {
    const now = new Date()
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    const seconds = Math.floor((now - date) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch (e) {
    return dateStr || '—'
  }
}

function getNotificationIcon(type) {
  const map = {
    'low_stock': '⚠️',
    'warning': '⚠️',
    'product_added': '🎁',
    'material_added': '📦',
    'stock_updated': '📊',
    'stock_in': '📥',
    'stock_out': '📤',
    'info': 'ℹ️',
    'success': '✅',
    'error': '❌',
  }
  return map[(type || '').toLowerCase()] || 'ℹ️'
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get('/notifications')
      setNotifications(res.data.notifications || res.data || [])
    } catch (err) {
      toast.error('Failed to load notifications')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = async (id) => {
    try {
      await axios.put(`/notifications/${id}/read`)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, status: 'read' } : n)
      )
    } catch (err) {
      toast.error('Failed to mark as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      await axios.put('/notifications/read-all')
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'read' }))
      )
      toast.success('All notifications marked as read')
    } catch (err) {
      toast.error('Failed to mark all as read')
    }
  }

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('Notification deleted')
    } catch (err) {
      toast.error('Failed to delete notification')
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return n.status === 'unread'
    if (filter === 'read') return n.status === 'read'
    return true
  })

  const unreadCount = notifications.filter(n => n.status === 'unread').length

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <p className="loading-text">Loading notifications...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>🔔 Notifications</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {unreadCount > 0 && (
            <button className="btn btn-primary" onClick={markAllAsRead}>
              ✓ Mark All as Read
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
          <div className="empty-state-icon">🔔</div>
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
                cursor: notification.status === 'unread' ? 'pointer' : 'default',
                borderLeft: notification.status === 'unread'
                  ? '4px solid var(--accent)'
                  : '4px solid transparent',
                background: notification.status === 'unread'
                  ? 'linear-gradient(135deg, var(--card-bg), var(--accent-light))'
                  : 'var(--card-bg)',
                opacity: notification.status === 'read' ? 0.8 : 1,
                transition: 'all 0.2s ease',
                animation: 'fadeIn 0.3s ease',
              }}
              onClick={() => {
                if (notification.status === 'unread') markAsRead(notification.id)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1 }}>
                  {/* Icon */}
                  <div style={{
                    fontSize: 28,
                    minWidth: 44,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                    background: notification.status === 'unread'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'var(--bg)',
                  }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: notification.status === 'unread' ? 700 : 500,
                        color: 'var(--text-primary)',
                      }}>
                        {notification.title}
                      </h4>
                      {notification.status === 'unread' && (
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
                      fontSize: 12,
                      color: 'var(--text-muted)',
                    }}>
                      {timeAgo(notification.created_at)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {notification.status === 'unread' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(notification.id)
                      }}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(notification.id)
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
