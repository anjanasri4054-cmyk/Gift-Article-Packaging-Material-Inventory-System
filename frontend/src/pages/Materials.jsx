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

const MATERIAL_TYPES = ['Boxes', 'Ribbons', 'Wrapping Paper', 'Filler Materials', 'Tapes', 'Decorative Items']
const UNITS = ['Pieces', 'Meters', 'Rolls', 'Sheets', 'Kilograms', 'Liters', 'Sets']
const PER_PAGE = 10

const EMPTY_FORM = {
  name: '', material_type: '', quantity: '', unit: '',
  reorder_level: '', supplier_id: '', storage_location: '',
}

const TYPE_BADGE_COLORS = {
  'Boxes': 'badge-info',
  'Ribbons': 'badge-amber',
  'Wrapping Paper': 'badge-success',
  'Filler Materials': 'badge-warning',
  'Tapes': 'badge-primary',
  'Decorative Items': 'badge-danger',
}

export default function Materials() {
  const [materials, setMaterials] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editMaterial, setEditMaterial] = useState(null)
  const [viewMaterial, setViewMaterial] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, limit: PER_PAGE }
      if (search) params.search = search
      if (typeFilter) params.material_type = typeFilter
      if (supplierFilter) params.supplier_id = supplierFilter

      const { data } = await axios.get('/materials', { params })
      setMaterials(data.materials || data.data || data || [])
      setTotal(data.total || data.count || (data.materials || data.data || data || []).length)
    } catch {
      toast('Failed to load materials', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, typeFilter, supplierFilter])

  useEffect(() => { fetchMaterials() }, [fetchMaterials])
  useEffect(() => { setPage(1) }, [search, typeFilter, supplierFilter])

  useEffect(() => {
    axios.get('/suppliers?limit=100').then(({ data }) => {
      setSuppliers(data.suppliers || data.data || data || [])
    }).catch(() => {})
  }, [])

  function openAdd() {
    setEditMaterial(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setShowAddModal(true)
  }

  function openEdit(material) {
    setEditMaterial(material)
    setForm({
      name: material.name || '',
      material_type: material.material_type || '',
      quantity: material.quantity ?? '',
      unit: material.unit || '',
      reorder_level: material.reorder_level ?? '',
      supplier_id: material.supplier_id ?? '',
      storage_location: material.storage_location || '',
    })
    setFormErrors({})
    setShowAddModal(true)
  }

  function openView(material) {
    setViewMaterial(material)
    setShowViewModal(true)
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setFormErrors(fe => ({ ...fe, [name]: '' }))
  }

  function validate() {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Material name is required'
    if (!form.material_type) errors.material_type = 'Material type is required'
    if (form.quantity === '' || isNaN(form.quantity) || Number(form.quantity) < 0) errors.quantity = 'Valid quantity is required'
    if (!form.unit) errors.unit = 'Unit is required'
    if (form.reorder_level === '' || isNaN(form.reorder_level) || Number(form.reorder_level) < 0) errors.reorder_level = 'Valid reorder level is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = { ...form }
      if (!payload.supplier_id) delete payload.supplier_id

      if (editMaterial) {
        await axios.put(`/materials/${editMaterial.id || editMaterial._id}`, payload)
        toast('Material updated successfully!', 'success')
      } else {
        await axios.post('/materials', payload)
        toast('Material added successfully!', 'success')
      }
      setShowAddModal(false)
      fetchMaterials()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save material', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(material) {
    if (!window.confirm(`Delete "${material.name}"? This action cannot be undone.`)) return
    try {
      await axios.delete(`/materials/${material.id || material._id}`)
      toast('Material deleted successfully', 'success')
      fetchMaterials()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete material', 'error')
    }
  }

  function isLowStock(m) {
    return Number(m.quantity) <= Number(m.reorder_level)
  }

  function getSupplierName(id) {
    const s = suppliers.find(s => s.id == id || s._id == id)
    return s ? s.name : '—'
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>📦 Packaging Materials</h1>
          <p>Manage your packaging material inventory</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Material</button>
      </div>

      {/* Search & Filters */}
      <div className="search-filter-bar">
        <div className="search-bar">
          <span className="search-bar-icon">🔍</span>
          <input
            type="text"
            placeholder="Search materials..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="filter-select" value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
            <option value="">All Suppliers</option>
            {suppliers.map(s => <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /><p className="loading-text">Loading materials...</p></div>
          ) : materials.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>No materials found</h3>
              <p>Add your first packaging material to get started.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Material Name</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Reorder Level</th>
                  <th>Supplier</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m, idx) => (
                  <tr key={m.id || m._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{(page - 1) * PER_PAGE + idx + 1}</td>
                    <td>
                      <div>
                        <strong>{m.name}</strong>
                        {isLowStock(m) && Number(m.quantity) > 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 600 }}>⚠ Low Stock</div>
                        )}
                        {Number(m.quantity) === 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 600 }}>❌ Out of Stock</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${TYPE_BADGE_COLORS[m.material_type] || 'badge-primary'}`}>
                        {m.material_type}
                      </span>
                    </td>
                    <td>
                      <span className={isLowStock(m) ? 'quantity-low' : 'quantity-ok'}>
                        {m.quantity}
                      </span>
                    </td>
                    <td>{m.unit}</td>
                    <td>{m.reorder_level}</td>
                    <td>{m.supplier_name || getSupplierName(m.supplier_id)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{m.storage_location || '—'}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openView(m)} title="View">{EYE_ICON}</button>
                        <button className="btn btn-info btn-sm btn-icon" onClick={() => openEdit(m)} title="Edit">{EDIT_ICON}</button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(m)} title="Delete">{TRASH_ICON}</button>
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
        title={editMaterial ? `Edit: ${editMaterial.name}` : 'Add New Material'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><span className="spinner-sm" /> Saving...</> : (editMaterial ? '✏️ Update' : '+ Add Material')}
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Material Name <span className="required">*</span></label>
            <input className="form-control" name="name" value={form.name} onChange={handleChange} placeholder="e.g., Brown Kraft Boxes" />
            {formErrors.name && <span className="form-error">{formErrors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Material Type <span className="required">*</span></label>
            <select className="form-select" name="material_type" value={form.material_type} onChange={handleChange}>
              <option value="">Select Type</option>
              {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {formErrors.material_type && <span className="form-error">{formErrors.material_type}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Quantity <span className="required">*</span></label>
            <input className="form-control" type="number" name="quantity" value={form.quantity} onChange={handleChange} placeholder="0" min="0" />
            {formErrors.quantity && <span className="form-error">{formErrors.quantity}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Unit <span className="required">*</span></label>
            <select className="form-select" name="unit" value={form.unit} onChange={handleChange}>
              <option value="">Select Unit</option>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            {formErrors.unit && <span className="form-error">{formErrors.unit}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Reorder Level <span className="required">*</span></label>
            <input className="form-control" type="number" name="reorder_level" value={form.reorder_level} onChange={handleChange} placeholder="0" min="0" />
            {formErrors.reorder_level && <span className="form-error">{formErrors.reorder_level}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Supplier</label>
            <select className="form-select" name="supplier_id" value={form.supplier_id} onChange={handleChange}>
              <option value="">No Supplier</option>
              {suppliers.map(s => (
                <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Storage Location</label>
          <input className="form-control" name="storage_location" value={form.storage_location} onChange={handleChange} placeholder="e.g., Warehouse Shelf B-3" />
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Material Details"
        size="md"
        footer={<button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>}
      >
        {viewMaterial && (
          <div className="info-grid">
            <div className="info-item"><label>Name</label><span>{viewMaterial.name}</span></div>
            <div className="info-item"><label>Type</label><span className={`badge ${TYPE_BADGE_COLORS[viewMaterial.material_type] || 'badge-primary'}`}>{viewMaterial.material_type}</span></div>
            <div className="info-item"><label>Quantity</label><span className={isLowStock(viewMaterial) ? 'quantity-low' : 'quantity-ok'}>{viewMaterial.quantity}</span></div>
            <div className="info-item"><label>Unit</label><span>{viewMaterial.unit}</span></div>
            <div className="info-item"><label>Reorder Level</label><span>{viewMaterial.reorder_level}</span></div>
            <div className="info-item"><label>Supplier</label><span>{viewMaterial.supplier_name || getSupplierName(viewMaterial.supplier_id)}</span></div>
            <div className="info-item" style={{ gridColumn: 'span 2' }}><label>Storage Location</label><span>{viewMaterial.storage_location || '—'}</span></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
