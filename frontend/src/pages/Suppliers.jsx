import React, { useState, useEffect, useCallback } from 'react'
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

const PER_PAGE = 10

const EMPTY_FORM = {
  name: '', phone: '', email: '', address: '', status: 'active'
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editSupplier, setEditSupplier] = useState(null)
  const [viewSupplier, setViewSupplier] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, limit: PER_PAGE }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter

      const { data } = await axios.get('/suppliers', { params })
      setSuppliers(data.suppliers || data.data || data || [])
      setTotal(data.total || data.count || (data.suppliers || data.data || data || []).length)
    } catch {
      toast('Failed to load suppliers', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => { fetchSuppliers() }, [fetchSuppliers])
  useEffect(() => { setPage(1) }, [search, statusFilter])

  function openAdd() {
    setEditSupplier(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setShowAddModal(true)
  }

  function openEdit(supplier) {
    setEditSupplier(supplier)
    setForm({
      name: supplier.name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      status: supplier.status || 'active',
    })
    setFormErrors({})
    setShowAddModal(true)
  }

  async function openView(supplier) {
    try {
      const { data } = await axios.get(`/suppliers/${supplier.id || supplier._id}`)
      setViewSupplier(data)
    } catch {
      setViewSupplier(supplier)
    }
    setShowViewModal(true)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setFormErrors(fe => ({ ...fe, [name]: '' }))
  }

  function validate() {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Supplier name is required'
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Invalid email format'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      if (editSupplier) {
        await axios.put(`/suppliers/${editSupplier.id || editSupplier._id}`, form)
        toast('Supplier updated successfully!', 'success')
      } else {
        await axios.post('/suppliers', form)
        toast('Supplier added successfully!', 'success')
      }
      setShowAddModal(false)
      fetchSuppliers()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save supplier', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(supplier) {
    if (!window.confirm(`Delete "${supplier.name}"? This action cannot be undone.`)) return
    try {
      await axios.delete(`/suppliers/${supplier.id || supplier._id}`)
      toast('Supplier deleted successfully', 'success')
      fetchSuppliers()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete supplier', 'error')
    }
  }

  async function toggleStatus(supplier) {
    try {
      const newStatus = supplier.status === 'active' ? 'inactive' : 'active'
      await axios.put(`/suppliers/${supplier.id || supplier._id}`, { ...supplier, status: newStatus })
      toast(`Supplier marked as ${newStatus}`, 'success')
      fetchSuppliers()
    } catch (err) {
      toast('Failed to update status', 'error')
    }
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>🏭 Suppliers</h1>
          <p>Manage your supplier relationships</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Supplier</button>
      </div>

      {/* Search & Filters */}
      <div className="search-filter-bar">
        <div className="search-bar">
          <span className="search-bar-icon">🔍</span>
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
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
            <div className="loading-spinner"><div className="spinner" /><p className="loading-text">Loading suppliers...</p></div>
          ) : suppliers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏭</div>
              <h3>No suppliers found</h3>
              <p>Add your first supplier to get started.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Supplier Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Materials</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, idx) => (
                  <tr key={s.id || s._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{(page - 1) * PER_PAGE + idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: 'var(--accent-light)', color: 'var(--accent-dark)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                        }}>
                          {s.name.substring(0, 2).toUpperCase()}
                        </div>
                        <strong>{s.name}</strong>
                      </div>
                    </td>
                    <td>{s.phone || '—'}</td>
                    <td style={{ fontSize: '0.82rem' }}>{s.email || '—'}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {s.address || '—'}
                    </td>
                    <td>
                      <span className="badge badge-info">{s.materials_count ?? s.materialsCount ?? 0} items</span>
                    </td>
                    <td>
                      <button
                        className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-primary'}`}
                        onClick={() => toggleStatus(s)}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle status"
                      >
                        <span className={`status-dot ${s.status}`} />
                        {s.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openView(s)} title="View">{EYE_ICON}</button>
                        <button className="btn btn-info btn-sm btn-icon" onClick={() => openEdit(s)} title="Edit">{EDIT_ICON}</button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(s)} title="Delete">{TRASH_ICON}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <span className="pagination-info">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total}</span>
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
        title={editSupplier ? `Edit: ${editSupplier.name}` : 'Add New Supplier'}
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><span className="spinner-sm" /> Saving...</> : (editSupplier ? '✏️ Update' : '+ Add Supplier')}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Supplier Name <span className="required">*</span></label>
          <input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="Company or individual name" />
          {formErrors.name && <span className="form-error">{formErrors.name}</span>}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input className="form-control" name="phone" value={form.phone} onChange={handleChange} placeholder="e.g. 98765-43210" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} placeholder="supplier@example.com" />
            {formErrors.email && <span className="form-error">{formErrors.email}</span>}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <textarea className="form-control" name="address" value={form.address} onChange={handleChange} placeholder="Full address..." rows={3} />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" name="status" value={form.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Supplier Details"
        size="md"
        footer={<button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>}
      >
        {viewSupplier && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '20px',
              background: 'var(--bg)', borderRadius: 12, marginBottom: 20,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                color: 'var(--primary)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem',
              }}>
                {viewSupplier.name?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{viewSupplier.name}</h3>
                <span className={`badge ${viewSupplier.status === 'active' ? 'badge-success' : 'badge-primary'}`}>
                  {viewSupplier.status}
                </span>
              </div>
            </div>
            <div className="info-grid">
              <div className="info-item"><label>Phone</label><span>{viewSupplier.phone || '—'}</span></div>
              <div className="info-item"><label>Email</label><span>{viewSupplier.email || '—'}</span></div>
              <div className="info-item" style={{ gridColumn: 'span 2' }}>
                <label>Address</label><span>{viewSupplier.address || '—'}</span>
              </div>
              <div className="info-item"><label>Materials Supplied</label>
                <span className="badge badge-info">{viewSupplier.materials_count ?? viewSupplier.materialsCount ?? 0} items</span>
              </div>
            </div>
            {viewSupplier.materials && viewSupplier.materials.length > 0 && (
              <div className="mt-16">
                <div className="section-title">📦 Materials Supplied</div>
                {viewSupplier.materials.map((m, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 8, marginBottom: 6, fontSize: '0.875rem' }}>
                    {m.name} — <span style={{ color: 'var(--text-muted)' }}>{m.material_type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
