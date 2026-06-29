import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Eye,
  Trash2,
  Calendar,
  AlertTriangle,
  UserPlus,
  UserCheck,
  CheckCircle,
  Calculator,
  Loader2,
  Printer,
  Hourglass
} from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';
import StatCard from '../components/StatCard';

const ORDER_TYPES = ['Personal Gift', 'Corporate Gift', 'Customized Order', 'Event Package', 'Bulk Hampers', 'Other'];
const STATUS_OPTIONS = ['Pending', 'In Production', 'Ready', 'Completed', 'Cancelled'];
const PER_PAGE = 10;

const EMPTY_CUSTOMER_FORM = {
  name: '',
  phone: '',
  email: '',
  address: '',
};

const EMPTY_ORDER_FORM = {
  order_type: 'Personal Gift',
  delivery_date: '',
  status: 'Pending',
  items: [{ productId: '', quantity: 1 }]
};

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemConfig, setSystemConfig] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Customer selection mode
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Forms state
  const [customerForm, setCustomerForm] = useState(EMPTY_CUSTOMER_FORM);
  const [orderForm, setOrderForm] = useState(EMPTY_ORDER_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Auto calculator state
  const [materialsNeeded, setMaterialsNeeded] = useState([]);
  const [hasShortage, setHasShortage] = useState(false);
  const [loadingCalculator, setLoadingCalculator] = useState(false);

  // Fetch all orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/orders');
      setOrders(data || []);
    } catch (err) {
      toast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch products and customers
  const fetchAuxiliary = useCallback(async () => {
    try {
      const [prodRes, custRes] = await Promise.all([
        api.get('/products'),
        api.get('/customers')
      ]);
      setProducts(prodRes.data || []);
      setCustomers(custRes.data || []);
    } catch (err) {
      console.error('Failed to load auxiliary data', err);
    }

    try {
      const { data } = await api.get('/settings');
      setSystemConfig(data || null);
    } catch (err) {
      console.error('Failed to load settings configuration', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchAuxiliary();
  }, [fetchOrders, fetchAuxiliary]);

  // Live Auto Calculator Hook
  useEffect(() => {
    const activeItems = orderForm.items.filter(item => item.productId !== '');
    if (activeItems.length === 0) {
      setMaterialsNeeded([]);
      setHasShortage(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoadingCalculator(true);
      try {
        const { data } = await api.post('/orders/calculate-materials', { items: activeItems });
        setMaterialsNeeded(data.materialsNeeded || []);
        setHasShortage(data.hasShortage || false);
      } catch (err) {
        console.error('Calculator API error:', err);
      } finally {
        setLoadingCalculator(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [orderForm.items]);

  // Filter & Search helper
  const filteredOrders = orders.filter(o => {
    const custName = (o.customerName || '').toLowerCase();
    const orderNum = (o.orderNumber || '').toLowerCase();
    const query = search.toLowerCase();
    const matchesSearch = custName.includes(query) || orderNum.includes(query);
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  // Pagination helper
  const totalItems = filteredOrders.length;
  const paginatedOrders = filteredOrders.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(totalItems / PER_PAGE) || 1;

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // Order Counts stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    completed: orders.filter(o => o.status === 'Completed').length,
    today: orders.filter(o => {
      const todayStr = new Date().toISOString().split('T')[0];
      return o.orderDate.startsWith(todayStr);
    }).length
  };

  // Open Create Modal
  function openCreate() {
    setIsNewCustomer(true);
    setSelectedCustomerId('');
    setCustomerSearch('');
    setCustomerForm(EMPTY_CUSTOMER_FORM);
    setOrderForm({
      order_type: 'Personal Gift',
      delivery_date: '',
      status: 'Pending',
      items: [{ productId: '', quantity: 1 }]
    });
    setFormErrors({});
    setMaterialsNeeded([]);
    setHasShortage(false);
    setShowAddModal(true);
  }

  // Open View Details Modal
  async function openView(order) {
    setShowViewModal(true);
    setLoadingDetail(true);
    setViewOrder(null);
    try {
      const { data } = await api.get(`/orders/${order.id}`);
      setViewOrder(data);
    } catch (err) {
      toast('Failed to load order details', 'error');
      setShowViewModal(false);
    } finally {
      setLoadingDetail(false);
    }
  }

  // Form changes
  function handleCustomerChange(e) {
    const { name, value } = e.target;
    setCustomerForm(c => ({ ...c, [name]: value }));
    setFormErrors(fe => ({ ...fe, [name]: '' }));
  }

  function handleOrderChange(e) {
    const { name, value } = e.target;
    setOrderForm(o => ({ ...o, [name]: value }));
    setFormErrors(fe => ({ ...fe, [name]: '' }));
  }

  // Item rows
  function handleItemChange(index, field, value) {
    const newItems = [...orderForm.items];
    newItems[index][field] = value;
    setOrderForm(o => ({ ...o, items: newItems }));
    setFormErrors(fe => ({ ...fe, items: '' }));
  }

  function addItemRow() {
    setOrderForm(o => ({
      ...o,
      items: [...o.items, { productId: '', quantity: 1 }]
    }));
  }

  function removeItemRow(index) {
    if (orderForm.items.length === 1) {
      toast('Order must have at least one item', 'warning');
      return;
    }
    const newItems = orderForm.items.filter((_, i) => i !== index);
    setOrderForm(o => ({ ...o, items: newItems }));
  }

  function calculateTotal() {
    let total = 0;
    orderForm.items.forEach(item => {
      const prod = products.find(p => p.id === parseInt(item.productId));
      if (prod && item.quantity) {
        total += prod.price * parseInt(item.quantity);
      }
    });
    return total;
  }

  function validate() {
    const errors = {};
    if (isNewCustomer) {
      if (!customerForm.name.trim()) errors.name = 'Customer name is required';
      if (!customerForm.phone.trim()) errors.phone = 'Phone number is required';
    } else {
      if (!selectedCustomerId) errors.customerId = 'Please select a customer';
    }
    if (!orderForm.delivery_date) errors.delivery_date = 'Delivery date is required';

    const itemErrors = [];
    orderForm.items.forEach((item, index) => {
      if (!item.productId) {
        itemErrors.push(`Item ${index + 1}: Select a product`);
      }
      if (!item.quantity || parseInt(item.quantity) <= 0) {
        itemErrors.push(`Item ${index + 1}: Qty must be at least 1`);
      }
    });

    if (itemErrors.length > 0) {
      errors.items = itemErrors.join(', ');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Handle Form Submit
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      let finalCustomerId = selectedCustomerId;

      // 1. Create new customer if selected
      if (isNewCustomer) {
        const custRes = await api.post('/customers', customerForm);
        finalCustomerId = custRes.data.id;
        toast('New customer created successfully', 'success');
        fetchAuxiliary(); // Refresh customer lists
      }

      // 2. Calculate totalPrice
      const totalPrice = calculateTotal();

      // 3. Create the order
      const payload = {
        customerId: finalCustomerId,
        orderDate: new Date().toISOString(),
        deliveryDate: new Date(orderForm.delivery_date).toISOString(),
        totalPrice,
        items: orderForm.items
      };

      await api.post('/orders', payload);
      toast('Order created successfully', 'success');
      setShowAddModal(false);
      fetchOrders();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to create order', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // Transition Order Status
  async function handleStatusChange(orderId, newStatus) {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      toast(`Order status updated to "${newStatus}"`, 'success');
      fetchOrders();
      if (viewOrder && viewOrder.id === orderId) {
        const { data } = await api.get(`/orders/${orderId}`);
        setViewOrder(data);
      }
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to update order status', 'error');
    }
  }

  // Delete Order
  async function handleDelete(order) {
    if (window.confirm(`Are you sure you want to delete order ${order.orderNumber}?`)) {
      try {
        await api.delete(`/orders/${order.id}`);
        toast('Order deleted successfully', 'success');
        fetchOrders();
      } catch (err) {
        toast('Failed to delete order', 'error');
      }
    }
  }

  // Render Status Badge
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

  function handlePrintInvoice(order) {
    const businessName = systemConfig?.businessName || 'Paper Plane';
    const invoiceSubtitle = systemConfig?.invoiceSubtitle || 'Gift Article & Packaging Material Inventory System';
    const businessAddress = systemConfig?.businessAddress || 'Shop 12, Connaught Place, New Delhi, Delhi';
    const businessGst = systemConfig?.businessGst || '07AAAAA1111A1Z1';

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const itemsHtml = order.items.map(item => `
      <tr>
        <td>${item.productName}</td>
        <td>${item.productType}</td>
        <td>Rs. ${item.price.toLocaleString()}</td>
        <td>${item.quantity}</td>
        <td style="text-align: right;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Invoice - ${order.orderNumber}</title>
          <style>
            body { font-family: 'Poppins', sans-serif; color: #0f172a; padding: 40px; margin: 0; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 700; color: #0f172a; }
            .invoice-title { font-size: 28px; font-weight: 800; color: #1e293b; text-transform: uppercase; }
            .meta-section { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 20px; }
            .meta-block h4 { margin: 0 0 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            .meta-block p { margin: 0; font-size: 13px; line-height: 1.5; font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background-color: #f8fafc; text-align: left; padding: 12px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
            td { padding: 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            .totals { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; margin-bottom: 40px; }
            .total-row { display: flex; width: 300px; justify-content: space-between; font-size: 14px; }
            .total-row.grand { font-size: 18px; font-weight: 700; border-top: 2px solid #e2e8f0; padding-top: 10px; color: #0f172a; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px; margin-top: 60px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">${businessName}</div>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">${invoiceSubtitle}</p>
            </div>
            <div style="text-align: right;">
              <div class="invoice-title">Invoice</div>
              <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600; color: #475569;">${order.orderNumber}</p>
            </div>
          </div>
          
          <div class="meta-section">
            <div class="meta-block">
              <h4>Billed To</h4>
              <p><strong>${order.customerName}</strong></p>
              ${order.customerPhone ? `<p>Phone: ${order.customerPhone}</p>` : ''}
              ${order.customerAddress ? `<p>${order.customerAddress}</p>` : ''}
            </div>
            <div class="meta-block">
              <h4>Seller Profile</h4>
              <p><strong>${businessName}</strong></p>
              <p>GSTIN: ${businessGst}</p>
              <p>${businessAddress}</p>
            </div>
            <div class="meta-block" style="text-align: right;">
              <h4>Order Details</h4>
              <p>Order Date: ${new Date(order.orderDate).toLocaleDateString()}</p>
              <p>Delivery Date: ${new Date(order.deliveryDate).toLocaleDateString()}</p>
              <p>Status: <strong>${order.status}</strong></p>
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
              <span>Rs. ${Number(order.totalPrice).toLocaleString()}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your business with Paper Plane!</p>
            <p>This is a system generated document.</p>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  }

  // Filter customer listing
  const searchedCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🛍️ Customer Orders</h1>
          <p className="page-subtitle">Track and progress gift assembly orders</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> New Order
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid mb-24">
        <StatCard title="Total Orders" value={stats.total} icon={<ShoppingBag size={20} />} color="total-orders" />
        <StatCard title="Pending" value={stats.pending} icon={<Hourglass size={20} />} color="pending-orders" />
        <StatCard title="Completed" value={stats.completed} icon={<CheckCircle size={20} />} color="completed-orders" />
        <StatCard title="Placed Today" value={stats.today} icon={<Calendar size={20} />} color="todays-orders" />
      </div>

      {/* Filters & Search */}
      <div className="search-bar mb-24">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-control"
            placeholder="Search by customer name or order number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select
            className="form-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ minWidth: 150 }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="loading-spinner" style={{ padding: '60px' }}>
              <div className="spinner" />
              <p>Loading orders...</p>
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><ShoppingBag size={40} /></div>
              <h3>No orders found</h3>
              <p>Try clearing your search query or filters.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order No.</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Delivery Date</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map(order => (
                  <tr key={order.id}>
                    <td><strong>{order.orderNumber}</strong></td>
                    <td>{order.customerName}</td>
                    <td>{new Date(order.orderDate).toLocaleDateString('en-IN')}</td>
                    <td>{new Date(order.deliveryDate).toLocaleDateString('en-IN')}</td>
                    <td>Rs. {Number(order.totalPrice).toLocaleString()}</td>
                    <td>{getOrderStatusBadge(order.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-icon" title="View details" onClick={() => openView(order)}>
                          <Eye size={14} />
                        </button>
                        <button className="btn-icon" title="Delete" onClick={() => handleDelete(order)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Previous
              </button>
              <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- ADD/CREATE ORDER MODAL --- */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="🛒 New Assembly Order" size="lg">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Customer Selection Block */}
          <div className="card" style={{ padding: 16, background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {isNewCustomer ? <UserPlus size={16} /> : <UserCheck size={16} />}
                Customer Profile
              </h4>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsNewCustomer(!isNewCustomer);
                  setCustomerForm(EMPTY_CUSTOMER_FORM);
                  setSelectedCustomerId('');
                }}
              >
                {isNewCustomer ? 'Select Existing' : 'Register New'}
              </button>
            </div>

            {isNewCustomer ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={customerForm.name}
                    onChange={handleCustomerChange}
                    placeholder="e.g. Rahul Sharma"
                  />
                  {formErrors.name && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="phone"
                    value={customerForm.phone}
                    onChange={handleCustomerChange}
                    placeholder="e.g. 98765-43210"
                  />
                  {formErrors.phone && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.phone}</span>}
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Delivery Address *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address"
                    value={customerForm.address}
                    onChange={handleCustomerChange}
                    placeholder="e.g. 12A Mall Road, Civil Lines, Delhi"
                  />
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Search & Select Customer *</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div className="search-input-wrapper" style={{ flex: 1 }}>
                    <Search className="search-icon" size={14} />
                    <input
                      type="text"
                      className="search-control"
                      placeholder="Type name or phone to search..."
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                    />
                  </div>
                </div>
                {customerSearch && (
                  <div className="card" style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border)', padding: 4 }}>
                    {searchedCustomers.length === 0 ? (
                      <p style={{ padding: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>No customers found</p>
                    ) : (
                      searchedCustomers.map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setCustomerSearch(c.name + ' (' + c.phone + ')');
                          }}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderRadius: 4,
                            fontSize: '0.85rem',
                            backgroundColor: selectedCustomerId === c.id ? 'var(--accent-light)' : 'transparent',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <strong>{c.name}</strong> - {c.phone} ({c.address})
                        </div>
                      ))
                    )}
                  </div>
                )}
                {formErrors.customerId && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.customerId}</span>}
              </div>
            )}
          </div>

          {/* Order Details Block */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Order Type *</label>
              <select className="form-select" name="order_type" value={orderForm.order_type} onChange={handleOrderChange}>
                {ORDER_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Delivery Date *</label>
              <input
                type="date"
                className="form-control"
                name="delivery_date"
                value={orderForm.delivery_date}
                onChange={handleOrderChange}
              />
              {formErrors.delivery_date && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.delivery_date}</span>}
            </div>
          </div>

          {/* Order Items Section */}
          <div className="card" style={{ padding: 16 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Order Items (Gift Articles)
            </h4>
            {formErrors.items && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginBottom: 8, display: 'block' }}>{formErrors.items}</span>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {orderForm.items.map((item, idx) => {
                const selectedProd = products.find(p => p.id === Number(item.productId));
                return (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                      <select
                        className="form-select"
                        value={item.productId}
                        onChange={e => handleItemChange(idx, 'productId', e.target.value)}
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (Rs. {p.price})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Qty"
                        value={item.quantity}
                        min="1"
                        onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div style={{ minWidth: 80, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Rs. {selectedProd ? (selectedProd.price * item.quantity).toLocaleString() : '0'}
                    </div>
                    <button type="button" className="btn-icon" onClick={() => removeItemRow(idx)} style={{ color: 'var(--danger)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={addItemRow}>
              + Add Item
            </button>
          </div>

          {/* --- LIVE AUTO CALCULATOR PANEL --- */}
          <div className="card" style={{ padding: 16, border: '1px dashed var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
              <Calculator size={16} /> Live Packaging Material Auto-Calculator
            </h4>

            {loadingCalculator ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-muted)', padding: '10px 0' }}>
                <Loader2 className="spinner" size={14} />
                Calculating required stocks...
              </div>
            ) : materialsNeeded.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Add products to the order to calculate needed boxes, ribbons, and wrapping sheets.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {materialsNeeded.map(m => (
                  <div key={m.materialId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '4px 0' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{m.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Needed: {m.quantityNeeded} {m.unit}</span>
                      <span style={{ color: 'var(--text-muted)' }}>Stock: {m.currentStock} {m.unit}</span>
                      {m.status === 'shortage' ? (
                        <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle size={10} /> Shortage: −{m.shortage}
                        </span>
                      ) : (
                        <span className="badge badge-success">Available</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Submit */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>GRAND TOTAL</p>
              <h3 style={{ margin: 0, color: 'var(--primary)' }}>Rs. {calculateTotal().toLocaleString()}</h3>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* --- VIEW ORDER DETAILS MODAL --- */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="🛍️ Order Detail Overview">
        {loadingDetail ? (
          <div className="loading-spinner" style={{ padding: '60px' }}>
            <div className="spinner" />
            <p>Loading order details...</p>
          </div>
        ) : !viewOrder ? (
          <p>Order not found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{viewOrder.orderNumber}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Placed on {new Date(viewOrder.orderDate).toLocaleString()}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {getOrderStatusBadge(viewOrder.status)}
                <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handlePrintInvoice(viewOrder)}>
                  <Printer size={13} /> Print Invoice
                </button>
              </div>
            </div>

            {/* Customer profile */}
            <div className="card" style={{ padding: 12, background: 'var(--bg)' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Customer Details</h4>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem' }}><strong>{viewOrder.customerName}</strong></p>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📞 {viewOrder.customerPhone || 'No phone number'}</p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📍 {viewOrder.customerAddress || 'No address'}</p>
            </div>

            {/* Order Items Table */}
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>Items Ordered</h4>
              <table className="data-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Product Description</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th style={{ textAnchor: 'end' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {viewOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>{item.productName}</strong></td>
                      <td>{item.productType}</td>
                      <td>Rs. {item.price.toLocaleString()}</td>
                      <td>{item.quantity}</td>
                      <td>Rs. {(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Workflow status controls */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>GRAND TOTAL</p>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary)' }}>Rs. {viewOrder.totalPrice.toLocaleString()}</h4>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {viewOrder.status === 'Pending' && (
                  <button className="btn btn-sm btn-primary" onClick={() => handleStatusChange(viewOrder.id, 'In Production')}>
                    ⚙️ Send to Production
                  </button>
                )}
                {viewOrder.status === 'In Production' && (
                  <button className="btn btn-sm" style={{ backgroundColor: '#3b82f6', color: '#fff' }} onClick={() => handleStatusChange(viewOrder.id, 'Ready')}>
                    📦 Mark as Ready
                  </button>
                )}
                {viewOrder.status === 'Ready' && (
                  <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(viewOrder.id, 'Completed')}>
                    ✅ Dispatch & Complete
                  </button>
                )}
                {viewOrder.status !== 'Completed' && viewOrder.status !== 'Cancelled' && (
                  <button className="btn btn-sm btn-danger" onClick={() => handleStatusChange(viewOrder.id, 'Cancelled')}>
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
