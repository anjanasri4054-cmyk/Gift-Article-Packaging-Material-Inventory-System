import React, { useState } from 'react';

// ── 1. Inventory Distribution (Premium Doughnut Chart)
export function InventoryDistributionChart({ data }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const labels = data?.labels || [];
  const values = data?.values || data?.data || [];
  const total = values.reduce((sum, val) => sum + val, 0);
  const centerText = data?.centerText || 'Products';

  if (total === 0) {
    return (
      <div className="empty-state" style={{ padding: '30px' }}>
        <div className="empty-state-icon">📊</div>
        <p>No data available</p>
      </div>
    );
  }

  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  // Premium curated color palette
  const colors = [
    '#6366f1', // Indigo
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#8b5cf6', // Violet
    '#f97316'  // Orange
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      flexWrap: 'wrap',
      gap: '24px',
      padding: '16px',
      background: 'rgba(255,255,255,0.01)',
      borderRadius: '16px'
    }}>
      {/* SVG Doughnut Ring */}
      <div style={{ position: 'relative', width: '130px', height: '130px' }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
          {/* Base shadow ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="var(--border)"
            strokeWidth="8"
            style={{ opacity: 0.4 }}
          />

          {values.map((val, idx) => {
            const percent = (val / total) * 100;
            const strokeLength = (percent / 100) * circumference;
            // The segment starts at the accumulated length of the previous segments
            const strokeOffset = -(accumulatedPercent / 100) * circumference;
            accumulatedPercent += percent;

            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={colors[idx % colors.length]}
                strokeWidth={isHovered ? 11 : 8}
                strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                strokeDashoffset={strokeOffset}
                transform="rotate(-90 50 50)"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  filter: isHovered ? `drop-shadow(0 0 4px ${colors[idx % colors.length]}aa)` : 'none'
                }}
              />
            );
          })}
        </svg>

        {/* Center Text Panel */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>
            {total}
          </span>
          <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '600' }}>
            {centerText}
          </span>
        </div>
      </div>

      {/* Legend list */}
      <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {labels.map((lbl, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: isHovered ? 'var(--bg)' : 'transparent',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: colors[idx % colors.length],
                  boxShadow: isHovered ? `0 0 6px ${colors[idx % colors.length]}` : 'none',
                  transition: 'all 0.2s ease'
                }} />
                <span style={{
                  color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isHovered ? '600' : '500'
                }}>
                  {lbl}
                </span>
              </div>
              <span style={{
                fontWeight: '700',
                color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}>
                {values[idx]} ({((values[idx] / total) * 100).toFixed(0)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 2. Monthly Movement (Premium SVG Double-Bar Chart)
export function MonthlyMovementChart({ data, onChartClick }) {
  const [hoveredGroupIdx, setHoveredGroupIdx] = useState(null);
  const labels = data?.labels || [];
  const stockIn = data?.stockIn || [];
  const stockOut = data?.stockOut || [];

  if (labels.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '30px' }}>
        <div className="empty-state-icon">📈</div>
        <p>No movement data available</p>
      </div>
    );
  }

  // Round maxVal up to the nearest multiple of 4 to generate perfect integer gridline intervals
  const rawMax = Math.max(...stockIn, ...stockOut, 1);
  const maxVal = Math.ceil(rawMax / 4) * 4 || 4;

  const height = 220;
  const width = 450;

  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingTop = 25;
  const paddingBottom = 30;

  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingLeft - paddingRight;

  const numMonths = labels.length;
  const groupWidth = chartWidth / numMonths;
  const barWidth = groupWidth * 0.32; // Make bars substantially thicker

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          {/* Green gradients for Stock In */}
          <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          {/* Red gradients for Stock Out */}
          <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>

        {/* Y Axis Gridlines and Ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + chartHeight * (1 - ratio);
          const val = Math.round(maxVal * ratio);
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="4,4"
                style={{ opacity: 0.6 }}
              />
              <text
                x={paddingLeft - 8}
                y={y + 3}
                textAnchor="end"
                fill="var(--text-muted)"
                fontSize="9"
                fontWeight="600"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* X Axis Baseline */}
        <line
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={width - paddingRight}
          y2={paddingTop + chartHeight}
          stroke="var(--border)"
          strokeWidth="1.5"
        />

        {/* Double Bars */}
        {labels.map((label, idx) => {
          const groupX = paddingLeft + idx * groupWidth;
          const inVal = stockIn[idx] || 0;
          const outVal = stockOut[idx] || 0;

          // Calculate height of bars
          const inHeight = (inVal / maxVal) * chartHeight;
          const outHeight = (outVal / maxVal) * chartHeight;

          const inY = paddingTop + chartHeight - inHeight;
          const outY = paddingTop + chartHeight - outHeight;

          // Align bar coordinates
          const barInX = groupX + groupWidth * 0.14;
          const barOutX = barInX + barWidth + 6;

          const isGroupHovered = hoveredGroupIdx === idx;

          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredGroupIdx(idx)}
              onMouseLeave={() => setHoveredGroupIdx(null)}
            >
              {/* Highlight Background strip on hover */}
              {isGroupHovered && (
                <rect
                  x={groupX + 4}
                  y={paddingTop - 10}
                  width={groupWidth - 8}
                  height={chartHeight + 18}
                  fill="var(--bg)"
                  rx="6"
                  style={{ opacity: 0.5, transition: 'all 0.2s ease' }}
                />
              )}

              {/* Stock In Bar (Green Gradient) */}
              <rect
                x={barInX}
                y={inY}
                width={barWidth}
                height={inHeight}
                fill="url(#gradientGreen)"
                rx="4"
                cursor="pointer"
                onClick={() => onChartClick && onChartClick('Stock In')}
                style={{
                  transition: 'all 0.3s ease',
                  filter: isGroupHovered ? 'brightness(1.05)' : 'none'
                }}
              />
              {/* Dynamic green value marker */}
              {inVal > 0 && (
                <text
                  x={barInX + barWidth / 2}
                  y={inY - 5}
                  textAnchor="middle"
                  fill="#10b981"
                  fontSize="9.5"
                  fontWeight="700"
                >
                  {inVal}
                </text>
              )}

              {/* Stock Out Bar (Red Gradient) */}
              <rect
                x={barOutX}
                y={outY}
                width={barWidth}
                height={outHeight}
                fill="url(#gradientRed)"
                rx="4"
                cursor="pointer"
                onClick={() => onChartClick && onChartClick('Stock Out')}
                style={{
                  transition: 'all 0.3s ease',
                  filter: isGroupHovered ? 'brightness(1.05)' : 'none'
                }}
              />
              {/* Dynamic red value marker */}
              {outVal > 0 && (
                <text
                  x={barOutX + barWidth / 2}
                  y={outY - 5}
                  textAnchor="middle"
                  fill="#f43f5e"
                  fontSize="9.5"
                  fontWeight="700"
                >
                  {outVal}
                </text>
              )}

              {/* X Axis Month Label */}
              <text
                x={groupX + groupWidth / 2}
                y={height - 8}
                textAnchor="middle"
                fill={isGroupHovered ? 'var(--text-primary)' : 'var(--text-muted)'}
                fontSize="9"
                fontWeight={isGroupHovered ? '700' : '600'}
                style={{ transition: 'color 0.2s ease' }}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── 3. Low Stock Chart (Horizontal Bars)
export function LowStockChart({ data }) {
  const labels = data?.labels || [];
  const quantities = data?.quantities || [];
  const minimums = data?.minimums || [];

  if (labels.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '30px' }}>
        <div className="empty-state-icon">✅</div>
        <h3>No Low Stock Items!</h3>
        <p>All packaging materials are well-stocked.</p>
      </div>
    );
  }

  const height = Math.max(120, labels.length * 36);
  const width = 450;
  const paddingLeft = 110;
  const paddingRight = 20;
  const paddingTop = 10;
  const paddingBottom = 15;

  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingLeft - paddingRight;

  const rowHeight = chartHeight / labels.length;
  const maxVal = Math.max(...quantities, ...minimums, 10);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {labels.map((lbl, idx) => {
        const y = paddingTop + idx * rowHeight;
        const qty = quantities[idx] || 0;
        const min = minimums[idx] || 0;

        const qtyWidth = (qty / maxVal) * chartWidth;
        const minWidth = (min / maxVal) * chartWidth;

        return (
          <g key={idx}>
            {/* Label */}
            <text
              x={paddingLeft - 8}
              y={y + rowHeight / 2 + 3}
              textAnchor="end"
              fill="var(--text-secondary)"
              fontSize="9.5"
              fontWeight="600"
            >
              {lbl}
            </text>

            {/* Minimum Limit bar */}
            <rect
              x={paddingLeft}
              y={y + rowHeight / 2 - 8}
              width={minWidth}
              height="6"
              fill="#f43f5e"
              opacity="0.25"
              rx="2"
            />

            {/* Current Level bar */}
            <rect
              x={paddingLeft}
              y={y + rowHeight / 2 - 2}
              width={qtyWidth}
              height="6"
              fill="#f59e0b"
              rx="2"
            >
              <title>{`Current Level: ${qty} / Minimum Level: ${min}`}</title>
            </rect>
          </g>
        );
      })}
    </svg>
  );
}
