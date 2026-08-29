import { openDB } from './db.js';
import { registerRoute, initRouter } from './router.js';
import { render as renderDashboard } from './modules/dashboard.js';
import { stubModule } from './modules/stub.js';

async function main() {
  await openDB();

  registerRoute('#/dashboard', renderDashboard);
  registerRoute('#/ingresos', stubModule('Ingresos', 3));
  registerRoute('#/gastos', stubModule('Gastos', 3));
  registerRoute('#/ahorro', stubModule('Ahorro', 4));
  registerRoute('#/emergencia', stubModule('Fondo de emergencia', 4));
  registerRoute('#/inversiones', stubModule('Inversiones', 5));
  registerRoute('#/activos', stubModule('Activos', 6));
  registerRoute('#/deudas', stubModule('Deudas', 6));
  registerRoute('#/patrimonio', stubModule('Patrimonio', 6));
  registerRoute('#/metas', stubModule('Metas y proyecciones', 7));
  registerRoute('#/config', stubModule('Configuración / Backup', 8));

  initRouter('#/dashboard');
}

main();
