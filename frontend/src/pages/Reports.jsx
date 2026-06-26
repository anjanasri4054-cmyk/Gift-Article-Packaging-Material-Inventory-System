import React, { useState, useCallback } from 'react'
import axios from 'axios'
import { toast } from '../components/Toast'

// ── PDF generation using jsPDF + autoTable ───────────────────────────────────
async function buildPDF(reportType, data) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // Header banner
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, 297, 22, 'F')
  doc.setTextColor(245, 158, 11)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('🎁  Gift Article & Packaging Material Inventory System', 14, 14)

  doc.setTextColor(203, 213, 225)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleString()}`, 200, 14)

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')

  const tableOpts = {
    startY: 30,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: [245, 158, 11], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  }

  switch (reportType) {
    case 'gift-articles':
      doc.text('Gift Articles Report', 14, 27)
      autoTable(doc, {
        ...tableOpts,
        head: [['ID', 'Name', 'Category', 'Price (Rs)', 'Qty', 'Min Stock', 'Status']],
        body: data.products.map(p => [p.id, p.name, p.category, `Rs ${p.price?.toFixed?.(2) ?? p.price}`, p.quantity, p.minimum_stock, p.status]),
      })
      break

    case 'packaging-materials':
      doc.text('Packaging Materials Report', 14, 27)
      autoTable(doc, {
        ...tableOpts,
        head: [['ID', 'Name', 'Type', 'Qty', 'Unit', 'Reorder Level', 'Supplier']],
        body: data.materials.map(m => [m.id, m.name, m.type, m.quantity, m.unit, m.reorder_level, m.supplier || '—']),
      })
      break

    case 'low-stock':
      doc.text('Low Stock Alerts Report (with Suggested Purchases)', 14, 27)
      autoTable(doc, {
        ...tableOpts,
        head: [['Name', 'Item Type', 'Current Qty', 'Min Threshold', 'Shortfall', 'Suggested Purchase']],
        body: data.lowStockItems.map(i => [
          i.name,
          i.item_type,
          i.quantity,
          i.threshold,
          { content: `−${Math.abs(i.threshold - i.quantity)}`, styles: { textColor: [244, 63, 94], fontStyle: 'bold' } },
          `${i.suggested ?? (i.threshold - i.quantity + 10)} units`
        ]),
      })
      break

    case 'suppliers':
      doc.text('Suppliers Report', 14, 27)
      autoTable(doc, {
        ...tableOpts,
        head: [['ID', 'Name', 'Phone', 'Email', 'Address', 'Status', 'Materials']],
        body: data.suppliers.map(s => [s.id, s.name, s.phone || '—', s.email || '—', s.address || '—', s.status, s.materials_count ?? 0]),
      })
      break

    case 'stock-movements':
      doc.text('Stock Movements Report', 14, 27)
      autoTable(doc, {
        ...tableOpts,
        head: [['ID', 'Item Name', 'Type', 'Action', 'Qty', 'User', 'Notes', 'Date']],
        body: data.recentMovements.map(m => [
          m.id, m.item_name, m.item_type, m.action, m.quantity,
          m.user || 'Admin', (m.notes || '').slice(0, 40),
          m.date ? new Date(m.date).toLocaleDateString() : '—'
        ]),
      })
      break

    case 'customer-orders':
      doc.text('Customer Orders Report', 14, 27)
      autoTable(doc, {
        ...tableOpts,
        head: [['Order Number', 'Customer Name', 'Order Date', 'Delivery Date', 'Order Type', 'Total Amount', 'Status']],
        body: data.orders.map(o => [
          o.order_number,
          o.customer_name,
          o.order_date ? new Date(o.order_date).toLocaleDateString() : '—',
          o.delivery_date ? new Date(o.delivery_date).toLocaleDateString() : '—',
          o.order_type,
          `Rs. ${Number(o.total_amount || 0).toLocaleString()}`,
          o.status
        ]),
      })
      break

    case 'order-status':
      doc.text('Order Status Breakdown Report', 14, 27)
      autoTable(doc, {
        ...tableOpts,
        head: [['Status', 'Orders Count', 'Total Value']],
        body: data.orderStatus.map(o => [
          o.status,
          o.count,
          `Rs. ${Number(o.total_value || 0).toLocaleString()}`
        ]),
      })
      break

    case 'order-history':
      doc.text('Order History Log Report', 14, 27)
      autoTable(doc, {
        ...tableOpts,
        head: [['ID', 'Item Name', 'Type', 'Action', 'Qty', 'Notes', 'User', 'Date']],
        body: data.orderHistory.map(h => [
          h.id,
          h.item_name,
          h.item_type,
          h.action,
          h.quantity,
          h.notes || '—',
          h.user || 'Admin',
          h.date ? new Date(h.date).toLocaleDateString() : '—'
        ]),
      })
      break

    case 'top-products':
      doc.text('Top Ordered Products Report', 14, 27)
      autoTable(doc, {
        ...tableOpts,
        head: [['Product Name', 'Category', 'Total Quantity Ordered', 'Total Revenue Generated']],
        body: data.topProducts.map(p => [
          p.name,
          p.category,
          `${p.total_ordered} units`,
          `Rs. ${Number(p.total_revenue || 0).toLocaleString()}`
        ]),
      })
      break

    case 'material-consumption':
      doc.text('Packaging Material Consumption Report', 14, 27)
      autoTable(doc, {
        ...tableOpts,
        head: [['Material Name', 'Material Type', 'Total Consumed', 'Unit']],
        body: data.materialConsumption.map(m => [
          m.material_name,
          m.material_type,
          m.total_consumed,
          m.unit
        ]),
      })
      break

    case 'full-summary':
      // Page 1: Summary
      doc.text('Full Inventory Summary', 14, 27)
      autoTable(doc, {
        ...tableOpts,
        head: [['Metric', 'Value']],
        body: [
          ['Total Gift Articles', data.summary.totalProducts],
          ['Total Packaging Materials', data.summary.totalMaterials],
          ['Total Suppliers', data.summary.totalSuppliers],
          ['Low Stock Gift Articles', data.summary.lowStockProducts],
          ['Low Stock Materials', data.summary.lowStockMaterials],
          ['Report Generated', new Date(data.generatedAt).toLocaleString()],
        ],
      })
      // Page 2: Products
      doc.addPage()
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, 297, 22, 'F')
      doc.setTextColor(245, 158, 11)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Gift Articles', 14, 14)
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(12)
      doc.text('Gift Articles', 14, 27)
      autoTable(doc, {
        ...tableOpts,
        head: [['ID', 'Name', 'Category', 'Price', 'Qty', 'Min Stock', 'Status']],
        body: data.products.map(p => [p.id, p.name, p.category, `Rs ${p.price}`, p.quantity, p.minimum_stock, p.status]),
      })
      // Page 3: Materials
      doc.addPage()
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, 297, 22, 'F')
      doc.setTextColor(245, 158, 11)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Packaging Materials', 14, 14)
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(12)
      doc.text('Packaging Materials', 14, 27)
      autoTable(doc, {
        ...tableOpts,
        head: [['ID', 'Name', 'Type', 'Qty', 'Unit', 'Reorder Level', 'Supplier']],
        body: data.materials.map(m => [m.id, m.name, m.type, m.quantity, m.unit, m.reorder_level, m.supplier || '—']),
      })
      break

    default:
      break
  }

  // Page numbers
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`Page ${i} of ${pageCount}  |  Gift Article & Packaging Material Inventory System`, 14, doc.internal.pageSize.height - 8)
  }

  doc.save(`gift_packaging_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`)
}

// ── CSV download via the backend stream ─────────────────────────────────────
async function downloadCSV(endpoint, filename) {
  const token = localStorage.getItem('token')
  const response = await fetch(`/api/reports/${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) throw new Error('Download failed')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Report definitions ────────────────────────────────────────────────────────
