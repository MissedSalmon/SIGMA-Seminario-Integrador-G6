'use client';

/**
 * A dónde lleva «Volver al listado» en una pantalla de detalle (23/11/2026).
 *
 * Si se llegó desde una notificación (la campana o /notificaciones), el enlace
 * trae «?desde=notificaciones» y se vuelve a la lista de notificaciones. Si no,
 * al listado propio de la pantalla.
 *
 *   const volverA = useVolverA('/tickets');
 *   <BotonEnlace href={volverA}>Volver al listado</BotonEnlace>
 */
import { useSearchParams } from 'next/navigation';

const DESDE_NOTIFICACIONES = 'notificaciones';

/** El enlace de una notificación, marcado para que el detalle vuelva a /notificaciones. */
export function enlaceDesdeNotificaciones(enlace) {
  if (!enlace) return enlace;
  return `${enlace}${enlace.includes('?') ? '&' : '?'}desde=${DESDE_NOTIFICACIONES}`;
}

/** @param {string} listado - el listado propio de la pantalla */
export function useVolverA(listado) {
  const parametros = useSearchParams();
  return parametros.get('desde') === DESDE_NOTIFICACIONES ? '/notificaciones' : listado;
}
