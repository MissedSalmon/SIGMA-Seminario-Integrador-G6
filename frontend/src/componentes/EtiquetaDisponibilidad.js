'use client';

/**
 * Badge de disponibilidad de un tecnico (HU-5): un punto de color + el texto.
 * A diferencia de EtiquetaTipo (color por hash, texto libre), ac hay solo dos
 * estados posibles y cada uno tiene su color fijo.
 */
/** El tono del sello de cada estado (ver --sigma-tono-* en globals.css). */
const TONOS = {
  Disponible: 'bien',
  'No disponible': 'peligro',
};

export default function EtiquetaDisponibilidad({ disponibilidad }) {
  const tono = TONOS[disponibilidad] ?? TONOS['No disponible'];

  return (
    <span className={`sigma-sello sigma-sello--${tono}`}>
      {disponibilidad}
    </span>
  );
}
