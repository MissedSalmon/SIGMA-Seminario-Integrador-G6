'use client';

/**
 * Estado de un préstamo de herramienta en "Herramientas utilizadas": un punto
 * de color + el texto, con la misma forma que EtiquetaEstadoOT (25/10/2026).
 *
 * Celeste: la herramienta está a nombre del técnico y la puede devolver.
 * Gris: ya la devolvió, la fila queda sólo como historial.
 */
/** El tono del sello de cada estado (ver --sigma-tono-* en globals.css). */
const TONOS = {
  'En uso': 'curso',
  Devuelta: 'neutro',
};

export default function EtiquetaEstadoPrestamo({ enUso }) {
  const estado = enUso ? 'En uso' : 'Devuelta';
  const tono = TONOS[estado];

  return (
    <span className={`sigma-sello sigma-sello--${tono}`}>
      {estado}
    </span>
  );
}
