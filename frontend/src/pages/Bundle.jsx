import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { toast } from '../components/Toast'

export default function Bundle() {
  // ── State ───────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [allMaterials, setAllMaterials] = useState([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [bundleData, setBundleData] = useState(null)          // { product, materials }
  const [calcData, setCalcData] = useState(null)              // { canFulfill, breakdown }
  const [useQty, setUseQty] = useState(1)
  const [calcQty, setCalcQty] = useState(1)
  const [notes, setNotes] = useState('')
  const [loadingBundle, setLoadingBundle] = useState(false)
  const [loadingUse, setLoadingUse] = useState(false)
  const [loadingCalc, setLoadingCalc] = useState(false)
  const [activeTab, setActiveTab] = useState('view')           // 'view' | 'add' | 'use'

  // Add-material form
  const [addMaterialId, setAddMaterialId] = useState('')
  const [addQtyRequired, setAddQtyRequired] = useState('')
  const [addingMaterial, setAddingMaterial] = useState(false)

  // ── Fetch lists ──────────────────────────────────────────────────────────────
  const fetchProductList = useCallback(async () => {
    try {
      const { data } = await axios.get('/products')
      setAllProducts(data.products || [])
    } catch { /* ignore */ }
  }, [])

  const fetchMaterialList = useCallback(async () => {
    try {
      const { data } = await axios.get('/materials')
      setAllMaterials(data.materials || [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchProductList()
    fetchMaterialList()
  }, [fetchProductList, fetchMaterialList])

  // ── Fetch bundle for selected product ────────────────────────────────────────
  const fetchBundle = useCallback(async (productId) => {
    if (!productId) { setBundleData(null); setCalcData(null); return }
    try {
      setLoadingBundle(true)
      const { data } = await axios.get(`/bundles/${productId}`)
      setBundleData(data)
    } catch (err) {
      if (err.response?.status !== 404) toast('Failed to load bundle data', 'error')
      setBundleData({ product: allProducts.find(p => p.id == productId), materials: [] })
    } finally {
      setLoadingBundle(false)
    }
  }, [allProducts])

  useEffect(() => {
    if (selectedProductId) fetchBundle(selectedProductId)
    else { setBundleData(null); setCalcData(null) }
  }, [selectedProductId, fetchBundle])

  // ── Calculate preview ────────────────────────────────────────────────────────
  async function handleCalculate() {
    if (!selectedProductId) return
    try {
      setLoadingCalc(true)
      const { data } = await axios.get(`/bundles/${selectedProductId}/calculate`, {
        params: { quantity: calcQty }
      })
      setCalcData(data)
    } catch {
      toast('Calculation failed', 'error')
    } finally {
      setLoadingCalc(false)
    }
  }

  // ── Add material to bundle ───────────────────────────────────────────────────
  async function handleAddMaterial(e) {
    e.preventDefault()
    if (!addMaterialId || !addQtyRequired) return toast('Fill all fields', 'warning')
    try {
      setAddingMaterial(true)
      await axios.post(`/bundles/${selectedProductId}/materials`, {
        material_id: addMaterialId,
        quantity_required: addQtyRequired,
      })
      toast('Material added to bundle', 'success')
      setAddMaterialId('')
      setAddQtyRequired('')
      fetchBundle(selectedProductId)
      setActiveTab('view')
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to add material', 'error')
    } finally {
      setAddingMaterial(false)
    }
  }

  // ── Remove material from bundle ──────────────────────────────────────────────
  async function handleRemoveMaterial(bundleId, materialName) {
    if (!window.confirm(`Remove "${materialName}" from this bundle?`)) return
    try {
      await axios.delete(`/bundles/entry/${bundleId}`)
      toast('Material removed', 'success')
      fetchBundle(selectedProductId)
    } catch {
      toast('Failed to remove material', 'error')
    }
  }

  // ── Use bundle (deduct stock) ────────────────────────────────────────────────
  async function handleUseBundle(e) {
    e.preventDefault()
    if (!selectedProductId || !useQty) return
    if (!window.confirm(`Deduct materials for ${useQty} unit(s) of "${bundleData?.product?.name}"? This cannot be undone.`)) return
    try {
      setLoadingUse(true)
      const { data } = await axios.post(`/bundles/${selectedProductId}/use`, {
        quantity: useQty, notes,
      })
      toast(data.message, 'success')
      fetchBundle(selectedProductId)
      setCalcData(null)
      setNotes('')
      setUseQty(1)
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to use bundle'
      const shortages = err.response?.data?.shortages
      if (shortages) {
        toast(`Insufficient stock: ${shortages.map(s => `${s.material} (need ${s.required}, have ${s.available})`).join('; ')}`, 'error')
      } else {
        toast(msg, 'error')
      }
    } finally {
      setLoadingUse(false)
    }
  }

  // ── Available materials not yet in bundle ────────────────────────────────────
  const bundleMaterialIds = new Set((bundleData?.materials || []).map(m => m.material_id))
  const availableMaterials = allMaterials.filter(m => !bundleMaterialIds.has(m.id))

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>📦 Bundle / Material Usage</h1>
          <p>Define which packaging materials are used per gift product, then deduct stock when packaging</p>
        </div>
      </div>

      {/* Product Selector */}
      <div className="card" style={{ padding: '24px', marginBottom: 24, background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 0 }}>
            Select Gift Product
          </label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
            <select
              className="form-select"
              style={{ maxWidth: 420, flex: '1 1 300px', height: '42px', padding: '10px 16px' }}
              value={selectedProductId}
              onChange={e => { setSelectedProductId(e.target.value); setActiveTab('view'); setCalcData(null) }}
            >
              <option value="">— Choose a gift article —</option>
              {allProducts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category}) — Stock: {p.quantity}
                </option>
              ))}
            </select>
            {selectedProductId && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  className={`btn btn-sm ${activeTab === 'view' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ height: '42px', padding: '0 20px', borderRadius: 'var(--radius-sm)' }}
                  onClick={() => setActiveTab('view')}
                >
                  📋 View Bundle
                </button>
                <button
                  className={`btn btn-sm ${activeTab === 'add' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ height: '42px', padding: '0 20px', borderRadius: 'var(--radius-sm)' }}
                  onClick={() => setActiveTab('add')}
                >
                  ➕ Add Material
                </button>
                <button
                  className={`btn btn-sm ${activeTab === 'use' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ height: '42px', padding: '0 20px', borderRadius: 'var(--radius-sm)' }}
                  onClick={() => setActiveTab('use')}
                >
                  ⚡ Use Bundle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!selectedProductId && (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>Select a Gift Article</h3>
          <p>Choose a product above to view or manage its material bundle definition.</p>
        </div>
      )}

      {selectedProductId && (
        <>
          {/* ── TAB: VIEW BUNDLE ─────────────────────────────────────────── */}
          {activeTab === 'view' && (
            <div className="card">
              <div className="card-header">
                <h3>📋 Bundle Definition — {bundleData?.product?.name}</h3>
                {bundleData && (
                  <span className="badge badge-info">
                    {(bundleData.materials || []).length} material{(bundleData.materials || []).length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="table-container">
                {loadingBundle ? (
                  <div className="loading-spinner"><div className="spinner" /><p className="loading-text">Loading bundle...</p></div>
                ) : !bundleData || bundleData.materials.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">🔧</div>
                    <h3>No materials defined yet</h3>
                    <p>Click <strong>+ Add Material</strong> to build the bundle recipe for this product.</p>
                    <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setActiveTab('add')}>
                      ➕ Add First Material
                    </button>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Material Name</th>
                        <th>Type</th>
                        <th>Qty Required / Unit</th>
                        <th>Available Stock</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bundleData.materials.map((m, idx) => {
                        const sufficient = m.available_quantity >= m.quantity_required
                        return (
                          <tr key={m.bundle_id}>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{idx + 1}</td>
                            <td><strong>{m.material_name}</strong></td>
                            <td><span className="badge badge-info">{m.material_type}</span></td>
                            <td>
                              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                                {m.quantity_required}
                              </span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 4 }}>{m.unit}</span>
                            </td>
                            <td>
                              <span className={`quantity-${sufficient ? 'ok' : 'low'}`} style={{
                                fontWeight: 700,
                                color: sufficient ? 'var(--success)' : 'var(--danger)'
                              }}>
                                {m.available_quantity}
                              </span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 4 }}>{m.unit}</span>
                            </td>
                            <td>
                              {sufficient
                                ? <span className="badge badge-success">✓ Sufficient</span>
                                : <span className="badge badge-danger">⚠ Low</span>
                              }
                            </td>
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleRemoveMaterial(m.bundle_id, m.material_name)}
                              >🗑 Remove</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: ADD MATERIAL ───────────────────────────────────────── */}
          {activeTab === 'add' && (
            <div className="card" style={{ maxWidth: 600 }}>
              <div className="card-header">
                <h3>➕ Add Material to Bundle</h3>
              </div>
              <form onSubmit={handleAddMaterial} style={{ padding: '24px' }}>
                <div className="form-group">
                  <label className="form-label">Packaging Material *</label>
                  <select
                    className="form-select"
                    value={addMaterialId}
                    onChange={e => setAddMaterialId(e.target.value)}
                    required
                  >
                    <option value="">— Select material —</option>
                    {availableMaterials.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.type}) — Stock: {m.quantity} {m.unit}
                      </option>
                    ))}
                  </select>
                  {availableMaterials.length === 0 && bundleData?.materials?.length > 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 6 }}>
                      ✓ All available materials are already in this bundle.
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity Required per Unit *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 2"
                    value={addQtyRequired}
                    onChange={e => setAddQtyRequired(e.target.value)}
                    min="0.01"
                    step="0.01"
                    required
                  />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>
                    How many units of this material are needed to package one gift article?
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn btn-primary" disabled={addingMaterial}>
                    {addingMaterial ? 'Adding...' : '➕ Add to Bundle'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('view')}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── TAB: USE BUNDLE ─────────────────────────────────────────── */}
          {activeTab === 'use' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
              {/* Use Form */}
              <div className="card">
                <div className="card-header">
                  <h3>⚡ Use Bundle</h3>
                  <span className="badge badge-warning">Deducts Stock</span>
                </div>
                <form onSubmit={handleUseBundle} style={{ padding: '24px' }}>
                  <div className="form-group">
                    <label className="form-label">Number of Units to Package *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={useQty}
                      onChange={e => setUseQty(parseInt(e.target.value) || 1)}
                      min="1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes (optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Packed for Order #123"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>
                  <div className="alert alert-warning" style={{ marginBottom: 16, fontSize: '0.85rem' }}>
                    <span>⚠️</span>
                    <span>This will permanently deduct raw material stock. Ensure quantities are correct before proceeding.</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button type="submit" className="btn btn-primary" disabled={loadingUse || !bundleData?.materials?.length}>
                      {loadingUse ? 'Processing...' : '✅ Confirm & Deduct'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Preview Calculator */}
              <div className="card">
                <div className="card-header">
                  <h3>🧮 Preview Calculator</h3>
                  <span className="badge badge-info">Read-only preview</span>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <input
                      type="number"
                      className="form-control"
                      value={calcQty}
                      onChange={e => setCalcQty(parseInt(e.target.value) || 1)}
                      min="1"
                      style={{ maxWidth: 120 }}
                    />
                    <button className="btn btn-secondary" onClick={handleCalculate} disabled={loadingCalc}>
                      {loadingCalc ? 'Calculating...' : '🔍 Preview'}
                    </button>
                  </div>

                  {calcData && (
                    <>
                      <div className={`alert ${calcData.canFulfill ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: 16 }}>
                        <span>{calcData.canFulfill ? '✅' : '❌'}</span>
                        <strong style={{ marginLeft: 6 }}>
                          {calcData.canFulfill
                            ? `Can package ${calcQty} unit(s) — all materials sufficient`
                            : `Cannot package ${calcQty} unit(s) — insufficient stock`}
                        </strong>
                      </div>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Material</th>
                            <th>Required</th>
                            <th>Available</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calcData.breakdown.map(b => (
                            <tr key={b.material_id}>
                              <td><strong>{b.material_name}</strong></td>
                              <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{b.required} {b.unit}</td>
                              <td style={{ fontWeight: 700, color: b.sufficient ? 'var(--success)' : 'var(--danger)' }}>
                                {b.available} {b.unit}
                              </td>
                              <td>
                                {b.sufficient
                                  ? <span className="badge badge-success">✓ OK</span>
                                  : <span className="badge badge-danger">−{b.shortfall} {b.unit}</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {!calcData && (
                    <div className="empty-state" style={{ padding: '24px 0' }}>
                      <div className="empty-state-icon">🧮</div>
                      <p>Enter a quantity and click Preview to see material requirements without committing changes.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
