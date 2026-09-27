/**
 * Llamadas a la API de órdenes de trabajo (HU-14).
 *
 * La OT se genera sola al validar el ticket. Lo que se hace desde estas
 * pantallas es planificarla: cargarle las tareas, ponerles prioridad y decir
 * quién hace cada una.
 */
import { api } from './api.js';

/**
 * Lista las OT de la más nueva a la más vieja. Los filtros se combinan.
 *
 * @param {object} [filtros]
 * @param {string} [filtros.estado]        - "Creada", "Asignada", ...
 * @param {string} [filtros.prioridad]     - "Alta" | "Media" | "Baja"
 * @param {string} [filtros.codigoActivo]
 * @param {string} [filtros.desde]         - fecha/hora ISO (inclusive)
 * @param {string} [filtros.hasta]         - fecha/hora ISO (inclusive)
 */
export async function listarOrdenes(filtros = {}) {
  const { estado, prioridad, codigoActivo, desde, hasta } = filtros;

  const { data } = await api.get('/ordenes-trabajo', {
    params: {
      ...(estado ? { estado } : {}),
      ...(prioridad ? { prioridad } : {}),
      ...(codigoActivo ? { codigoActivo } : {}),
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
    },
  });

  return data.datos;
}

/** Los estados posibles de una OT, en el orden del flujo. */
export async function listarEstadosDeOrden() {
  const { data } = await api.get('/ordenes-trabajo/estados');
  return data.datos;
}

/** Las prioridades posibles de una tarea, de la más urgente a la menos. */
export async function listarPrioridades() {
  const { data } = await api.get('/ordenes-trabajo/prioridades');
  return data.datos;
}

export async function obtenerOrden(id) {
  const { data } = await api.get(`/ordenes-trabajo/${id}`);
  return data.datos;
}

/**
 * Genera la OT de un ticket ya validado.
 *
 * Normalmente la OT ya existe, porque se crea sola al validar el ticket. Esto
 * es para el ticket que quedó validado sin OT: se usa desde el botón "Crear
 * OT" del detalle del ticket y desde el alta del listado de órdenes.
 *
 * @param {number|string} idTicket
 * @param {string} [descripcion] - si no viene, la OT arranca con la descripción del ticket.
 */
export async function crearOrdenDesdeTicket(idTicket, descripcion) {
  const { data } = await api.post('/ordenes-trabajo', {
    idTicket,
    ...(descripcion ? { descripcion } : {}),
  });

  return data.datos;
}

export async function actualizarOrden(id, orden) {
  const { data } = await api.put(`/ordenes-trabajo/${id}`, orden);
  return data.datos;
}

/*
 * Las tres de abajo devuelven la OT completa y ya actualizada (con sus tareas
 * y su estado recalculado), así que la pantalla no tiene que volver a pedirla.
 */

export async function agregarTarea(idOrden, tarea) {
  const { data } = await api.post(`/ordenes-trabajo/${idOrden}/tareas`, tarea);
  return data.datos;
}

export async function actualizarTarea(idOrden, idTarea, tarea) {
  const { data } = await api.put(`/ordenes-trabajo/${idOrden}/tareas/${idTarea}`, tarea);
  return data.datos;
}

export async function eliminarTarea(idOrden, idTarea) {
  const { data } = await api.delete(`/ordenes-trabajo/${idOrden}/tareas/${idTarea}`);
  return data.datos;
}
