import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Gift, Plus, Search, Eye, Edit, Trash2, Image, AlertTriangle } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';

const CATEGORIES = ['Photo Frames', 'Mugs', 'Cushions', 'Hampers', 'Greeting Cards', 'Customized Gifts', 'Others'];
const PER_PAGE = 10;

const EMPTY_FORM = {
  name: '',
  type: '',
  description: '',
  price: '',
  image: null,
};

export default function GiftArticles() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
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
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.type = categoryFilter;

      const { data } = await api.get('/products', { params });
      setProducts(data || []);
    } catch (err) {
      toast('Failed to load gift articles', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

  function openAdd() {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setImagePreview(null);
    setFormErrors({});
    setShowAddModal(true);
  }

  function openEdit(product) {
    setEditProduct(product);
    setForm({
      name: product.name || '',
      type: product.type || '',
      description: product.description || '',
      price: product.price ?? '',
      image: null
    });
    setImagePreview(product.imageUrl ? product.imageUrl : null);
    setFormErrors({});
    setShowAddModal(true);
  }

  function openView(product) {
    setViewProduct(product);
    setShowViewModal(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setFormErrors(fe => ({ ...fe, [name]: '' }));
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, image: file }));
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  function validate() {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Product name is required';
    if (!form.type) errors.type = 'Category is required';
    if (!form.price || isNaN(form.price) || Number(form.price) < 0) {
      errors.price = 'Valid price is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('type', form.type);
      fd.append('description', form.description);
      fd.append('price', form.price);
      if (form.image) {
        fd.append('image', form.image);
      }

      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast('Gift article updated successfully!', 'success');
      } else {
        await api.post('/products', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast('Gift article added successfully!', 'success');
      }
      setShowAddModal(false);
      fetchProducts();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to save product', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Delete "${product.name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      toast('Product deleted successfully', 'success');
      fetchProducts();
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to delete product', 'error');
    }
  }

  // Filter & Pagination logic
  const totalItems = products.length;
  const paginatedProducts = products.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(totalItems / PER_PAGE) || 1;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🎁 Gift Articles Catalog</h1>
          <p className="page-subtitle">Manage customizable gift items sold to customers</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search & Filters */}
      <div className="search-bar mb-24">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-control"
            placeholder="Search by product name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select
            className="form-select"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{ minWidth: 160 }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="loading-spinner" style={{ padding: '60px' }}>
              <div className="spinner" />
              <p>Loading products...</p>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Gift size={40} /></div>
              <h3>No gift articles found</h3>
              <p>Add new products or clear filters.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Base Price</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }}
                          />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <Image size={18} />
                          </div>
                        )}
                        <strong>{p.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{p.type}</span>
                    </td>
                    <td>Rs. {Number(p.price).toLocaleString()}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.description || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-icon" title="View details" onClick={() => openView(p)}>
                          <Eye size={14} />
                        </button>
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(p)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn-icon" title="Delete" onClick={() => handleDelete(p)}>
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
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={editProduct ? '✏️ Edit Gift Article' : '🎁 Add New Gift Article'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              className="form-control"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Handmade Photo Frame"
            />
            {formErrors.name && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.name}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" name="type" value={form.type} onChange={handleChange}>
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {formErrors.type && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.type}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Selling Price (Rs) *</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="450.00"
              />
              {formErrors.price && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{formErrors.price}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Provide a detailed description of the gift article..."
              rows="3"
            />
          </div>

          {/* Product Image Uploader */}
          <div className="form-group">
            <label className="form-label">Product Image</label>
            <input
              type="file"
              ref={fileRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Image size={15} /> Upload File
              </button>
              {imagePreview && (
                <div style={{ position: 'relative' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Controls */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- VIEW DETAILS MODAL --- */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="🎁 Product Overview">
        {viewProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              {viewProduct.imageUrl ? (
                <img
                  src={viewProduct.imageUrl}
                  alt={viewProduct.name}
                  style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border)' }}
                />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <Image size={30} />
                </div>
              )}
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem' }}>{viewProduct.name}</h3>
                <span className="badge badge-info">{viewProduct.type}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="card" style={{ padding: '12px', background: 'var(--bg)' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>BASE SELLING PRICE</p>
                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Rs. {Number(viewProduct.price).toLocaleString()}</h4>
              </div>
              <div className="card" style={{ padding: '12px', background: 'var(--bg)' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>PRODUCT ID</p>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>#{viewProduct.id}</h4>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.875rem' }}>Description</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {viewProduct.description || 'No description provided for this gift article.'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
