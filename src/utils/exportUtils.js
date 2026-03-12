import { toast } from 'react-toastify';

/**
 * Export data to CSV and trigger download
 * @param {Array<Object>} data - Array of objects to export
 * @param {string} filename - Download filename (without extension)
 * @param {Array<{key: string, label: string}>} columns - Column definitions [{key, label}]
 */
export function exportToCSV(data, filename = 'export', columns = []) {
  if (!data?.length) {
    toast.info('No data to export');
    return;
  }
  const cols = columns.length ? columns : Object.keys(data[0]).map(k => ({ key: k, label: k }));
  const header = cols.map(c => `"${String(c.label).replace(/"/g, '""')}"`).join(',');
  const rows = data.map(row =>
    cols.map(c => {
      const val = row[c.key];
      const str = val == null ? '' : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
