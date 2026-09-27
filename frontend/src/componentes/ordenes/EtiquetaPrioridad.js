'use client';

/**
 * Badge de prioridad de una tarea de la OT (HU-14).
 *
 * La prioridad se carga en cada tarea; la OT muestra la más alta de las suyas.
 * El color acompaña, pero lo que se lee es la palabra: "Alta", "Media" o
 * "Baja". Si una OT no tiene tareas todavía, no hay prioridad que mostrar y se
 * devuelve un guion.
 */
const ESTILOS = {
  Alta: { fondo: 'var(--cui-danger-bg-subtle, #fbdcdc)', texto: 'var(--cui-danger-text-emphasis, #b02a37)' },
  Media: { fondo: 'var(--cui-warning-bg-subtle, #fff3cd)', texto: 'var(--cui-warning-text-emphasis, #997404)' },
  Baja: { fondo: 'var(--cui-secondary-bg-subtle, #e9ecef)', texto: 'var(--cui-secondary-text-emphasis, #5c636a)' },
};

export default function EtiquetaPrioridad({ prioridad }) {
  if (!prioridad) return <span className="text-body-tertiary">-</span>;

  const estilo = ESTILOS[prioridad] ?? ESTILOS.Media;

  return (
    <span className="sigma-etiqueta text-nowrap" style={{ backgroundColor: estilo.fondo, color: estilo.texto }}>
      <span aria-hidden="true" style={{ marginRight: '0.35rem' }}>●</span>
      {prioridad}
    </span>
  );
}
