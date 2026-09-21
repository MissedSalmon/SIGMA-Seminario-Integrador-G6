/**
 * Llamadas a la API de prestadores de servicio.
 *
 * Por ahora sólo se listan: se usan para elegir quién hace una tarea de la OT
 * cuando el trabajo no lo cubre el equipo propio (HU-14). El alta, la edición
 * y la baja son la HU-33, así que hasta entonces esta lista puede venir vacía.
 */
import { api } from './api.js';

export async function listarPrestadores() {
  const { data } = await api.get('/prestadores');
  return data.datos;
}
