import { api } from './api.js';

export async function listarTiposActivos() {
  const { data } = await api.get('/tipos-activos');
  return data.datos;
}

export async function obtenerTipoActivo(id) {
  const { data } = await api.get(`/tipos-activos/${id}`);
  return data.datos;
}

export async function crearTipoActivo(datos) {
  const { data } = await api.post('/tipos-activos', datos);
  return data.datos;
}

export async function actualizarTipoActivo(id, datos) {
  const { data } = await api.put(`/tipos-activos/${id}`, datos);
  return data.datos;
}

export async function eliminarTipoActivo(id) {
  await api.delete(`/tipos-activos/${id}`);
}
