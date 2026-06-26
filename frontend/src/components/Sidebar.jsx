import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import axios from 'axios'

const NAV_ITEMS = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/products', icon: '🎁', label: 'Gift Articles' },
  { path: '/materials', icon: '📦', label: 'Packaging Materials' },
  { path: '/orders', icon: '🛍️', label: 'Customer Orders' },
  { path: '/stock-in', icon: '📥', label: 'Stock In' },
  { path: '/stock-out', icon: '📤', label: 'Stock Out' },
  { path: '/suppliers', icon: '🏭', label: 'Suppliers' },
  { path: '/bundle', icon: '🔗', label: 'Bundle Usage' },
  { path: '/history', icon: '📜', label: 'History' },
  { path: '/reports', icon: '📊', label: 'Reports' },
  { path: '/notifications', icon: '🔔', label: 'Notifications', showBadge: true },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const adminName = 'Admin'

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchUnreadCount() {
    try {
      const { data } = await axios.get('/notifications/unread-count')
      setUnreadCount(data.count || 0)
    } catch {
      // silently fail
    }
  }

  function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🎁</div>
        <div className="sidebar-logo-text">
          <h1 style={{ fontSize: '0.72rem', lineHeight: '1.3', fontWeight: 700 }} className="sidebar-logo-title">
            Gift Article &<br />Packaging Material
          </h1>
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }} className="sidebar-logo-subtitle">
            Inventory System
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main Menu</div>
        {NAV_ITEMS.slice(0, 7).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span className="nav-item-label">{item.label}</span>
          </Link>
        ))}

        <div className="sidebar-section-label" style={{ marginTop: 16 }}>Reports & Tools</div>
        {NAV_ITEMS.slice(7).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span className="nav-item-label">{item.label}</span>
            {item.showBadge && unreadCount > 0 && (
              <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{getInitials(adminName)}</div>
          <div className="sidebar-user-info">
            <h4>{adminName}</h4>
            <p>Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
