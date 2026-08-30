/**
 * Llamadas a la API de especialidades.
 *
 * Solo lectura: HU-4 (el ABM de especialidades) todavia no esta implementada,
 * asi que esto solo sirve para el selector del formulario de tecnicos (HU-5)
 * y el filtro del listado.
 */
import { api } from './api.js';

export async function listarEspecialidades() {
  const { data } = await api.get('/especialidades');
  return data.datos;
}

export async function crearEspecialidad(nombre) {
  const { data } = await api.post('/especialidades', { nombre });
  return data.datos;
}

export async function actualizarEspecialidad(id, nombre) {
  const { data } = await api.put(`/especialidades/${id}`, { nombre });
  return data.datos;
}

export async function eliminarEspecialidad(id) {
  const { data } = await api.delete(`/especialidades/${id}`);
  return data.datos;
}

export async function obtenerEspecialidad(id) {
  const { data } = await api.get(`/especialidades`);
  // La API actual devuelve todas las especialidades; buscamos la que coincide.
  const fila = data.datos.find((e) => Number(e.idEspecialidad) === Number(id));
  if (!fila) throw new Error('No existe la especialidad solicitada.');
  return fila;
}
