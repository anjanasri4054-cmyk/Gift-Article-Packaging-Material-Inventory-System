import React from 'react'

export default function AlertBadge({ count, type = 'danger' }) {
  if (!count || count === 0) return null

  const colors = {
    danger: { bg: 'var(--danger)', text: 'white' },
    warning: { bg: 'var(--accent)', text: 'var(--primary)' },
  }

  const style = colors[type] || colors.danger

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: style.bg,
        color: style.text,
        borderRadius: '999px',
        fontSize: '0.65rem',
        fontWeight: '700',
        padding: '2px 7px',
        minWidth: '20px',
        animation: 'pulse 2s infinite',
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
