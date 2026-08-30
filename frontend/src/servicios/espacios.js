/**
 * Llamadas a la API de espacios (HU-2).
 */
import { api } from './api.js';

/**
 * @param {number} [idEdificio] - si viene, trae solo los espacios de ese edificio.
 */
export async function listarEspacios(idEdificio = null) {
  const { data } = await api.get('/espacios', {
    params: idEdificio ? { idEdificio } : undefined,
  });
  return data.datos;
}

export async function obtenerEspacio(id) {
  const { data } = await api.get(`/espacios/${id}`);
  return data.datos;
}

/** Los tipos validos de espacio: aula, laboratorio, oficina, pasillo, area comun. */
export async function listarTiposDeEspacio() {
  const { data } = await api.get('/espacios/tipos');
  return data.datos;
}

export async function crearEspacio(espacio) {
  const { data } = await api.post('/espacios', espacio);
  return data.datos;
}

export async function actualizarEspacio(id, espacio) {
  const { data } = await api.put(`/espacios/${id}`, espacio);
  return data.datos;
}

export async function eliminarEspacio(id) {
  const { data } = await api.delete(`/espacios/${id}`);
  return data.datos;
}
