/**
 * Llamadas a la API de tecnicos (HU-5).
 */
import { api } from './api.js';

/**
 * @param {object} [filtros]
 * @param {number} [filtros.especialidad_id]
 * @param {string} [filtros.disponibilidad] - "Disponible" | "No disponible"
 */
export async function listarTecnicos(filtros = {}) {
  const { especialidad_id, disponibilidad } = filtros;
  const { data } = await api.get('/tecnicos', {
    params: {
      ...(especialidad_id ? { especialidad_id } : {}),
      ...(disponibilidad ? { disponibilidad } : {}),
    },
  });
  return data.datos;
}

/** Carga de tareas por técnico, filtrada por fecha prevista y especialidad. */
export async function listarCargaTrabajo(filtros = {}) {
  const { desde, hasta, especialidad_id } = filtros;
  const { data } = await api.get('/tecnicos/carga-trabajo', {
    params: {
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
      ...(especialidad_id ? { especialidad_id } : {}),
    },
  });
  return data.datos;
}

/** Tareas vigentes de un técnico dentro del período seleccionado. */
export async function listarTareasDeCarga(legajo, filtros = {}) {
  const { desde, hasta } = filtros;
  const { data } = await api.get(`/tecnicos/${legajo}/carga-trabajo`, {
    params: {
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
    },
  });
  return data.datos;
}

export async function obtenerTecnico(legajo) {
  const { data } = await api.get(`/tecnicos/${legajo}`);
  return data.datos;
}

export async function crearTecnico(tecnico) {
  const { data } = await api.post('/tecnicos', tecnico);
  return data.datos;
}

export async function actualizarTecnico(legajo, tecnico) {
  const { data } = await api.put(`/tecnicos/${legajo}`, tecnico);
  return data.datos;
}

export async function eliminarTecnico(legajo) {
  const { data } = await api.delete(`/tecnicos/${legajo}`);
  return data.datos;
}
