import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from '../components/Toast'

const PER_PAGE = 15

const ACTION_CONFIG = {
  stock_in: { class: 'badge-success', label: 'Stock In' },
  stock_out: { class: 'badge-danger', label: 'Stock Out' },
  product_created: { class: 'badge-info', label: 'Product Added' },
  product_updated: { class: 'badge-amber', label: 'Product Updated' },
  product_deleted: { class: 'badge-danger', label: 'Product Deleted' },
  material_created: { class: 'badge-info', label: 'Material Added' },
  material_updated: { class: 'badge-amber', label: 'Material Updated' },
  material_deleted: { class: 'badge-danger', label: 'Material Deleted' },
  supplier_created: { class: 'badge-info', label: 'Supplier Added' },
  supplier_updated: { class: 'badge-amber', label: 'Supplier Updated' },
  supplier_deleted: { class: 'badge-danger', label: 'Supplier Deleted' },
}

export default function History() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [itemTypeFilter, setItemTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, limit: PER_PAGE }
      if (search) params.search = search
      if (actionFilter) params.action = actionFilter
      if (itemTypeFilter) params.item_type = itemTypeFilter
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo

      const { data } = await axios.get('/inventory/logs', { params })
      setLogs(data.logs || data.data || data || [])
      setTotal(data.total || data.count || (data.logs || data.data || data || []).length)
    } catch {
      toast('Failed to load history', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, actionFilter, itemTypeFilter, dateFrom, dateTo])

  useEffect(() => { fetchLogs() }, [fetchLogs])
  useEffect(() => { setPage(1) }, [search, actionFilter, itemTypeFilter, dateFrom, dateTo])

  function getActionBadge(action) {
    const key = (action || '').toLowerCase().replace(/ /g, '_')
    const cfg = ACTION_CONFIG[key]
    if (!cfg) return <span className="badge badge-primary">{action}</span>
    return <span className={`badge ${cfg.class}`}>{cfg.label}</span>
  }

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  function clearFilters() {
    setSearch('')
    setActionFilter('')
    setItemTypeFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const totalPages = Math.ceil(total / PER_PAGE)
  const hasFilters = search || actionFilter || itemTypeFilter || dateFrom || dateTo

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>📜 Inventory History</h1>
          <p>Complete audit log of all inventory transactions</p>
        </div>
        {hasFilters && (
          <button className="btn btn-secondary" onClick={clearFilters}>Clear Filters ×</button>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Search Item
            </label>
            <div className="search-bar" style={{ minWidth: 'auto' }}>
              <span className="search-bar-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by item name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Action Type
            </label>
            <select className="filter-select w-full" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              <option value="">All Actions</option>
              {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Item Type
            </label>
            <select className="filter-select w-full" value={itemTypeFilter} onChange={e => setItemTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="product">Gift Article</option>
              <option value="material">Packaging Material</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Date From
            </label>
            <input type="date" className="form-control" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Date To
            </label>
            <input type="date" className="form-control" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <h3>📋 Transaction Log</h3>
          <span className="badge badge-primary">{total} records</span>
        </div>
        <div className="table-container">
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /><p className="loading-text">Loading history...</p></div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No records found</h3>
              <p>Try adjusting your filters or date range.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Name</th>
                  <th>Item Type</th>
                  <th>Action</th>
                  <th>Quantity</th>
                  <th>User</th>
                  <th>Notes</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={log.id || log._id || idx}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{(page - 1) * PER_PAGE + idx + 1}</td>
                    <td><strong>{log.item_name || log.itemName || '—'}</strong></td>
                    <td>
                      {log.item_type || log.itemType ? (
                        <span className={`badge ${(log.item_type || log.itemType) === 'product' ? 'badge-amber' : 'badge-info'}`}>
                          {(log.item_type || log.itemType) === 'product' ? '🎁 Gift Article' : '📦 Material'}
                        </span>
                      ) : <span className="badge badge-primary">—</span>}
                    </td>
                    <td>{getActionBadge(log.action || log.action_type)}</td>
                    <td>
                      {log.quantity != null ? (
                        <span style={{
                          fontWeight: 700,
                          color: (log.action || '').includes('stock_in') ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {(log.action || '').includes('stock_in') ? '+' : ''}{log.quantity}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{log.user || log.performed_by || 'Admin'}</td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {log.notes || '—'}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(log.created_at || log.date)}
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
    </div>
  )
}
