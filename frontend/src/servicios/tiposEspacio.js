/**
 * Llamadas a la API de tipos de espacio (HU-2).
 *
 * PENDIENTE: el modulo /api/tipos-espacio todavia no existe en el backend.
 * Hasta que se cargue, estas pantallas muestran el error de la API.
 * Lo que espera el frontend de cada tipo es: { idTipoEspacio, nombre }.
 */
import { api } from './api.js';

export async function listarTiposEspacio() {
  const { data } = await api.get('/tipos-espacio');
  return data.datos;
}

export async function obtenerTipoEspacio(id) {
  const { data } = await api.get(`/tipos-espacio/${id}`);
  return data.datos;
}

export async function crearTipoEspacio(tipo) {
  const { data } = await api.post('/tipos-espacio', tipo);
  return data.datos;
}

export async function actualizarTipoEspacio(id, tipo) {
  const { data } = await api.put(`/tipos-espacio/${id}`, tipo);
  return data.datos;
}

export async function eliminarTipoEspacio(id) {
  const { data } = await api.delete(`/tipos-espacio/${id}`);
  return data.datos;
}
