// router.js — Enrutador simple basado en hash. Cada módulo exporta render(container).
const routes = {}; // '#/dashboard' -> async (container) => {...}

export function registerRoute(hash, renderFn) {
  routes[hash] = renderFn;
}

export function initRouter(defaultHash = '#/dashboard') {
  window.addEventListener('hashchange', () => renderCurrent());
  if (!location.hash) location.hash = defaultHash;
  renderCurrent();
}

async function renderCurrent() {
  const hash = location.hash || '#/dashboard';
  const container = document.getElementById('app-main');
  const navLinks = document.querySelectorAll('.bottom-nav a');
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === hash));

  const renderFn = routes[hash];
  if (!renderFn) {
    container.innerHTML = `<div class="empty-state"><strong>Sección no encontrada</strong></div>`;
    return;
  }
  container.innerHTML = `<div class="empty-state">Cargando…</div>`;
  try {
    await renderFn(container);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="empty-state"><strong>Error al cargar la sección</strong>${err.message}</div>`;
  }
}
