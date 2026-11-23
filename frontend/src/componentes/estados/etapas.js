/**
 * Las etapas de un ticket o de una orden de trabajo y su color.
 *
 * Decision del 18/11/2026 (regla 6 de UI del CLAUDE.md): los sellos de estado
 * de tickets y OT llevan un color por ETAPA, no uno por estado, y la
 * referencia de que significa cada color se muestra escrita al lado
 * (componente ReferenciaEtapas). Ningun sello usa el azul petroleo: ese color
 * es de las acciones y del numero de cada registro.
 *
 * Los colores son los tonos del sistema (--sigma-tono-* en globals.css),
 * todos con contraste de al menos 4.5:1 sobre blanco.
 */
export const ETAPAS = {
  pendiente: { tono: 'aviso', color: 'var(--sigma-tono-aviso)', texto: 'Falta empezar' },
  enCurso: { tono: 'curso', color: 'var(--sigma-tono-curso)', texto: 'En curso' },
  terminado: { tono: 'bien', color: 'var(--sigma-tono-bien)', texto: 'Terminado' },
  cerrado: { tono: 'neutro', color: 'var(--sigma-tono-neutro)', texto: 'Cerrado' },
  cancelado: { tono: 'peligro', color: 'var(--sigma-tono-peligro)', texto: 'Cancelado o rechazado' },
};

/** La etapa de cada estado de un ticket. */
export const ETAPA_TICKET = {
  Creado: 'pendiente',
  Validado: 'enCurso',
  Asignado: 'enCurso',
  'En ejecución': 'enCurso',
  Finalizado: 'terminado',
  Cerrado: 'cerrado',
  Rechazado: 'cancelado',
};

/** La etapa de cada estado de una orden de trabajo. */
export const ETAPA_OT = {
  Creada: 'pendiente',
  Asignada: 'enCurso',
  'En ejecución': 'enCurso',
  Finalizada: 'terminado',
  Cancelada: 'cancelado',
};

/** Las tareas usan los mismos sellos que la OT, más «Pendiente», que la OT no tiene (22/11/2026). */
export const ETAPA_TAREA = {
  Creada: 'pendiente',
  Pendiente: 'pendiente',
  Asignada: 'enCurso',
  'En ejecución': 'enCurso',
  Finalizada: 'terminado',
  Cancelada: 'cancelado',
};
