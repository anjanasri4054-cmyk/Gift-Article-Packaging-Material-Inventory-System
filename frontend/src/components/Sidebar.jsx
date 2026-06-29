import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import api from '../api'
import { LogOut } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/products', icon: '🎁', label: 'Gift Articles' },
  { path: '/materials', icon: '📦', label: 'Packaging Materials' },
  { path: '/orders', icon: '🛍️', label: 'Customer Orders' },
  { path: '/inventory', icon: '📋', label: 'Inventory' },
  { path: '/suppliers', icon: '🏭', label: 'Suppliers' },
  { path: '/bundle', icon: '🔗', label: 'Bundle Usage' },
  { path: '/reports', icon: '📊', label: 'Reports' },
  { path: '/notifications', icon: '🔔', label: 'Notifications', showBadge: true },
  { path: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [outOfStockCount, setOutOfStockCount] = useState(0)
  const adminName = localStorage.getItem('adminName') || 'Admin'

  const [branding, setBranding] = useState({
    businessName: localStorage.getItem('businessName') || 'Paper Plane',
    invoiceSubtitle: localStorage.getItem('invoiceSubtitle') || 'Inventory System'
  });

  useEffect(() => {
    fetchUnreadCount();
    fetchSettings();

    function handleSettingsUpdate() {
      setBranding({
        businessName: localStorage.getItem('businessName') || 'Paper Plane',
        invoiceSubtitle: localStorage.getItem('invoiceSubtitle') || 'Inventory System'
      });
    }

    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, []);

  async function fetchSettings() {
    try {
      const { data } = await api.get('/settings');
      if (data) {
        localStorage.setItem('businessName', data.businessName || 'Paper Plane');
        localStorage.setItem('invoiceSubtitle', data.invoiceSubtitle || 'Inventory System');
        setBranding({
          businessName: data.businessName || 'Paper Plane',
          invoiceSubtitle: data.invoiceSubtitle || 'Inventory System'
        });
      }
    } catch {
      // silently ignore
    }
  }

  async function fetchUnreadCount() {
    try {
      const { data } = await api.get('/notifications/unread-count')
      setUnreadCount(data.unreadCount || 0)
      setOutOfStockCount(data.outOfStockCount || 0)
    } catch {
      // silently fail
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('adminName');
    navigate('/login');
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
          <h1 style={{ fontSize: '0.92rem', lineHeight: '1.2', fontWeight: 800, color: 'var(--accent)' }} className="sidebar-logo-title">
            {branding.businessName}
          </h1>
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.5px', marginTop: '2px' }} className="sidebar-logo-subtitle">
            {branding.invoiceSubtitle || 'Inventory System'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main Menu</div>
        {NAV_ITEMS.slice(0, 6).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span className="nav-item-label">{item.label}</span>
            {item.path === '/materials' && outOfStockCount > 0 && (
              <span className="nav-badge" style={{ backgroundColor: 'var(--danger)', color: 'white', marginLeft: 'auto' }}>
                {outOfStockCount} out
              </span>
            )}
          </Link>
        ))}

        <div className="sidebar-section-label" style={{ marginTop: 16 }}>Reports & Tools</div>
        {NAV_ITEMS.slice(6).map((item) => (
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
      <div className="sidebar-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="sidebar-user" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="sidebar-avatar">{getInitials(adminName)}</div>
          <div className="sidebar-user-info">
            <h4 style={{ margin: 0, fontSize: '0.85rem' }}>{adminName}</h4>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>Admin</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn-icon"
          title="Sign Out"
          style={{ color: 'var(--danger)', padding: '6px', cursor: 'pointer' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
