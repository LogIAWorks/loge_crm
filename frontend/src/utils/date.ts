// Formatea 'YYYY-MM-DD' a un formato corto en español (ej: "10 may 2026").
// Devuelve el valor original si no es una fecha reconocible.
export function fmtDate(value?: string | null): string {
  if (!value) return '—';
  const s = String(value).slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return String(value);
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}
