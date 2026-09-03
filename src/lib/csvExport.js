// Turns an array of row-objects into a downloaded CSV — entirely in the
// browser, so no backend endpoint or extra dependency is needed for what's
// fundamentally just a text file.

function csvEscape(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/**
 * @param {string} filename e.g. 'attendees-tech-summit.csv'
 * @param {string[]} headers column headers, in order
 * @param {Array<Array<string|number>>} rows each row's values, matching header order
 */
export function downloadCsv(filename, headers, rows) {
  const lines = [headers, ...rows].map((row) => row.map(csvEscape).join(','));
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
