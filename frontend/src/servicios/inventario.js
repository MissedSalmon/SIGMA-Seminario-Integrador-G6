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

/** El historial de ingresos y consumos del item, del mas nuevo al mas viejo (HU-16). */
export async function listarMovimientos(codigo) {
  const { data } = await api.get(`/inventario/${encodeURIComponent(codigo)}/movimientos`);
  return data.datos;
}

/** Le asigna la herramienta a un técnico. Si ya la tiene otro, la API lo rechaza. */
export async function asignarHerramienta(codigo, legajo) {
  const { data } = await api.post(`/inventario/${encodeURIComponent(codigo)}/asignacion`, { legajo });
  return data.datos;
}

/** Qué técnicos tuvieron la herramienta, de la asignación más nueva a la más vieja. */
export async function listarAsignaciones(codigo) {
  const { data } = await api.get(`/inventario/${encodeURIComponent(codigo)}/asignaciones`);
  return data.datos;
}

/** Registra que el técnico devolvió la herramienta. */
export async function devolverHerramienta(codigo) {
  const { data } = await api.delete(`/inventario/${encodeURIComponent(codigo)}/asignacion`);
  return data.datos;
}

/** Vuelve a poner en servicio una herramienta que estaba fuera de servicio. */
export async function ponerEnServicio(codigo) {
  const { data } = await api.post(`/inventario/${encodeURIComponent(codigo)}/en-servicio`);
  return data.datos;
}

/**
 * Un material se borra (si no tiene movimientos). Una herramienta no se borra:
 * pasa a "Fuera de servicio".
 */
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
