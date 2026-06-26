import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import StatCard from '../components/StatCard'
import { InventoryDistributionChart, MonthlyMovementChart } from '../components/Charts'
import { toast } from '../components/Toast'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [statsRes, chartRes, lowStockRes, activityRes] = await Promise.all([
        axios.get('/dashboard/stats'),
        axios.get('/dashboard/chart-data'),
        axios.get('/dashboard/low-stock'),
        axios.get('/dashboard/recent-activity'),
      ])
      setStats(statsRes.data)

      // Map backend field names to what charts expect
      setChartData({
        distribution: chartRes.data.inventoryDistribution || chartRes.data.distribution,
        monthly: chartRes.data.monthlyMovements || chartRes.data.monthly,
      })

      // Merge products and materials into a flat low-stock list
      const lowStockData = lowStockRes.data
      const combined = []
      if (lowStockData.products) {
        lowStockData.products.forEach(p => combined.push({ ...p, type: 'product' }))
      }
      if (lowStockData.materials) {
        lowStockData.materials.forEach(m => combined.push({ ...m, type: 'material' }))
      }
      // Fallback: if it's already an array
      if (Array.isArray(lowStockData)) {
        combined.push(...lowStockData)
      }
      setLowStock(combined)

      // Recent activity
      const actData = activityRes.data
      setRecentActivity(actData.logs || actData || [])
      setRecentOrders(actData.orders || [])
    } catch (err) {
      setError('Failed to load dashboard data. Please check your connection.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  function getActionBadge(action) {
    const map = {
      'stock_in': { class: 'badge-success', label: 'Stock In' },
      'stock in': { class: 'badge-success', label: 'Stock In' },
      'stock_out': { class: 'badge-danger', label: 'Stock Out' },
      'stock out': { class: 'badge-danger', label: 'Stock Out' },
      'product_created': { class: 'badge-info', label: 'Product Added' },
      'product created': { class: 'badge-info', label: 'Product Added' },
      'product_updated': { class: 'badge-amber', label: 'Product Updated' },
      'product updated': { class: 'badge-amber', label: 'Product Updated' },
      'product_deleted': { class: 'badge-danger', label: 'Product Deleted' },
      'product deleted': { class: 'badge-danger', label: 'Product Deleted' },
      'material_created': { class: 'badge-info', label: 'Material Added' },
      'material created': { class: 'badge-info', label: 'Material Added' },
      'material_updated': { class: 'badge-amber', label: 'Material Updated' },
      'material updated': { class: 'badge-amber', label: 'Material Updated' },
      'material_deleted': { class: 'badge-danger', label: 'Material Deleted' },
      'material deleted': { class: 'badge-danger', label: 'Material Deleted' },
    }
    const key = (action || '').toLowerCase()
    const info = map[key] || map[key.replace(/ /g, '_')] || { class: 'badge-primary', label: action }
    return <span className={`badge ${info.class}`}>{info.label}</span>
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function getOrderStatusBadge(status) {
    const map = {
      'Pending': 'badge-amber',
      'In Production': 'badge-info',
      'Ready': 'badge-primary',
      'Completed': 'badge-success',
      'Cancelled': 'badge-danger',
    }
    const cls = map[status] || 'badge-primary'
    return <span className={`badge ${cls}`}>{status}</span>
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <p className="loading-text">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return <div className="alert alert-danger"><span>⚠️</span><span>{error}</span></div>
  }

  return (
    <div>
      {/* Inventory Overview */}
      <div className="section-header" style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <span>📦</span> Inventory Overview
        </h2>
      </div>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard
          title="Gift Articles"
          value={stats?.totalProducts ?? 0}
          icon="🎁"
          color="gift-articles"
        />
        <StatCard
          title="Packaging Materials"
          value={stats?.totalMaterials ?? 0}
          icon="📦"
          color="packaging-materials"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockItems ?? stats?.lowStockCount ?? 0}
          icon="⚠️"
          color="low-stock"
          onClick={() => document.getElementById('low-stock-section')?.scrollIntoView({ behavior: 'smooth' })}
        />
        <StatCard
          title="Total Suppliers"
          value={stats?.totalSuppliers ?? 0}
          icon="🏭"
          color="suppliers"
        />
        <StatCard
          title="Today's Movements"
          value={stats?.todayMovements ?? 0}
          icon="📊"
          color="movements"
        />
        <StatCard
          title="Unread Notifications"
          value={stats?.unreadNotifications ?? 0}
          icon="🔔"
          color="notifications"
          onClick={() => navigate('/notifications')}
        />
      </div>

      {/* Customer Orders Overview */}
      <div className="section-header" style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <span>🛍️</span> Customer Orders Overview
        </h2>
      </div>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders ?? 0}
          icon="🛍️"
          color="total-orders"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pendingOrders ?? 0}
          icon="⏳"
          color="pending-orders"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Completed Orders"
          value={stats?.completedOrders ?? 0}
          icon="✅"
          color="completed-orders"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Today's Orders"
          value={stats?.todayOrders ?? 0}
          icon="📅"
          color="todays-orders"
          onClick={() => navigate('/orders')}
        />
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>📊 Inventory by Category</h3>
            <span className="badge badge-info">{chartData?.distribution?.labels?.length || 0} categories</span>
          </div>
          <div className="chart-body" style={{ height: 300 }}>
            {chartData?.distribution
              ? <InventoryDistributionChart data={chartData.distribution} />
              : <div className="empty-state"><p>No data available</p></div>
            }
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>📈 Monthly Movement</h3>
            <span className="badge badge-primary">Last 6 months</span>
          </div>
          <div className="chart-body" style={{ height: 300 }}>
            {chartData?.monthly
              ? <MonthlyMovementChart data={chartData.monthly} />
              : <div className="empty-state"><p>No data available</p></div>
            }
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div id="low-stock-section" className="card mb-24">
        <div className="card-header low-stock-alert-header">
          <h3>🚨 Low Stock Alerts</h3>
          <span className="badge low-stock-badge">
            {lowStock.length} item{lowStock.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="table-container">
          {lowStock.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <h3>All items are well-stocked!</h3>
              <p>No items are below minimum stock levels.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Type</th>
                  <th>Current Qty</th>
                  <th>Min Level</th>
                  <th>Shortage</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item, idx) => (
                  <tr key={idx}>
                    <td><strong>{item.name}</strong></td>
                    <td>
                      <span className={`badge ${item.type === 'product' ? 'badge-amber' : 'badge-info'}`}>
                        {item.type === 'product' ? '🎁 Gift Article' : '📦 Material'}
                      </span>
                    </td>
                    <td><span className="quantity-low">{item.quantity}</span></td>
                    <td>{item.minimum_stock || item.reorder_level}</td>
                    <td>
                      <span className="badge badge-danger">
                        −{Math.abs((item.minimum_stock || item.reorder_level) - item.quantity)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate('/stock-in')}
                      >
                        📥 Reorder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Customer Orders */}
      <div className="card mb-24">
        <div className="card-header">
          <h3>🛍️ Recent Customer Orders</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/orders')}>
            Manage Orders →
          </button>
        </div>
        <div className="table-container">
          {recentOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No recent orders</h3>
              <p>Customer orders will appear here.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer Name</th>
                  <th>Order Type</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Delivery Date</th>
                  <th>Order Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, idx) => (
                  <tr key={idx}>
                    <td><strong>{order.order_number}</strong></td>
                    <td>{order.customer_name}</td>
                    <td><span className="badge badge-primary">{order.order_type}</span></td>
                    <td>Rs. {Number(order.total_amount || 0).toLocaleString()}</td>
                    <td>{getOrderStatusBadge(order.status)}</td>
                    <td>{formatDate(order.delivery_date)}</td>
                    <td>{formatDate(order.order_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3>🕐 Recent Activity</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/history')}>
            View All →
          </button>
        </div>
        <div className="table-container">
          {recentActivity.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No recent activity</h3>
              <p>Inventory transactions will appear here.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Action</th>
                  <th>Quantity</th>
                  <th>User</th>
                  <th>Notes</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.slice(0, 10).map((activity, idx) => (
                  <tr key={idx}>
                    <td><strong>{activity.item_name || activity.itemName}</strong></td>
                    <td>{getActionBadge(activity.action || activity.action_type)}</td>
                    <td>{activity.quantity ?? '—'}</td>
                    <td>{activity.user || activity.performed_by || 'Admin'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activity.notes || '—'}
                    </td>
                    <td>{formatDate(activity.created_at || activity.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
