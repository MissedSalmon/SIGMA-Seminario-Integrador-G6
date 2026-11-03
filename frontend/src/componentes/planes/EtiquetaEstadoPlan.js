'use client';

/**
 * Etiqueta de estado de un plan de mantenimiento preventivo: un punto de color
 * más el texto, con el mismo formato que EtiquetaEstadoOT.
 *
 * Qué quiere decir cada color (decidido el 03/11/2026):
 *   verde = Activo: el plan sigue generando órdenes de trabajo.
 *   gris  = Dado de baja: ya no genera; las OT que generó no se tocan.
 */
const ESTILOS = {
  Activo: { fondo: 'var(--cui-success-bg-subtle, #d8f3e3)', texto: 'var(--cui-success-text-emphasis, #1b9e5a)' },
  'Dado de baja': { fondo: 'var(--cui-secondary-bg-subtle, #e7e8ea)', texto: 'var(--cui-secondary-text-emphasis, #4f5d73)' },
};

export default function EtiquetaEstadoPlan({ activo }) {
  const estado = activo ? 'Activo' : 'Dado de baja';
  const estilo = ESTILOS[estado];

  return (
    <span className="sigma-etiqueta text-nowrap" style={{ backgroundColor: estilo.fondo, color: estilo.texto }}>
      <span aria-hidden="true" style={{ marginRight: '0.35rem' }}>●</span>
      {estado}
    </span>
  );
}
