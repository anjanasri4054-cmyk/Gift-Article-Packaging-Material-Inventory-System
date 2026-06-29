import React, { useState, useEffect } from 'react';
import { FileText, Settings, Save } from 'lucide-react';
import api from '../api';
import { toast } from '../components/Toast';

export default function SettingsView() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [config, setConfig] = useState({
    businessName: 'Paper Plane',
    businessAddress: 'Shop 12, Connaught Place, New Delhi, Delhi',
    businessGst: '07AAAAA1111A1Z1',
    invoiceSubtitle: 'Gift Article & Packaging Material Inventory System',
    orderPrefix: 'ORD-',
    defaultGstRate: '18',
    defaultUnit: 'Pieces'
  });

  // Load from database on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await api.get('/settings');
        if (data) {
          setConfig({
            businessName: data.businessName || 'Paper Plane',
            businessAddress: data.businessAddress || 'Shop 12, Connaught Place, New Delhi, Delhi',
            businessGst: data.businessGst || '07AAAAA1111A1Z1',
            invoiceSubtitle: data.invoiceSubtitle || 'Gift Article & Packaging Material Inventory System',
            orderPrefix: data.orderPrefix || 'ORD-',
            defaultGstRate: String(data.defaultGstRate || '18'),
            defaultUnit: data.defaultUnit || 'Pieces'
          });
          localStorage.setItem('businessName', data.businessName || 'Paper Plane');
          localStorage.setItem('invoiceSubtitle', data.invoiceSubtitle || 'Gift Article & Packaging Material Inventory System');
          window.dispatchEvent(new Event('settingsUpdated'));
        }
      } catch (err) {
        toast('Failed to load configurations from database', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setConfig(c => ({ ...c, [name]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put('/settings', {
        businessName: config.businessName,
        businessAddress: config.businessAddress,
        businessGst: config.businessGst,
        invoiceSubtitle: config.invoiceSubtitle,
        orderPrefix: config.orderPrefix,
        defaultGstRate: config.defaultGstRate,
        defaultUnit: config.defaultUnit
      });

      localStorage.setItem('businessName', config.businessName);
      localStorage.setItem('invoiceSubtitle', config.invoiceSubtitle);
      window.dispatchEvent(new Event('settingsUpdated'));

      toast('Operational parameters saved to database successfully!', 'success');
    } catch {
      toast('Failed to save settings configurations', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner" style={{ padding: '60px' }}>
        <div className="spinner" />
        <p>Loading settings configurations...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ System Configurations</h1>
          <p className="page-subtitle">Configure business settings, tax variables, and print metadata</p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Invoice & Brand Identity Config */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} style={{ color: 'var(--info)' }} />
            Business Profile & Invoice Templates
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Brand/Business Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="businessName"
                  value={config.businessName}
                  onChange={handleChange}
                  placeholder="e.g. Paper Plane"
                />
              </div>
              <div className="form-group">
                <label className="form-label">GSTIN (Business GST Number)</label>
                <input
                  type="text"
                  className="form-control"
                  name="businessGst"
                  value={config.businessGst}
                  onChange={handleChange}
                  placeholder="e.g. 07AAAAA1111A1Z1"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Invoice Template Subtitle</label>
              <input
                type="text"
                className="form-control"
                name="invoiceSubtitle"
                value={config.invoiceSubtitle}
                onChange={handleChange}
                placeholder="Subtitle printed below business name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company Address (Printed on Invoices)</label>
              <textarea
                className="form-control"
                name="businessAddress"
                value={config.businessAddress}
                onChange={handleChange}
                placeholder="Full commercial business address..."
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Global Operational parameters */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={20} style={{ color: 'var(--accent)' }} />
            System Rules & Parameters
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Order Number Prefix</label>
              <input
                type="text"
                className="form-control"
                name="orderPrefix"
                value={config.orderPrefix}
                onChange={handleChange}
                placeholder="ORD-"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Default GST Tax Rate (%)</label>
              <select
                className="form-select"
                name="defaultGstRate"
                value={config.defaultGstRate}
                onChange={handleChange}
              >
                <option value="0">0% Exempt</option>
                <option value="5">5% SGST + CGST</option>
                <option value="12">12% Standard Rate</option>
                <option value="18">18% Standard Services</option>
                <option value="28">28% Premium Goods</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Default Packaging Unit</label>
              <select
                className="form-select"
                name="defaultUnit"
                value={config.defaultUnit}
                onChange={handleChange}
              >
                <option value="Pieces">Pieces</option>
                <option value="Meters">Meters</option>
                <option value="Rolls">Rolls</option>
                <option value="Sheets">Sheets</option>
                <option value="Kilograms">Kilograms</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Saving Configurations...' : 'Save Settings'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
