/**
 * Llamadas a la API de areas funcionales (HU-3).
 */
import { api } from './api.js';

export async function listarAreas() {
  const { data } = await api.get('/areas');
  return data.datos;
}

export async function obtenerArea(id) {
  const { data } = await api.get(`/areas/${id}`);
  return data.datos;
}

export async function crearArea(area) {
  const { data } = await api.post('/areas', area);
  return data.datos;
}

export async function actualizarArea(id, area) {
  const { data } = await api.put(`/areas/${id}`, area);
  return data.datos;
}

export async function eliminarArea(id) {
  const { data } = await api.delete(`/areas/${id}`);
  return data.datos;
}
