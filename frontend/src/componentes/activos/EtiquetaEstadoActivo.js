'use client';

/**
 * Etiqueta de estado de un activo: un punto de color más el texto, con el
 * mismo formato que EtiquetaEstadoOT.
 *
 * Qué quiere decir cada color (decidido el 03/11/2026):
 *   verde   = Operativo: funciona.
 *   celeste = En mantenimiento: tiene una OT en ejecución.
 *   rojo    = Fuera de servicio: no funciona.
 *   gris    = Retirado: dado de baja.
 */
/** El tono del sello de cada estado (ver --sigma-tono-* en globals.css). */
const TONOS = {
  Operativo: 'bien',
  'En mantenimiento': 'curso',
  'Fuera de servicio': 'peligro',
  Retirado: 'neutro',
};

export default function EtiquetaEstadoActivo({ estado }) {
  if (!estado) return null;

  const tono = TONOS[estado] ?? TONOS.Retirado;

  return (
    <span className={`sigma-sello sigma-sello--${tono}`}>
      {estado}
    </span>
  );
}
