import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Navbar({ title, adminName, theme, toggleTheme }) {
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const isDark = theme === 'dark'

  useEffect(() => {
    fetchUnreadCount()
    const notifInterval = setInterval(fetchUnreadCount, 30000)
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => {
      clearInterval(notifInterval)
      clearInterval(clockInterval)
    }
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
    return (name || 'A').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h2 className="navbar-title">{title}</h2>
      </div>

      <div className="navbar-right">
        <div className="navbar-time">
          📅 {formatDate(currentTime)} &nbsp;|&nbsp; 🕐 {formatTime(currentTime)}
        </div>

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title="Toggle Dark/Light Mode"
        >
          {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>

        <button
          className="notification-btn"
          onClick={() => navigate('/notifications')}
          title="Notifications"
        >
          🔔
          {unreadCount > 0 && (
            <span className="notification-count">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="navbar-admin">
          <div className="admin-avatar">{getInitials(adminName)}</div>
          <div className="admin-info">
            <h4>{adminName || 'Admin'}</h4>
            <p>Administrator</p>
          </div>
        </div>
      </div>
    </header>
  )
}
