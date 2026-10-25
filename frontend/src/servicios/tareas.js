/**
 * Llamadas a la API de las tareas del técnico (HU-21).
 *
 * El técnico no se manda: la API lo saca de la sesión, así que cada uno recibe
 * sólo las tareas que le asignaron.
 */
import { api } from './api.js';

export async function agregarObservacion(idOt, idTarea, texto) {
  const { data } = await api.post(`/tareas/mias/${idOt}/${idTarea}/observaciones`, { texto });
  return data.datos;
}

/**
 * Las tareas del técnico y cuántas le quedan pendientes. Los filtros se combinan.
 * El orden de la lista lo pone la pantalla.
 *
 * @param {object} [filtros]
 * @param {string} [filtros.estado]    - "En ejecución" | "Asignada" | "Finalizada" | "Cancelada"
 * @param {string} [filtros.prioridad] - "Alta" | "Media" | "Baja"
 * @param {string} [filtros.desde]     - "2026-10-01": fecha prevista de inicio desde
 * @param {string} [filtros.hasta]     - "2026-10-31": fecha prevista de inicio hasta
 * @returns {Promise<{ tareas: object[], pendientes: number }>}
 */
export async function listarMisTareas(filtros = {}) {
  const { estado, prioridad, desde, hasta } = filtros;

  const { data } = await api.get('/tareas/mias', {
    params: {
      ...(estado ? { estado } : {}),
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

/* ---------- Ejecutar la tarea (HU-22) ---------- */

/** Empieza la tarea: pasa a En ejecución y el activo a En mantenimiento. */
export async function iniciarTarea(idOt, idTarea) {
  const { data } = await api.post(`/tareas/mias/${idOt}/${idTarea}/iniciar`);
  return data.datos;
}

/**
 * Termina la tarea. Si era la última de la OT, la OT se finaliza sola.
 * @returns {Promise<{ tarea: object, ordenFinalizada: boolean }>}
 */
export async function finalizarTarea(idOt, idTarea) {
  const { data } = await api.post(`/tareas/mias/${idOt}/${idTarea}/finalizar`);
  return data.datos;
}

/**
 * Registra los materiales usados y descuenta el stock. Todo o nada: si a uno
 * no le alcanza el stock, no se registra ninguno.
 * @param {Array<{ codigo: string, cantidad: number }>} items
 */
export async function registrarMateriales(idOt, idTarea, items) {
  const { data } = await api.post(`/tareas/mias/${idOt}/${idTarea}/materiales`, { items });
  return data.datos;
}

/** Los materiales del depósito con su stock: [{ codigo, nombre, stock }]. */
export async function listarMaterialesDelDeposito() {
  const { data } = await api.get('/tareas/materiales');
  return data.datos;
}

/** Las herramientas a nombre del técnico y las disponibles: { mias, disponibles }. */
export async function listarMisHerramientas() {
  const { data } = await api.get('/tareas/herramientas');
  return data.datos;
}

/** El técnico toma una herramienta para la tarea: queda En uso a su nombre. */
export async function tomarHerramienta(idOt, idTarea, codigo) {
  const { data } = await api.post(`/tareas/mias/${idOt}/${idTarea}/herramientas`, { codigo });
  return data.datos;
}

/** El técnico devuelve una herramienta suya. */
export async function devolverHerramienta(codigo) {
  const { data } = await api.post(`/tareas/herramientas/${encodeURIComponent(codigo)}/devolver`);
  return data.datos;
}

/* ---------- Historial del técnico ---------- */

/** Lo que se usó en las tareas del técnico, del más nuevo al más viejo. */
export async function listarHistorialMateriales() {
  const { data } = await api.get('/tareas/historial/materiales');
  return data.datos;
}

/** Las herramientas que tiene y las que tuvo, de la más nueva a la más vieja. */
export async function listarHistorialHerramientas() {
  const { data } = await api.get('/tareas/historial/herramientas');
  return data.datos;
}

/** Las prioridades para el filtro, de más urgente a menos. */
export async function listarPrioridadesDeTarea() {
  const { data } = await api.get('/tareas/prioridades');
  return data.datos;
}
