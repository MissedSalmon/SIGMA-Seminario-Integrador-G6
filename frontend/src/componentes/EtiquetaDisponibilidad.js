'use client';

/**
 * Badge de disponibilidad de un tecnico (HU-5): un punto de color + el texto.
 * A diferencia de EtiquetaTipo (color por hash, texto libre), ac hay solo dos
 * estados posibles y cada uno tiene su color fijo.
 */
const ESTILOS = {
  Disponible: { fondo: 'var(--cui-success-bg-subtle, #d8f3e3)', texto: 'var(--cui-success, #1b9e5a)' },
  'No disponible': { fondo: 'var(--cui-danger-bg-subtle, #fbdcdc)', texto: 'var(--cui-danger, #e55353)' },
};

export default function EtiquetaDisponibilidad({ disponibilidad }) {
  const estilo = ESTILOS[disponibilidad] ?? ESTILOS['No disponible'];

  return (
    <span className="sigma-etiqueta" style={{ backgroundColor: estilo.fondo, color: estilo.texto }}>
      <span aria-hidden="true" style={{ marginRight: '0.35rem' }}>●</span>
      {disponibilidad}
    </span>
  );
}
