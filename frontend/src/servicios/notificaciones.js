/**
 * Llamada a la API de la campana de notificaciones.
 *
 * El rol no se manda: la API lo saca de la sesión y cada uno recibe las suyas.
 */
import { api } from './api.js';

/** @returns {Promise<{ verMas: string|null, notificaciones: { clave, titulo, detalle, enlace }[] }>} */
export async function listarNotificaciones() {
  const { data } = await api.get('/notificaciones');
  return data.datos;
}
