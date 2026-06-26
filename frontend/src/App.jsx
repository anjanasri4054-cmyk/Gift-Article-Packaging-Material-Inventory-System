import React, { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import axios from 'axios'

import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import { ToastContainer } from './components/Toast'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Materials from './pages/Materials'
import StockIn from './pages/StockIn'
import StockOut from './pages/StockOut'
import Suppliers from './pages/Suppliers'
import History from './pages/History'
import Notifications from './pages/Notifications'
import Bundle from './pages/Bundle'
import Reports from './pages/Reports'
import Orders from './pages/Orders'

// ── Axios global setup ──────────────────────────────────────────────────
axios.defaults.baseURL = '/api'

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axios.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
)

// ── Page titles map ──────────────────────────────────────────────────────
const PAGE_TITLES = {
  '/': 'Dashboard',
  '/products': 'Gift Articles',
  '/materials': 'Packaging Materials',
  '/orders': 'Customer Orders',
  '/stock-in': 'Stock In',
  '/stock-out': 'Stock Out',
  '/suppliers': 'Suppliers',
  '/history': 'Inventory History',
  '/notifications': 'Notifications',
  '/bundle': 'Bundle / Material Usage',
  '/reports': 'Reports & Exports',
}

// ── App Layout (Sidebar + Navbar + Content) ──────────────────────────────
function AppLayout() {
  const location = useLocation()
  const adminName = 'Admin'
  const pageTitle = PAGE_TITLES[location.pathname] || 'Gift & Packaging'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark')
    } else {
      document.body.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', newTheme)
    setTheme(newTheme)
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content" key={theme}>
        <Navbar title={pageTitle} adminName={adminName} theme={theme} toggleTheme={toggleTheme} />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/stock-in" element={<StockIn />} />
            <Route path="/stock-out" element={<StockOut />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/history" element={<History />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/bundle" element={<Bundle />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}

// ── Root App ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  )
}
