import React from 'react'

export default function StatCard({ title, value, icon, color = 'primary', trend, onClick }) {
  return (
    <div
      className={`stat-card ${color}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="stat-card-header">
        <div>
          <div className="stat-card-label">{title}</div>
          <div className="stat-card-value">{value ?? '—'}</div>
          {trend !== undefined && (
            <div className={`stat-card-trend ${trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'trend-neutral'}`}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
              {' '}
              {trend > 0 ? `+${trend}` : trend} this week
            </div>
          )}
        </div>
        <div className="stat-card-icon">{icon}</div>
      </div>
    </div>
  )
}
