import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Modal from '../components/Modal'
import { toast } from '../components/Toast'
import StatCard from '../components/StatCard'

const EYE_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
)

const EDIT_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
)

const TRASH_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
)

const ORDER_TYPES = ['Personal Gift', 'Corporate Gift', 'Customized Order', 'Event Package', 'Bulk Hampers', 'Other']
const STATUS_OPTIONS = ['Pending', 'In Production', 'Ready', 'Completed', 'Cancelled']
const PER_PAGE = 10

const EMPTY_CUSTOMER_FORM = {
  customer_name: '',
  phone: '',
  email: '',
  address: '',
}

const EMPTY_ORDER_FORM = {
  order_type: 'Personal Gift',
  delivery_date: '',
  status: 'Pending',
  items: [{ product_id: '', quantity: 1 }]
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editOrder, setEditOrder] = useState(null)
  const [viewOrder, setViewOrder] = useState(null)
  
  // Details state
  const [orderDetail, setOrderDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Forms state
  const [customerForm, setCustomerForm] = useState(EMPTY_CUSTOMER_FORM)
  const [orderForm, setOrderForm] = useState(EMPTY_ORDER_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [shortages, setShortages] = useState([])
  const [submitting, setSubmitting] = useState(false)

  // Fetch all orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter

      const { data } = await axios.get('/orders', { params })
      setOrders(data.orders || [])
    } catch (err) {
      toast('Failed to load orders', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  // Fetch active products for dropdown selection
  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await axios.get('/products', { params: { status: 'active' } })
      setProducts(data.products || [])
    } catch (err) {
      console.error('Failed to load products', err)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    fetchProducts()
  }, [fetchOrders, fetchProducts])

  // Pagination helper
  const totalItems = orders.length
  const paginatedOrders = orders.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(totalItems / PER_PAGE) || 1

  // Handle pagination pages reset on filter change
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  // Get order count summary for stats cards
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    completed: orders.filter(o => o.status === 'Completed').length,
    today: orders.filter(o => {
      const todayStr = new Date().toISOString().split('T')[0]
      const orderDateStr = (o.order_date || o.created_at || '').split('T')[0]
      return todayStr === orderDateStr
    }).length
  }

  // Open Create Modal
  function openCreate() {
    setEditOrder(null)
    setCustomerForm(EMPTY_CUSTOMER_FORM)
    setOrderForm({
      order_type: 'Personal Gift',
      delivery_date: '',
      status: 'Pending',
      items: [{ product_id: '', quantity: 1 }]
    })
    setFormErrors({})
    setShortages([])
    setShowAddModal(true)
  }

  // Open View Details Modal
  async function openView(order) {
    setShowViewModal(true)
    setLoadingDetail(true)
    setOrderDetail(null)
    try {
      const { data } = await axios.get(`/orders/${order.order_id}`)
      setOrderDetail(data)
    } catch (err) {
      toast('Failed to load order details', 'error')
      setShowViewModal(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Open Edit Modal (pre-fills with order info)
  async function openEdit(order) {
    setEditOrder(order)
    setFormErrors({})
    setShortages([])
    setShowAddModal(true)
    
    // Fetch full detail of order to populate items
    try {
      const { data } = await axios.get(`/orders/${order.order_id}`)
      setCustomerForm({
        customer_name: data.order.customer_name || '',
        phone: data.order.phone || '',
        email: data.order.email || '',
        address: data.order.address || '',
      })
      setOrderForm({
        order_type: data.order.order_type || 'Personal Gift',
        delivery_date: data.order.delivery_date ? data.order.delivery_date.substring(0, 10) : '',
        status: data.order.status || 'Pending',
        items: data.items.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
      })
    } catch (err) {
      toast('Failed to load order for editing', 'error')
      setShowAddModal(false)
    }
  }

  // Handle Form changes
  function handleCustomerChange(e) {
    const { name, value } = e.target
    setCustomerForm(c => ({ ...c, [name]: value }))
    setFormErrors(fe => ({ ...fe, [name]: '' }))
  }

  function handleOrderChange(e) {
    const { name, value } = e.target
    setOrderForm(o => ({ ...o, [name]: value }))
    setFormErrors(fe => ({ ...fe, [name]: '' }))
  }

  // Dynamic order items row handlers
  function handleItemChange(index, field, value) {
    const newItems = [...orderForm.items]
    newItems[index][field] = value
    setOrderForm(o => ({ ...o, items: newItems }))
    setFormErrors(fe => ({ ...fe, items: '' }))
  }

  function addItemRow() {
    setOrderForm(o => ({
      ...o,
      items: [...o.items, { product_id: '', quantity: 1 }]
    }))
  }

  function removeItemRow(index) {
    if (orderForm.items.length === 1) {
      toast('Order must have at least one item', 'warning')
      return
    }
    const newItems = orderForm.items.filter((_, i) => i !== index)
    setOrderForm(o => ({ ...o, items: newItems }))
  }

  // Real-time calculation of order total amount
  function calculateTotal() {
    let total = 0
    orderForm.items.forEach(item => {
      const prod = products.find(p => p.id === parseInt(item.product_id))
      if (prod && item.quantity) {
        total += prod.price * parseInt(item.quantity)
      }
    })
    return total
  }

  // Validation
  function validate() {
    const errors = {}
    if (!editOrder) {
      if (!customerForm.customer_name.trim()) errors.customer_name = 'Customer name is required'
      if (!customerForm.address.trim()) errors.address = 'Address is required'
    }
    if (!orderForm.order_type) errors.order_type = 'Order type is required'
    if (!orderForm.delivery_date) errors.delivery_date = 'Delivery date is required'

    // Validate items
    const itemErrors = []
    orderForm.items.forEach((item, index) => {
      if (!item.product_id) {
        itemErrors.push(`Item ${index + 1}: Please select a product`)
      }
      if (!item.quantity || isNaN(item.quantity) || parseInt(item.quantity) <= 0) {
        itemErrors.push(`Item ${index + 1}: Quantity must be at least 1`)
      }
    })

    if (itemErrors.length > 0) {
      errors.items = itemErrors.join(', ')
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Form Submit (Create or Update)
  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    setShortages([])
    
    const payload = {
      ...customerForm,
      ...orderForm,
    }

    try {
      if (editOrder) {
        // Edit order
        await axios.put(`/orders/${editOrder.order_id}`, payload)
        toast('Order updated successfully', 'success')
      } else {
        // Create order
        await axios.post('/orders', payload)
        toast('Order created successfully', 'success')
      }
      setShowAddModal(false)
      fetchOrders()
    } catch (err) {
      const responseData = err.response?.data
      if (responseData && responseData.shortages) {
        setShortages(responseData.shortages)
        toast('Insufficient inventory stock', 'error')
      } else {
        toast(responseData?.error || 'Failed to save order', 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Delete Order
  async function handleDelete(order) {
    if (window.confirm(`Are you sure you want to delete order ${order.order_number}? This will restore stock levels.`)) {
      try {
        await axios.delete(`/orders/${order.order_id}`)
        toast('Order deleted successfully', 'success')
        fetchOrders()
      } catch (err) {
        toast('Failed to delete order', 'error')
      }
    }
  }

  // Quick Action: Update Status
  async function handleStatusChange(orderId, newStatus) {
    try {
      await axios.patch(`/orders/${orderId}/status`, { status: newStatus })
      toast(`Order status updated to "${newStatus}"`, 'success')
      
      // Refresh current active views
      fetchOrders()
      if (orderDetail && orderDetail.order.order_id === orderId) {
        const { data } = await axios.get(`/orders/${orderId}`)
        setOrderDetail(data)
      }
    } catch (err) {
      const responseData = err.response?.data
      if (responseData && responseData.shortages) {
        alert(`Cannot change status: Insufficient stock for this order.\nMissing items:\n${responseData.shortages.map(s => ` - ${s.item}: need ${s.required}, have ${s.available} (${s.type})`).join('\n')}`)
      } else {
        toast(responseData?.error || 'Failed to update order status', 'error')
      }
    }
  }

  // Print invoice helper
  function handlePrintInvoice(orderDetail) {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    const itemsHtml = orderDetail.items.map(item => `
      <tr>
        <td>${item.product_name}</td>
        <td>${item.category}</td>
        <td>Rs. ${item.price.toLocaleString()}</td>
        <td>${item.quantity}</td>
        <td style="text-align: right;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('')

    const materialsHtml = orderDetail.materialsUsed.map(m => `
      <li>${m.name}: ${m.quantity} ${m.unit}</li>
    `).join('') || '<li>None</li>'

    const html = `
      <html>
        <head>
          <title>Invoice - ${orderDetail.order.order_number}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; padding: 40px; margin: 0; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 700; color: #0f172a; }
            .logo span { color: #f59e0b; }
            .invoice-title { font-size: 28px; font-weight: 800; color: #1e293b; text-transform: uppercase; }
            .meta-section { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 20px; }
            .meta-block h4 { margin: 0 0 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            .meta-block p { margin: 0; font-size: 14px; line-height: 1.5; font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background-color: #f8fafc; text-align: left; padding: 12px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
            td { padding: 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            .totals { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; margin-bottom: 40px; }
            .total-row { display: flex; width: 300px; justify-content: space-between; font-size: 14px; }
            .total-row.grand { font-size: 18px; font-weight: 700; border-top: 2px solid #e2e8f0; padding-top: 10px; color: #0f172a; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px; margin-top: 60px; }
            .materials-box { background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 15px; margin-top: 20px; }
            .materials-box h4 { margin: 0 0 10px 0; font-size: 12px; color: #64748b; text-transform: uppercase; }
            .materials-box ul { margin: 0; padding-left: 20px; font-size: 13px; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">Paper <span>Plane</span></div>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">Gift Article & Packaging Material Inventory System</p>
            </div>
            <div style="text-align: right;">
              <div class="invoice-title">Invoice</div>
              <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600; color: #475569;">${orderDetail.order.order_number}</p>
            </div>
          </div>
          
          <div class="meta-section">
            <div class="meta-block">
              <h4>Billed To</h4>
              <p><strong>${orderDetail.order.customer_name}</strong></p>
              ${orderDetail.order.phone ? `<p>Phone: ${orderDetail.order.phone}</p>` : ''}
              ${orderDetail.order.email ? `<p>Email: ${orderDetail.order.email}</p>` : ''}
              ${orderDetail.order.address ? `<p>${orderDetail.order.address}</p>` : ''}
            </div>
            <div class="meta-block" style="text-align: right;">
              <h4>Order Details</h4>
              <p>Order Type: <strong>${orderDetail.order.order_type}</strong></p>
              <p>Order Date: ${new Date(orderDetail.order.order_date).toLocaleDateString()}</p>
              ${orderDetail.order.delivery_date ? `<p>Delivery Date: ${new Date(orderDetail.order.delivery_date).toLocaleDateString()}</p>` : ''}
              <p>Status: <strong>${orderDetail.order.status}</strong></p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Product Description</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row grand">
              <span>Grand Total:</span>
              <span>Rs. ${Number(orderDetail.order.total_amount).toLocaleString()}</span>
            </div>
          </div>

          <div class="materials-box">
            <h4>Packaging Materials Consumed</h4>
            <ul>
              ${materialsHtml}
            </ul>
          </div>

          <div class="footer">
            <p>Thank you for choosing Paper Plane!</p>
            <p>This is a system generated document.</p>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  // Format Helper
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

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div>
      {/* Stats Cards Row */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard
          title="Total Orders"
          value={stats.total}
          icon="🛍️"
          color="primary"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pending}
          icon="⏳"
          color="warning"
        />
        <StatCard
          title="Completed Orders"
          value={stats.completed}
          icon="✅"
          color="success"
        />
        <StatCard
          title="Today's Orders"
          value={stats.today}
          icon="📅"
          color="info"
        />
      </div>

      {/* Control Panel */}
      <div className="search-filter-bar">
        <div className="search-bar">
          <span className="search-bar-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by order number or customer name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openCreate}>
            🛍️ Create Order
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              <p className="loading-text">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🛍️</div>
              <h3>No customer orders found</h3>
              <p>Create a new order or modify search keywords.</p>
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Order Number</th>
                    <th>Customer Details</th>
                    <th>Order Type</th>
                    <th>Products Ordered</th>
                    <th>Total Price</th>
                    <th>Status</th>
                    <th>Delivery Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order, idx) => (
                    <tr key={order.order_id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {(page - 1) * PER_PAGE + idx + 1}
                      </td>
                      <td><strong>{order.order_number}</strong></td>
                      <td>
                        <div>
                          <strong>{order.customer_name}</strong>
                          {(order.phone || order.address) && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                              {order.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span>📞</span> {order.phone}</div>}
                              {order.address && <div style={{ display: 'flex', alignItems: 'center', gap: 4, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 180 }} title={order.address}><span>📍</span> {order.address}</div>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td><span className="badge badge-primary">{order.order_type}</span></td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', maxWidth: 220, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={order.products_list}>
                          {order.products_list || '—'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Total: {order.items_count || 0} pcs
                        </div>
                      </td>
                      <td>Rs. {Number(order.total_amount).toLocaleString()}</td>
                      <td>{getOrderStatusBadge(order.status)}</td>
                      <td>{formatDate(order.delivery_date)}</td>
                      <td>
                        <div className="actions-cell">
                          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openView(order)} title="View">{EYE_ICON}</button>
                          <button className="btn btn-info btn-sm btn-icon" onClick={() => openEdit(order)} title="Edit">{EDIT_ICON}</button>
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(order)} title="Delete">{TRASH_ICON}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, padding: '0 10px' }}>
                  <span className="pagination-info" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Showing page {page} of {totalPages} ({totalItems} orders)
                  </span>
                  <div className="pagination-buttons" style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPage(p => Math.max(p - 1, 1))}
                      disabled={page === 1}
                    >
                      ◀ Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setPage(i + 1)}
                        style={{ minWidth: 32 }}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                    >
                      Next ▶
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editOrder ? `Edit Order — ${editOrder.order_number}` : 'Create New Customer Order'}
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Customer details - Disabled if Editing order */}
          <div className="glass-card" style={{ padding: 15, borderRadius: 8 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
              👤 Customer Information {editOrder && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Locked for edits)</span>}
            </h4>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Customer Name*</label>
                <input
                  type="text"
                  name="customer_name"
                  className={`form-control ${formErrors.customer_name ? 'is-invalid' : ''}`}
                  value={customerForm.customer_name}
                  onChange={handleCustomerChange}
                  disabled={!!editOrder}
                  placeholder="e.g. Rahul Sharma"
                />
                {formErrors.customer_name && <span className="error-text" style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.customer_name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  className="form-control"
                  value={customerForm.phone}
                  onChange={handleCustomerChange}
                  disabled={!!editOrder}
                  placeholder="e.g. 98765-43210"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={customerForm.email}
                  onChange={handleCustomerChange}
                  disabled={!!editOrder}
                  placeholder="e.g. customer@example.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Address*</label>
                <input
                  type="text"
                  name="address"
                  className={`form-control ${formErrors.address ? 'is-invalid' : ''}`}
                  value={customerForm.address}
                  onChange={handleCustomerChange}
                  disabled={!!editOrder}
                  placeholder="e.g. 12A Mall Road, Civil Lines, Delhi"
                />
                {formErrors.address && <span className="error-text" style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.address}</span>}
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="glass-card" style={{ padding: 15, borderRadius: 8 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
              🛍️ Order Settings
            </h4>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Order Type*</label>
                <select
                  name="order_type"
                  className="form-select"
                  value={orderForm.order_type}
                  onChange={handleOrderChange}
                >
                  {ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Date*</label>
                <input
                  type="date"
                  name="delivery_date"
                  className={`form-control ${formErrors.delivery_date ? 'is-invalid' : ''}`}
                  value={orderForm.delivery_date}
                  onChange={handleOrderChange}
                />
                {formErrors.delivery_date && <span className="error-text" style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.delivery_date}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Status*</label>
                <select
                  name="status"
                  className="form-select"
                  value={orderForm.status}
                  onChange={handleOrderChange}
                  disabled={!editOrder} // Status initialized as Pending for new orders
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Items Management */}
          <div className="glass-card" style={{ padding: 15, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 6, marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary)' }}>🎁 Products List</h4>
              <button className="btn btn-secondary btn-sm" onClick={addItemRow}>
                ➕ Add Item
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {orderForm.items.map((item, idx) => {
                const selectedProduct = products.find(p => p.id === parseInt(item.product_id))
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                    <div style={{ flex: 3 }} className="form-group">
                      {idx === 0 && <label className="form-label">Product Name</label>}
                      <select
                        className="form-select"
                        value={item.product_id}
                        onChange={e => handleItemChange(idx, 'product_id', e.target.value)}
                      >
                        <option value="">Select Gift Article...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Rs. {p.price} | Stock: {p.quantity})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flex: 1 }} className="form-group">
                      {idx === 0 && <label className="form-label">Quantity</label>}
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                      />
                    </div>

                    <div style={{ flex: 1.2, textAlign: 'right', paddingBottom: 10, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {selectedProduct ? (
                        <div>
                          <p style={{ margin: 0, fontSize: '0.7rem' }}>Unit: Rs.{selectedProduct.price}</p>
                          <strong>Rs. {(selectedProduct.price * (item.quantity || 0)).toLocaleString()}</strong>
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </div>

                    <button
                      className="btn btn-danger btn-sm"
                      style={{ height: 38, marginBottom: 2 }}
                      onClick={() => removeItemRow(idx)}
                    >
                      🗑️
                    </button>
                  </div>
                )
              })}
            </div>
            {formErrors.items && <div className="alert alert-danger" style={{ marginTop: 12, padding: '6px 12px', fontSize: '0.8rem' }}>{formErrors.items}</div>}
          </div>

          {/* Shortages Alert Banner */}
          {shortages.length > 0 && (
            <div className="alert alert-danger" style={{ display: 'block' }}>
              <strong style={{ display: 'block', marginBottom: 6 }}>🚨 Shortages Detected:</strong>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.85rem' }}>
                {shortages.map((s, idx) => (
                  <li key={idx}>
                    <strong>{s.item}</strong> ({s.type}): Required <strong>{s.required}</strong>, Available <strong>{s.available}</strong> (Shortage of <strong>{s.shortfall}</strong>)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Modal Footer Summary */}
          <div style={{ display: 'flex', justifySelf: 'flex-end', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 15 }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Estimated Grand Total:</span>
              <h3 style={{ margin: 0, color: 'var(--primary)' }}>Rs. {calculateTotal().toLocaleString()}</h3>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={submitting}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : editOrder ? 'Save Changes' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Details View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Customer Order Details & Invoice"
        size="lg"
      >
        {loadingDetail ? (
          <div className="loading-spinner" style={{ minHeight: 300 }}>
            <div className="spinner" />
            <p className="loading-text">Loading details...</p>
          </div>
        ) : !orderDetail ? (
          <div className="alert alert-danger">Failed to load order details.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: 6 }}>{orderDetail.order.order_type}</span>
                <h2 style={{ margin: 0 }}>{orderDetail.order.order_number}</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Created on: {formatDate(orderDetail.order.order_date)}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: 8 }}>{getOrderStatusBadge(orderDetail.order.status)}</div>
                <h3 style={{ margin: 0, color: 'var(--primary)' }}>Rs. {Number(orderDetail.order.total_amount).toLocaleString()}</h3>
              </div>
            </div>

            {/* Content body split */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Customer Box */}
              <div className="glass-card" style={{ padding: 15, borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>👤 Customer Profile</h4>
                <p style={{ margin: '0 0 6px 0' }}><strong>Name:</strong> {orderDetail.order.customer_name}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Phone:</strong> {orderDetail.order.phone || '—'}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Email:</strong> {orderDetail.order.email || '—'}</p>
                <p style={{ margin: 0 }}><strong>Address:</strong> {orderDetail.order.address}</p>
              </div>

              {/* Delivery Info Box */}
              <div className="glass-card" style={{ padding: 15, borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>🚚 Delivery Info</h4>
                <p style={{ margin: '0 0 6px 0' }}><strong>Target Date:</strong> {formatDate(orderDetail.order.delivery_date)}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Status Log:</strong> {orderDetail.order.status}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 15 }}>
                  {orderDetail.order.status !== 'Completed' && orderDetail.order.status !== 'Cancelled' && (
                    <>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleStatusChange(orderDetail.order.order_id, 'Completed')}
                      >
                        ✅ Complete
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleStatusChange(orderDetail.order.order_id, 'Cancelled')}
                      >
                        ❌ Cancel
                      </button>
                    </>
                  )}
                  {orderDetail.order.status === 'Cancelled' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleStatusChange(orderDetail.order.order_id, 'Pending')}
                    >
                      Re-open Order
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Ordered Items Table */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>🎁 Ordered Articles</h4>
              <table className="data-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Product Description</th>
                    <th>Category</th>
                    <th>Unit Price</th>
                    <th>Quantity</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetail.items.map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>{item.product_name}</strong></td>
                      <td><span className="badge badge-amber">{item.category}</span></td>
                      <td>Rs. {Number(item.price).toLocaleString()}</td>
                      <td>{item.quantity}</td>
                      <td><strong>Rs. {Number(item.subtotal).toLocaleString()}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Consumed materials recipe calculations */}
            <div className="glass-card" style={{ padding: 15, borderRadius: 8, borderLeft: '4px solid var(--accent)' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>📦 Raw Packaging Materials Consumed</h4>
              {orderDetail.materialsUsed.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>No packaging recipe linked to the ordered products.</p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {orderDetail.materialsUsed.map((m, idx) => (
                    <li key={idx}>
                      <strong>{m.name}</strong>: {m.quantity} {m.unit}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 15, marginTop: 10 }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowViewModal(false)
                  openEdit(orderDetail.order)
                }}
              >
                ✏️ Edit Order
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                  Close
                </button>
                <button className="btn btn-primary" onClick={() => handlePrintInvoice(orderDetail)}>
                  🖨️ Print Invoice
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
