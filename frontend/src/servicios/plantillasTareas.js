/**
 * Llamadas a la API de plantillas de tareas (HU-12).
 *
 * Una plantilla es una tarea modelo asociada a un tipo de activo. Sirve para
 * precargar las tareas estándar cuando se arma una orden de trabajo.
 *
 * Ojo: las direcciones /api/plantillas-tareas todavía no existen en el backend.
 */
import { api } from './api.js';

/** @param {number} [idTipoActivo] - si viene, trae sólo las de ese tipo de activo. */
export async function listarPlantillas(idTipoActivo = null) {
  const { data } = await api.get('/plantillas-tareas', {
    params: idTipoActivo ? { idTipoActivo } : undefined,
  });
  return data.datos;
}

export async function obtenerPlantilla(id) {
  const { data } = await api.get(`/plantillas-tareas/${id}`);
  return data.datos;
}

export async function crearPlantilla(plantilla) {
  const { data } = await api.post('/plantillas-tareas', plantilla);
  return data.datos;
}

export async function actualizarPlantilla(id, plantilla) {
  const { data } = await api.put(`/plantillas-tareas/${id}`, plantilla);
  return data.datos;
}

export async function eliminarPlantilla(id) {
  const { data } = await api.delete(`/plantillas-tareas/${id}`);
  return data.datos;
}
