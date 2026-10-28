'use client';

/**
 * Estado de un préstamo de herramienta en "Herramientas utilizadas": un punto
 * de color + el texto, con la misma forma que EtiquetaEstadoOT (25/10/2026).
 *
 * Celeste: la herramienta está a nombre del técnico y la puede devolver.
 * Gris: ya la devolvió, la fila queda sólo como historial.
 */
const ESTILOS = {
  'En uso': { fondo: 'var(--cui-info-bg-subtle, #d6f1fb)', texto: 'var(--cui-info-text-emphasis, #0b6b8c)' },
  Devuelta: { fondo: 'var(--cui-secondary-bg-subtle, #e9ecef)', texto: 'var(--cui-secondary-text-emphasis, #495057)' },
};

export default function EtiquetaEstadoPrestamo({ enUso }) {
  const estado = enUso ? 'En uso' : 'Devuelta';
  const estilo = ESTILOS[estado];

  return (
    <span className="sigma-etiqueta text-nowrap" style={{ backgroundColor: estilo.fondo, color: estilo.texto }}>
      <span aria-hidden="true" style={{ marginRight: '0.35rem' }}>●</span>
      {estado}
    </span>
  );
}
