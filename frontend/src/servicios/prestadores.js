/**
 * Llamadas a la API de prestadores de servicio (HU-25).
 *
 * Cada prestador llega como
 * { idPrestador, nombre, cuil, telefono, email, garantia, tipos: [{ idTipoPrestador, nombre }] }.
 *
 * El listado tambien lo usa el formulario de tareas de la OT (HU-14), para
 * elegir quien hace una tarea que no cubre el equipo propio.
 */
import { api } from './api.js';

export async function listarPrestadores(filtros = {}) {
  const { tipo_prestador_id } = filtros;
  const { data } = await api.get('/prestadores', {
    params: tipo_prestador_id ? { tipo_prestador_id } : {},
  });
  return data.datos;
}

export async function obtenerPrestador(id) {
  const { data } = await api.get(`/prestadores/${id}`);
  return data.datos;
}

export async function crearPrestador(prestador) {
  const { data } = await api.post('/prestadores', prestador);
  return data.datos;
}

export async function actualizarPrestador(id, prestador) {
  const { data } = await api.put(`/prestadores/${id}`, prestador);
  return data.datos;
}

export async function eliminarPrestador(id) {
  const { data } = await api.delete(`/prestadores/${id}`);
  return data.datos;
}
