// Exporta un array de objetos a CSV y lo descarga. Sin dependencias.
export function exportToCSV(filename: string, rows: Record<string, any>[], columns?: { key: string; label: string }[]) {
  if (!rows || rows.length === 0) return;
  const cols = columns || Object.keys(rows[0]).map(k => ({ key: k, label: k }));
  const escape = (v: any) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n;]/.test(s) ? `"${s}"` : s;
  };
  const header = cols.map(c => escape(c.label)).join(';');
  const body = rows.map(r => cols.map(c => escape(r[c.key])).join(';')).join('\n');
  // BOM para que Excel respete los acentos
  const blob = new Blob(['﻿' + header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `${filename}_${stamp}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
