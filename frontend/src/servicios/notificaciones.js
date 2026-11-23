/**
 * Llamadas a la API de las notificaciones (campana y /notificaciones).
 *
 * El rol no se manda: la API lo saca de la sesión y cada uno recibe las suyas.
 *
 * Después de leer o eliminar una, se avisa con el evento EVENTO_CAMBIO para
 * que la campana se ponga al día sin esperar a que se cambie de pantalla.
 */
import { api } from './api.js';

export const EVENTO_CAMBIO = 'sigma-notificaciones-cambiaron';

function avisarCambio() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENTO_CAMBIO));
}

/**
 * @returns {Promise<{
 *   verMas: string|null,
 *   noLeidas: number,
 *   notificaciones: { clave, tipo, titulo, detalle, enlace, accion, fecha, leida }[]
 * }>} de la más nueva a la más vieja
 */
export async function listarNotificaciones() {
  const { data } = await api.get('/notificaciones');
  return data.datos;
}

/** Marca una como leída (o como no leída, con leida = false). */
export async function marcarNotificacionLeida(clave, leida = true) {
  await api.patch(`/notificaciones/${encodeURIComponent(clave)}`, { leida });
  avisarCambio();
}

export async function marcarTodasLeidas() {
  await api.patch('/notificaciones/leidas');
  avisarCambio();
}

export async function eliminarNotificacion(clave) {
  await api.delete(`/notificaciones/${encodeURIComponent(clave)}`);
  avisarCambio();
}
