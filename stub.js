export function stubModule(nombre, fase) {
  return async (container) => {
    container.innerHTML = `
      <div class="section-title"><h2>${nombre}</h2><span class="badge">Fase ${fase}</span></div>
      <div class="empty-state">
        <strong>Módulo aún no implementado</strong>
        Se construirá en la Fase ${fase} del plan de trabajo.
      </div>
    `;
  };
}