const REPORTS = [
  {
    id: 'gift-articles',
    title: 'Gift Articles',
    description: 'All gift products with stock levels, categories, pricing, and status.',
    icon: '🎁',
    color: 'var(--accent)',
    csvEndpoint: 'gift-articles',
    csvFile: 'gift_articles.csv',
  },
  {
    id: 'packaging-materials',
    title: 'Packaging Materials',
    description: 'All packaging materials with quantities, units, reorder levels, and supplier info.',
    icon: '📦',
    color: 'var(--info)',
    csvEndpoint: 'packaging-materials',
    csvFile: 'packaging_materials.csv',
  },
  {
    id: 'low-stock',
    title: 'Low Stock Alerts',
    description: 'Items below their minimum stock or reorder level thresholds.',
    icon: '⚠️',
    color: 'var(--danger)',
    csvEndpoint: 'low-stock',
    csvFile: 'low_stock_report.csv',
  },
  {
    id: 'suppliers',
    title: 'Suppliers',
    description: 'All supplier details including contact information and material counts.',
    icon: '🏭',
    color: 'var(--success)',
    csvEndpoint: 'suppliers',
    csvFile: 'suppliers.csv',
  },
  {
    id: 'stock-movements',
    title: 'Stock Movements',
    description: 'Full inventory transaction history — stock in, stock out, and bundle usage.',
    icon: '📜',
    color: 'var(--warning)',
    csvEndpoint: 'stock-movements',
    csvFile: 'stock_movements.csv',
  },
  {
    id: 'customer-orders',
    title: 'Customer Orders',
    description: 'List of customer orders with delivery dates, totals, types, and status.',
    icon: '🛍️',
    color: 'var(--primary)',
    csvEndpoint: 'orders',
    csvFile: 'customer_orders.csv',
  },
  {
    id: 'order-status',
    title: 'Order Status Breakdown',
    description: 'Summary counts and financial valuations grouped by order statuses.',
    icon: '📊',
    color: 'var(--accent)',
    csvEndpoint: 'order-status',
    csvFile: 'order_status.csv',
  },
  {
    id: 'order-history',
    title: 'Order Movements History',
    description: 'Audit log of stock deductions and restorations matching customer orders.',
    icon: '📜',
    color: 'var(--info)',
    csvEndpoint: 'order-history',
    csvFile: 'order_history.csv',
  },
  {
    id: 'top-products',
    title: 'Top Ordered Products',
    description: 'Gift articles ranked by customer order frequency and sales volume.',
    icon: '🎁',
    color: 'var(--success)',
    csvEndpoint: 'top-products',
    csvFile: 'top_ordered_products.csv',
  },
  {
    id: 'material-consumption',
    title: 'Packaging Material Consumption',
    description: 'Aggregated packaging materials consumed across all customer orders.',
    icon: '📦',
    color: 'var(--warning)',
    csvEndpoint: 'material-consumption',
    csvFile: 'material_consumption.csv',
  },
  {
    id: 'full-summary',
    title: 'Full Summary (PDF only)',
    description: 'Multi-page PDF with summary stats, all products, and all materials.',
    icon: '📄',
    color: '#8b5cf6',
    csvEndpoint: null,
    csvFile: null,
  },
]

