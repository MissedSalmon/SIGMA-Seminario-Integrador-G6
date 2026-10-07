/**
 * Llamadas a la API de tipos de prestador de servicio (HU-24).
 * Cada tipo llega como { idTipoPrestador, nombre, descripcion }.
 */
import { api } from './api.js';

export async function listarTiposPrestador() {
  const { data } = await api.get('/tipos-prestador');
  return data.datos;
}

export async function obtenerTipoPrestador(id) {
  const { data } = await api.get(`/tipos-prestador/${id}`);
  return data.datos;
}

export async function crearTipoPrestador(tipo) {
  const { data } = await api.post('/tipos-prestador', tipo);
  return data.datos;
}

export async function actualizarTipoPrestador(id, tipo) {
  const { data } = await api.put(`/tipos-prestador/${id}`, tipo);
  return data.datos;
}

export async function eliminarTipoPrestador(id) {
  const { data } = await api.delete(`/tipos-prestador/${id}`);
  return data.datos;
}
