'use client';

/**
 * Etiqueta de estado de un plan de mantenimiento preventivo: un punto de color
 * más el texto, con el mismo formato que EtiquetaEstadoOT.
 *
 * Qué quiere decir cada color (decidido el 03/11/2026):
 *   verde = Activo: el plan sigue generando órdenes de trabajo.
 *   gris  = Dado de baja: ya no genera; las OT que generó no se tocan.
 */
/** El tono del sello de cada estado (ver --sigma-tono-* en globals.css). */
const TONOS = {
  Activo: 'bien',
  'Dado de baja': 'neutro',
};

export default function EtiquetaEstadoPlan({ activo }) {
  const estado = activo ? 'Activo' : 'Dado de baja';
  const tono = TONOS[estado];

  return (
    <span className={`sigma-sello sigma-sello--${tono}`}>
      {estado}
    </span>
  );
}