export default function Reports() {
  const [summaryData, setSummaryData] = useState(null)
  const [loadingPDF, setLoadingPDF] = useState({})
  const [loadingCSV, setLoadingCSV] = useState({})

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await axios.get('/reports/summary')
      return data
    } catch {
      throw new Error('Failed to fetch report data')
    }
  }, [])

  async function handlePDF(report) {
    try {
      setLoadingPDF(prev => ({ ...prev, [report.id]: true }))
      const data = summaryData || await fetchSummary()
      if (!summaryData) setSummaryData(data)
      await buildPDF(report.id, data)
      toast(`PDF exported: ${report.title}`, 'success')
    } catch (err) {
      toast(err.message || 'PDF export failed', 'error')
    } finally {
      setLoadingPDF(prev => ({ ...prev, [report.id]: false }))
    }
  }

  async function handleCSV(report) {
    if (!report.csvEndpoint) return
    try {
      setLoadingCSV(prev => ({ ...prev, [report.id]: true }))
      await downloadCSV(report.csvEndpoint, report.csvFile)
      toast(`CSV downloaded: ${report.csvFile}`, 'success')
    } catch {
      toast('CSV download failed', 'error')
    } finally {
      setLoadingCSV(prev => ({ ...prev, [report.id]: false }))
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>📊 Reports & Exports</h1>
          <p>Download inventory reports as PDF or CSV for records, audits, and presentations</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="alert alert-info" style={{ marginBottom: 24 }}>
        <span>ℹ️</span>
        <span>
          <strong>PDF</strong> reports are generated in your browser using live data.
          <strong style={{ marginLeft: 6 }}>CSV</strong> files are streamed directly from the server and open in Excel, Google Sheets, etc.
        </span>
      </div>

      {/* Report Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 20
      }}>
        {REPORTS.map(report => (
          <div
            key={report.id}
            className="card"
            style={{
              borderLeft: `4px solid ${report.color}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = ''
            }}
          >
            {/* Card Header */}
            <div style={{ padding: '20px 20px 12px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${report.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', flexShrink: 0,
              }}>
                {report.icon}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {report.title}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {report.description}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ padding: '12px 20px 20px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {/* PDF Button */}
              <button
                id={`pdf-${report.id}`}
                className="btn btn-primary btn-sm"
                onClick={() => handlePDF(report)}
                disabled={loadingPDF[report.id]}
                style={{ flex: report.csvEndpoint ? '1' : '1 1 100%' }}
              >
                {loadingPDF[report.id] ? (
                  <>⏳ Generating...</>
                ) : (
                  <>📄 Export PDF</>
                )}
              </button>

              {/* CSV Button */}
              {report.csvEndpoint && (
                <button
                  id={`csv-${report.id}`}
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleCSV(report)}
                  disabled={loadingCSV[report.id]}
                  style={{ flex: 1 }}
                >
                  {loadingCSV[report.id] ? (
                    <>⏳ Downloading...</>
                  ) : (
                    <>📥 Export CSV</>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="card" style={{ marginTop: 28, padding: '20px 24px' }}>
        <h3 style={{ marginBottom: 14, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          💡 Tips
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {[
            { icon: '📄', text: 'PDF reports open instantly in your browser\'s PDF viewer.' },
            { icon: '📥', text: 'CSV files open directly in Microsoft Excel or Google Sheets.' },
            { icon: '🔄', text: 'All reports reflect live data — no need to refresh the page first.' },
            { icon: '📅', text: 'Use Stock Movements CSV to filter by date in Excel for custom date ranges.' },
          ].map((tip, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--bg)', border: '1px solid var(--border)'
            }}>
              <span style={{ fontSize: '1.1rem' }}>{tip.icon}</span>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{tip.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
