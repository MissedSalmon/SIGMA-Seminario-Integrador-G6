/**
 * Llamadas a la API de las tareas del técnico (HU-21).
 *
 * El técnico no se manda: la API lo saca de la sesión, así que cada uno recibe
 * sólo las tareas que le asignaron.
 */
import { api } from './api.js';

/**
 * Las tareas del técnico, ya ordenadas por prioridad y fecha prevista, y
 * cuántas le quedan pendientes. Los filtros se combinan.
 *
 * @param {object} [filtros]
 * @param {string} [filtros.prioridad] - "Alta" | "Media" | "Baja"
 * @param {string} [filtros.desde]     - "2026-10-01": fecha prevista de inicio desde
 * @param {string} [filtros.hasta]     - "2026-10-31": fecha prevista de inicio hasta
 * @returns {Promise<{ tareas: object[], pendientes: number }>}
 */
export async function listarMisTareas(filtros = {}) {
  const { prioridad, desde, hasta } = filtros;

  const { data } = await api.get('/tareas/mias', {
    params: {
      ...(prioridad ? { prioridad } : {}),
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
    },
  });

  return data.datos;
}

/** Una tarea del técnico, con su activo, dónde está y su OT. */
export async function obtenerMiTarea(idOt, idTarea) {
  const { data } = await api.get(`/tareas/mias/${idOt}/${idTarea}`);
  return data.datos;
}

/** Las prioridades para el filtro, de más urgente a menos. */
export async function listarPrioridadesDeTarea() {
  const { data } = await api.get('/tareas/prioridades');
  return data.datos;
}
