import React, { useState } from 'react';
import { FileText, Download, Printer, AlertTriangle, FileSpreadsheet, Loader2 } from 'lucide-react';
import api from '../api';
import { toast } from '../components/Toast';

// PDF generator using jsPDF + autoTable (lazily loaded to optimize initial bundle size)
async function buildPDF(reportType, data) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 22, 'F');
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('🎁  Gift Article & Packaging Material Inventory System', 14, 14);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 200, 14);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');

  const tableOpts = {
    startY: 30,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: [245, 158, 11], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  };

  switch (reportType) {
    case 'gift-articles':
      doc.text('Gift Articles Report', 14, 27);
      autoTable(doc, {
        ...tableOpts,
        head: [['ID', 'Name', 'Category', 'Price (Rs)', 'Status']],
        body: data.products.map(p => [p.id, p.name, p.category, `Rs ${Number(p.price).toLocaleString()}`, p.status]),
      });
      break;

    case 'packaging-materials':
      doc.text('Packaging Materials Report', 14, 27);
      autoTable(doc, {
        ...tableOpts,
        head: [['ID', 'Name', 'Unit/Type', 'Qty', 'Unit', 'Min threshold', 'Supplier']],
        body: data.materials.map(m => [m.id, m.name, m.type, m.quantity, m.unit, m.reorder_level, m.supplier || '—']),
      });
      break;

    case 'low-stock':
      doc.text('Low Stock Alerts Report (with Suggested Purchases)', 14, 27);
      autoTable(doc, {
        ...tableOpts,
        head: [['Name', 'Item Type', 'Current Qty', 'Min Threshold', 'Shortfall', 'Suggested Purchase']],
        body: data.lowStockItems.map(i => [
          i.name,
          i.item_type,
          i.quantity,
          i.threshold,
          { content: `−${Math.abs(i.threshold - i.quantity)}`, styles: { textColor: [244, 63, 94], fontStyle: 'bold' } },
          `${i.suggested || (i.threshold - i.quantity + 10)} units`
        ]),
      });
      break;

    case 'suppliers':
      doc.text('Suppliers Report', 14, 27);
      autoTable(doc, {
        ...tableOpts,
        head: [['ID', 'Name', 'Phone', 'Email', 'Address', 'Status', 'Materials']],
        body: data.suppliers.map(s => [s.id, s.name, s.phone || '—', s.email || '—', s.address || '—', s.status, s.materials_count ?? 0]),
      });
      break;

    case 'stock-movements':
      doc.text('Stock Movements Report', 14, 27);
      autoTable(doc, {
        ...tableOpts,
        head: [['ID', 'Item Name', 'Type', 'Action', 'Qty', 'User', 'Notes', 'Date']],
        body: data.recentMovements.map(m => [
          m.id, m.item_name, m.item_type, m.action, m.quantity,
          m.user || 'Admin', (m.notes || '').slice(0, 40),
          m.date ? new Date(m.date).toLocaleDateString() : '—'
        ]),
      });
      break;

    case 'customer-orders':
      doc.text('Customer Orders Report', 14, 27);
      autoTable(doc, {
        ...tableOpts,
        head: [['Order Number', 'Customer Name', 'Order Date', 'Delivery Date', 'Total Amount', 'Status']],
        body: data.orders.map(o => [
          o.orderNumber,
          o.customer_name,
          o.orderDate ? new Date(o.orderDate).toLocaleDateString() : '—',
          o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString() : '—',
          `Rs. ${Number(o.totalPrice || 0).toLocaleString()}`,
          o.status
        ]),
      });
      break;

    case 'order-status':
      doc.text('Order Status Breakdown Report', 14, 27);
      autoTable(doc, {
        ...tableOpts,
        head: [['Status', 'Orders Count', 'Total Value']],
        body: data.orderStatus.map(o => [
          o.status,
          o.count,
          `Rs. ${Number(o.total_value || 0).toLocaleString()}`
        ]),
      });
      break;

    case 'order-history':
      doc.text('Order History Log Report', 14, 27);
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
      });
      break;

    case 'top-products':
      doc.text('Top Ordered Products Report', 14, 27);
      autoTable(doc, {
        ...tableOpts,
        head: [['Product Name', 'Category', 'Total Quantity Ordered', 'Total Revenue Generated']],
        body: data.topProducts.map(p => [
          p.name,
          p.category,
          `${p.total_ordered} units`,
          `Rs. ${Number(p.total_revenue || 0).toLocaleString()}`
        ]),
      });
      break;

    case 'material-consumption':
      doc.text('Packaging Material Consumption Report', 14, 27);
      autoTable(doc, {
        ...tableOpts,
        head: [['Material Name', 'Material Type', 'Total Consumed', 'Unit']],
        body: data.materialConsumption.map(m => [
          m.material_name,
          m.material_type,
          m.total_consumed,
          m.unit
        ]),
      });
      break;

    case 'full-summary':
      // Page 1: Summary Stats
      doc.text('Full Inventory Summary', 14, 27);
      autoTable(doc, {
        ...tableOpts,
        head: [['Metric', 'Value']],
        body: [
          ['Total Gift Articles', data.summary.totalProducts],
          ['Total Packaging Materials', data.summary.totalMaterials],
          ['Total Suppliers', data.summary.totalSuppliers],
          ['Low Stock Materials', data.summary.lowStockMaterials],
          ['Report Generated', new Date(data.generatedAt).toLocaleString()],
        ],
      });

      // Page 2: Products List
      doc.addPage();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 297, 22, 'F');
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Gift Articles', 14, 14);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text('Gift Articles', 14, 27);
      autoTable(doc, {
        ...tableOpts,
        head: [['ID', 'Name', 'Category', 'Price', 'Status']],
        body: data.products.map(p => [p.id, p.name, p.category, `Rs ${p.price}`, p.status]),
      });

      // Page 3: Materials List
      doc.addPage();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 297, 22, 'F');
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Packaging Materials', 14, 14);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text('Packaging Materials', 14, 27);
      autoTable(doc, {
        ...tableOpts,
        head: [['ID', 'Name', 'Type', 'Qty', 'Unit', 'Reorder Level', 'Supplier']],
        body: data.materials.map(m => [m.id, m.name, m.type, m.quantity, m.unit, m.reorder_level, m.supplier || '—']),
      });
      break;

    default:
      break;
  }

  // Page Numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}  |  Gift Article & Packaging Material Inventory System`, 14, doc.internal.pageSize.height - 8);
  }

  doc.save(`gift_packaging_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export default function Reports() {
  const [downloadingCsv, setDownloadingCsv] = useState({});
  const [generatingPdf, setGeneratingPdf] = useState({});

  const handleCsvDownload = async (endpoint, filename) => {
    try {
      setDownloadingCsv(prev => ({ ...prev, [endpoint]: true }));
      const response = await api.get(`/reports/${endpoint}`);
      
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      toast(`CSV "${filename}" downloaded successfully`, 'success');
    } catch {
      toast('Failed to download CSV report', 'error');
    } finally {
      setDownloadingCsv(prev => ({ ...prev, [endpoint]: false }));
    }
  };

  const handlePdfGeneration = async (reportType) => {
    try {
      setGeneratingPdf(prev => ({ ...prev, [reportType]: true }));
      const { data } = await api.get('/reports/summary');
      await buildPDF(reportType, data);
      toast('PDF generated successfully!', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to generate PDF report', 'error');
    } finally {
      setGeneratingPdf(prev => ({ ...prev, [reportType]: false }));
    }
  };

  const reportItems = [
    { title: 'Gift Articles Catalog', desc: 'Complete listings of gift items, base selling prices, and categories.', endpoint: 'gift-articles', filename: 'gift_articles.csv', key: 'gift-articles' },
    { title: 'Packaging Materials', desc: 'Current inventory stock levels, unit metrics, and storage locations.', endpoint: 'packaging-materials', filename: 'packaging_materials.csv', key: 'packaging-materials' },
    { title: 'Low Stock Alerts', desc: 'Materials running below thresholds with suggested purchasing quantities.', endpoint: 'low-stock', filename: 'low_stock_report.csv', key: 'low-stock' },
    { title: 'Vendor Suppliers', desc: 'Registered vendor registries, contact numbers, and Indian GSTIN registers.', endpoint: 'suppliers', filename: 'suppliers.csv', key: 'suppliers' },
    { title: 'Stock Ledger Movements', desc: 'Complete history logs detailing all manual Stock In and Stock Out records.', endpoint: 'stock-movements', filename: 'stock_movements.csv', key: 'stock-movements' },
    { title: 'Customer Orders List', desc: 'Record of all customer orders, billing totals, and active statuses.', endpoint: 'orders', filename: 'customer_orders.csv', key: 'customer-orders' },
    { title: 'Order Status Breakdown', desc: 'Comparative metrics showing order values aggregated by status fields.', endpoint: 'order-status', filename: 'order_status.csv', key: 'order-status' },
    { title: 'Order Material Consumed', desc: 'Detailed log logs of packaging stock items deducted for assembly orders.', endpoint: 'order-history', filename: 'order_history.csv', key: 'order-history' },
    { title: 'Top Selling Products', desc: 'Analyzes most ordered gift articles alongside total revenue levels.', endpoint: 'top-products', filename: 'top_ordered_products.csv', key: 'top-products' },
    { title: 'Packaging Consumption', desc: 'Summarizes bulk material consumption metrics mapping usage metrics.', endpoint: 'material-consumption', filename: 'material_consumption.csv', key: 'material-consumption' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Visual & CSV Reporting</h1>
          <p className="page-subtitle">Compile and download formatted spreadsheet logs or print invoice summaries</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => handlePdfGeneration('full-summary')}
          disabled={generatingPdf['full-summary']}
        >
          {generatingPdf['full-summary'] ? <Loader2 className="spinner" size={16} /> : <Printer size={16} />}
          Print Full Summary PDF
        </button>
      </div>

      {/* Grid of Report Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '20px' }}>
        {reportItems.map(item => (
          <div key={item.key} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={18} style={{ color: 'var(--accent)' }} />
                {item.title}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '10px' }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                onClick={() => handleCsvDownload(item.endpoint, item.filename)}
                disabled={downloadingCsv[item.endpoint]}
              >
                {downloadingCsv[item.endpoint] ? <Loader2 className="spinner" size={12} /> : <FileSpreadsheet size={13} />}
                Export CSV
              </button>
              <button
                className="btn btn-primary btn-sm"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                onClick={() => handlePdfGeneration(item.key)}
                disabled={generatingPdf[item.key]}
              >
                {generatingPdf[item.key] ? <Loader2 className="spinner" size={12} /> : <Printer size={13} />}
                Print PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
