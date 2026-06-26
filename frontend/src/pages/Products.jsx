import React, { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import Modal from '../components/Modal'
import { toast } from '../components/Toast'

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

const CATEGORIES = ['Photo Frames', 'Mugs', 'Cushions', 'Hampers', 'Greeting Cards', 'Customized Gifts', 'Others']
const STATUSES = ['active', 'inactive']
const PER_PAGE = 10

const EMPTY_FORM = {
  name: '', category: '', description: '',
  price: '', quantity: '', minimum_stock: '',
  status: 'active', image: null,
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [viewProduct, setViewProduct] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const fileRef = useRef()

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, limit: PER_PAGE }
      if (search) params.search = search
      if (categoryFilter) params.category = categoryFilter
      if (statusFilter) params.status = statusFilter

      const { data } = await axios.get('/products', { params })
      setProducts(data.products || data.data || data || [])
      setTotal(data.total || data.count || (data.products || data.data || data || []).length)
    } catch (err) {
      toast('Failed to load products', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryFilter, statusFilter])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1) }, [search, categoryFilter, statusFilter])

  function openAdd() {
    setEditProduct(null)
    setForm(EMPTY_FORM)
    setImagePreview(null)
    setFormErrors({})
    setShowAddModal(true)
  }

  function openEdit(product) {
    setEditProduct(product)
    setForm({
      name: product.name || '',
      category: product.category || '',
      description: product.description || '',
      price: product.price ?? '',
      quantity: product.quantity ?? '',
      minimum_stock: product.minimum_stock ?? '',
      status: product.status || 'active',
      image: null,
    })
    setImagePreview(product.image_url ? product.image_url : null)
    setFormErrors({})
    setShowAddModal(true)
  }

  function openView(product) {
    setViewProduct(product)
    setShowViewModal(true)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setFormErrors(fe => ({ ...fe, [name]: '' }))
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setForm(f => ({ ...f, image: file }))
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  function validate() {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Product name is required'
    if (!form.category) errors.category = 'Category is required'
    if (!form.price || isNaN(form.price) || Number(form.price) < 0) errors.price = 'Valid price is required'
    if (form.quantity === '' || isNaN(form.quantity) || Number(form.quantity) < 0) errors.quantity = 'Valid quantity is required'
    if (form.minimum_stock === '' || isNaN(form.minimum_stock) || Number(form.minimum_stock) < 0) errors.minimum_stock = 'Valid minimum stock is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'image') {
          if (v) fd.append('image', v)
        } else {
          fd.append(k, v)
        }
      })

      if (editProduct) {
        await axios.put(`/products/${editProduct.id || editProduct._id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast('Product updated successfully!', 'success')
      } else {
        await axios.post('/products', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast('Product added successfully!', 'success')
      }
      setShowAddModal(false)
      fetchProducts()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save product', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"? This action cannot be undone.`)) return
    try {
      await axios.delete(`/products/${product.id || product._id}`)
      toast('Product deleted successfully', 'success')
      fetchProducts()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete product', 'error')
    }
  }

  function isLowStock(p) {
    return Number(p.quantity) <= Number(p.minimum_stock)
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  // Stats
  const activeCount = products.filter(p => p.status === 'active').length
  const lowStockCount = products.filter(isLowStock).length
  const outOfStockCount = products.filter(p => Number(p.quantity) === 0).length

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>🎁 Gift Articles</h1>
          <p>Manage your gift article inventory</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Product
        </button>
      </div>

      {/* Stats Mini Row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {[
          { label: 'Total', value: total, color: '#0f172a', bg: 'rgba(15,23,42,0.06)' },
          { label: 'Active', value: activeCount, color: '#10b981', bg: '#d1fae5' },
          { label: 'Low Stock', value: lowStockCount, color: '#f43f5e', bg: '#ffe4e6' },
          { label: 'Out of Stock', value: outOfStockCount, color: '#f97316', bg: '#ffedd5' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px', borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: '600' }}>{s.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="search-filter-bar">
        <div className="search-bar">
          <span className="search-bar-icon">🔍</span>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select className="filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /><p className="loading-text">Loading products...</p></div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎁</div>
              <h3>No products found</h3>
              <p>Try adjusting your filters or add a new product.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Min Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => (
                  <tr key={p.id || p._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {(page - 1) * PER_PAGE + idx + 1}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="product-thumb"
                            onError={e => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          <div className="product-thumb-placeholder">🎁</div>
                        )}
                        <div>
                          <strong>{p.name}</strong>
                          {isLowStock(p) && Number(p.quantity) > 0 && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 600 }}>⚠ Low Stock</div>
                          )}
                          {Number(p.quantity) === 0 && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 600 }}>❌ Out of Stock</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-amber">{p.category}</span></td>
                    <td>Rs. {Number(p.price || 0).toLocaleString()}</td>
                    <td>
                      <span className={isLowStock(p) ? 'quantity-low' : 'quantity-ok'}>
                        {p.quantity}
                      </span>
                    </td>
                    <td>{p.minimum_stock}</td>
                    <td>
                      <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-primary'}`}>
                        <span className={`status-dot ${p.status}`} />
                        {p.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openView(p)} title="View">{EYE_ICON}</button>
                        <button className="btn btn-info btn-sm btn-icon" onClick={() => openEdit(p)} title="Edit">{EDIT_ICON}</button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p)} title="Delete">{TRASH_ICON}</button>
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
          <div className="pagination">
            <span className="pagination-info">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total}
            </span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editProduct ? `Edit: ${editProduct.name}` : 'Add New Product'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><span className="spinner-sm" /> Saving...</> : (editProduct ? '✏️ Update' : '+ Add Product')}
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Product Name <span className="required">*</span></label>
            <input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="e.g., Personalized Mug" />
            {formErrors.name && <span className="form-error">{formErrors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Category <span className="required">*</span></label>
            <select className="form-select" name="category" value={form.category} onChange={handleChange}>
              <option value="">Select Category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {formErrors.category && <span className="form-error">{formErrors.category}</span>}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-control" name="description" value={form.description} onChange={handleChange} placeholder="Product description..." rows={3} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Selling Price (Rs.) <span className="required">*</span></label>
            <input className="form-control" type="number" name="price" value={form.price} onChange={handleChange} placeholder="0" min="0" step="0.01" />
            {formErrors.price && <span className="form-error">{formErrors.price}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" name="status" value={form.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Available Quantity <span className="required">*</span></label>
            <input className="form-control" type="number" name="quantity" value={form.quantity} onChange={handleChange} placeholder="0" min="0" />
            {formErrors.quantity && <span className="form-error">{formErrors.quantity}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Minimum Stock Level <span className="required">*</span></label>
            <input className="form-control" type="number" name="minimum_stock" value={form.minimum_stock} onChange={handleChange} placeholder="0" min="0" />
            {formErrors.minimum_stock && <span className="form-error">{formErrors.minimum_stock}</span>}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Product Image</label>
          <div className="image-preview-container" onClick={() => fileRef.current?.click()}>
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" />
            ) : (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📷</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Click to upload image</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Product Details"
        size="md"
        footer={<button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>}
      >
        {viewProduct && (
          <div>
            {viewProduct.image_url && (
              <img
                src={viewProduct.image_url}
                alt={viewProduct.name}
                style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 20 }}
                onError={e => { e.target.style.display = 'none' }}
              />
            )}
            <div className="info-grid">
              <div className="info-item"><label>Name</label><span>{viewProduct.name}</span></div>
              <div className="info-item"><label>Category</label><span>{viewProduct.category}</span></div>
              <div className="info-item"><label>Price</label><span>Rs. {Number(viewProduct.price || 0).toLocaleString()}</span></div>
              <div className="info-item"><label>Status</label><span className={`badge ${viewProduct.status === 'active' ? 'badge-success' : 'badge-primary'}`}>{viewProduct.status}</span></div>
              <div className="info-item"><label>Quantity</label><span className={isLowStock(viewProduct) ? 'quantity-low' : 'quantity-ok'}>{viewProduct.quantity}</span></div>
              <div className="info-item"><label>Minimum Stock</label><span>{viewProduct.minimum_stock}</span></div>
            </div>
            {viewProduct.description && (
              <div className="form-group mt-16">
                <label className="form-label">Description</label>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{viewProduct.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
