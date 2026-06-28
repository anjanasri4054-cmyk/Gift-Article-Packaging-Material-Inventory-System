import React from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement
)

const DOUGHNUT_COLORS = [
  '#f59e0b', '#3b82f6', '#10b981', '#ec4899',
  '#8b5cf6', '#f97316', '#06b6d4', '#a855f7',
]

// ── 1. Inventory Distribution (Doughnut) ────────────────────────────────
export function InventoryDistributionChart({ data }) {
  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '40px' }}>
        <div className="empty-state-icon">📊</div>
        <p>No category data available</p>
      </div>
    )
  }

  const isDark = document.body.classList.contains('dark')

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values || data.data,
        backgroundColor: DOUGHNUT_COLORS.slice(0, data.labels.length),
        borderColor: isDark ? '#101726' : '#ffffff',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, family: "'Plus Jakarta Sans', 'Inter', sans-serif", weight: '500' },
          color: isDark ? '#cbd5e1' : '#475569',
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed} items`,
        },
      },
    },
    cutout: '65%',
  }

  return <Doughnut data={chartData} options={options} />
}

// ── 2. Monthly Stock Movement (Bar) ─────────────────────────────────────
export function MonthlyMovementChart({ data, onChartClick }) {
  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '40px' }}>
        <div className="empty-state-icon">📈</div>
        <p>No movement data available</p>
      </div>
    )
  }

  const isDark = document.body.classList.contains('dark')

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Stock In',
        data: data.stockIn,
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderColor: '#10b981',
        borderWidth: 1.5,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Stock Out',
        data: data.stockOut,
        backgroundColor: 'rgba(244, 63, 94, 0.85)',
        borderColor: '#f43f5e',
        borderWidth: 1.5,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (elements && elements.length > 0) {
        const datasetIndex = elements[0].datasetIndex;
        const actionType = datasetIndex === 0 ? 'Stock In' : 'Stock Out';
        if (onChartClick) {
          onChartClick(actionType);
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, family: "'Plus Jakarta Sans', 'Inter', sans-serif", weight: '500' },
          color: isDark ? '#cbd5e1' : '#475569',
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} units`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: "'Plus Jakarta Sans', 'Inter', sans-serif" }, color: isDark ? '#94a3b8' : '#64748b' },
      },
      y: {
        grid: { color: isDark ? 'rgba(255, 255, 255, 0.06)' : '#eef2f6', drawBorder: false },
        ticks: { font: { size: 11, family: "'Plus Jakarta Sans', 'Inter', sans-serif" }, color: isDark ? '#94a3b8' : '#64748b' },
        beginAtZero: true,
      },
    },
  }

  return <Bar data={chartData} options={options} />
}

// ── 3. Low Stock Chart (Horizontal Bar) ─────────────────────────────────
export function LowStockChart({ data }) {
  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '40px' }}>
        <div className="empty-state-icon">✅</div>
        <h3>No Low Stock!</h3>
        <p>All items are above minimum levels</p>
      </div>
    )
  }

  const isDark = document.body.classList.contains('dark')

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Current Stock',
        data: data.quantities,
        backgroundColor: 'rgba(245, 158, 11, 0.85)',
        borderColor: '#f59e0b',
        borderWidth: 1.5,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Minimum Level',
        data: data.minimums,
        backgroundColor: 'rgba(244, 63, 94, 0.55)',
        borderColor: '#f43f5e',
        borderWidth: 1.5,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12, family: "'Plus Jakarta Sans', 'Inter', sans-serif", weight: '500' },
          color: isDark ? '#cbd5e1' : '#475569',
        },
      },
    },
    scales: {
      x: {
        grid: { color: isDark ? 'rgba(255, 255, 255, 0.06)' : '#eef2f6' },
        ticks: { font: { size: 11, family: "'Plus Jakarta Sans', 'Inter', sans-serif" }, color: isDark ? '#94a3b8' : '#64748b' },
        beginAtZero: true,
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 11, family: "'Plus Jakarta Sans', 'Inter', sans-serif" }, color: isDark ? '#cbd5e1' : '#475569' },
      },
    },
  }

  return <Bar data={chartData} options={options} />
}
