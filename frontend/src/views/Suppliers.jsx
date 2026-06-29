import React, { useState, useEffect, useCallback } from 'react';
import { Factory, Plus, Search, Eye, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';

const PER_PAGE = 10;

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  gst: '',
  address: '',
  status: 'active'
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [viewSupplier, setViewSupplier] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const { data } = await api.get('/suppliers', { params });
      setSuppliers(data || []);
    } catch {
      toast('Failed to load suppliers', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  function openAdd() {
    setEditSupplier(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowAddModal(true);
  }

  function openEdit(supplier) {
    setEditSupplier(supplier);
    setForm({
      name: supplier.name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      gst: supplier.gst || '',
      address: supplier.address || '',
      status: supplier.status || 'active'
    });
    setFormErrors({});
    setShowAddModal(true);
  }

  async function openView(supplier) {
    try {
      const { data } = await api.get(`/suppliers/${supplier.id}`);
      setViewSupplier(data);
    } catch {
      setViewSupplier(supplier);
    }
    setShowViewModal(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setFormErrors(fe => ({ ...fe, [name]: '' }));
  }

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Supplier name is required';
    if (!form.gst.trim()) errors.gst = 'GSTIN is required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = 'Invalid email format';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (editSupplier) {
        await api.put(`/suppliers/${editSupplier.id}`, form);
        toast('Supplier details updated successfully!', 'success');
      } else {
        await api.post('/suppliers', form);
        toast('Supplier vendor added successfully!', 'success');
      }
      setShowAddModal(false);
      fetchSuppliers();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to save supplier', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(supplier) {
    if (!window.confirm(`Delete "${supplier.name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/suppliers/${supplier.id}`);
      toast('Supplier deleted successfully', 'success');
      fetchSuppliers();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to delete supplier', 'error');
    }
  }

  async function toggleStatus(supplier) {
    try {
      const newStatus = supplier.status === 'active' ? 'inactive' : 'active';
      await api.put(`/suppliers/${supplier.id}`, { ...supplier, status: newStatus });
      toast(`Supplier marked as ${newStatus}`, 'success');
      fetchSuppliers();
    } catch (err) {
      toast('Failed to update status', 'error');
    }
  }

  // Filter & Pagination logic
  const totalItems = suppliers.length;
  const paginatedSuppliers = suppliers.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(totalItems / PER_PAGE) || 1;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🏭 Suppliers</h1>
          <p className="page-subtitle">Manage packaging material vendors and purchase channels</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      {/* Search & Filters */}
      <div className="search-bar mb-24">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-control"
            placeholder="Search suppliers by name, GSTIN, or city..."
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
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="loading-spinner" style={{ padding: '60px' }}>
              <div className="spinner" />
              <p>Loading suppliers...</p>
            </div>
          ) : paginatedSuppliers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Factory size={40} /></div>
              <h3>No suppliers found</h3>
              <p>Add your first packaging material supplier to get started.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Supplier Name</th>
                  <th>GSTIN</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Materials supplied</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSuppliers.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: 'var(--accent-light)', color: 'var(--accent-dark)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                        }}>
                          {s.name.substring(0, 2).toUpperCase()}
                        </div>
                        <strong>{s.name}</strong>
                      </div>
                    </td>
                    <td>{s.gst}</td>
                    <td>{s.phone || '—'}</td>
                    <td>{s.email || '—'}</td>
                    <td>
                      <span className="badge badge-info">{s.materialsCount || 0} items</span>
                    </td>
                    <td>
                      <button
                        className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-primary'}`}
                        onClick={() => toggleStatus(s)}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle status"
                      >
                        {s.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-icon" title="View details" onClick={() => openView(s)}>
                          <Eye size={14} />
                        </button>
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(s)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn-icon" title="Delete" onClick={() => handleDelete(s)}>
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
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={editSupplier ? '✏️ Edit Supplier' : '🏭 Add New Supplier'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Supplier Name *</label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Ribbon World"
            />
            {formErrors.name && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.name}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. 98123-45678"
              />
            </div>

            <div className="form-group">
              <label className="form-label">GSTIN (GST Number) *</label>
              <input
                type="text"
                className="form-control"
                name="gst"
                value={form.gst}
                onChange={handleChange}
                placeholder="e.g. 07AAAAA1111A1Z1"
              />
              {formErrors.gst && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.gst}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. supply@ribbonworld.com"
            />
            {formErrors.email && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-control"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="e.g. Shop 12, Connaught Place, New Delhi, Delhi"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" name="status" value={form.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Footer Controls */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- VIEW DETAILS MODAL --- */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="🏭 Supplier Vendor Overview">
        {viewSupplier && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-dark)', fontWeight: 'bold' }}>
                {viewSupplier.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{viewSupplier.name}</h3>
                <span className={`badge ${viewSupplier.status === 'active' ? 'badge-success' : 'badge-primary'}`}>
                  {viewSupplier.status === 'active' ? 'Active Vendor' : 'Inactive Vendor'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="card" style={{ padding: '12px', background: 'var(--bg)' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>GSTIN (GST NUMBER)</p>
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{viewSupplier.gst || 'Not Provided'}</h4>
              </div>
              <div className="card" style={{ padding: '12px', background: 'var(--bg)' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ITEMS SUPPLIED</p>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{viewSupplier.materialsCount || 0} items</h4>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                Phone: <strong>{viewSupplier.phone || '—'}</strong>
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                Email: <strong>{viewSupplier.email || '—'}</strong>
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                Address: <strong>{viewSupplier.address || '—'}</strong>
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
