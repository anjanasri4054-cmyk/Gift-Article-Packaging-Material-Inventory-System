import React, { useState, useCallback, useEffect, useRef } from 'react'

let globalAddToast = null

export function useToast() {
  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    if (globalAddToast) globalAddToast(message, type, duration)
  }, [])
  return { addToast }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])
  const counterRef = useRef(0)

  useEffect(() => {
    globalAddToast = (message, type, duration) => {
      const id = ++counterRef.current
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration || 4000)
    }
    return () => { globalAddToast = null }
  }, [])

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span>{icons[toast.type] || 'ℹ️'}</span>
          <span>{toast.message}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, color: 'inherit', fontSize: '1rem' }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

// Simple standalone toast function for pages that don't use the hook
export function toast(message, type = 'success', duration = 4000) {
  if (globalAddToast) globalAddToast(message, type, duration)
}
