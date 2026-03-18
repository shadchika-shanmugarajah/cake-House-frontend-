import React, { useState, useMemo } from 'react';

/**
 * Reusable data table component for admin pages.
 *
 * Props:
 *   columns      - Array of { key, label, render?, sortable?, width? }
 *   data         - Array of row objects
 *   onRowClick   - Optional callback (row) => void
 *   searchable   - Boolean, show search input (default true)
 *   searchKeys   - Array of keys to search in (default: all column keys)
 *   emptyMessage - Message when no data (default: "No data found")
 *   pagination   - Optional { page, limit, total, pages } from API
 *   onPageChange - Optional callback (newPage) => void
 *   actions      - Optional render function (row) => JSX for action buttons
 */
const DataTable = ({
  columns = [],
  data = [],
  onRowClick,
  searchable = true,
  searchKeys,
  emptyMessage = 'No data found',
  pagination,
  onPageChange,
  actions,
}) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const keys = searchKeys || columns.map((c) => c.key);

  const filteredData = useMemo(() => {
    let result = [...data];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        keys.some((k) => String(row[k] ?? '').toLowerCase().includes(q))
      );
    }
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey] ?? '';
        const bVal = b[sortKey] ?? '';
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return sortDir === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }
    return result;
  }, [data, search, sortKey, sortDir, keys]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const styles = {
    container: {
      background: 'var(--card-bg, #1E1E2E)',
      borderRadius: '16px',
      border: '1px solid var(--border-color, rgba(255,255,255,0.06))',
      overflow: 'hidden',
    },
    searchBar: {
      padding: '16px 20px',
      borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))',
    },
    searchInput: {
      width: '100%',
      maxWidth: 320,
      padding: '10px 16px',
      borderRadius: '10px',
      border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
      background: 'var(--input-bg, rgba(255,255,255,0.04))',
      color: 'var(--text-primary, #fff)',
      fontSize: 14,
      outline: 'none',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      padding: '12px 20px',
      textAlign: 'left',
      fontSize: 12,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--text-secondary, #888)',
      borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))',
      userSelect: 'none',
    },
    td: {
      padding: '14px 20px',
      fontSize: 14,
      color: 'var(--text-primary, #fff)',
      borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.04))',
    },
    row: {
      transition: 'background 0.15s ease',
      cursor: onRowClick ? 'pointer' : 'default',
    },
    empty: {
      padding: '48px 20px',
      textAlign: 'center',
      color: 'var(--text-secondary, #888)',
      fontSize: 14,
    },
    pagination: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 20px',
      borderTop: '1px solid var(--border-color, rgba(255,255,255,0.06))',
      fontSize: 13,
      color: 'var(--text-secondary, #888)',
    },
    pageBtn: {
      padding: '6px 14px',
      borderRadius: '8px',
      border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
      background: 'transparent',
      color: 'var(--text-primary, #fff)',
      cursor: 'pointer',
      fontSize: 13,
    },
  };

  return (
    <div style={styles.container}>
      {searchable && (
        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ ...styles.th, width: col.width, cursor: col.sortable !== false ? 'pointer' : 'default' }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
              {actions && <th style={styles.th}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} style={styles.empty}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr
                  key={row._id || row.id || idx}
                  style={styles.row}
                  onClick={() => onRowClick?.(row)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={styles.td}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {actions && <td style={styles.td}>{actions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && pagination.pages > 1 && (
        <div style={styles.pagination}>
          <span>
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{ ...styles.pageBtn, opacity: pagination.page <= 1 ? 0.4 : 1 }}
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              Previous
            </button>
            <button
              style={{ ...styles.pageBtn, opacity: pagination.page >= pagination.pages ? 0.4 : 1 }}
              disabled={pagination.page >= pagination.pages}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
