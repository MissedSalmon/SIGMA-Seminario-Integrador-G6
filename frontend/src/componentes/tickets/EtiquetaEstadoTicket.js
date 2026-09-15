'use client';

/**
 * Badge de estado de un ticket (HU-10): un punto de color + el texto.
 *
 * Mismo formato que EtiquetaDisponibilidad. Cada estado tiene su color fijo,
 * y "Creado" es el que mas importa distinguir: es el ticket que todavia
 * espera la decision del administrador.
 */
const ESTILOS = {
  Creado: { fondo: 'var(--cui-warning-bg-subtle, #fff3cd)', texto: 'var(--cui-warning-text-emphasis, #997404)' },
  Validado: { fondo: 'var(--cui-info-bg-subtle, #d6f1fb)', texto: 'var(--cui-info-text-emphasis, #0b6b8c)' },
  Asignado: { fondo: 'var(--cui-primary-bg-subtle, #dfe2ff)', texto: 'var(--cui-primary-text-emphasis, #2f3ba3)' },
  'En ejecución': { fondo: 'var(--cui-primary-bg-subtle, #dfe2ff)', texto: 'var(--cui-primary-text-emphasis, #2f3ba3)' },
  Finalizado: { fondo: 'var(--cui-success-bg-subtle, #d8f3e3)', texto: 'var(--cui-success-text-emphasis, #1b9e5a)' },
  Cerrado: { fondo: 'var(--cui-secondary-bg-subtle, #e9ecef)', texto: 'var(--cui-secondary-text-emphasis, #5c636a)' },
  Rechazado: { fondo: 'var(--cui-danger-bg-subtle, #fbdcdc)', texto: 'var(--cui-danger-text-emphasis, #b02a37)' },
};

export default function EtiquetaEstadoTicket({ estado }) {
  if (!estado) return null;

  const estilo = ESTILOS[estado] ?? ESTILOS.Cerrado;

  return (
    <span className="sigma-etiqueta text-nowrap" style={{ backgroundColor: estilo.fondo, color: estilo.texto }}>
      <span aria-hidden="true" style={{ marginRight: '0.35rem' }}>●</span>
      {estado}
    </span>
  );
}
