import React from 'react';

/**
 * Reusable stat card for admin dashboard.
 * 
 * Props:
 *   title     - Card title (e.g. "Total Orders")
 *   value     - Main metric value
 *   icon      - React icon element
 *   trend     - Optional trend text (e.g. "+12%")
 *   trendUp   - Boolean, true = positive trend (green), false = negative (red)
 *   color     - Accent color for icon background
 *   onClick   - Optional click handler
 *   style     - Optional additional styles
 */
const StatCard = ({ title, value, icon, trend, trendUp = true, color = '#6C63FF', onClick, style }) => {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card-bg, #1E1E2E)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '12px',
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: color,
          fontSize: 24,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary, #888)', marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary, #fff)', lineHeight: 1.2 }}>
          {value}
        </div>
        {trend && (
          <div style={{
            fontSize: 12,
            marginTop: 6,
            color: trendUp ? '#4ade80' : '#f87171',
            fontWeight: 500,
          }}>
            {trendUp ? '↑' : '↓'} {trend}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
