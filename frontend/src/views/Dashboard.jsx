import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gift,
  Package,
  AlertTriangle,
  Factory,
  BarChart3,
  Bell,
  ShoppingBag,
  Hourglass,
  CheckCircle,
  Calendar,
  Clock,
  ClipboardList
} from 'lucide-react';
import api from '../api';
import StatCard from '../components/StatCard';
import { InventoryDistributionChart, MonthlyMovementChart } from '../components/CustomCharts';
import { toast } from '../components/Toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activityFilter, setActivityFilter] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, chartRes, lowStockRes, activityRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/chart-data'),
        api.get('/dashboard/low-stock'),
        api.get('/dashboard/recent-activity'),
      ]);
      setStats(statsRes.data);

      setChartData({
        distribution: chartRes.data.inventoryDistribution,
        monthly: chartRes.data.monthlyMovements,
      });

      setLowStock(lowStockRes.data || []);

      setRecentActivity(activityRes.data.logs || []);
      setRecentOrders(activityRes.data.orders || []);
    } catch (err) {
      setError('Failed to load dashboard data. Please check your connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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
    };
    const key = (action || '').toLowerCase();
    const info = map[key] || map[key.replace(/ /g, '_')] || { class: 'badge-primary', label: action };
    return <span className={`badge ${info.class}`}>{info.label}</span>;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getOrderStatusBadge(status) {
    const map = {
      'Pending': 'badge-amber',
      'In Production': 'badge-info',
      'Ready': 'badge-primary',
      'Completed': 'badge-success',
      'Cancelled': 'badge-danger',
    };
    const cls = map[status] || 'badge-primary';
    return <span className={`badge ${cls}`}>{status}</span>;
  }

  const filteredActivity = recentActivity.filter(activity => {
    if (!activityFilter) return true;
    const act = (activity.action || '').toLowerCase();
    const filter = activityFilter.toLowerCase();
    return act === filter;
  });

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
        <p className="loading-text">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertTriangle size={18} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div>
      {/* Inventory Overview */}
      <div className="section-header" style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <Package size={20} />
          Inventory Overview
        </h2>
      </div>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard
          title="Gift Articles"
          value={stats?.totalProducts ?? 0}
          icon={<Gift size={22} />}
          color="gift-articles"
        />
        <StatCard
          title="Packaging Materials"
          value={stats?.totalMaterials ?? 0}
          icon={<Package size={22} />}
          color="packaging-materials"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockItems ?? 0}
          icon={<AlertTriangle size={22} />}
          color="low-stock"
          onClick={() => document.getElementById('low-stock-section')?.scrollIntoView({ behavior: 'smooth' })}
        />
        <StatCard
          title="Total Suppliers"
          value={stats?.totalSuppliers ?? 0}
          icon={<Factory size={22} />}
          color="suppliers"
        />
        <StatCard
          title="Today's Movements"
          value={stats?.todayMovements ?? 0}
          icon={<BarChart3 size={22} />}
          color="movements"
        />
        <StatCard
          title="Unread Notifications"
          value={stats?.unreadNotifications ?? 0}
          icon={<Bell size={22} />}
          color="notifications"
          onClick={() => navigate('/notifications')}
        />
      </div>

      {/* Customer Orders Overview */}
      <div className="section-header" style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <ShoppingBag size={20} />
          Customer Orders Overview
        </h2>
      </div>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders ?? 0}
          icon={<ShoppingBag size={22} />}
          color="total-orders"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pendingOrders ?? 0}
          icon={<Hourglass size={22} />}
          color="pending-orders"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Completed Orders"
          value={stats?.completedOrders ?? 0}
          icon={<CheckCircle size={22} />}
          color="completed-orders"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Today's Orders"
          value={stats?.todayOrders ?? 0}
          icon={<Calendar size={22} />}
          color="todays-orders"
          onClick={() => navigate('/orders')}
        />
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3><BarChart3 size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Orders by Customer</h3>
            <span className="badge badge-info">{chartData?.distribution?.labels?.length || 0} customers</span>
          </div>
          <div className="chart-body" style={{ height: 300 }}>
            {chartData?.distribution ? (
              <InventoryDistributionChart data={{ ...chartData.distribution, centerText: 'Orders' }} />
            ) : (
              <div className="empty-state"><p>No data available</p></div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3><Clock size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Monthly Movement</h3>
            <span className="badge badge-primary">Last 6 months</span>
          </div>
          <div className="chart-body" style={{ height: 300 }}>
            {chartData?.monthly ? (
              <MonthlyMovementChart
                data={chartData.monthly}
                onChartClick={(actionType) => {
                  setActivityFilter(activityFilter === actionType ? null : actionType);
                  document.getElementById('recent-activity-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            ) : (
              <div className="empty-state"><p>No data available</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div id="low-stock-section" className="card mb-24">
        <div className="card-header low-stock-alert-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3><AlertTriangle size={18} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#f87171' }} /> Low Stock Alerts</h3>
          <span className="badge low-stock-badge">
            {lowStock.length} item{lowStock.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="table-container">
          {lowStock.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><CheckCircle size={40} style={{ color: '#10b981' }} /></div>
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
                      <span className="badge badge-info">
                        Packaging Material
                      </span>
                    </td>
                    <td><span className="quantity-low">{item.quantity}</span></td>
                    <td>{item.reorder_level}</td>
                    <td>
                      <span className="badge badge-danger">
                        −{Math.abs(item.reorder_level - item.quantity)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate('/inventory')}
                      >
                        Reorder
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
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3><ShoppingBag size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Recent Customer Orders</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/orders')}>
            Manage Orders →
          </button>
        </div>
        <div className="table-container">
          {recentOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><ClipboardList size={40} /></div>
              <h3>No recent orders</h3>
              <p>Customer orders will appear here.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer Name</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Delivery Date</th>
                  <th>Order Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, idx) => (
                  <tr key={idx}>
                    <td><strong>{order.orderNumber}</strong></td>
                    <td>{order.customer_name}</td>
                    <td>Rs. {Number(order.totalPrice || 0).toLocaleString()}</td>
                    <td>{getOrderStatusBadge(order.status)}</td>
                    <td>{formatDate(order.deliveryDate)}</td>
                    <td>{formatDate(order.orderDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div id="recent-activity-section" className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3><Clock size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Recent Activity</h3>
            {activityFilter && (
              <span
                className={`badge ${activityFilter === 'Stock In' ? 'badge-success' : 'badge-danger'}`}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => setActivityFilter(null)}
                title="Click to clear filter"
              >
                Filtered: {activityFilter} ✕
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className={`btn btn-sm ${activityFilter === 'Stock In' ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => setActivityFilter(activityFilter === 'Stock In' ? null : 'Stock In')}
              style={{ backgroundColor: activityFilter === 'Stock In' ? '#10b981' : '', color: activityFilter === 'Stock In' ? '#fff' : '' }}
            >
              Stock In
            </button>
            <button
              className={`btn btn-sm ${activityFilter === 'Stock Out' ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => setActivityFilter(activityFilter === 'Stock Out' ? null : 'Stock Out')}
              style={{ backgroundColor: activityFilter === 'Stock Out' ? '#f43f5e' : '', color: activityFilter === 'Stock Out' ? '#fff' : '' }}
            >
              Stock Out
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/inventory')}>
              View Ledger →
            </button>
          </div>
        </div>
        <div className="table-container">
          {filteredActivity.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><ClipboardList size={40} /></div>
              <h3>No matching activity</h3>
              <p>{activityFilter ? `No recent logs found for "${activityFilter}".` : 'Inventory transactions will appear here.'}</p>
              {activityFilter && (
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => setActivityFilter(null)}>
                  Clear Filter
                </button>
              )}
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
                {filteredActivity.slice(0, 10).map((activity, idx) => (
                  <tr key={idx}>
                    <td><strong>{activity.item_name}</strong></td>
                    <td>{getActionBadge(activity.action)}</td>
                    <td>{activity.quantity ?? '—'}</td>
                    <td>{activity.user || 'Admin'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activity.notes || '—'}
                    </td>
                    <td>{formatDate(activity.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
