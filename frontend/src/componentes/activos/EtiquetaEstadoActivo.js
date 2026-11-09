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
const ESTILOS = {
  Operativo: { fondo: 'var(--cui-success-bg-subtle, #d8f3e3)', texto: 'var(--cui-success-text-emphasis, #1b9e5a)' },
  'En mantenimiento': { fondo: 'var(--cui-info-bg-subtle, #d6f1fb)', texto: 'var(--cui-info-text-emphasis, #0b6b8c)' },
  'Fuera de servicio': { fondo: 'var(--cui-danger-bg-subtle, #fbdcdc)', texto: 'var(--cui-danger-text-emphasis, #b02a37)' },
  Retirado: { fondo: 'var(--cui-secondary-bg-subtle, #e7e8ea)', texto: 'var(--cui-secondary-text-emphasis, #4f5d73)' },
};

export default function EtiquetaEstadoActivo({ estado }) {
  if (!estado) return null;

  const estilo = ESTILOS[estado] ?? ESTILOS.Retirado;

  return (
    <span className="sigma-etiqueta text-nowrap" style={{ backgroundColor: estilo.fondo, color: estilo.texto }}>
      <span aria-hidden="true" style={{ marginRight: '0.35rem' }}>●</span>
      {estado}
    </span>
  );
}
