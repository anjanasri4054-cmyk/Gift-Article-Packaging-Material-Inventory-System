import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from '../components/Toast'

const PURPOSES = ['Customer Order', 'Corporate Order', 'Sample Production', 'Damaged Item', 'Internal Usage']
const today = () => new Date().toISOString().split('T')[0]

export default function StockOut() {
  const [form, setForm] = useState({
    item_type: 'product',
    item_id: '',
    quantity: '',
    purpose: '',
    date: today(),
    notes: '',
  })
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [history, setHistory] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [loadingItems, setLoadingItems] = useState(false)
  const [lowStockWarning, setLowStockWarning] = useState('')

  const fetchItems = useCallback(async () => {
    setLoadingItems(true)
    try {
      const endpoint = form.item_type === 'product' ? '/products?limit=200' : '/materials?limit=200'
      const { data } = await axios.get(endpoint)
      setItems(data.products || data.materials || data.data || data || [])
    } catch {
      toast('Failed to load items', 'error')
    } finally {
      setLoadingItems(false)
    }
  }, [form.item_type])

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await axios.get('/inventory/logs', { params: { action: 'stock_out', limit: 20 } })
      setHistory(data.logs || data.data || data || [])
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchItems()
    setForm(f => ({ ...f, item_id: '', quantity: '' }))
    setSelectedItem(null)
    setLowStockWarning('')
  }, [form.item_type])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setErrors(er => ({ ...er, [name]: '' }))

    if (name === 'item_id') {
      const found = items.find(i => String(i.id || i._id) === String(value))
      setSelectedItem(found || null)
      setLowStockWarning('')
    }

    if (name === 'quantity' && selectedItem) {
      const requested = Number(value)
      const current = Number(selectedItem.quantity)
      if (requested > current) {
        setErrors(er => ({ ...er, quantity: `Insufficient stock! Only ${current} units available.` }))
      } else {
        setErrors(er => ({ ...er, quantity: '' }))
      }
    }
  }

  function validate() {
    const errs = {}
    if (!form.item_id) errs.item_id = 'Please select an item'
    if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) < 1) errs.quantity = 'Quantity must be at least 1'
    if (selectedItem && Number(form.quantity) > Number(selectedItem.quantity)) {
      errs.quantity = `Insufficient stock! Only ${selectedItem.quantity} available.`
    }
    if (!form.purpose) errs.purpose = 'Purpose is required'
    if (!form.date) errs.date = 'Date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setLowStockWarning('')
    try {
      const { data } = await axios.post('/inventory/stock-out', {
        item_type: form.item_type,
        item_id: form.item_id,
        quantity: Number(form.quantity),
        purpose: form.purpose,
        date: form.date,
        notes: form.notes,
      })
      toast(`✅ Stock Out recorded! Removed ${form.quantity} units.`, 'success')

      // Check for low-stock warning from backend
      if (data.lowStockWarning || data.low_stock_warning) {
        setLowStockWarning(`⚠️ Warning: ${selectedItem?.name} is now low on stock! Consider reordering.`)
      }

      setForm({ item_type: form.item_type, item_id: '', quantity: '', purpose: '', date: today(), notes: '' })
      setSelectedItem(null)
      fetchItems()
      fetchHistory()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to record stock out', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isLow = selectedItem && Number(selectedItem.quantity) <= Number(selectedItem.minimum_stock || selectedItem.reorder_level || 0)

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>📤 Stock Out</h1>
          <p>Record inventory usage and outgoing stock</p>
        </div>
      </div>

      {lowStockWarning && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div>
            <strong>Low Stock Alert!</strong>
            <div>{lowStockWarning}</div>
          </div>
          <button onClick={() => setLowStockWarning('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.6 }}>×</button>
        </div>
      )}

      <div className="split-layout">
        {/* Form */}
        <div className="card">
          <div className="card-header">
            <h3>📝 Record Stock Out</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Item Type */}
              <div className="form-group">
                <label className="form-label">Item Type <span className="required">*</span></label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { value: 'product', label: '🎁 Gift Article' },
                    { value: 'material', label: '📦 Packaging Material' },
                  ].map(opt => (
                    <label key={opt.value} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${form.item_type === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.item_type === opt.value ? 'var(--accent-light)' : 'var(--card-bg)',
                      flex: 1, transition: 'all 0.2s',
                    }}>
                      <input
                        type="radio"
                        name="item_type"
                        value={opt.value}
                        checked={form.item_type === opt.value}
                        onChange={handleChange}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Item Select */}
              <div className="form-group">
                <label className="form-label">Select Item <span className="required">*</span></label>
                <select
                  className="form-select"
                  name="item_id"
                  value={form.item_id}
                  onChange={handleChange}
                  disabled={loadingItems}
                >
                  <option value="">{loadingItems ? 'Loading...' : '— Choose an item —'}</option>
                  {items.map(item => (
                    <option key={item.id || item._id} value={item.id || item._id}>
                      {item.name} (Stock: {item.quantity})
                    </option>
                  ))}
                </select>
                {errors.item_id && <span className="form-error">{errors.item_id}</span>}
              </div>

              {/* Current Stock Display */}
              {selectedItem && (
                <div className={`stock-level-indicator ${isLow ? 'low' : 'ok'}`}>
                  <span>{isLow ? '⚠️' : '✅'}</span>
                  <span>
                    <strong>Current Stock:</strong> {selectedItem.quantity} {selectedItem.unit || 'units'}
                    {isLow && <span style={{ marginLeft: 8, fontWeight: 700 }}>— LOW STOCK!</span>}
                  </span>
                </div>
              )}

              {/* Quantity */}
              <div className="form-group">
                <label className="form-label">Quantity to Remove <span className="required">*</span></label>
                <input
                  className="form-control"
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  min="1"
                  max={selectedItem?.quantity || undefined}
                  style={errors.quantity ? { borderColor: 'var(--danger)' } : {}}
                />
                {errors.quantity && <span className="form-error">{errors.quantity}</span>}
                {selectedItem && form.quantity && !errors.quantity && (
                  <span className="form-text">
                    After deduction: {Number(selectedItem.quantity) - Number(form.quantity)} units remaining
                  </span>
                )}
              </div>

              {/* Purpose */}
              <div className="form-group">
                <label className="form-label">Purpose <span className="required">*</span></label>
                <select className="form-select" name="purpose" value={form.purpose} onChange={handleChange}>
                  <option value="">Select Purpose</option>
                  {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.purpose && <span className="form-error">{errors.purpose}</span>}
              </div>

              {/* Date */}
              <div className="form-group">
                <label className="form-label">Date <span className="required">*</span></label>
                <input
                  className="form-control"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  max={today()}
                />
                {errors.date && <span className="form-error">{errors.date}</span>}
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <button type="submit" className="btn btn-danger w-full" disabled={submitting} style={{ justifyContent: 'center' }}>
                {submitting ? <><span className="spinner-sm" /> Processing...</> : '📤 Record Stock Out'}
              </button>
            </form>
          </div>
        </div>

        {/* History */}
        <div className="card">
          <div className="card-header">
            <h3>📋 Recent Stock Out</h3>
            <span className="badge badge-danger">{history.length} records</span>
          </div>
          <div className="table-container">
            {history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📤</div>
                <h3>No records yet</h3>
                <p>Stock out transactions will appear here.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Purpose</th>
                    <th>Date</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, idx) => (
                    <tr key={idx}>
                      <td><strong>{h.item_name || h.itemName}</strong></td>
                      <td><span className="badge badge-danger">−{h.quantity}</span></td>
                      <td style={{ fontSize: '0.82rem' }}>{h.purpose || h.reference || '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(h.created_at || h.date)}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {h.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
