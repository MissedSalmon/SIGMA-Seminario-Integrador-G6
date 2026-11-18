'use client';

/**
 * Sello de estado del usuario de una persona (técnico o autorizado), con el
 * mismo formato que EtiquetaEstadoPlan.
 *
 * Qué quiere decir cada color (07/11/2026, igual que en los planes):
 *   verde = Activo: puede iniciar sesión.
 *   gris  = Inactivo: no puede iniciar sesión; se conserva lo que registró.
 *   gris  = Sin usuario: la persona todavía no tiene usuario para entrar.
 */

export function textoEstado(activo) {
  if (activo === null || activo === undefined) return 'Sin usuario';
  return activo ? 'Activo' : 'Inactivo';
}

export default function EtiquetaEstadoUsuario({ activo }) {
  const tono = activo ? 'bien' : 'neutro';

  return (
    <span className={`sigma-sello sigma-sello--${tono}`}>
      {textoEstado(activo)}
    </span>
  );
}
