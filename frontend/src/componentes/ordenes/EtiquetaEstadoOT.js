'use client';

/**
 * Badge de estado de una orden de trabajo (HU-14): un punto de color + el
 * texto del estado.
 *
 * Mismo formato que EtiquetaEstadoTicket. El color no dice nada por su cuenta:
 * al lado está escrito el estado, que es lo que se lee.
 */
const ESTILOS = {
  Creada: { fondo: 'var(--cui-warning-bg-subtle, #fff3cd)', texto: 'var(--cui-warning-text-emphasis, #997404)' },
  Asignada: { fondo: 'var(--cui-primary-bg-subtle, #dfe2ff)', texto: 'var(--cui-primary-text-emphasis, #2f3ba3)' },
  'En ejecución': { fondo: 'var(--cui-info-bg-subtle, #d6f1fb)', texto: 'var(--cui-info-text-emphasis, #0b6b8c)' },
  Finalizada: { fondo: 'var(--cui-success-bg-subtle, #d8f3e3)', texto: 'var(--cui-success-text-emphasis, #1b9e5a)' },
  Cancelada: { fondo: 'var(--cui-danger-bg-subtle, #fbdcdc)', texto: 'var(--cui-danger-text-emphasis, #b02a37)' },
};

export default function EtiquetaEstadoOT({ estado }) {
  if (!estado) return null;

  const estilo = ESTILOS[estado] ?? ESTILOS.Creada;

  return (
    <span className="sigma-etiqueta text-nowrap" style={{ backgroundColor: estilo.fondo, color: estilo.texto }}>
      <span aria-hidden="true" style={{ marginRight: '0.35rem' }}>●</span>
      {estado}
    </span>
  );
}
