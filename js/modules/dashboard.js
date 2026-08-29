import { dbGetAll } from '../db.js';
import * as calc from '../calc.js';
import { fmtMonto, fmtPct } from '../format.js';

function deltaClass(v) {
  if (v > 0) return 'positive';
  if (v < 0) return 'negative';
  return 'neutral';
}

function wealthLineSVG(serie) {
  // serie: array de números (patrimonio por snapshot). Si está vacío o es todo 0, dibuja línea plana en $0.
  const w = 600, h = 46;
  const vals = serie.length ? serie : [0, 0];
  const max = Math.max(...vals, 1);
  const min = Math.min(...vals, 0);
  const range = max - min || 1;
  const step = w / Math.max(vals.length - 1, 1);
  const pts = vals.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`);
  return `<svg class="wealth-line" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <path d="M${pts.join(' L')}" />
  </svg>`;
}

export async function render(container) {
  const [ingresos, gastos, inversiones, activos, deudas, snapshots] = await Promise.all([
    dbGetAll('ingresos'), dbGetAll('gastos'), dbGetAll('inversiones'),
    dbGetAll('activos'), dbGetAll('deudas'), dbGetAll('patrimonio_snapshots')
  ]);

  const patrimonioActual = calc.patrimonioNeto(activos, inversiones, deudas);
  const serieOrdenada = [...snapshots].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const patrimonioAnterior = serieOrdenada.length ? serieOrdenada[serieOrdenada.length - 1].patrimonio : 0;
  const { absoluto, porcentual } = calc.crecimientoPatrimonial(patrimonioActual, patrimonioAnterior);

  const ahorro = calc.ahorroPeriodo(ingresos, gastos);
  const tasaAhorro = calc.tasaAhorro(ingresos, gastos);
  const cartera = calc.resumenCartera(inversiones);

  const sinDatos = ingresos.length === 0 && gastos.length === 0 && inversiones.length === 0
    && activos.length === 0 && deudas.length === 0;

  container.innerHTML = `
    <div class="section-title"><h2>Patrimonio neto</h2></div>
    <div class="grid">
      <div class="card">
        <div class="label">Patrimonio actual</div>
        <div class="value">${fmtMonto(patrimonioActual)}</div>
        <div class="delta ${deltaClass(absoluto)}">${absoluto >= 0 ? '+' : ''}${fmtMonto(absoluto)} (${fmtPct(porcentual)})</div>
      </div>
      <div class="card">
        <div class="label">Ahorro del período</div>
        <div class="value">${fmtMonto(ahorro)}</div>
        <div class="delta ${deltaClass(ahorro)}">Tasa de ahorro: ${fmtPct(tasaAhorro)}</div>
      </div>
      <div class="card">
        <div class="label">Cartera de inversión</div>
        <div class="value">${fmtMonto(cartera.valorTotal)}</div>
        <div class="delta ${deltaClass(cartera.gananciaTotal)}">${fmtPct(cartera.rentabilidadTotal)} rentabilidad</div>
      </div>
    </div>

    ${sinDatos ? `
      <div class="empty-state" style="margin-top:24px">
        <strong>Estás partiendo desde $0</strong>
        Registra tu primer ingreso, gasto o activo para que el patrimonio empiece a calcularse. El sistema está listo para acompañarte desde aquí.
      </div>
    ` : ''}
  `;

  const svgHost = document.querySelector('.app-header');
  const existing = svgHost.querySelector('.wealth-line');
  if (existing) existing.remove();
  svgHost.insertAdjacentHTML('beforeend', wealthLineSVG(serieOrdenada.map(s => s.patrimonio).concat(patrimonioActual)));
}
