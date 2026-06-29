import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Package, Plus, Search, Eye, Edit, Trash2, AlertTriangle, MapPin, DollarSign } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';

const UNITS = ['Pieces', 'Meters', 'Rolls', 'Sheets', 'Kilograms', 'Liters', 'Sets'];
const PER_PAGE = 10;

const EMPTY_FORM = {
  name: '',
  currentStock: '',
  minimumStock: '',
  supplierId: '',
  location: '',
  unit: 'Pieces',
  pricePerUnit: ''
};

export default function PackagingMaterials() {
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [page, setPage] = useState(1);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearch(searchParam);
    }
  }, [location.search]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editMaterial, setEditMaterial] = useState(null);
  const [viewMaterial, setViewMaterial] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (supplierFilter) params.supplierId = supplierFilter;

      const { data } = await api.get('/materials', { params });
      setMaterials(data || []);
    } catch {
      toast('Failed to load materials', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, supplierFilter]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  useEffect(() => {
    setPage(1);
  }, [search, supplierFilter]);

  useEffect(() => {
    api.get('/suppliers').then(({ data }) => {
      setSuppliers(data || []);
    }).catch(() => {});
  }, []);

  function openAdd() {
    setEditMaterial(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowAddModal(true);
  }

  function openEdit(material) {
    setEditMaterial(material);
    setForm({
      name: material.name || '',
      currentStock: material.currentStock ?? '',
      minimumStock: material.minimumStock ?? '',
      supplierId: material.supplierId ?? '',
      location: material.location || '',
      unit: material.unit || 'Pieces',
      pricePerUnit: material.pricePerUnit ?? ''
    });
    setFormErrors({});
    setShowAddModal(true);
  }

  function openView(material) {
    setViewMaterial(material);
    setShowViewModal(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setFormErrors(fe => ({ ...fe, [name]: '' }));
  }

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Material name is required';
    if (form.currentStock === '' || isNaN(form.currentStock) || Number(form.currentStock) < 0) {
      errors.currentStock = 'Valid quantity is required';
    }
    if (form.minimumStock === '' || isNaN(form.minimumStock) || Number(form.minimumStock) < 0) {
      errors.minimumStock = 'Valid minimum stock threshold is required';
    }
    if (!form.supplierId) errors.supplierId = 'Supplier is required';
    if (form.pricePerUnit === '' || isNaN(form.pricePerUnit) || Number(form.pricePerUnit) < 0) {
      errors.pricePerUnit = 'Valid unit cost is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        currentStock: Number(form.currentStock),
        minimumStock: Number(form.minimumStock),
        supplierId: Number(form.supplierId),
        location: form.location,
        unit: form.unit,
        pricePerUnit: parseFloat(form.pricePerUnit)
      };

      if (editMaterial) {
        await api.put(`/materials/${editMaterial.id}`, payload);
        toast('Material updated successfully!', 'success');
      } else {
        await api.post('/materials', payload);
        toast('Material added successfully!', 'success');
      }
      setShowAddModal(false);
      fetchMaterials();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to save material', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(material) {
    if (!window.confirm(`Delete "${material.name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/materials/${material.id}`);
      toast('Material deleted successfully', 'success');
      fetchMaterials();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to delete material', 'error');
    }
  }

  function isLowStock(m) {
    return Number(m.currentStock) <= Number(m.minimumStock);
  }

  // Filter & Pagination logic
  const totalItems = materials.length;
  const paginatedMaterials = materials.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(totalItems / PER_PAGE) || 1;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Packaging Materials</h1>
          <p className="page-subtitle">Track and configure gift packing items stock</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Material
        </button>
      </div>

      {/* Search & Filters */}
      <div className="search-bar mb-24">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-control"
            placeholder="Search materials by name or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select
            className="form-select"
            value={supplierFilter}
            onChange={e => setSupplierFilter(e.target.value)}
            style={{ minWidth: 160 }}
          >
            <option value="">All Suppliers</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Materials Table Card */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="loading-spinner" style={{ padding: '60px' }}>
              <div className="spinner" />
              <p>Loading materials...</p>
            </div>
          ) : paginatedMaterials.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Package size={40} /></div>
              <h3>No packaging materials found</h3>
              <p>Add your first packaging sheet, box, or ribbon.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material Name</th>
                  <th>Stock Quantity</th>
                  <th>Min threshold</th>
                  <th>Supplier</th>
                  <th>Unit Cost</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMaterials.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div>
                        <strong>{m.name}</strong>
                        {isLowStock(m) && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                            <AlertTriangle size={10} /> Low Stock Alert
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={isLowStock(m) ? 'quantity-low' : ''} style={{ fontWeight: '600' }}>
                        {m.currentStock} {m.unit}
                      </span>
                    </td>
                    <td>{m.minimumStock} {m.unit}</td>
                    <td>{m.supplierName || '—'}</td>
                    <td>Rs. {Number(m.pricePerUnit).toLocaleString()}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                        <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                        {m.location || '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-icon" title="View Details" onClick={() => openView(m)}>
                          <Eye size={14} />
                        </button>
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(m)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn-icon" title="Delete" onClick={() => handleDelete(m)}>
                          <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination footer */}
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

      {/* --- ADD/EDIT MODAL --- */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={editMaterial ? '✏️ Edit Material Item' : '📦 Add Material Item'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Material Name *</label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Red Satin Ribbon 2cm"
            />
            {formErrors.name && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.name}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Initial Stock *</label>
              <input
                type="number"
                className="form-control"
                name="currentStock"
                value={form.currentStock}
                onChange={handleChange}
                placeholder="100"
              />
              {formErrors.currentStock && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.currentStock}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Min Stock Threshold *</label>
              <input
                type="number"
                className="form-control"
                name="minimumStock"
                value={form.minimumStock}
                onChange={handleChange}
                placeholder="20"
              />
              {formErrors.minimumStock && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.minimumStock}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Unit of Measure *</label>
              <select className="form-select" name="unit" value={form.unit} onChange={handleChange}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              {formErrors.unit && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.unit}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Unit Cost (Rs) *</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                name="pricePerUnit"
                value={form.pricePerUnit}
                onChange={handleChange}
                placeholder="15.00"
              />
              {formErrors.pricePerUnit && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.pricePerUnit}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Supplier *</label>
              <select className="form-select" name="supplierId" value={form.supplierId} onChange={handleChange}>
                <option value="">Choose Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {formErrors.supplierId && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.supplierId}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Storage Location</label>
              <input
                type="text"
                className="form-control"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Shelf A1"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Material'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- VIEW DETAILS MODAL --- */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="📦 Material Details Overview">
        {viewMaterial && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <Package size={22} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{viewMaterial.name}</h3>
                <span className="badge badge-info">{viewMaterial.unit} Packaging</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              <div className="card" style={{ padding: '12px', background: 'var(--bg)' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>CURRENT STOCK</p>
                <h4 style={{ margin: 0, fontSize: '1rem', color: isLowStock(viewMaterial) ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {viewMaterial.currentStock} {viewMaterial.unit}
                </h4>
              </div>
              <div className="card" style={{ padding: '12px', background: 'var(--bg)' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>MIN STOCK THRESHOLD</p>
                <h4 style={{ margin: 0, fontSize: '1rem' }}>
                  {viewMaterial.minimumStock} {viewMaterial.unit}
                </h4>
              </div>
              <div className="card" style={{ padding: '12px', background: 'var(--bg)' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>UNIT COST (RS)</p>
                <h4 style={{ margin: 0, fontSize: '1rem' }}>
                  Rs. {Number(viewMaterial.pricePerUnit).toLocaleString()}
                </h4>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                Storage Location: <strong>{viewMaterial.location || 'Not Specified'}</strong>
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Assigned Supplier: <strong>{viewMaterial.supplierName}</strong>
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
