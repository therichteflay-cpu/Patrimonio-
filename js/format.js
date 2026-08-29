// format.js — Redondeo y formato SOLO para visualización. Nunca usar en cálculos internos.
export function fmtMonto(valor, moneda = 'CLP') {
  const v = Number(valor) || 0;
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: moneda, maximumFractionDigits: 0 }).format(v);
  } catch {
    return `$${Math.round(v).toLocaleString('es-CL')}`;
  }
}

export function fmtPct(valor, decimales = 1) {
  const v = Number(valor) || 0;
  return `${(v * 100).toFixed(decimales)}%`;
}

export function fmtFecha(fecha) {
  const d = new Date(fecha);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' });
}
