/**
 * Llamadas a la API de edificios (HU-1).
 *
 * Todas devuelven directamente el contenido de `datos`. Si la API responde con
 * error, api.js ya lo convirtio en un Error con el mensaje que escribio el
 * backend, asi que la pantalla solo tiene que mostrarlo.
 */
import { api } from './api.js';

export async function listarEdificios() {
  const { data } = await api.get('/edificios');
  return data.datos;
}

export async function obtenerEdificio(id) {
  const { data } = await api.get(`/edificios/${id}`);
  return data.datos;
}

export async function crearEdificio(edificio) {
  const { data } = await api.post('/edificios', edificio);
  return data.datos;
}

export async function actualizarEdificio(id, edificio) {
  const { data } = await api.put(`/edificios/${id}`, edificio);
  return data.datos;
}

export async function eliminarEdificio(id) {
  const { data } = await api.delete(`/edificios/${id}`);
  return data.datos;
}
