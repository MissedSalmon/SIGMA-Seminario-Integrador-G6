/**
 * Llamadas a la API de usuarios autorizados (HU-8).
 */
import { api } from './api.js';

/**
 * @param {object} [filtros]
 * @param {number} [filtros.area_id] - para ver solo los responsables de un area
 */
export async function listarAutorizados(filtros = {}) {
  const { area_id } = filtros;
  const { data } = await api.get('/autorizados', {
    params: {
      ...(area_id ? { area_id } : {}),
    },
  });
  return data.datos;
}

export async function obtenerAutorizado(legajo) {
  const { data } = await api.get(`/autorizados/${legajo}`);
  return data.datos;
}

export async function crearAutorizado(autorizado) {
  const { data } = await api.post('/autorizados', autorizado);
  return data.datos;
}

export async function actualizarAutorizado(legajo, autorizado) {
  const { data } = await api.put(`/autorizados/${legajo}`, autorizado);
  return data.datos;
}

export async function eliminarAutorizado(legajo) {
  const { data } = await api.delete(`/autorizados/${legajo}`);
  return data.datos;
}
