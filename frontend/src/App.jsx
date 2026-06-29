import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import axios from 'axios'

import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import { ToastContainer } from './components/Toast'

import Login from './views/Login'
import Dashboard from './views/Dashboard'
import GiftArticles from './views/GiftArticles'
import PackagingMaterials from './views/PackagingMaterials'
import CustomerOrders from './views/CustomerOrders'
import Inventory from './views/Inventory'
import Suppliers from './views/Suppliers'
import BundleMapping from './views/BundleMapping'
import Reports from './views/Reports'
import Notifications from './views/Notifications'
import Settings from './views/Settings'

// Axios global fallback setup
axios.defaults.baseURL = '/api'
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Page titles map
const PAGE_TITLES = {
  '/': 'Dashboard Overview',
  '/products': 'Gift Articles Catalog',
  '/materials': 'Packaging Materials',
  '/orders': 'Customer Orders',
  '/inventory': 'Material Inventory Console',
  '/suppliers': 'Vendor Suppliers',
  '/notifications': 'Alerts Notifications',
  '/bundle': 'Bundle Recipes Mapping',
  '/reports': 'Visual & CSV Reports',
  '/settings': 'Settings & Utilities',
}

// Protected route router guard
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

// App Layout (Sidebar + Navbar + Page Content)
function AppLayout() {
  const location = useLocation()
  const adminName = localStorage.getItem('adminName') || 'Admin'
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
            <Route path="/products" element={<GiftArticles />} />
            <Route path="/materials" element={<PackagingMaterials />} />
            <Route path="/orders" element={<CustomerOrders />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/bundle" element={<BundleMapping />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}

// Root App Entry Point
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
