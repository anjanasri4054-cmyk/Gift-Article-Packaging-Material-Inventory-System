import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ClipboardList,
  PlusCircle,
  MinusCircle,
  Search,
  Calendar,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import api from '../api';
import { toast } from '../components/Toast';

const PURPOSES = ['Customer Order', 'Corporate Order', 'Sample Production', 'Damaged Item', 'Internal Usage'];
const PER_PAGE = 15;

export default function Inventory() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'stock-in' | 'stock-out'

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'stock-in' || tabParam === 'stock-out' || tabParam === 'ledger') {
      setActiveTab(tabParam);
    } else {
      setActiveTab('ledger');
    }
  }, [location.search]);

  // Ledger state
  const [logs, setLogs] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);

  // Materials and suppliers list for forms
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Stock In Form
  const [stockInForm, setStockInForm] = useState({
    materialId: '',
    quantity: '',
    supplierId: '',
    notes: ''
  });
  const [stockInErrors, setStockInErrors] = useState({});
  const [submittingIn, setSubmittingIn] = useState(false);

  // Stock Out Form
  const [stockOutForm, setStockOutForm] = useState({
    materialId: '',
    quantity: '',
    purpose: 'Damaged Item',
    notes: ''
  });
  const [stockOutErrors, setStockOutErrors] = useState({});
  const [submittingOut, setSubmittingOut] = useState(false);

  // Selected item details for stock levels
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Fetch lists
  const fetchAuxiliary = useCallback(async () => {
    try {
      const [matRes, supRes] = await Promise.all([
        api.get('/materials'),
        api.get('/suppliers')
      ]);
      setMaterials(matRes.data || []);
      setSuppliers(supRes.data || []);
    } catch {
      toast('Failed to load material/supplier options', 'error');
    }
  }, []);

  const fetchLedger = useCallback(async () => {
    try {
      setLoadingLedger(true);
      const params = {};
      if (search) params.search = search;
      if (actionFilter) params.type = actionFilter;

      const { data } = await api.get('/inventory/logs', { params });
      setLogs(data || []);
    } catch {
      toast('Failed to load inventory log history', 'error');
    } finally {
      setLoadingLedger(false);
    }
  }, [search, actionFilter]);

  useEffect(() => {
    fetchAuxiliary();
  }, [fetchAuxiliary]);

  useEffect(() => {
    if (activeTab === 'ledger') {
      fetchLedger();
    }
  }, [activeTab, fetchLedger]);

  useEffect(() => {
    setPage(1);
  }, [search, actionFilter]);

  // Handle forms change
  function handleStockInChange(e) {
    const { name, value } = e.target;
    setStockInForm(f => ({ ...f, [name]: value }));
    setStockInErrors(fe => ({ ...fe, [name]: '' }));

    if (name === 'materialId') {
      const m = materials.find(mat => mat.id === Number(value));
      setSelectedMaterial(m || null);
    }
  }

  function handleStockOutChange(e) {
    const { name, value } = e.target;
    setStockOutForm(f => ({ ...f, [name]: value }));
    setStockOutErrors(fe => ({ ...fe, [name]: '' }));

    if (name === 'materialId') {
      const m = materials.find(mat => mat.id === Number(value));
      setSelectedMaterial(m || null);
    }
  }

  // Submit Stock In
  async function handleStockInSubmit(e) {
    e.preventDefault();
    const errors = {};
    if (!stockInForm.materialId) errors.materialId = 'Please select a material';
    if (!stockInForm.quantity || Number(stockInForm.quantity) <= 0) {
      errors.quantity = 'Quantity must be greater than zero';
    }
    if (!stockInForm.supplierId) errors.supplierId = 'Please select a supplier';

    if (Object.keys(errors).length > 0) {
      setStockInErrors(errors);
      return;
    }

    setSubmittingIn(true);
    try {
      await api.post('/inventory/stock-in', {
        materialId: Number(stockInForm.materialId),
        quantity: Number(stockInForm.quantity),
        supplierId: Number(stockInForm.supplierId),
        notes: stockInForm.notes
      });
      toast('Stock Restocked successfully!', 'success');
      setStockInForm({ materialId: '', quantity: '', supplierId: '', notes: '' });
      setSelectedMaterial(null);
      fetchAuxiliary(); // Refresh stock levels
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to submit Stock In', 'error');
    } finally {
      setSubmittingIn(false);
    }
  }

  // Submit Stock Out
  async function handleStockOutSubmit(e) {
    e.preventDefault();
    const errors = {};
    if (!stockOutForm.materialId) errors.materialId = 'Please select a material';
    if (!stockOutForm.quantity || Number(stockOutForm.quantity) <= 0) {
      errors.quantity = 'Quantity must be greater than zero';
    } else if (selectedMaterial && selectedMaterial.currentStock < Number(stockOutForm.quantity)) {
      errors.quantity = `Insufficient stock (available: ${selectedMaterial.currentStock})`;
    }

    if (Object.keys(errors).length > 0) {
      setStockOutErrors(errors);
      return;
    }

    setSubmittingOut(true);
    try {
      await api.post('/inventory/stock-out', {
        materialId: Number(stockOutForm.materialId),
        quantity: Number(stockOutForm.quantity),
        purpose: stockOutForm.purpose,
        notes: stockOutForm.notes
      });
      toast('Stock deduction recorded!', 'success');
      setStockOutForm({ materialId: '', quantity: '', purpose: 'Damaged Item', notes: '' });
      setSelectedMaterial(null);
      fetchAuxiliary(); // Refresh stock levels
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to submit Stock Out', 'error');
    } finally {
      setSubmittingOut(false);
    }
  }

  // Filter logs for pagination
  const totalItems = logs.length;
  const paginatedLogs = logs.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(totalItems / PER_PAGE) || 1;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Material Inventory Console</h1>
          <p className="page-subtitle">Track ledger histories, log incoming supplies, or report item damages</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '24px', paddingBottom: '4px' }}>
        <button
          className={`btn ${activeTab === 'ledger' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('ledger'); setSelectedMaterial(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ClipboardList size={15} /> Stock Ledger History
        </button>
        <button
          className={`btn ${activeTab === 'stock-in' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('stock-in'); setSelectedMaterial(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <PlusCircle size={15} /> Record Stock In
        </button>
        <button
          className={`btn ${activeTab === 'stock-out' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('stock-out'); setSelectedMaterial(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <MinusCircle size={15} /> Record Stock Out
        </button>
      </div>

      {/* TAB: LEDGER */}
      {activeTab === 'ledger' && (
        <>
          {/* Filters */}
          <div className="search-bar mb-24">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                className="search-control"
                placeholder="Search ledger by material name or notes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select
                className="form-select"
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                style={{ minWidth: 150 }}
              >
                <option value="">All Actions</option>
                <option value="Stock In">Stock In Only</option>
                <option value="Stock Out">Stock Out Only</option>
              </select>
              <button className="btn btn-secondary" onClick={fetchLedger} title="Refresh ledger">
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="card">
            <div className="table-container">
              {loadingLedger ? (
                <div className="loading-spinner" style={{ padding: '60px' }}>
                  <div className="spinner" />
                  <p>Loading ledger entries...</p>
                </div>
              ) : paginatedLogs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><ClipboardList size={40} /></div>
                  <h3>No ledger records found</h3>
                  <p>Verify filters or enter new stock transactions.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Material Name</th>
                      <th>Action</th>
                      <th>Quantity</th>
                      <th>Location</th>
                      <th>User</th>
                      <th>Purpose / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.map(log => {
                      const isStockIn = log.type === 'Stock In';
                      return (
                        <tr key={log.id}>
                          <td>{new Date(log.date).toLocaleString('en-IN')}</td>
                          <td><strong>{log.materialName}</strong></td>
                          <td>
                            <span className={`badge ${isStockIn ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {isStockIn ? <ArrowDownCircle size={10} /> : <ArrowUpCircle size={10} />}
                              {log.type}
                            </span>
                          </td>
                          <td style={{ fontWeight: '600', color: isStockIn ? 'var(--success)' : 'var(--danger)' }}>
                            {isStockIn ? '+' : '−'}{log.quantity} {log.unit}
                          </td>
                          <td>{log.location || '—'}</td>
                          <td>{log.user || 'Admin'}</td>
                          <td style={{ maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={log.purpose}>
                            {log.purpose || '—'}
                          </td>
                        </tr>
                      );
                    })}
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
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB: STOCK IN FORM */}
      {activeTab === 'stock-in' && (
        <div className="card" style={{ maxWidth: '540px', margin: '0 auto', padding: '24px' }}>
          <div className="card-header" style={{ padding: 0, marginBottom: '20px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><PlusCircle style={{ color: 'var(--success)' }} /> Record Stock In</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Add incoming material batches purchased from suppliers</p>
          </div>

          <form onSubmit={handleStockInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Select Packaging Material *</label>
              <select
                className="form-select"
                name="materialId"
                value={stockInForm.materialId}
                onChange={handleStockInChange}
              >
                <option value="">-- Choose Material --</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.unit} — Current Stock: {m.currentStock})
                  </option>
                ))}
              </select>
              {stockInErrors.materialId && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{stockInErrors.materialId}</span>}
            </div>

            {selectedMaterial && (
              <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid var(--border)' }}>
                📍 Storage Location: <strong>{selectedMaterial.location || 'Not Specified'}</strong> &nbsp;|&nbsp; Current Level: <strong>{selectedMaterial.currentStock} {selectedMaterial.unit}</strong>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Quantity to Add *</label>
                <input
                  type="number"
                  className="form-control"
                  name="quantity"
                  value={stockInForm.quantity}
                  onChange={handleStockInChange}
                  placeholder="50"
                  min="1"
                />
                {stockInErrors.quantity && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{stockInErrors.quantity}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Vendor Supplier *</label>
                <select
                  className="form-select"
                  name="supplierId"
                  value={stockInForm.supplierId}
                  onChange={handleStockInChange}
                >
                  <option value="">-- Choose Vendor --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {stockInErrors.supplierId && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{stockInErrors.supplierId}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes / Purposed Description</label>
              <textarea
                className="form-control"
                name="notes"
                value={stockInForm.notes}
                onChange={handleStockInChange}
                placeholder="Enter invoice details, supplier references, or batch numbers..."
                rows="3"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ height: '42px', marginTop: '12px' }} disabled={submittingIn}>
              {submittingIn ? 'Submitting...' : '📥 Submit Restock'}
            </button>
          </form>
        </div>
      )}

      {/* TAB: STOCK OUT FORM */}
      {activeTab === 'stock-out' && (
        <div className="card" style={{ maxWidth: '540px', margin: '0 auto', padding: '24px' }}>
          <div className="card-header" style={{ padding: 0, marginBottom: '20px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><MinusCircle style={{ color: 'var(--danger)' }} /> Record Stock Out</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Deduct material stock for internal use, samples, or damages</p>
          </div>

          <form onSubmit={handleStockOutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Select Packaging Material *</label>
              <select
                className="form-select"
                name="materialId"
                value={stockOutForm.materialId}
                onChange={handleStockOutChange}
              >
                <option value="">-- Choose Material --</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.unit} — Current Stock: {m.currentStock})
                  </option>
                ))}
              </select>
              {stockOutErrors.materialId && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{stockOutErrors.materialId}</span>}
            </div>

            {selectedMaterial && (
              <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid var(--border)' }}>
                📍 Storage Location: <strong>{selectedMaterial.location || 'Not Specified'}</strong> &nbsp;|&nbsp; Current Level: <strong style={{ color: selectedMaterial.currentStock <= selectedMaterial.minimumStock ? 'var(--danger)' : 'inherit' }}>{selectedMaterial.currentStock} {selectedMaterial.unit}</strong>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Quantity to Remove *</label>
                <input
                  type="number"
                  className="form-control"
                  name="quantity"
                  value={stockOutForm.quantity}
                  onChange={handleStockOutChange}
                  placeholder="10"
                  min="1"
                />
                {stockOutErrors.quantity && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{stockOutErrors.quantity}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Usage Purpose *</label>
                <select
                  className="form-select"
                  name="purpose"
                  value={stockOutForm.purpose}
                  onChange={handleStockOutChange}
                >
                  {PURPOSES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes / Damage Reports</label>
              <textarea
                className="form-control"
                name="notes"
                value={stockOutForm.notes}
                onChange={handleStockOutChange}
                placeholder="Describe reason for stock reduction, damaged items report, or internal request reference..."
                rows="3"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ height: '42px', marginTop: '12px' }} disabled={submittingOut}>
              {submittingOut ? 'Submitting...' : '📤 Submit Deduction'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
