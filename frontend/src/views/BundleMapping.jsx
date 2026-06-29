import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Search, Trash2, Edit2, AlertTriangle, Layers, ArrowRight } from 'lucide-react';
import api from '../api';
import { toast } from '../components/Toast';

export default function BundleMapping() {
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [recipe, setRecipe] = useState([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [activeTab, setActiveTab] = useState('view'); // 'view' | 'add'

  // Add mapping form
  const [addMaterialId, setAddMaterialId] = useState('');
  const [addQtyRequired, setAddQtyRequired] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch products and materials
  const fetchAuxiliary = useCallback(async () => {
    try {
      const [prodRes, matRes] = await Promise.all([
        api.get('/products'),
        api.get('/materials')
      ]);
      setProducts(prodRes.data || []);
      setMaterials(matRes.data || []);
    } catch {
      toast('Failed to load products/materials lists', 'error');
    }
  }, []);

  useEffect(() => {
    fetchAuxiliary();
  }, [fetchAuxiliary]);

  // Fetch recipe mapping details
  const fetchRecipe = useCallback(async (productId) => {
    if (!productId) {
      setRecipe([]);
      return;
    }
    try {
      setLoadingRecipe(true);
      const { data } = await api.get(`/mappings/product/${productId}`);
      setRecipe(data || []);
    } catch {
      toast('Failed to load recipe mapping details', 'error');
    } finally {
      setLoadingRecipe(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipe(selectedProductId);
  }, [selectedProductId, fetchRecipe]);

  // Add material recipe mapping
  async function handleAddMapping(e) {
    e.preventDefault();
    if (!selectedProductId) return toast('Please select a product first', 'warning');
    if (!addMaterialId || !addQtyRequired || Number(addQtyRequired) <= 0) {
      return toast('Please select a material and enter a positive quantity required', 'warning');
    }

    setSubmitting(true);
    try {
      await api.post('/mappings', {
        productId: Number(selectedProductId),
        materialId: Number(addMaterialId),
        quantityNeeded: Number(addQtyRequired)
      });
      toast('Material added to recipe successfully!', 'success');
      setAddMaterialId('');
      setAddQtyRequired('');
      fetchRecipe(selectedProductId);
      setActiveTab('view');
    } catch (err) {
      toast(err.response?.data?.error || 'Failed to map material', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // Delete material recipe mapping
  async function handleRemoveMapping(mappingId, materialName) {
    if (!window.confirm(`Are you sure you want to remove "${materialName}" from this product's packaging recipe?`)) return;
    try {
      await api.delete(`/mappings/${mappingId}`);
      toast('Material removed from recipe', 'success');
      fetchRecipe(selectedProductId);
    } catch {
      toast('Failed to remove material mapping', 'error');
    }
  }

  // Filter out materials already mapped to the product
  const mappedIds = new Set(recipe.map(r => r.materialId));
  const unmappedMaterials = materials.filter(m => !mappedIds.has(m.id));

  const selectedProduct = products.find(p => p.id === Number(selectedProductId));

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Bundle Recipes Mapping</h1>
          <p className="page-subtitle">Map customizable gift products to their required packaging materials</p>
        </div>
      </div>

      {/* Product Selector */}
      <div className="card mb-24" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="form-label" style={{ fontWeight: '600' }}>Select Gift Product</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ maxWidth: '400px', flex: 1, height: '40px' }}
              value={selectedProductId}
              onChange={e => {
                setSelectedProductId(e.target.value);
                setActiveTab('view');
              }}
            >
              <option value="">— Choose a gift article —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type})
                </option>
              ))}
            </select>

            {selectedProductId && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`btn btn-sm ${activeTab === 'view' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('view')}
                >
                  View Recipe
                </button>
                <button
                  className={`btn btn-sm ${activeTab === 'add' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('add')}
                >
                  + Add Material
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!selectedProductId ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Layers size={40} style={{ color: 'var(--text-muted)' }} /></div>
          <h3>Select a Gift Article</h3>
          <p>Choose a product above to define and manage its corrugated boxes, satin ribbons, or wrapping paper recipes.</p>
        </div>
      ) : (
        <>
          {/* TAB: VIEW RECIPE */}
          {activeTab === 'view' && (
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>📋 Recipe Mapping — {selectedProduct?.name}</h3>
                <span className="badge badge-info">{recipe.length} material{recipe.length !== 1 ? 's' : ''} mapped</span>
              </div>
              
              <div className="table-container">
                {loadingRecipe ? (
                  <div className="loading-spinner" style={{ padding: '40px' }}>
                    <div className="spinner" />
                    <p>Loading recipe...</p>
                  </div>
                ) : recipe.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><Layers size={36} /></div>
                    <h3>No materials mapped yet</h3>
                    <p>Define which packaging items are needed to wrap and assemble this gift.</p>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => setActiveTab('add')}>
                      + Map First Material
                    </button>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Material Name</th>
                        <th>Required Quantity per Unit</th>
                        <th>Current Available Stock</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipe.map(r => {
                        const isOut = Number(r.currentStock) < Number(r.quantityNeeded);
                        return (
                          <tr key={r.id}>
                            <td><strong>{r.materialName}</strong></td>
                            <td>{r.quantityNeeded} {r.unit}</td>
                            <td>{r.currentStock} {r.unit}</td>
                            <td>
                              {isOut ? (
                                <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <AlertTriangle size={10} /> Insufficient Stock
                                </span>
                              ) : (
                                <span className="badge badge-success">Available</span>
                              )}
                            </td>
                            <td>
                              <button className="btn-icon" title="Remove" onClick={() => handleRemoveMapping(r.id, r.materialName)}>
                                <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB: ADD/MAP MATERIAL */}
          {activeTab === 'add' && (
            <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '24px' }}>
              <div className="card-header" style={{ padding: 0, marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>➕ Add Material to Recipe</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Map an additional packaging item to {selectedProduct?.name}</p>
              </div>

              <form onSubmit={handleAddMapping} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Select Packaging Material</label>
                  <select
                    className="form-select"
                    value={addMaterialId}
                    onChange={e => setAddMaterialId(e.target.value)}
                  >
                    <option value="">-- Choose Material --</option>
                    {unmappedMaterials.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.unit} — Available: {m.currentStock})
                      </option>
                    ))}
                  </select>
                  {unmappedMaterials.length === 0 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>All available materials are already mapped to this recipe.</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity Needed (per single gift unit)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control"
                    placeholder="e.g. 2 sheets, 1.5 meters, 1 box"
                    value={addQtyRequired}
                    onChange={e => setAddQtyRequired(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('view')}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Mapping...' : 'Save Mapping'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
