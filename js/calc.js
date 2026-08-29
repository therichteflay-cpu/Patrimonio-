// calc.js — Fórmulas financieras centrales. Toda división pasa por safeDiv.
// Regla: precisión interna sin redondear; redondear SOLO al mostrar (ver format.js).

export function safeDiv(numerador, denominador) {
  if (!denominador || !isFinite(denominador)) return 0;
  const r = numerador / denominador;
  return isFinite(r) ? r : 0;
}

export function sum(arr, sel = (x) => x) {
  return arr.reduce((acc, x) => acc + (Number(sel(x)) || 0), 0);
}

export function mesesEntre(fechaInicial, fechaFinal = new Date()) {
  const a = new Date(fechaInicial), b = new Date(fechaFinal);
  const meses = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  return Math.max(meses, 1); // mínimo 1 para evitar división por cero en promedios
}

// ---- Ingresos / Gastos / Ahorro ----
export const totalIngresos = (ingresos) => sum(ingresos, i => i.monto);
export const totalGastos = (gastos) => sum(gastos, g => g.monto);
export const ahorroPeriodo = (ingresos, gastos) => totalIngresos(ingresos) - totalGastos(gastos);
export const tasaAhorro = (ingresos, gastos) => safeDiv(ahorroPeriodo(ingresos, gastos), totalIngresos(ingresos));
export const tasaGastos = (ingresos, gastos) => safeDiv(totalGastos(gastos), totalIngresos(ingresos));
export const promedioMensual = (total, fechaInicial) => safeDiv(total, mesesEntre(fechaInicial));

// ---- Fondo de emergencia ----
export function fondoEmergencia({ gastosEsenciales, fondoActual, mesesObjetivo }) {
  const gastoEsencialMensual = safeDiv(sum(gastosEsenciales, g => g.monto), mesesEntre(gastosEsenciales[0]?.fecha ?? new Date()));
  const capitalNecesario = gastoEsencialMensual * mesesObjetivo;
  const capitalFaltante = Math.max(capitalNecesario - fondoActual, 0);
  return {
    gastoEsencialMensual,
    mesesCubiertos: safeDiv(fondoActual, gastoEsencialMensual),
    capitalNecesario,
    capitalFaltante,
    progreso: safeDiv(fondoActual, capitalNecesario)
  };
}

// ---- Inversiones ----
export function metricasInversion(inv) {
  const capital = (inv.cantidad * inv.precioEntrada) + (inv.comision || 0);
  const valorActual = inv.estado === 'vendida'
    ? (inv.cantidad * (inv.precioSalida || 0))
    : (inv.cantidad * (inv.precioActual ?? inv.precioEntrada));
  const gananciaPerdida = valorActual + (inv.dividendos || 0) - capital;
  return {
    capital,
    valorActual,
    gananciaPerdida,
    rentabilidad: safeDiv(gananciaPerdida, capital)
  };
}

export function resumenCartera(inversiones) {
  const filas = inversiones.map(metricasInversion);
  const capitalAportado = sum(filas, f => f.capital);
  const valorTotal = sum(filas, f => f.valorActual);
  const gananciaTotal = sum(filas, f => f.gananciaPerdida);
  return {
    capitalAportado,
    valorTotal,
    gananciaTotal,
    rentabilidadTotal: safeDiv(gananciaTotal, capitalAportado),
    dividendosAcumulados: sum(inversiones, i => i.dividendos || 0)
  };
}

// ---- Activos / Deudas / Patrimonio ----
export const totalActivos = (activos, inversiones) =>
  sum(activos, a => a.monto) + resumenCartera(inversiones).valorTotal;
export const totalDeudas = (deudas) => sum(deudas, d => d.saldoPendiente);
export const patrimonioNeto = (activos, inversiones, deudas) =>
  totalActivos(activos, inversiones) - totalDeudas(deudas);

export function crecimientoPatrimonial(actual, anterior) {
  return {
    absoluto: actual - anterior,
    porcentual: safeDiv(actual - anterior, Math.abs(anterior))
  };
}

export const velocidadRiqueza = (patrimonioActual, patrimonioInicial, fechaInicial) =>
  safeDiv(patrimonioActual - patrimonioInicial, mesesEntre(fechaInicial));

export const ratioDeudaIngreso = (pagoMensualDeudas, ingresoMensual) => safeDiv(pagoMensualDeudas, ingresoMensual);
export const ratioDeudaActivos = (deudaTotal, activosTotal) => safeDiv(deudaTotal, activosTotal);

// ---- Métricas de creación de riqueza ----
export const patrimonioPorIngreso = (patrimonio, ingresosAcumulados) => safeDiv(patrimonio, ingresosAcumulados);
export const pctPatrimonioPorAportes = (capitalAportado, patrimonio) => safeDiv(capitalAportado, patrimonio);
export const pctPatrimonioPorRentabilidad = (gananciaInversiones, patrimonio) => safeDiv(gananciaInversiones, patrimonio);

// ---- Interés compuesto / proyección ----
// VF = P(1+r)^n + A[((1+r)^n - 1)/r]
export function proyeccionPatrimonio({ patrimonioInicial, aporteMensual, rentabilidadAnual, inflacionAnual = 0, anios }) {
  const n = anios * 12;
  const rMensual = rentabilidadAnual / 12;
  const factor = rMensual === 0 ? n : (Math.pow(1 + rMensual, n) - 1) / rMensual;
  const vfNominal = patrimonioInicial * Math.pow(1 + rMensual, n) + aporteMensual * factor;
  const inflacionAcumulada = Math.pow(1 + inflacionAnual, anios);
  const vfReal = safeDiv(vfNominal, inflacionAcumulada);
  return { vfNominal, vfReal, meses: n };
}

export function escenarios(base) {
  return {
    conservador: proyeccionPatrimonio({ ...base, rentabilidadAnual: Math.max(base.rentabilidadAnual - 0.04, 0) }),
    base: proyeccionPatrimonio(base),
    agresivo: proyeccionPatrimonio({ ...base, rentabilidadAnual: base.rentabilidadAnual + 0.04 })
  };
}

// ---- Independencia financiera ----
export function independenciaFinanciera({ gastosMensuales, tasaRetiro, patrimonioActual }) {
  const gastosAnuales = gastosMensuales * 12;
  const patrimonioObjetivo = safeDiv(gastosAnuales, tasaRetiro);
  return {
    gastosAnuales,
    patrimonioObjetivo,
    diferencia: patrimonioObjetivo - patrimonioActual,
    pctAlcanzado: safeDiv(patrimonioActual, patrimonioObjetivo)
  };
}

// ---- Metas ----
export function progresoMeta({ montoMeta, patrimonioActual, aporteMensual }) {
  const capitalFaltante = Math.max(montoMeta - patrimonioActual, 0);
  return {
    capitalFaltante,
    pctAlcanzado: safeDiv(patrimonioActual, montoMeta),
    mesesEstimados: aporteMensual > 0 ? Math.ceil(safeDiv(capitalFaltante, aporteMensual)) : null
  };
}
