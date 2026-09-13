import { api } from './api.js';

export async function listarItems(clase) {
  const { data } = await api.get('/inventario', { params: clase ? { clase } : {} });
  return data.datos;
}

export async function obtenerItem(codigo) {
  const { data } = await api.get(`/inventario/${encodeURIComponent(codigo)}`);
  return data.datos;
}

export async function crearItem(item) {
  const { data } = await api.post('/inventario', item);
  return data.datos;
}

export async function actualizarItem(codigo, item) {
  const { data } = await api.put(`/inventario/${encodeURIComponent(codigo)}`, item);
  return data.datos;
}

export async function eliminarItem(codigo) {
  const { data } = await api.delete(`/inventario/${encodeURIComponent(codigo)}`);
  return data.datos;
}

export async function listarTiposInventario(clase) {
  const { data } = await api.get('/inventario/tipos', { params: clase ? { clase } : {} });
  return data.datos;
}

export async function obtenerTipoInventario(id) {
  const { data } = await api.get(`/inventario/tipos/${id}`);
  return data.datos;
}

export async function crearTipoInventario(tipo) {
  const { data } = await api.post('/inventario/tipos', tipo);
  return data.datos;
}

export async function actualizarTipoInventario(id, tipo) {
  const { data } = await api.put(`/inventario/tipos/${id}`, tipo);
  return data.datos;
}

export async function eliminarTipoInventario(id) {
  const { data } = await api.delete(`/inventario/tipos/${id}`);
  return data.datos;
}
