'use client';

/**
 * Etiqueta de estado del usuario de una persona (técnico o autorizado): un
 * punto de color más el texto, con el mismo formato que EtiquetaEstadoPlan.
 *
 * Qué quiere decir cada color (07/11/2026, igual que en los planes):
 *   verde = Activo: puede iniciar sesión.
 *   gris  = Inactivo: no puede iniciar sesión; se conserva lo que registró.
 *   gris  = Sin usuario: la persona todavía no tiene usuario para entrar.
 */
const VERDE = { fondo: 'var(--cui-success-bg-subtle, #d8f3e3)', texto: 'var(--cui-success-text-emphasis, #1b9e5a)' };
const GRIS = { fondo: 'var(--cui-secondary-bg-subtle, #e7e8ea)', texto: 'var(--cui-secondary-text-emphasis, #4f5d73)' };

export function textoEstado(activo) {
  if (activo === null || activo === undefined) return 'Sin usuario';
  return activo ? 'Activo' : 'Inactivo';
}

export default function EtiquetaEstadoUsuario({ activo }) {
  const estilo = activo ? VERDE : GRIS;

  return (
    <span className="sigma-etiqueta text-nowrap" style={{ backgroundColor: estilo.fondo, color: estilo.texto }}>
      <span aria-hidden="true" style={{ marginRight: '0.35rem' }}>●</span>
      {textoEstado(activo)}
    </span>
  );
}
