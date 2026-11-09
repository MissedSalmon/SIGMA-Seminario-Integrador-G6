/**
 * Llamadas a la API de plantillas de tareas (HU-12).
 *
 * Una plantilla es una tarea modelo asociada a la especialidad que la hace
 * (desde el 02/11/2026; antes era el tipo de activo). Sirve para precargar las
 * tareas estándar cuando se arma una orden de trabajo y para ofrecer sólo los
 * técnicos de esa especialidad.
 */
import { api } from './api.js';

/** @param {number} [idEspecialidad] - si viene, trae sólo las de esa especialidad. */
export async function listarPlantillas(idEspecialidad = null) {
  const { data } = await api.get('/plantillas-tareas', {
    params: idEspecialidad ? { idEspecialidad } : undefined,
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
